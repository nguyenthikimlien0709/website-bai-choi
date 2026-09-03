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

  // Người thắng hiện tại.
  // null = ván chưa kết thúc
  winnerId: string | null
}


// ======================================================
// 30 QUÂN BÀI
// ID PHẢI GIỐNG 100% BaiChoiGame.tsx
// ======================================================

const CARD_IDS = [

  // ====================================================
  // PHÔ 01 — 01 → 10
  // ====================================================

  'nhat-tro',
  'nhi-bi',
  'tam-quan',
  'tu-huong',
  'ngu-truot',
  'luc-xo',
  'that-nhon',
  'bat-bong',
  'cuu-thay',
  'thai-tu',


  // ====================================================
  // PHÔ 02 — 11 → 20
  // ====================================================

  'pho2-la1',
  'pho2-la2',
  'pho2-la3',
  'pho2-la4',
  'pho2-la5',
  'pho2-la6',
  'pho2-la7',
  'pho2-la8',
  'pho2-la9',
  'pho2-la10',


  // ====================================================
  // PHÔ 03 — 21 → 30
  // ====================================================

  'pho3-la1',
  'pho3-la2',
  'pho3-la3',
  'pho3-la4',
  'pho3-la5',
  'pho3-la6',
  'pho3-la7',
  'pho3-la8',
  'pho3-la9',
  'pho3-la10',
]


// ======================================================
// GIỚI HẠN HỘI
// ======================================================

const MAX_PLAYERS = 5


// ======================================================
// SHUFFLE
// ======================================================

const shuffle = <T>(items: readonly T[]) => {

  const result = [...items]

  for (
    let i = result.length - 1;
    i > 0;
    i -= 1
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      )

    ;[
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ]
  }

  return result
}


// ======================================================
// JSON RESPONSE
// ======================================================

const json = (
  data: object,
  status = 200
) =>
  new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        'content-type':
          'application/json; charset=utf-8',

        'access-control-allow-origin':
          '*',
      },
    }
  )


// ======================================================
// CLOUDFLARE WORKER
// ======================================================

export default {

  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {

    const url =
      new URL(request.url)


    // ==================================================
    // HEALTH CHECK
    // ==================================================

    if (
      url.pathname === '/health'
    ) {

      return json({
        ok: true,
        service: 'bai-choi-realtime',
        cards: CARD_IDS.length,
      })
    }


    // ==================================================
    // WEBSOCKET ENDPOINT
    // ==================================================

    if (
      url.pathname !== '/bai-choi-ws' ||
      request.headers.get('Upgrade') !==
        'websocket'
    ) {

      return json(
        {
          error:
            'WebSocket endpoint: /bai-choi-ws',
        },
        426
      )
    }


    // ==================================================
    // ACTION
    // ==================================================

    const action =
      url.searchParams.get('action')


    if (
      action !== 'createRoom' &&
      action !== 'joinRoom'
    ) {

      return json(
        {
          error:
            'Hành động không hợp lệ.',
        },
        400
      )
    }


    // ==================================================
    // PLAYER NAME
    // ==================================================

    const name =
      (
        url.searchParams.get('name') ||
        ''
      )
        .normalize('NFC')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 16)


    if (
      name.length < 2
    ) {

      return json(
        {
          error:
            'Tên không hợp lệ.',
        },
        400
      )
    }


    // ==================================================
    // ROOM CODE
    // ==================================================

    let roomId =
      (
        url.searchParams.get('roomId') ||
        ''
      )
        .toUpperCase()
        .trim()


    // Tạo hội mới
    if (
      action === 'createRoom'
    ) {

      roomId =
        String(
          Math.floor(
            100000 +
            Math.random() *
              900000
          )
        )
    }


    /*
      Frontend hiện cho phép:

      123456

      hoặc

      CHOI-123456

      Worker sẽ chuyển cả hai thành:

      123456
    */

    if (
      action === 'joinRoom'
    ) {

      roomId =
        roomId.replace(
          /^CHOI-/,
          ''
        )
    }


    if (
      !/^\d{6}$/.test(roomId)
    ) {

      return json(
        {
          error:
            'Mã hội không hợp lệ.',
        },
        400
      )
    }


    // ==================================================
    // DURABLE OBJECT ROOM
    // ==================================================

    const room =
      env.ROOMS.getByName(roomId)


    const target =
      new URL(request.url)


    target.searchParams.set(
      'roomId',
      roomId
    )

    target.searchParams.set(
      'action',
      action
    )

    target.searchParams.set(
      'name',
      name
    )


    return room.fetch(
      new Request(
        target,
        request
      )
    )
  },
}


