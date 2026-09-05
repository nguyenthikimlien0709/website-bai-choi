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

  // =====================================================
  // PHÔ 01 — LÁ 01 → 10
  // =====================================================

  {
    id: 'nhat-tro',
    name: 'Nhất Trò',
    image: '/assets/the1.jpg',
    sound: '/sound/Nhat-tro.mp3'
  },

  {
    id: 'nhi-bi',
    name: 'Nhì Bí',
    image: '/assets/the2.jpg',
    sound: '/sound/Nhi-Bi.mp3'
  },

  {
    id: 'tam-quan',
    name: 'Tam Quan',
    image: '/assets/the3.jpg',
    sound: '/sound/Tam-Quan.mp3'
  },

  {
    id: 'tu-huong',
    name: 'Tứ Hương',
    image: '/assets/the4.jpg',
    sound: '/sound/Tu-Huong.mp3'
  },

  {
    id: 'ngu-truot',
    name: 'Ngũ Trượt',
    image: '/assets/the5.jpg',
    sound: '/sound/Ngu-trot.mp3'
  },

  {
    id: 'luc-xo',
    name: 'Lục Xơ',
    image: '/assets/the6.jpg',
    sound: '/sound/Luc-Xo.mp3'
  },

  {
    id: 'that-nhon',
    name: 'Thất Nhọn',
    image: '/assets/the7.jpg',
    sound: '/sound/That-Nhon.mp3'
  },

  {
    id: 'bat-bong',
    name: 'Bát Bồng',
    image: '/assets/the8.jpg',
    sound: '/sound/Bat-Bong.mp3'
  },

  {
    id: 'cuu-thay',
    name: 'Cửu Thầy',
    image: '/assets/the9.jpg',
    sound: '/sound/Cuu-thay.mp3'
  },

  {
    id: 'thai-tu',
    name: 'Thái Tử',
    image: '/assets/the10.jpg',
    sound: '/sound/Thai-tu.mp3'
  },


  // =====================================================
  // PHÔ 02 — LÁ 11 → 20
  // =====================================================

  // =====================================================
// PHÔ 02 — LÁ 11 → 20
// =====================================================

{
  id: 'nhat-noc',
  name: 'Nhất Nọc',
  image: '/assets/the11.jpg',
  sound: '/sound/Nhat-Noc.mp3'
},

{
  id: 'nhi-ngheo',
  name: 'Nhì Nghèo',
  image: '/assets/the12.jpg',
  sound: '/sound/Nhi-Ngheo.mp3'
},

{
  id: 'ba-ga',
  name: 'Ba Gà',
  image: '/assets/the13.jpg',
  sound: '/sound/Ba-Ga.mp3'
},

{
  id: 'tu-dong',
  name: 'Tứ Dóng',
  image: '/assets/the14.jpg',
  sound: '/sound/Tu-Dong.mp3'
},

{
  id: 'ngu-dum',
  name: 'Ngũ Đụm',
  image: '/assets/the15.jpg',
  sound: '/sound/Ngu-Dum.mp3'
},

{
  id: 'sau-hot',
  name: 'Sáu Hột',
  image: '/assets/the16.jpg',
  sound: '/sound/Sau-Hot.mp3'
},

{
  id: 'bay-thua',
  name: 'Bảy Thưa',
  image: '/assets/the17.jpg',
  sound: '/sound/Bay-Thua.mp3'
},

{
  id: 'tam-day',
  name: 'Tám Dầy',
  image: '/assets/the18.jpg',
  sound: '/sound/Tam-Day.mp3'
},

{
  id: 'chin-goi',
  name: 'Chín Gối',
  image: '/assets/the19.jpg',
  sound: '/sound/Chin-Goi.mp3'
},

{
  id: 'do-mo',
  name: 'Đỏ Mỏ',
  image: '/assets/the20.jpg',
  sound: '/sound/Do-Mo.mp3'
},


// =====================================================
// PHÔ 03 — LÁ 21 → 30
// =====================================================

{
  id: 'bach-hue',
  name: 'Bạch Huê',
  image: '/assets/the21.jpg',
  sound: '/sound/Bach-Hue.mp3'
},

{
  id: 'banh-hai',
  name: 'Bành Hai',
  image: '/assets/the22.jpg',
  sound: '/sound/Banh-Hai.mp3'
},

