import { useEffect, useMemo, useRef, useState } from 'react';
import './index.css';

type Screen = 'name' | 'mode' | 'matchmaking' | 'friend' | 'playing' | 'result'
type OnlinePlayer = { id: string; name: string; ready: boolean; flags: number }

type Card = {
  id: string
  name: string
  image: string
  sound: string
}

const CARDS: Card[] = [
  { id: 'nhat-tro', name: 'Nhất Trò', image: '/assets/the1.jpg', sound: '/sound/Nhat-tro.mp3' },
  { id: 'nhi-bi', name: 'Nhì Bí', image: '/assets/the2.jpg', sound: '/sound/Nhi-Bi.mp3' },
  { id: 'tam-quan', name: 'Tam Quan', image: '/assets/the3.jpg', sound: '/sound/Tam-Quan.mp3' },
  { id: 'tu-huong', name: 'Tứ Hương', image: '/assets/the4.jpg', sound: '/sound/Tu-Huong.mp3' },
  { id: 'ngu-truot', name: 'Ngũ Trượt', image: '/assets/the5.jpg', sound: '/sound/Ngu-trot.mp3' },
  { id: 'luc-xo', name: 'Lục Xơ', image: '/assets/the6.jpg', sound: '/sound/Luc-Xo.mp3' },
  { id: 'that-nhon', name: 'Thất Nhọn', image: '/assets/the7.jpg', sound: '/sound/That-Nhon.mp3' },
  { id: 'bat-bong', name: 'Bát Bồng', image: '/assets/the8.jpg', sound: '/sound/Bat-Bong.mp3' },
  { id: 'cuu-thay', name: 'Cửu Thầy', image: '/assets/the9.jpg', sound: '/sound/Cuu-thay.mp3' },
  { id: 'thai-tu', name: 'Thái Tử', image: '/assets/the10.jpg', sound: '/sound/Thai-tu.mp3' },
]
const showcaseCards = [...CARDS]
  .sort(() => Math.random() - 0.5)
  .slice(0, 5);

const BOT_NAMES = ['Cô Ba', 'Chú Tư', 'Anh Năm', 'Chị Sáu']

function shuffle<T>(items: readonly T[]) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function cleanName(value: string) {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').slice(0, 16)
}

function FlyingClouds() {
  return (
    <div className="game-cloud-layer pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <img src="/assets/may-vang-transparent.png" alt="" className="game-cloud game-cloud-one" />
      <img src="/assets/may-vang-transparent.png" alt="" className="game-cloud game-cloud-two" />
      <img src="/assets/may-vang-transparent.png" alt="" className="game-cloud game-cloud-three" />
      <img src="/assets/may-vang-transparent.png" alt="" className="game-cloud game-cloud-four" />
    </div>
  )
}