// ======================================================
// DURABLE OBJECT — MỖI PHÒNG LÀ 1 INSTANCE
// ======================================================

export class BaiChoiRoom
  implements DurableObject {

  constructor(
    private state:
      DurableObjectState
  ) {}


  // ====================================================
  // SOCKETS
  // ====================================================

  private sockets() {

    return this.state
      .getWebSockets()
  }


  // ====================================================
  // PLAYERS
  // ====================================================

  private players() {

    return this
      .sockets()
      .map(
        (socket) =>
          socket.deserializeAttachment()
            as PlayerAttachment
      )
      .filter(Boolean)
  }


  // ====================================================
  // SEND
  // ====================================================

  private send(
    socket: WebSocket,
    data: object
  ) {

    try {

      socket.send(
        JSON.stringify(data)
      )

    } catch {

      // socket đã ngắt
    }
  }


  // ====================================================
  // BROADCAST
  // ====================================================

  private broadcast(
    data: object
  ) {

    this
      .sockets()
      .forEach(
        (socket) =>
          this.send(
            socket,
            data
          )
      )
  }


  // ====================================================
  // GAME STATE
  // ====================================================

  private async gameState():
    Promise<GameState> {

    return (
      await this.state.storage.get<GameState>(
        'game'
      )
    ) || {

      hostId: '',

      status:
        'waiting',

      deck: [],

      drawIndex:
        -1,

      currentCard:
        null,

      winnerId:
        null,
    }
  }


  // ====================================================
  // PUBLIC ROOM
  // ====================================================

  private publicRoom(
    roomId: string,
    game: GameState
  ) {

    return {

      roomId,

      hostId:
        game.hostId,

      status:
        game.status,

      players:
        this.players().map(
          ({
            id,
            name,
            ready,
            claimed,
          }) => ({

            id,

            name,

            ready,

            flags:
              claimed.length,
          })
        ),
    }
  }


  // ====================================================
  // KẾT NỐI WEBSOCKET
  // ====================================================

  async fetch(
    request: Request
  ): Promise<Response> {

    const url =
      new URL(request.url)


    const roomId =
      url.searchParams.get(
        'roomId'
      ) || ''


    const action =
      url.searchParams.get(
        'action'
      )


    const name =
      url.searchParams.get(
        'name'
      ) || ''


    let game =
      await this.gameState()


    const existingPlayers =
      this.players()


    // ==================================================
    // JOIN ROOM
    // ==================================================

    if (
      action === 'joinRoom'
    ) {

      if (
        !existingPlayers.length
      ) {

        return json(
          {
            error:
              'Mã hội không tồn tại hoặc đã kết thúc.',
          },
          404
        )
      }


      if (
        game.status !==
        'waiting'
      ) {

        return json(
          {
            error:
              'Hội này đã bắt đầu.',
          },
          409
        )
      }


      if (
        existingPlayers.length >=
        MAX_PLAYERS
      ) {

        return json(
          {
            error:
              `Hội đã đủ ${MAX_PLAYERS} chòi.`,
          },
          409
        )
      }


      const duplicateName =
        existingPlayers.some(
          (player) =>
            player.name.toLocaleLowerCase(
              'vi-VN'
            ) ===
            name.toLocaleLowerCase(
              'vi-VN'
            )
        )


      if (
        duplicateName
      ) {

        return json(
          {
            error:
              `Tên “${name}” đã có trong hội.`,
          },
          409
        )
      }
    }


    // ==================================================
    // CREATE SOCKET
    // ==================================================

    const pair =
      new WebSocketPair()


    const client =
      pair[0]


    const server =
      pair[1]


    // ==================================================
    // PLAYER
    // ==================================================

    const player:
      PlayerAttachment = {

      id:
        crypto.randomUUID(),

      name,

      ready:
        action ===
        'createRoom',

      hand: [],

      claimed: [],
    }


    server.serializeAttachment(
      player
    )


    this.state.acceptWebSocket(
      server
    )


    // ==================================================
    // HOST
    // ==================================================

    if (
      !game.hostId
    ) {

      game = {
        ...game,

        hostId:
          player.id,
      }


      await this.state.storage.put(
        'game',
        game
      )
    }


    // ==================================================
    // SEND ROOM
    // ==================================================

    queueMicrotask(
      () => {

        this.send(
          server,
          {
            type:
              'roomJoined',

            playerId:
              player.id,

            ...this.publicRoom(
              roomId,
              game
            ),
          }
        )


        this.broadcast(
          {
            type:
              'roomState',

            ...this.publicRoom(
              roomId,
              game
            ),
          }
        )
      }
    )


    return new Response(
      null,
      {
        status: 101,

        webSocket:
          client,
      }
    )
  }


  // ====================================================
  // MESSAGE
  // ====================================================

  async webSocketMessage(
    socket: WebSocket,
    raw:
      string |
      ArrayBuffer
  ) {

    let message: any


    try {

      message =
        JSON.parse(
          typeof raw ===
            'string'
            ? raw
            : new TextDecoder()
                .decode(raw)
        )

    } catch {

      return
    }


    const player =
      socket.deserializeAttachment()
        as PlayerAttachment


    let game =
      await this.gameState()


    const roomId =
      this.state.id.name ||
      ''


    // ==================================================
    // READY
    // ==================================================

    if (
      message.type ===
        'ready' &&
      game.status ===
        'waiting'
    ) {

      player.ready =
        Boolean(
          message.ready
        )


      socket.serializeAttachment(
        player
      )


      this.broadcast(
        {
          type:
            'roomState',

          ...this.publicRoom(
            roomId,
            game
          ),
        }
      )


      return
    }


    // ==================================================
    // START GAME
    // ==================================================

    if (
      message.type ===
        'startGame' &&
      game.hostId ===
        player.id &&
      game.status ===
        'waiting'
    ) {

      const players =
        this.players()


      // Ít nhất 2 người
      if (
        players.length < 2
      ) {

        return
      }


      // Mọi người phải READY
      if (
        players.some(
          (item) =>
            !item.ready
        )
      ) {

        return
      }


      /*
        ==================================================
        QUAN TRỌNG:

        callDeck
        = bộ 30 quân dùng để hô

        dealDeck
        = bộ 30 quân riêng dùng để chia bài
        ==================================================
      */


      const callDeck =
        shuffle(CARD_IDS)


      const dealDeck =
        shuffle(CARD_IDS)


      game = {
        ...game,

        status:
          'playing',

        deck:
          callDeck,

        drawIndex:
          -1,

        currentCard:
          null,

        winnerId:
          null,
      }


      await this.state.storage.put(
        'game',
        game
      )


      const clients =
        this.sockets()


      // =================================================
      // BƯỚC 1:
      // CHIA 3 LÁ KHÔNG TRÙNG CHO TỪNG CHÒI
      // =================================================

      clients.forEach(
        (
          clientSocket,
          playerIndex
        ) => {

          const attendee =
            clientSocket
              .deserializeAttachment()
              as PlayerAttachment


          const start =
            playerIndex * 3


          attendee.hand =
            dealDeck.slice(
              start,
              start + 3
            )


          // Reset cờ
          attendee.claimed =
            []


          clientSocket
            .serializeAttachment(
              attendee
            )
        }
      )


      /*
        Lúc này ví dụ:

        Player 1 = dealDeck[0..2]

        Player 2 = dealDeck[3..5]

        Player 3 = dealDeck[6..8]

        Player 4 = dealDeck[9..11]

        Player 5 = dealDeck[12..14]

        => KHÔNG TRÙNG BÀI
      */


      // =================================================
      // BƯỚC 2:
      // GỬI BÀI RIÊNG CHO TỪNG NGƯỜI
      // =================================================

      const roomSnapshot =
        this.publicRoom(
          roomId,
          game
        )


      clients.forEach(
        (clientSocket) => {

          const attendee =
            clientSocket
              .deserializeAttachment()
              as PlayerAttachment


          this.send(
            clientSocket,
            {

              type:
                'gameStarted',

              hand:
                attendee.hand,

              ...roomSnapshot,
            }
          )
        }
      )


      return
    }


    // ==================================================
    // DRAW / HÔ
    // ==================================================

    if (
      message.type ===
        'draw' &&
      game.hostId ===
        player.id &&
      game.status ===
        'playing' &&
      !game.winnerId &&
      game.drawIndex <
        game.deck.length - 1
    ) {

      // Sang quân tiếp theo
      game.drawIndex +=
        1


      game.currentCard =
        game.deck[
          game.drawIndex
        ]


      await this.state.storage.put(
        'game',
        game
      )


      this.broadcast(
        {

          type:
            'cardDrawn',

          cardId:
            game.currentCard,

          drawIndex:
            game.drawIndex,
        }
      )


      return
    }


    // ==================================================
    // CLAIM / GÕ MÕ
    // ==================================================

    if (
      message.type ===
        'claim'
    ) {

      // Game chưa chạy
      if (
        game.status !==
        'playing'
      ) {

        return
      }


      // Đã có người thắng
      if (
        game.winnerId
      ) {

        return
      }


      // Chưa hô quân nào
      if (
        !game.currentCard
      ) {

        this.send(
          socket,
          {
            type:
              'claimRejected',
          }
        )

        return
      }


      const currentCard =
        game.currentCard


      // =================================================
      // KIỂM TRA NGƯỜI CHƠI CÓ QUÂN NÀY KHÔNG
      // =================================================

      const hasCard =
        player.hand.includes(
          currentCard
        )


      // =================================================
      // KIỂM TRA ĐÃ GÕ MÕ QUÂN NÀY CHƯA
      // =================================================

      const alreadyClaimed =
        player.claimed.includes(
          currentCard
        )


      if (
        !hasCard ||
        alreadyClaimed
      ) {

        this.send(
          socket,
          {
            type:
              'claimRejected',
          }
        )

        return
      }


      // =================================================
      // CLAIM HỢP LỆ
      // =================================================

      player.claimed.push(
        currentCard
      )


      socket.serializeAttachment(
        player
      )


      // =================================================
      // CẬP NHẬT CỜ
      // =================================================

      this.broadcast(
        {

          type:
            'flagsUpdated',

          playerId:
            player.id,

          flags:
            player.claimed.length,
        }
      )


      // =================================================
      // ĐỦ 3 CỜ → THẮNG
      // =================================================

      if (
        player.claimed.length >=
        3
      ) {

        game = {
          ...game,

          winnerId:
            player.id,
        }


        await this.state.storage.put(
          'game',
          game
        )


        this.broadcast(
          {

            type:
              'winner',

            playerId:
              player.id,

            name:
              player.name,
          }
        )
      }


      return
    }
  }


  // ====================================================
  // SOCKET CLOSE
  // ====================================================

  async webSocketClose(
    socket: WebSocket
  ) {

    const disconnectedPlayer =
      socket.deserializeAttachment()
        as
          | PlayerAttachment
          | undefined


    try {

      socket.close()

    } catch {

      // socket đã đóng
    }


    const remaining =
      this.players().filter(
        (player) =>
          player.id !==
          disconnectedPlayer?.id
      )


    // ==================================================
    // KHÔNG CÒN AI
    // ==================================================

    if (
      !remaining.length
    ) {

      await this.state.storage
        .deleteAll()

      return
    }


    // ==================================================
    // CHUYỂN HOST
    // ==================================================

    let game =
      await this.gameState()


    const hostStillHere =
      remaining.some(
        (player) =>
          player.id ===
          game.hostId
      )


    if (
      !hostStillHere
    ) {

      game = {
        ...game,

        hostId:
          remaining[0].id,
      }


      await this.state.storage.put(
        'game',
        game
      )
    }


    // ==================================================
    // UPDATE ROOM
    // ==================================================

    this.broadcast(
      {

        type:
          'roomState',

        ...this.publicRoom(
          this.state.id.name ||
            '',
          game
        ),
      }
    )
  }
}