{
  id: 'banh-ba',
  name: 'Bành Ba',
  image: '/assets/the23.jpg',
  sound: '/sound/Banh-Ba.mp3'
},

{
  id: 'dai-doi',
  name: 'Dái Doi',
  image: '/assets/the24.jpg',
  sound: '/sound/Dai-Doi.mp3'
},

{
  id: 'nam-run',
  name: 'Năm Rún',
  image: '/assets/the25.jpg',
  sound: '/sound/Nam-Run.mp3'
},

{
  id: 'sau-tien',
  name: 'Sáu Tiền',
  image: '/assets/the26.jpg',
  sound: '/sound/Sau-Tien.mp3'
},

{
  id: 'that-lieu',
  name: 'Thất Liễu',
  image: '/assets/the27.jpg',
  sound: '/sound/That-Lieu.mp3'
},

{
  id: 'tam-tien',
  name: 'Tám Tiền',
  image: '/assets/the28.jpg',
  sound: '/sound/Tam-Tien.mp3'
},

{
  id: 'chin-ghe',
  name: 'Chín Ghe',
  image: '/assets/the29.jpg',
  sound: '/sound/Chin-Ghe.mp3'
},

{
  id: 'ong-am',
  name: 'Ông Âm',
  image: '/assets/the30.jpg',
  sound: '/sound/Ong-Am.mp3'
},
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
const [botHands, setBotHands] = useState<Card[][]>([])
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

const [isMobilePortrait, setIsMobilePortrait] = useState(() => {
  if (typeof window === 'undefined') return false

  return (
    window.innerWidth < 768 &&
    window.innerHeight > window.innerWidth
  )
})

