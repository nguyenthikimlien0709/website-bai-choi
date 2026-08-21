interface Env {
  ROOMS: DurableObjectNamespace
}

type PlayerAttachment = {
  id: string
  name: string
  ready: boolean
  hand: string[]
  claimed: string[]
}

type GameState = {
  hostId: string
  status: 'waiting' | 'playing'
  deck: string[]
  drawIndex: number
  currentCard: string | null
}

const CARD_IDS = ['nhat-tro', 'nhi-bi', 'tam-quan', 'tu-huong', 'ngu-truot', 'luc-xo', 'that-nhon', 'bat-bong', 'cuu-thay', 'thai-tu']

const shuffle = <T>(items: readonly T[]) => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const json = (data: object, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
})

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/health') return json({ ok: true, service: 'bai-choi-realtime' })
    if (url.pathname !== '/bai-choi-ws' || request.headers.get('Upgrade') !== 'websocket') return json({ error: 'WebSocket endpoint: /bai-choi-ws' }, 426)

    const action = url.searchParams.get('action')
    const name = (url.searchParams.get('name') || '').normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 16)
    let roomId = (url.searchParams.get('roomId') || '').toUpperCase().trim()
    if (name.length < 2) return json({ error: 'Tên không hợp lệ.' }, 400)
    if (action === 'createRoom') roomId = String(Math.floor(100000 + Math.random() * 900000))
    if (!/^\d{6}$/.test(roomId)) return json({ error: 'Mã hội không hợp lệ.' }, 400)

    const room = env.ROOMS.getByName(roomId)
    const target = new URL(request.url)
    target.searchParams.set('roomId', roomId)
    target.searchParams.set('action', action || 'joinRoom')
    target.searchParams.set('name', name)
    return room.fetch(new Request(target, request))
  },
}

export class BaiChoiRoom implements DurableObject {
  constructor(private state: DurableObjectState) {}

  private sockets() {
    return this.state.getWebSockets()
  }

  private players() {
    return this.sockets().map((socket) => socket.deserializeAttachment() as PlayerAttachment).filter(Boolean)
  }

  private send(socket: WebSocket, data: object) {
    try { socket.send(JSON.stringify(data)) } catch { /* disconnected */ }
  }

  private broadcast(data: object) {
    this.sockets().forEach((socket) => this.send(socket, data))
  }

  private async gameState(): Promise<GameState> {
    return (await this.state.storage.get<GameState>('game')) || { hostId: '', status: 'waiting', deck: [], drawIndex: -1, currentCard: null }
  }

  private publicRoom(roomId: string, game: GameState) {
    return {
      roomId,
      hostId: game.hostId,
      status: game.status,
      players: this.players().map(({ id, name, ready, claimed }) => ({ id, name, ready, flags: claimed.length })),
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const roomId = url.searchParams.get('roomId') || ''
    const action = url.searchParams.get('action')
    const name = url.searchParams.get('name') || ''
    let game = await this.gameState()
    const existingPlayers = this.players()

    if (action === 'joinRoom') {
      if (!existingPlayers.length) return json({ error: 'Mã hội không tồn tại hoặc đã kết thúc.' }, 404)
      if (game.status !== 'waiting') return json({ error: 'Hội này đã bắt đầu.' }, 409)
      if (existingPlayers.length >= 5) return json({ error: 'Hội đã đủ 5 chòi.' }, 409)
      if (existingPlayers.some((player) => player.name.toLocaleLowerCase('vi-VN') === name.toLocaleLowerCase('vi-VN'))) return json({ error: `Tên “${name}” đã có trong hội.` }, 409)
    }

    const pair = new WebSocketPair()
    const client = pair[0]
    const server = pair[1]
    const player: PlayerAttachment = { id: crypto.randomUUID(), name, ready: action === 'createRoom', hand: [], claimed: [] }
    server.serializeAttachment(player)
    this.state.acceptWebSocket(server)
    if (!game.hostId) {
      game = { ...game, hostId: player.id }
      await this.state.storage.put('game', game)
    }
    queueMicrotask(() => {
      this.send(server, { type: 'roomJoined', playerId: player.id, ...this.publicRoom(roomId, game) })
      this.broadcast({ type: 'roomState', ...this.publicRoom(roomId, game) })
    })
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(socket: WebSocket, raw: string | ArrayBuffer) {
    let message: any
    try { message = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)) } catch { return }
    const player = socket.deserializeAttachment() as PlayerAttachment
    let game = await this.gameState()
    const roomId = this.state.id.name || ''

    if (message.type === 'ready' && game.status === 'waiting') {
      player.ready = Boolean(message.ready)
      socket.serializeAttachment(player)
      this.broadcast({ type: 'roomState', ...this.publicRoom(roomId, game) })
    }

    if (message.type === 'startGame' && game.hostId === player.id && game.status === 'waiting') {
      const players = this.players()
      if (players.length < 2 || players.some((item) => !item.ready)) return
      game = { ...game, status: 'playing', deck: shuffle(CARD_IDS), drawIndex: -1, currentCard: null }
      await this.state.storage.put('game', game)
      this.sockets().forEach((client) => {
        const attendee = client.deserializeAttachment() as PlayerAttachment
        attendee.hand = shuffle(CARD_IDS).slice(0, 3)
        attendee.claimed = []
        client.serializeAttachment(attendee)
        this.send(client, { type: 'gameStarted', hand: attendee.hand, ...this.publicRoom(roomId, game) })
      })
    }

    if (message.type === 'draw' && game.hostId === player.id && game.status === 'playing' && game.drawIndex < game.deck.length - 1) {
      game.drawIndex += 1
      game.currentCard = game.deck[game.drawIndex]
      await this.state.storage.put('game', game)
      this.broadcast({ type: 'cardDrawn', cardId: game.currentCard, drawIndex: game.drawIndex })
    }

    if (message.type === 'claim' && game.currentCard) {
      if (!player.hand.includes(game.currentCard) || player.claimed.includes(game.currentCard)) return this.send(socket, { type: 'claimRejected' })
      player.claimed.push(game.currentCard)
      socket.serializeAttachment(player)
      this.broadcast({ type: 'flagsUpdated', playerId: player.id, flags: player.claimed.length })
      if (player.claimed.length === 3) this.broadcast({ type: 'winner', playerId: player.id, name: player.name })
    }
  }

  async webSocketClose(socket: WebSocket) {
    socket.close()
    const remaining = this.players().filter((player) => player.id !== (socket.deserializeAttachment() as PlayerAttachment)?.id)
    if (!remaining.length) {
      await this.state.storage.deleteAll()
      return
    }
    let game = await this.gameState()
    if (!remaining.some((player) => player.id === game.hostId)) {
      game = { ...game, hostId: remaining[0].id }
      await this.state.storage.put('game', game)
    }
    this.broadcast({ type: 'roomState', ...this.publicRoom(this.state.id.name || '', game) })
  }
}