export default function BaiChoiGame({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>('name')
  const [nameInput, setNameInput] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(8)
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [deck, setDeck] = useState<Card[]>([])
  const [hand, setHand] = useState<Card[]>([])
  const [drawIndex, setDrawIndex] = useState(-1)
  const [claimed, setClaimed] = useState<string[]>([])
  const [botFlags, setBotFlags] = useState([0, 0, 0, 0])
  const [message, setMessage] = useState('Anh Hiệu đang chuẩn bị ống thẻ…')
  const [winner, setWinner] = useState('')
  const [onlineMode, setOnlineMode] = useState(false)
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([])
  const [playerId, setPlayerId] = useState('')
  const [hostId, setHostId] = useState('')
  const [roomError, setRoomError] = useState('')
  const [roomCodeCopied, setRoomCodeCopied] = useState(false)
  const [socketStatus, setSocketStatus] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [revealedCard, setRevealedCard] = useState<Card | null>(null)
  const [isCalling, setIsCalling] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const playerIdRef = useRef('')
  const drawnCardRef = useRef<Card | null>(null)

  const currentCard = revealedCard
  const canClaim = Boolean(currentCard && hand.some((card) => card.id === currentCard.id) && !claimed.includes(currentCard.id))
  const players = useMemo(() => onlineMode ? onlinePlayers.map((player) => player.name) : [playerName, ...BOT_NAMES], [onlineMode, onlinePlayers, playerName])

  useEffect(() => {
    if (screen !== 'matchmaking') return
    if (countdown <= 0) {
      startGame()
      return
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown, screen])

  const stopAudio = (release = true) => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    audioRef.current.onended = null
    if (release) {
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
      audioRef.current = null
    }
  }

  const unlockAudio = async () => {
    if (audioRef.current) return
    const audio = new Audio()
    audio.preload = 'auto'
    audio.src = CARDS[0].sound
    audio.volume = 0
    audioRef.current = audio
    try {
      await audio.play()
      audio.pause()
      audio.currentTime = 0
      audio.volume = 1
    } catch {
      audio.volume = 1
    }
  }

  useEffect(() => {
    const origOverflow = document.body.style.overflow
    const origTouchAction = document.body.style.touchAction
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      document.body.style.overflow = origOverflow
      document.body.style.touchAction = origTouchAction
    }
  }, [])

  useEffect(() => () => {
    stopAudio()
    socketRef.current?.close()
  }, [])
useEffect(() => {
  const preventZoom = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  };

  document.addEventListener("wheel", preventZoom, {
    passive: false,
  });

  return () => {
    document.removeEventListener("wheel", preventZoom);
  };
}, []);

  const leaveGame = () => {
    stopAudio()
    socketRef.current?.close()
    onClose()
  }

  const backToMode = () => {
    stopAudio()
    socketRef.current?.close()
    socketRef.current = null
    setOnlineMode(false)
    setRoomCode('')
    setOnlinePlayers([])
    setSocketStatus('idle')
    setScreen('mode')
  }

  const playCall = async (card: Card) => {
    stopAudio(false)
    setRevealedCard(null)
    setIsCalling(true)
    setMessage('Lắng nghe Chị Hiệu hô…')

    const audio = audioRef.current || new Audio()
    audio.src = card.sound
    audio.preload = 'auto'
    audio.volume = 1
    audioRef.current = audio

    await new Promise<void>((resolve) => {
      const revealCard = () => {
        setRevealedCard(card)
        setIsCalling(false)
        setMessage(`Quân ${card.name}! Nếu có thẻ, hãy gõ mõ.`)
        resolve()
      }

      audio.onended = revealCard
      audio.play().catch(() => {
        setRevealedCard(card)
        setIsCalling(false)
        setMessage(`Quân ${card.name}! Chạm GÕ MÕ nếu bạn có thẻ. Trình duyệt đang chặn âm thanh.`)
        resolve()
      })
    })
  }

  const connectRoom = (action: 'createRoom' | 'joinRoom') => {
    setRoomError('')
    const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    const configuredRealtimeUrl = import.meta.env.VITE_REALTIME_URL?.trim() || (isLocalHost ? '' : 'wss://bai-choi-realtime.lienntk-ce190812.workers.dev/bai-choi-ws')
    if (!configuredRealtimeUrl && !isLocalHost) {
      setRoomError('Phòng chơi online chưa được kết nối với máy chủ realtime trên bản public.')
      return
    }
    setSocketStatus('connecting')
    socketRef.current?.close()
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const baseRealtimeUrl = configuredRealtimeUrl || `${protocol}//${window.location.host}/bai-choi-ws`
    const realtimeUrl = new URL(baseRealtimeUrl)

    // Mã phòng do server tạo có dạng CHOI-123456.
    // Người chơi có thể nhập "123456" hoặc đầy đủ "CHOI-123456".
    const normalizedRoomCode =
      action === 'joinRoom'
        ? (joinCode.toUpperCase().startsWith('CHOI-')
            ? joinCode.toUpperCase()
            : `CHOI-${joinCode}`)
        : ''

    realtimeUrl.searchParams.set('action', action)
    realtimeUrl.searchParams.set('name', playerName)
    if (action === 'joinRoom') realtimeUrl.searchParams.set('roomId', normalizedRoomCode)

    const socket = new WebSocket(realtimeUrl.toString())
    socketRef.current = socket
    socket.onopen = () => {
      setSocketStatus('connected')
      if (!configuredRealtimeUrl) {
        socket.send(JSON.stringify({
          type: action,
          name: playerName,
          roomId: normalizedRoomCode,
        }))
      }
    }
    socket.onerror = () => { setRoomError(isLocalHost ? 'Không thể kết nối máy chủ phòng. Hãy khởi động lại npm run dev.' : 'Máy chủ phòng online đang không phản hồi.'); setSocketStatus('idle') }
    socket.onclose = () => setSocketStatus('idle')
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'error') return setRoomError(data.message)
      if (data.type === 'roomJoined') {
        playerIdRef.current = data.playerId
        setRoomCode(data.roomId); setPlayerId(data.playerId); setHostId(data.hostId); setOnlinePlayers(data.players); setOnlineMode(true)
      }
      if (data.type === 'roomState') { setHostId(data.hostId); setOnlinePlayers(data.players) }
      if (data.type === 'gameStarted') {
        setHostId(data.hostId); setOnlinePlayers(data.players); setHand(data.hand.map((id: string) => CARDS.find((card) => card.id === id)).filter(Boolean)); setClaimed([]); setRevealedCard(null); setIsCalling(false); setDrawIndex(-1); setWinner(''); setMessage('Hội đã khai. Chủ hội sẽ rút quân đầu tiên!'); setScreen('playing')
      }
      if (data.type === 'cardDrawn') {
        const card = CARDS.find((item) => item.id === data.cardId)
        if (card) { drawnCardRef.current = card; setRevealedCard(null); setDrawIndex(data.drawIndex); void playCall(card) }
      }
      if (data.type === 'flagsUpdated') {
        setOnlinePlayers((previous) => previous.map((player) => player.id === data.playerId ? { ...player, flags: data.flags } : player))
        if (data.playerId === playerIdRef.current) setClaimed((previous) => drawnCardRef.current && !previous.includes(drawnCardRef.current.id) ? [...previous, drawnCardRef.current.id] : previous)
      }
      if (data.type === 'claimRejected') setMessage('Thẻ này không có trong tay bạn hoặc đã nhận cờ rồi.')
      if (data.type === 'winner') finishGame(data.name)
    }
  }

  const submitName = () => {
    const nextName = cleanName(nameInput)
    if (nextName.length < 2) {
      setError('Tên cần có từ 2 đến 16 ký tự.')
      return
    }
    if (/^(máy|anh hiệu|chị hiệu)$/i.test(nextName)) {
      setError('Tên này được dành cho nhân vật trong hội.')
      return
    }
    setPlayerName(nextName)
    setError('')
    setScreen('mode')
  }

  const startGame = () => {
    setOnlineMode(false)
    const nextDeck = shuffle(CARDS)
    setDeck(nextDeck)
    setHand(shuffle(CARDS).slice(0, 3))
    setDrawIndex(-1)
    setClaimed([])
    setRevealedCard(null)
    setIsCalling(false)
    setBotFlags([0, 0, 0, 0])
    setWinner('')
    setMessage('Hội đã đủ chòi. Mời bạn nghe câu hô đầu tiên!')
    setScreen('playing')
  }

  const drawNext = async () => {
    if (winner || isCalling) return
    if (onlineMode) {
      socketRef.current?.send(JSON.stringify({ type: 'draw' }))
      return
    }
    if (drawIndex >= deck.length - 1) return
    const nextIndex = drawIndex + 1
    const card = deck[nextIndex]
    setDrawIndex(nextIndex)
    setMessage('Lắng nghe Anh Hiệu hô…')
    await playCall(card)

    setBotFlags((previous) => previous.map((flags, index) => {
      const botHasCard = ((CARDS.indexOf(card) + index * 2) % 5) < 2
      return botHasCard && flags < 3 ? flags + 1 : flags
    }))
  }

  useEffect(() => {
    if (screen !== 'playing' || winner) return
    const botWinnerIndex = botFlags.findIndex((flags) => flags >= 3)
    if (botWinnerIndex >= 0) {
      const timer = window.setTimeout(() => finishGame(BOT_NAMES[botWinnerIndex]), 1200)
      return () => window.clearTimeout(timer)
    }
  }, [botFlags, screen, winner])

  const finishGame = (winnerName: string) => {
    setWinner(winnerName)
    setMessage(winnerName === playerName ? 'TỚI! Ba cờ đã về chòi của bạn!' : `${winnerName} đã hô TỚI!`)
    stopAudio(false)
    const audio = audioRef.current || new Audio()
    audio.src = '/sound/Toi-Goi.mp3'
    audio.volume = 1
    audioRef.current = audio
    void audio.play().catch(() => undefined)
    window.setTimeout(() => setScreen('result'), 1400)
  }

  const claimCard = () => {
    if (onlineMode) {
      socketRef.current?.send(JSON.stringify({ type: 'claim' }))
      return
    }
    if (!currentCard || !canClaim) {
      setMessage('Ướm… thẻ này không có trong tay bạn.')
      return
    }
    const nextClaimed = [...claimed, currentCard.id]
    setClaimed(nextClaimed)
    setMessage(`Có đây! Bạn nhận cờ thứ ${nextClaimed.length}.`)
    if (nextClaimed.length === 3) window.setTimeout(() => finishGame(playerName), 500)
  }

  const createRoom = () => {
    void unlockAudio()
    connectRoom('createRoom')
  }

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
    } catch {
      const input = document.createElement('input')
      input.value = roomCode
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }
    setRoomCodeCopied(true)
    window.setTimeout(() => setRoomCodeCopied(false), 1800)
  }

  return (
    <div className="fixed inset-0 z-[300] overflow-hidden touch-none select-none bg-[#052f32] text-white h-[100dvh] w-full" role="dialog" aria-modal="true" aria-label="Trò chơi Bài Chòi">
      <div className="pointer-events-none fixed inset-0 opacity-20" style={{ backgroundImage: 'url(/assets/Background-toan.jpg)', backgroundSize: 'cover' }} />
      <button onClick={leaveGame} className="fixed right-3 top-3 sm:right-5 sm:top-5 z-[80] grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full border-2 border-white/70 bg-[#075f63]/80 text-2xl sm:text-3xl font-light leading-none text-white shadow-xl backdrop-blur-sm transition hover:scale-105 hover:bg-[#c44837]" aria-label="Đóng trò chơi">×</button>
      <main className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center p-0 overflow-hidden">
        {screen === 'name' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#052f32] overflow-hidden">
            {/* Nền đệm gradient màu tương đồng video */}
            <div className="absolute inset-0 bg-[#052f32] pointer-events-none">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,#408a8c_0%,#052f32_100%)]" />
            </div>

            {/* Sân khấu 16:9 chuẩn như trên laptop, hiển thị trọn vẹn 100% video và các nhân vật */}
            <div className="relative w-full max-w-[1400px] aspect-[16/9] max-h-[100dvh] flex items-center justify-center overflow-hidden sm:rounded-2xl shadow-2xl">
              <video
                ref={(node) => {
                  if (!node) return
                  node.muted = true
                  node.playsInline = true

                  let isReversing = false
                  let animFrameId: number

                  const animate = () => {
                    if (!node) return

                    if (!isReversing) {
                      if (node.duration && node.currentTime >= node.duration - 0.15) {
                        isReversing = true
                      }
                      animFrameId = requestAnimationFrame(animate)
                    } else {
                      if (node.currentTime <= 0.15) {
                        isReversing = false
                        animFrameId = requestAnimationFrame(animate)
                      } else {
                        node.currentTime = Math.max(0, node.currentTime - 0.08)
                        animFrameId = requestAnimationFrame(animate)
                      }
                    }
                  }

                  node.onplay = () => {
                    cancelAnimationFrame(animFrameId)
                    animFrameId = requestAnimationFrame(animate)
                  }

                  node.onpause = () => {
                    cancelAnimationFrame(animFrameId)
                  }
                }}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                src="/sound/video-daugame.mp4"
              />

              {/* Khung nhập tên đặt chính xác góc dưới bên trái của video như trên laptop */}
              <div className="
                absolute
                left-[5%]
                bottom-[4%]
                z-10
                w-[52%]
                max-w-[540px]
                sm:left-[10%]
                sm:bottom-[6%]
                sm:w-[46%]
              ">
                <div className="relative w-full flex flex-col items-center justify-center">
                  <img
                    src="/assets/khung(1).png"
                    alt="Khung nhập tên"
                    className="w-full h-auto object-contain drop-shadow-2xl mix-blend-screen"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-between py-[9%] px-[12%] text-center">
                    {/* Tiêu đề */}
                    <span
                      className="text-[10px] min-[380px]:text-xs sm:text-lg font-black text-[#2d4a3e]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Nhập tên
                    </span>

                    {/* Ô nhập tên */}
                    <div className="w-full max-w-[150px] min-[380px]:max-w-[200px] sm:max-w-[270px]">
                      <input
                        autoFocus
                        value={nameInput}
                        onChange={(event) => setNameInput(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && submitName()}
                        maxLength={20}
                        placeholder="Nhập tên của bạn"
                        className="w-full border-b border-dotted border-[#2d4a3e]/60 bg-transparent pb-0.5 text-center text-[10px] min-[380px]:text-xs sm:text-xl font-semibold text-[#2d4a3e] outline-none placeholder:text-[#2d4a3e]/50"
                        style={{ fontFamily: 'var(--font-body)' }}
                      />
                    </div>

                    {error && <p className="text-[8px] sm:text-xs font-bold text-red-600">{error}</p>}

                    {/* Nút Vào hội */}
                    <button
                      onClick={submitName}
                      className="animate-bounce-scale flex h-6 min-[380px]:h-8 sm:h-11 items-center justify-center rounded-full bg-[#2d4a3e] px-4 min-[380px]:px-6 sm:px-8 text-[9px] min-[380px]:text-xs sm:text-lg font-extrabold text-white shadow-xl active:scale-95 transition"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      Vào hội
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Gợi ý xoay ngang màn hình khi ở chiều dọc trên điện thoại */}
            <div className="landscape:hidden sm:hidden absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-[11px] text-white/85 backdrop-blur-sm pointer-events-none flex items-center gap-1.5 shadow-md whitespace-nowrap">
              <span className="text-sm">🔄</span>
              <span>Xoay ngang để xem toàn cảnh như laptop</span>
            </div>
          </div>
        )}

        {screen === 'mode' && (
          <section className="fixed inset-0 z-10 overflow-y-auto overflow-x-hidden bg-[#087b7f] text-center text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(125,242,224,.34),transparent_40%),linear-gradient(180deg,#075f68_0%,#087f82_55%,#043f49_100%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,245,176,.9)_1px,transparent_1.5px)] [background-size:42px_42px] pointer-events-none" />

            <div className="relative z-10 flex min-h-[100dvh] flex-col justify-between items-center px-4 pt-14 pb-8 sm:pt-14 sm:pb-8">
              {/* Tiêu đề chọn chế độ */}
              <div className="w-full max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[.25em] text-[#ffda86] sm:text-sm">Xin chào, {playerName}</p>
                <h2 className="mode-screen-title mt-1 font-black" style={{ fontFamily: 'var(--font-display)' }}>CHỌN CHẾ ĐỘ CHƠI</h2>
                <p className="mt-1 text-xs font-semibold text-white/75 sm:text-sm">Chọn một cách vào hội để bắt đầu</p>
              </div>

              {/* 5 quân bài xòe quạt ở trung tâm */}
              <div className="relative my-auto min-h-[220px] w-full max-w-[820px] flex-1 flex items-center justify-center py-4">
                <div className="absolute left-1/2 top-1/2 h-[48%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff1a6]/40 blur-3xl pointer-events-none" />
                <div className="mode-stage-beam absolute bottom-[10%] left-1/2 h-[65%] w-[65%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(255,249,190,.92),rgba(255,208,107,.25)_35%,transparent_70%)] blur-xl pointer-events-none" />

                <div className="mode-spin-ring pointer-events-none absolute bottom-[-5%] left-1/2 h-[95%] w-[min(140vw,1280px)] -translate-x-1/2" role="img" aria-label="Vòng xoay Bài Chòi" />

                <div className="relative h-[220px] sm:h-[280px] w-[min(94vw,720px)] mx-auto">
                  {CARDS.slice(0, 5).map((card, index) => {
                    const cardPositions = [
                      'left-[4%] top-[18%] z-[1] -rotate-[16deg]',
                      'left-[23%] top-[30%] z-[3] -rotate-[8deg]',
                      'left-1/2 top-[4%] z-[5] -translate-x-1/2 rotate-[3deg]',
                      'right-[22%] top-[29%] z-[4] rotate-[9deg]',
                      'right-[4%] top-[14%] z-[2] rotate-[17deg]',
                    ]
                    return (
                      <div key={card.id} className={`mode-card-float absolute w-[21%] max-w-[135px] ${cardPositions[index]}`} style={{ animationDelay: `${index * 0.14}s` }}>
                        <div className="mode-card-glow overflow-hidden rounded-[10px] border-2 border-[#fff0a4] bg-white p-1 shadow-lg">
                          <img src={card.image} alt={card.name} className="aspect-[3/4] h-auto w-full rounded-md object-cover" />
                        </div>
                        <span className="mt-1 block rounded-full bg-[#075f63]/90 px-1.5 py-0.5 text-[9px] min-[380px]:text-[11px] font-semibold text-white shadow truncate sm:text-base" style={{ fontFamily: 'var(--font-display)' }}>{card.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 2 nút chọn chế độ */}
              <div className="relative z-20 grid w-full max-w-[680px] grid-cols-2 gap-3 sm:gap-5">
                <button
                  onClick={() => { setCountdown(8); setScreen('matchmaking') }}
                  className="mode-choice-button group rounded-[1.2rem] sm:rounded-[1.4rem] border-2 border-[#f6d274] bg-[#fff9df]/95 px-3 py-3 text-[#075f63] shadow-[0_10px_28px_rgba(0,99,104,.22)] sm:px-6 sm:py-4 transition active:scale-95"
                >
                  <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-[#bd6648]">Chế độ 01</span>
                  <strong className="mt-0.5 block text-sm sm:text-xl font-black">Chơi ngay</strong>
                  <span className="mt-1 hidden text-xs text-[#075f63]/65 sm:block">Ghép hội nhanh với các chòi máy</span>
                </button>
                <button
                  onClick={() => setScreen('friend')}
                  className="mode-choice-button group rounded-[1.2rem] sm:rounded-[1.4rem] border-2 border-[#85d4ce] bg-[#eafff9]/95 px-3 py-3 text-[#075f63] shadow-[0_10px_28px_rgba(0,99,104,.22)] sm:px-6 sm:py-4 transition active:scale-95"
                >
                  <span className="block text-[10px] font-bold uppercase tracking-[.18em] text-[#b85a3f]">Chế độ 02</span>
                  <strong className="mt-0.5 block text-sm sm:text-xl font-black">Mở hội cùng bạn</strong>
                  <span className="mt-1 hidden text-xs text-[#075f63]/65 sm:block">Tạo mã hoặc tham gia phòng bạn bè</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {screen === 'matchmaking' && (
          <section className="relative z-10 w-full max-w-xl text-center">
            <FlyingClouds />
            <div className="mx-auto mb-7 grid h-32 w-32 place-items-center rounded-full border-4 border-[#f29963]/30 bg-[#0b5558] text-5xl font-black text-[#f29963] shadow-[0_0_50px_rgba(242,153,99,.2)]">{countdown}</div>
            <h2 className="text-3xl font-black">Bạn đang tìm bạn chơi…</h2>
            <p className="mt-3 text-white/65">Hết thời gian chờ, hệ thống sẽ mời các chòi máy vào.</p>
            <button onClick={startGame} className="mt-8 rounded-full border border-white/25 px-6 py-3 font-semibold hover:bg-white/10">Chơi với máy ngay</button>
          </section>
        )}

        {screen === 'friend' && (
          <>
            <FlyingClouds />
            <section className="friend-light-frame relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] p-7 sm:p-10">
            <button onClick={backToMode} className="mb-6 text-sm text-white/65 hover:text-white">← Quay lại</button>
            <h2 className="text-3xl font-black">Mở hội cùng bạn</h2>
            <p className="mt-3 text-white/65">Tạo mã rồi gửi cho bạn bè đang mở cùng địa chỉ website này.</p>
            {!roomCode ? <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-black/10 p-5">
                <h3 className="font-bold">Tạo hội mới</h3>
                <button onClick={createRoom} disabled={socketStatus === 'connecting'} className="mt-4 w-full rounded-xl bg-[#c44837] px-4 py-3 font-bold disabled:opacity-50">{socketStatus === 'connecting' ? 'Đang kết nối…' : 'Tạo mã hội'}</button>
              </div>
              <div className="rounded-2xl border border-white/15 bg-black/10 p-5">
                <h3 className="font-bold">Vào hội bằng mã</h3>
                <input
                  value={joinCode}
                  onChange={(event) => {
                    const value = event.target.value
                      .toUpperCase()
                      .replace(/\s/g, '')
                      .replace(/[^A-Z0-9-]/g, '')
                      .slice(0, 11)
                    setJoinCode(value)
                  }}
                  placeholder="CHOI-286194 hoặc 286194"
                  autoCapitalize="characters"
                  className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center font-bold tracking-widest outline-none"
                />
                <button
                  onClick={() => { void unlockAudio(); connectRoom('joinRoom') }}
                  disabled={!/^(CHOI-)?\d{6}$/i.test(joinCode) || socketStatus === 'connecting'}
                  className="mt-3 w-full rounded-xl bg-[#e69756] px-4 py-3 font-bold text-[#173a3a] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Vào hội
                </button>
              </div>
            </div> : <div className="mt-7">
              <div className="rounded-2xl border border-[#f29963]/40 bg-black/10 p-5 text-center"><p className="text-xs uppercase tracking-[.2em] text-white/55">Mã hội của bạn</p><div className="mt-2 text-3xl font-black tracking-[.2em] text-[#f29963]">{roomCode}</div><button onClick={() => void copyRoomCode()} className="mt-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">{roomCodeCopied ? 'Đã sao chép ✓' : 'Sao chép mã'}</button></div>
              <div className="mt-4 space-y-2">{onlinePlayers.map((player) => <div key={player.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"><span className="font-semibold">{player.name} {player.id === hostId && '👑'}</span><span className={player.ready ? 'text-[#f29963]' : 'text-white/45'}>{player.ready ? 'Sẵn sàng' : 'Chưa sẵn sàng'}</span></div>)}</div>
              {playerId !== hostId && <button onClick={() => { void unlockAudio(); socketRef.current?.send(JSON.stringify({ type: 'ready', ready: !onlinePlayers.find((player) => player.id === playerId)?.ready })) }} className="mt-5 w-full rounded-xl bg-[#e69756] px-4 py-3 font-bold text-[#173a3a]">{onlinePlayers.find((player) => player.id === playerId)?.ready ? 'Hủy sẵn sàng' : 'Tôi đã sẵn sàng'}</button>}
              {playerId === hostId && <button onClick={() => { void unlockAudio(); socketRef.current?.send(JSON.stringify({ type: 'startGame' })) }} disabled={onlinePlayers.length < 2 || onlinePlayers.some((player) => !player.ready)} className="mt-5 w-full rounded-xl bg-[#c44837] px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-35">{onlinePlayers.length < 2 ? 'Chờ ít nhất một người bạn…' : onlinePlayers.some((player) => !player.ready) ? 'Chờ mọi người sẵn sàng…' : 'Khai hội'}</button>}
            </div>}
            {roomError && <p className="mt-4 rounded-xl bg-[#7c2421]/50 px-4 py-3 text-sm text-[#ffd3c2]">{roomError}</p>}
            </section>
          </>
        )}

        {screen === 'playing' && (
          <section className="w-full">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs uppercase tracking-[.2em] text-[#f29963]">Hội Bài Chòi • 5 chòi</p><h2 className="text-2xl font-black">Ván đang diễn ra</h2></div>
              <div className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm">Cờ của bạn: <strong className="text-[#f29963]">{claimed.length}/3</strong></div>
            </header>
            <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
              <div className="rounded-[2rem] border border-white/15 bg-[#0b5558]/90 p-5">
              <p className="mb-4 text-center text-sm text-white/70">{message}</p>
                <div className="bai-choi-draw-stage">

  {/* NỀN / VÒNG MA THUẬT */}
  <img
    src="/assets/nen2game.jpg"
    alt=""
    className={`
      draw-magic-background
      ${isCalling ? 'draw-magic-background-active' : ''}
    `}
    draggable={false}
  />

  {/* ÁNH SÁNG PHÍA SAU LÁ BÀI */}
  <div
    className={`
      draw-stage-light
      ${isCalling ? 'draw-stage-light-active' : ''}
    `}
  />

  {/* LÁ BÀI */}
  {(isCalling || currentCard) ? (
    <div
      className={`
        draw-card-wrapper
        ${isCalling ? 'draw-card-calling' : ''}
      `}
    >
      <div
        className={`
          draw-card-inner
          ${currentCard ? 'draw-card-flipped' : ''}
        `}
      >

        {/* MẶT SAU */}
        <div className="draw-card-face draw-card-back">
          <img
            src="/assets/phiasau.png"
            alt="Mặt sau quân Bài Chòi"
            draggable={false}
          />

          {isCalling && (
            <>
              <span className="card-spark spark-1">✦</span>
              <span className="card-spark spark-2">✦</span>
              <span className="card-spark spark-3">✦</span>
              <span className="card-spark spark-4">✦</span>
            </>
          )}
        </div>

        {/* MẶT TRƯỚC */}
        <div className="draw-card-face draw-card-front">
          {currentCard && (
            <img
              src={currentCard.image}
              alt={currentCard.name}
              draggable={false}
            />
          )}
        </div>

      </div>
    </div>
  ) : (
    <div className="draw-waiting">
      <div className="draw-waiting-symbol">✦</div>

      <p>
        Chờ Chị Hiệu
        <br />
        rút thẻ
      </p>
    </div>
  )}

  <div className="draw-status">
    {isCalling ? (
      <>
        <span className="draw-status-dot" />
        <span>Chị Hiệu đang hô...</span>
      </>
    ) : currentCard ? (
      <span className="draw-card-name">
        QUÂN {currentCard.name.toUpperCase()}
      </span>
    ) : (
      <span>Chờ bắt đầu hội</span>
    )}
  </div>

</div>
               <div className="mt-5 grid grid-cols-2 gap-3">

  {/* NÚT HÔ */}
  <button
    onClick={drawNext}
    disabled={
      Boolean(winner) ||
      isCalling ||
      (onlineMode ? playerId !== hostId : drawIndex >= deck.length - 1)
    }
    className="game-action-btn game-action-btn-frame"
  >
    {isCalling
      ? 'Đang hô…'
      : onlineMode && playerId !== hostId
      ? 'Chờ chủ hội'
      : drawIndex < 0
      ? 'Bắt đầu hô'
      : 'Hô tiếp'}
  </button>


  {/* NÚT GÕ MÕ */}
  <button
  onClick={claimCard}
  disabled={isCalling || !currentCard || Boolean(winner)}
  className={`
    game-action-btn
    game-action-btn-frame
    ${canClaim && !isCalling ? 'game-action-btn-hit' : ''}
  `}
>
  GÕ MÕ
</button>

</div>
              </div>
              <div className="space-y-5">
                <div className="rounded-[2rem] border border-white/15 bg-[#0b5558]/90 p-5">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#f29963]">Ba thẻ trong chòi của bạn</p>
                  <div className="grid grid-cols-3 gap-3">
  {hand.map((card) => {
    const isClaimed = claimed.includes(card.id)

    // Chỉ sáng + nhấp nhô SAU KHI hò xong
    // và quân vừa hô trùng với lá này
    const isHit =
      !isCalling &&
      currentCard?.id === card.id &&
      !isClaimed

    return (
      <div
        key={card.id}
        className={`
          hand-card
          ${isHit ? 'hand-card-hit' : ''}
          ${isClaimed ? 'hand-card-claimed' : ''}
        `}
      >
        <div className="hand-card-image">
          <img
            src={card.image}
            alt={card.name}
            draggable={false}
          />
        </div>

        <p className="hand-card-name">
          {isClaimed ? '⚑ ' : ''}
          {card.name}
        </p>

        {isHit && (
          <>
            <span className="hit-spark hit-spark-1">✦</span>
            <span className="hit-spark hit-spark-2">✦</span>
          </>
        )}
      </div>
    )
  })}
</div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {players.map((player, index) => <div key={`${player}-${index}`} className={`rounded-2xl border p-3 text-center ${(onlineMode ? onlinePlayers[index]?.id === playerId : index === 0) ? 'border-[#f29963] bg-[#c44837]/25' : 'border-white/15 bg-[#0b5558]/80'}`}><div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-white/10">{onlineMode ? '☺' : index === 0 ? '☺' : '⚙'}</div><p className="truncate text-xs font-bold">{player}</p><p className="mt-1 text-[11px] text-[#f29963]">⚑ {onlineMode ? onlinePlayers[index]?.flags || 0 : index === 0 ? claimed.length : botFlags[index - 1]}/3</p></div>)}
                </div>
              </div>
            </div>
          </section>
        )}

        {screen === 'result' && (
          <section className="w-full max-w-xl rounded-[2rem] border border-[#f29963]/50 bg-[#0b5558]/95 p-8 text-center shadow-2xl sm:p-12">
            <div className="text-6xl">{winner === playerName ? '🎊' : '🏁'}</div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.25em] text-[#f29963]">Kết thúc ván</p>
            <h2 className="mt-2 text-4xl font-black" style={{ fontFamily: 'var(--font-display)' }}>{winner === playerName ? 'Bạn đã hô TỚI!' : `${winner} chiến thắng!`}</h2>
            <p className="mt-4 text-white/65">Cảm ơn {playerName} đã cùng vào hội.</p>
            <div className="mt-8 grid grid-cols-2 gap-3"><button onClick={() => { stopAudio(); onlineMode ? backToMode() : startGame() }} className="rounded-xl bg-[#c44837] px-4 py-3 font-bold">{onlineMode ? 'Về phòng hội' : 'Chơi ván nữa'}</button><button onClick={backToMode} className="rounded-xl border border-white/20 px-4 py-3 font-bold hover:bg-white/10">Về sảnh hội</button></div>
          </section>
        )}
      </main>
    </div>
  )
}