const introVideoSrc = isMobilePortrait
  ? '/sound/video-daugame-dienthoai.mp4'
  : '/sound/video-daugame.mp4'

  useEffect(() => {
    const checkOrientation = () => {
      setIsMobilePortrait(window.innerWidth < 768 && window.innerHeight > window.innerWidth)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

useEffect(() => {
  const origOverflow = document.body.style.overflow
  const origTouchAction = document.body.style.touchAction

  if (screen === 'playing') {
    // Màn chơi sẽ tự scroll ở container game
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'pan-y'
  } else {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  }

  return () => {
    document.body.style.overflow = origOverflow
    document.body.style.touchAction = origTouchAction
  }
}, [screen])

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


const goBack = () => {
  stopAudio()

  // Màn nhập tên → quay về website
  if (screen === 'name') {
    leaveGame()
    return
  }

  // Màn chọn chế độ → quay lại nhập tên
  if (screen === 'mode') {
    setScreen('name')
    return
  }

  // Các màn còn lại → quay lại chọn chế độ
  if (
    screen === 'matchmaking' ||
    screen === 'friend' ||
    screen === 'playing' ||
    screen === 'result'
  ) {
    backToMode()
  }
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

  const isLocalHost =
    ['localhost', '127.0.0.1'].includes(
      window.location.hostname
    )

  const configuredRealtimeUrl =
    import.meta.env.VITE_REALTIME_URL?.trim() ||
    (
      isLocalHost
        ? ''
        : 'wss://bai-choi-realtime.lienntk-ce190812.workers.dev/bai-choi-ws'
    )

  if (!configuredRealtimeUrl && !isLocalHost) {
    setRoomError(
      'Phòng chơi online chưa được kết nối với máy chủ realtime trên bản public.'
    )
    return
  }

  // ==========================================
  // MÃ HỘI CHỈ GỒM ĐÚNG 6 CHỮ SỐ
  // ==========================================
const normalizedRoomCode =
  action === 'joinRoom'
    ? joinCode.toUpperCase()
    : ''

if (
  action === 'joinRoom' &&
  !/^CHOI-\d{6}$/.test(normalizedRoomCode)
) {
  setRoomError(
    'Mã hội phải có dạng CHOI-123456.'
  )
  return
}


  // Chỉ chuyển sang connecting sau khi mã hợp lệ
  setSocketStatus('connecting')

  socketRef.current?.close()

  const protocol =
    window.location.protocol === 'https:'
      ? 'wss:'
      : 'ws:'

  const baseRealtimeUrl =
    configuredRealtimeUrl ||
    `${protocol}//${window.location.host}/bai-choi-ws`

  const realtimeUrl =
    new URL(baseRealtimeUrl)

  realtimeUrl.searchParams.set(
    'action',
    action
  )

  realtimeUrl.searchParams.set(
    'name',
    playerName
  )

  if (action === 'joinRoom') {
    realtimeUrl.searchParams.set(
      'roomId',
      normalizedRoomCode
    )
  }

  const socket =
    new WebSocket(
      realtimeUrl.toString()
    )

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
      setError('')
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

  // Bộ 30 quân dùng để Anh/Chị Hiệu rút và hô
  const nextDeck = shuffle(CARDS)

  // Một bộ xáo riêng để chia bài cho các chòi
  const dealDeck = shuffle(CARDS)

  // Người chơi nhận 3 quân
  const playerHand = dealDeck.slice(0, 3)

  // 4 bot, mỗi bot nhận 3 quân riêng
  const nextBotHands = BOT_NAMES.map((_, botIndex) => {
    const start = 3 + botIndex * 3

    return dealDeck.slice(start, start + 3)
  })

  setDeck(nextDeck)

  setHand(playerHand)

  // QUAN TRỌNG
  setBotHands(nextBotHands)

  setDrawIndex(-1)
  setClaimed([])
  setRevealedCard(null)
  setIsCalling(false)

  setBotFlags([0, 0, 0, 0])

  setWinner('')

  setMessage(
    'Hội đã đủ chòi. Mời bạn nghe câu hô đầu tiên!'
  )

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

    setBotFlags((previous) =>
  previous.map((flags, index) => {

    const botHasCard =
      botHands[index]?.some(
        (botCard) => botCard.id === card.id
      ) ?? false

    return botHasCard && flags < 3
      ? flags + 1
      : flags
  })
)
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
  <div
  className={`
    fixed inset-0 z-[300]
    select-none
    bg-[#052f32]
    text-white
    h-[100dvh]
    w-full

    ${
      screen === 'playing'
        ? 'overflow-y-auto overflow-x-hidden touch-pan-y overscroll-y-contain'
        : 'overflow-hidden touch-none'
    }
  `}
  role="dialog"
  aria-modal="true"
  aria-label="Trò chơi Bài Chòi"
>
      <div className="pointer-events-none fixed inset-0 opacity-20" style={{ backgroundImage: 'url(/assets/Background-toan.jpg)', backgroundSize: 'cover' }} />

      <button
  onClick={goBack}
  className="
    fixed
    left-3
    top-3
    z-[80]

    flex
    h-10
    items-center
    justify-center
    gap-1.5

    rounded-full
    border-2
    border-white/70

    bg-[#075f63]/80

    px-3

    text-sm
    font-bold
    text-white

    shadow-xl
    backdrop-blur-sm

    transition

    hover:scale-105
    hover:bg-[#c44837]

    sm:left-5
    sm:top-5
    sm:h-12
    sm:px-4
    sm:text-base
  "
  aria-label="Quay lại"
>
  <span className="text-xl leading-none">←</span>
  <span>Quay lại</span>
</button>
      <button onClick={leaveGame} className="fixed right-3 top-3 sm:right-5 sm:top-5 z-[80] grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full border-2 border-white/70 bg-[#075f63]/80 text-2xl sm:text-3xl font-light leading-none text-white shadow-xl backdrop-blur-sm transition hover:scale-105 hover:bg-[#c44837]" aria-label="Đóng trò chơi">×</button>
     <main
  className={`
    relative
    mx-auto
    flex
    w-full
    max-w-6xl
    justify-center
    p-0

    ${
      screen === 'playing'
        ? 'min-h-full h-auto items-start overflow-visible py-6'
        : 'h-full items-center overflow-hidden'
    }
  `}
>
  {screen === 'name' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#052f32] overflow-hidden">
            {/* Background video & stage */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {/* Video 16:9 dành riêng cho Laptop / Desktop / Màn hình ngang
              <video
                ref={(node) => {
                  if (!node) return
                  node.muted = true
                  node.playsInline = true
                  node.setAttribute('muted', '')
                  node.setAttribute('playsinline', '')
                  node.play().catch(() => {})
                }}
                autoPlay
                muted
                playsInline
                loop
                preload="auto"
                className="hidden landscape:block sm:block w-full h-full object-cover"
                src="/sound/video-daugame.mp4"
              /> */}

              {/* Video 9:16 đứng dành riêng cho Điện thoại / Màn hình dọc */}
             <video
  key={introVideoSrc}

  ref={(node) => {
    if (!node) return

    node.muted = true
    node.defaultMuted = true
    node.playsInline = true

    node.setAttribute('muted', '')
    node.setAttribute('playsinline', '')

    node.play().catch((error) => {
      console.error('Không phát được video:', introVideoSrc, error)
    })
  }}

  autoPlay
  muted
  playsInline
  loop
  preload="auto"

  src={introVideoSrc}

  className="
    absolute
    inset-0
    h-full
    w-full
    object-cover
  "

  onError={(event) => {
    console.error(
      'VIDEO LOAD ERROR:',
      introVideoSrc,
      event.currentTarget.error
    )
  }}
/>

              {/* Khung nhập tên: Tự động tương thích màn hình dọc điện thoại & màn hình ngang laptop */}
              <div
  className="
    absolute
    left-1/2
    top-1/2
    z-10
    w-[92vw]
    max-w-[420px]
    -translate-x-1/2
    -translate-y-1/2

    sm:left-[8%]
    sm:top-auto
    sm:bottom-[8%]
    sm:w-[42%]
    sm:max-w-[540px]
    sm:translate-x-0
    sm:translate-y-0
  "
>
  <div className="relative w-full">

    {/* ẢNH KHUNG */}
    <img
      src="/assets/khung(1).png"
      alt="Khung nhập tên"
      className="
        block
        h-auto
        w-full
        object-contain
        drop-shadow-2xl
        mix-blend-screen
      "
    />


    {/* ============================== */}
    {/* NỘI DUNG NẰM TRONG KHUNG */}
    {/* ============================== */}

    <div className="absolute inset-0">

      {/* NHẬP TÊN */}
      <div
        className="
          absolute
          left-1/2
          top-[29%]
          w-full
          -translate-x-1/2
          text-center
        "
      >
        <span
          className="
            text-sm
            font-black
            text-[#2d4a3e]
            sm:text-lg
          "
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Nhập tên
        </span>
      </div>


      {/* Ô NHẬP */}
      <div
        className="
          absolute
          left-1/2
          top-[48%]
          w-[58%]
          -translate-x-1/2
          -translate-y-1/2
        "
      >
        <input
          autoFocus
          value={nameInput}
          onChange={(event) => setNameInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitName()
          }}
          maxLength={20}
          placeholder="Nhập tên của bạn"
          className="
            w-full
            border-b
            border-dotted
            border-[#2d4a3e]/60
            bg-transparent
            pb-1
            text-center
            text-base
            font-semibold
            text-[#2d4a3e]
            outline-none
            placeholder:text-[#2d4a3e]/55

            sm:text-xl
          "
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>


      {/* LỖI */}
      {error && (
        <p
          className="
            absolute
            left-1/2
            top-[61%]
            w-[75%]
            -translate-x-1/2
            text-center
            text-[9px]
            font-bold
            text-red-600
            sm:text-xs
          "
        >
          {error}
        </p>
      )}


      {/* NÚT VÀO HỘI */}
      <button
        onClick={submitName}
        className="
          animate-bounce-scale

          absolute
          bottom-[25%]
          left-1/2
          -translate-x-1/2

          flex
          h-10
          min-w-[125px]
          items-center
          justify-center

          rounded-full
          bg-[#2d4a3e]

          px-7

          text-base
          font-extrabold
          leading-none
          text-white

          shadow-xl

          transition
          active:scale-95

          sm:h-11
          sm:min-w-[155px]
          sm:px-8
          sm:text-lg
        "
        style={{ fontFamily: 'var(--font-body)' }}
      >
        Vào hội
      </button>

    </div>
  </div>
</div>
            </div>
          </div>
          
        )}

        {screen === 'mode' && (
  <section className="fixed inset-0 z-10 overflow-hidden bg-[#087b7f] text-center text-white">

    {/* NỀN */}
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(125,242,224,.34),transparent_40%),linear-gradient(180deg,#075f68_0%,#087f82_55%,#043f49_100%)]" />

    <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle,rgba(255,245,176,.9)_1px,transparent_1.5px)] [background-size:42px_42px]" />


    {/* TOÀN BỘ GIAO DIỆN */}
    <div
      className="
        relative z-10
        flex h-[100dvh]
        flex-col
        items-center

        px-3
        pb-4
        pt-10

        sm:min-h-[100dvh]
        sm:h-auto
        sm:px-4
        sm:pb-8
        sm:pt-14
      "
    >

      {/* ========================= */}
      {/* TIÊU ĐỀ */}
      {/* ========================= */}

      <div className="w-full max-w-xl shrink-0">

        <p className="
          text-[10px]
          font-bold
          uppercase
          tracking-[.25em]
          text-[#ffda86]

          sm:text-sm
        ">
          Xin chào, {playerName}
        </p>

        <h2
          className="
            mode-screen-title
            mt-1
            font-black
          "
          style={{ fontFamily: 'var(--font-display)' }}
        >
          CHỌN CHẾ ĐỘ CHƠI
        </h2>

        <p className="
          mt-1
          text-[11px]
          font-semibold
          text-white/75

          sm:text-sm
        ">
          Chọn một cách vào hội để bắt đầu
        </p>

      </div>


      {/* ========================= */}
      {/* KHU 5 LÁ BÀI */}
      {/* ========================= */}

      <div
        className="
          relative

          mt-2
          mb-2

          flex
          h-[44dvh]
          min-h-[320px]
          max-h-[410px]

          w-full
          max-w-[820px]

          shrink-0

          items-center
          justify-center

          sm:my-auto
          sm:h-auto
          sm:min-h-[220px]
          sm:max-h-none
          sm:flex-1
          sm:py-4
        "
      >

        {/* Ánh sáng sau bài */}
        <div
          className="
            pointer-events-none
            absolute

            left-1/2
            top-1/2

            h-[50%]
            w-[92%]

            -translate-x-1/2
            -translate-y-1/2

            rounded-full

            bg-[#fff1a6]/35
            blur-3xl

            sm:h-[48%]
            sm:w-[78%]
          "
        />


        {/* Luồng sáng */}
        <div
          className="
            mode-stage-beam
            pointer-events-none
            absolute

            bottom-[10%]
            left-1/2

            h-[58%]
            w-[90%]

            -translate-x-1/2

            bg-[radial-gradient(ellipse_at_bottom,rgba(255,249,190,.92),rgba(255,208,107,.25)_35%,transparent_70%)]
            blur-xl

            sm:h-[65%]
            sm:w-[65%]
          "
        />


        {/* Vòng xoay */}
        <div
          className="
            mode-spin-ring
            pointer-events-none
            absolute

            bottom-[2%]
            left-1/2

            h-[68%]
            w-[105vw]

            -translate-x-1/2

            sm:bottom-[-5%]
            sm:h-[95%]
            sm:w-[min(140vw,1280px)]
          "
          role="img"
          aria-label="Vòng xoay Bài Chòi"
        />


        {/* ========================= */}
        {/* 5 QUÂN BÀI */}
        {/* ========================= */}

        <div
          className="
            relative
            mx-auto

            h-[250px]
            w-[min(96vw,720px)]

            sm:h-[280px]
            sm:w-[min(94vw,720px)]
          "
        >

          {CARDS.slice(0, 5).map((card, index) => {

            const cardPositions = [
            'left-[8%] top-[14%] sm:top-[4%] z-[1] -rotate-[14deg]',
  'left-[24%] top-[24%] sm:top-[14%] z-[3] -rotate-[7deg]',
  'left-1/2 top-[-2%] sm:top-[-12%] z-[5] -translate-x-1/2 rotate-[2deg]',
  'right-[24%] top-[23%] sm:top-[13%] z-[4] rotate-[7deg]',
  'right-[8%] top-[12%] sm:top-[2%] z-[2] rotate-[14deg]',
            ]

            return (
              <div
                key={card.id}
                className={`
                  mode-card-float
                  absolute

                  w-[30%]
max-w-[130px]

sm:w-[19%]
sm:max-w-[160px]

                  ${cardPositions[index]}
                `}
                style={{
                  animationDelay: `${index * 0.14}s`
                }}
              >

                <div
                  className="
                    mode-card-glow

                    overflow-hidden

                    rounded-[8px]
                    border-2
                    border-[#fff0a4]

                    bg-white
                    p-[2px]

                    shadow-lg

                    sm:rounded-[10px]
                    sm:p-1
                  "
                >
                  <img
                    src={card.image}
                    alt={card.name}
                    className="
                      aspect-[3/4]
                      h-auto
                      w-full
                      rounded-md
                      object-cover
                    "
                  />
                </div>


                {/* TÊN QUÂN */}
                <span
                  className="
                    mt-1
                    block

                    truncate
                    rounded-full

                    bg-[#075f63]/90

                    px-1
                    py-[2px]

                    text-[8px]
                    font-semibold
                    text-white

                    shadow

                    sm:px-1.5
                    sm:py-0.5
                    sm:text-base
                  "
                  style={{
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  {card.name}
                </span>

              </div>
            )
          })}

        </div>

      </div>


      {/* ========================= */}
      {/* 2 NÚT CHẾ ĐỘ */}
      {/* ========================= */}

      <div
        className="
          relative z-20

          grid
          w-full
          max-w-[680px]
          shrink-0
          grid-cols-2

          gap-2

          sm:gap-5
        "
      >

        {/* CHƠI NGAY */}
        <button
          onClick={() => {
            setCountdown(8)
            setScreen('matchmaking')
          }}
          className="
            mode-choice-button
            group

            min-h-[72px]

            rounded-[1.1rem]
            border-2
            border-[#f6d274]

            bg-[#fff9df]/95

            px-2
            py-2

            text-[#075f63]

            shadow-[0_10px_28px_rgba(0,99,104,.22)]

            transition
            active:scale-95

            sm:min-h-0
            sm:rounded-[1.4rem]
            sm:px-6
            sm:py-4
          "
        >

          <span className="
            block
            text-[8px]
            font-bold
            uppercase
            tracking-[.15em]
            text-[#bd6648]

            sm:text-[10px]
            sm:tracking-[.18em]
          ">
            CHẾ ĐỘ 01
          </span>

          <strong className="
            mt-0.5
            block

            text-[14px]
            font-black

            sm:text-xl
          ">
            Chơi ngay
          </strong>

          <span className="
            mt-1
            block

            text-[8px]
            leading-tight

            text-[#075f63]/65

            sm:text-xs
          ">
            Ghép hội nhanh với các chòi máy
          </span>

        </button>


        {/* MỞ HỘI CÙNG BẠN */}
        <button
          onClick={() => setScreen('friend')}
          className="
            mode-choice-button
            group

            min-h-[72px]

            rounded-[1.1rem]
            border-2
            border-[#85d4ce]

            bg-[#eafff9]/95

            px-2
            py-2

            text-[#075f63]

            shadow-[0_10px_28px_rgba(0,99,104,.22)]

            transition
            active:scale-95

            sm:min-h-0
            sm:rounded-[1.4rem]
            sm:px-6
            sm:py-4
          "
        >

          <span className="
            block
            text-[8px]
            font-bold
            uppercase
            tracking-[.15em]
            text-[#b85a3f]

            sm:text-[10px]
            sm:tracking-[.18em]
          ">
            CHẾ ĐỘ 02
          </span>

          <strong className="
            mt-0.5
            block

            text-[14px]
            font-black

            sm:text-xl
          ">
            Mở hội cùng bạn
          </strong>

          <span className="
            mt-1
            block

            text-[8px]
            leading-tight

            text-[#075f63]/65

            sm:text-xs
          ">
            Tạo mã hoặc tham gia phòng bạn bè
          </span>

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
  type="text"
  inputMode="text"
  value={joinCode}
  onChange={(event) => {
    const value = event.target.value
      .toUpperCase()
      .replace(/\s/g, '')
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 11)

    setJoinCode(value)
  }}
  placeholder="CHOI-123456"
  autoCapitalize="characters"
  autoCorrect="off"
  spellCheck={false}
  className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center font-bold tracking-widest outline-none"
/>
                <button
                  onClick={() => { void unlockAudio(); connectRoom('joinRoom') }}


                  disabled={!/^CHOI-\d{6}$/.test(joinCode) || socketStatus === 'connecting'}
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
  <section className="w-full px-3 pb-16 sm:px-4 sm:pb-12">
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
