import { useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import BaiChoiPuzzle, { PuzzleLevel } from './BaiChoiPuzzle';
import { getChantLyrics } from './chantLyrics';
import { authService } from './lib/authService';
import ChoiCoin from './components/ChoiCoin';
import CoinTopupModal from './components/CoinTopupModal';
import type { UserProfile } from './types/auth';

type Screen = 'name' | 'mode' | 'matchmaking' | 'card-picking' | 'friend' | 'playing' | 'result'
type OnlinePlayer = { id: string; name: string; ready: boolean; flags: number }

export interface PlayerTree {
  id: string
  name: string
  cards: Card[]
  claimedCardIds: string[]
}

export type Card = {
  id: string
  name: string
  image: string
  sound: string
  soundOffline?: string
}

export const CARDS: Card[] = [
  // =====================================================
  // PHÔ 01 — LÁ 01 → 10
  // =====================================================
  {
    id: 'nhat-tro',
    name: 'Nhất Trò',
    image: '/assets/the1.jpg',
    sound: '/sound-online/Nhat_Tro.mp3',
    soundOffline: '/sound-offline/Nhat-tro.mp3'
  },
  {
    id: 'nhi-bi',
    name: 'Nhì Bí',
    image: '/assets/the2.jpg',
    sound: '/sound-online/Nhi_Bi.mp3',
    soundOffline: '/sound-offline/Nhi-Bi.mp3'
  },
  {
    id: 'tam-quan',
    name: 'Tam Quan',
    image: '/assets/the3.jpg',
    sound: '/sound-online/Tam_Quan.mp3',
    soundOffline: '/sound-offline/Tam-Quan.mp3'
  },
  {
    id: 'tu-huong',
    name: 'Tứ Hương',
    image: '/assets/the4.jpg',
    sound: '/sound-online/Tu_Huong.mp3',
    soundOffline: '/sound-offline/Tu-Huong.mp3'
  },
  {
    id: 'ngu-truot',
    name: 'Ngũ Trượt',
    image: '/assets/the5.jpg',
    sound: '/sound-online/Ngu_Trot.mp3',
    soundOffline: '/sound-offline/Ngu-trot.mp3'
  },
  {
    id: 'luc-xo',
    name: 'Lục Xơ',
    image: '/assets/the6.jpg',
    sound: '/sound-online/Luc_Xo.mp3',
    soundOffline: '/sound-offline/Luc-Xo.mp3'
  },
  {
    id: 'that-nhon',
    name: 'Thất Nhọn',
    image: '/assets/the7.jpg',
    sound: '/sound-online/That_Nhon.mp3',
    soundOffline: '/sound-offline/That-Nhon.mp3'
  },
  {
    id: 'bat-bong',
    name: 'Bát Bồng',
    image: '/assets/the8.jpg',
    sound: '/sound-online/Bat_Bong.mp3',
    soundOffline: '/sound-offline/Bat-Bong.mp3'
  },
  {
    id: 'cuu-thay',
    name: 'Cửu Thầy',
    image: '/assets/the9.jpg',
    sound: '/sound-online/Cuu_Thay.mp3',
    soundOffline: '/sound-offline/Cuu-thay.mp3'
  },
  {
    id: 'thai-tu',
    name: 'Thái Tử',
    image: '/assets/the10.jpg',
    sound: '/sound-online/Thai_Tu.mp3',
    soundOffline: '/sound-offline/Thai-tu.mp3'
  },

  // =====================================================
  // PHÔ 02 — LÁ 11 → 20
  // =====================================================
  {
    id: 'nhat-noc',
    name: 'Nhất Nọc',
    image: '/assets/the11.jpg',
    sound: '/sound-online/Nhat_Noc.mp3',
    soundOffline: '/sound-offline/Nhat-Noc.mp3'
  },
  {
    id: 'nhi-ngheo',
    name: 'Nhì Nghèo',
    image: '/assets/the12.jpg',
    sound: '/sound-online/Nhi_Ngheo.mp3',
    soundOffline: '/sound-offline/Nhi-Ngheo.mp3'
  },
  {
    id: 'ba-ga',
    name: 'Ba Gà',
    image: '/assets/the13.jpg',
    sound: '/sound-online/Ba_Ga.mp3',
    soundOffline: '/sound-offline/Ba-Ga.mp3'
  },
  {
    id: 'tu-dong',
    name: 'Tứ Dóng',
    image: '/assets/the14.jpg',
    sound: '/sound-online/Tu_Dong.mp3',
    soundOffline: '/sound-offline/Tu-Dong.mp3'
  },
  {
    id: 'ngu-dum',
    name: 'Ngũ Đụm',
    image: '/assets/the15.jpg',
    sound: '/sound-online/Ngu_Dum.mp3',
    soundOffline: '/sound-offline/Ngu-Dum.mp3'
  },
  {
    id: 'sau-hot',
    name: 'Sáu Hột',
    image: '/assets/the16.jpg',
    sound: '/sound-online/Sau_Hot.mp3',
    soundOffline: '/sound-offline/Sau-Hot.mp3'
  },
  {
    id: 'bay-thua',
    name: 'Bảy Thưa',
    image: '/assets/the17.jpg',
    sound: '/sound-online/Bay_Thua.mp3',
    soundOffline: '/sound-offline/Bay-Thua.mp3'
  },
  {
    id: 'tam-day',
    name: 'Tám Dầy',
    image: '/assets/the18.jpg',
    sound: '/sound-online/Tam_Day.mp3',
    soundOffline: '/sound-offline/Tam-Day.mp3'
  },
  {
    id: 'chin-goi',
    name: 'Chín Gối',
    image: '/assets/the19.jpg',
    sound: '/sound-online/Chin_Goi.mp3',
    soundOffline: '/sound-offline/Chin-Goi.mp3'
  },
  {
    id: 'do-mo',
    name: 'Đỏ Mỏ',
    image: '/assets/the20.jpg',
    sound: '/sound-online/Do_Mo.mp3',
    soundOffline: '/sound-offline/Do-Mo.mp3'
  },

  // =====================================================
  // PHÔ 03 — LÁ 21 → 30
  // =====================================================
  {
    id: 'bach-hue',
    name: 'Bạch Huê',
    image: '/assets/the21.jpg',
    sound: '/sound-online/Bach_Hue.mp3',
    soundOffline: '/sound-offline/Bach-Hue.mp3'
  },
  {
    id: 'banh-hai',
    name: 'Bành Hai',
    image: '/assets/the22.jpg',
    sound: '/sound-online/Bach_Hai.mp3',
    soundOffline: '/sound-offline/Banh-Hai.mp3'
  },
  {
    id: 'banh-ba',
    name: 'Bành Ba',
    image: '/assets/the23.jpg',
    sound: '/sound-online/Bach_Ba.mp3',
    soundOffline: '/sound-offline/Banh-Ba.mp3'
  },
  {
    id: 'dai-doi',
    name: 'Dái Doi',
    image: '/assets/the24.jpg',
    sound: '/sound-online/Dai_Doi.mp3',
    soundOffline: '/sound-offline/Dai-Doi.mp3'
  },
  {
    id: 'nam-run',
    name: 'Năm Rún',
    image: '/assets/the25.jpg',
    sound: '/sound-online/Nam_Run.mp3',
    soundOffline: '/sound-offline/Nam-Run.mp3'
  },
  {
    id: 'sau-tien',
    name: 'Sáu Tiền',
    image: '/assets/the26.jpg',
    sound: '/sound-online/Sau_Tien.mp3',
    soundOffline: '/sound-offline/Sau-Tien.mp3'
  },
  {
    id: 'that-lieu',
    name: 'Thất Liễu',
    image: '/assets/the27.jpg',
    sound: '/sound-online/That_Lieu.mp3',
    soundOffline: '/sound-offline/That-Lieu.mp3'
  },
  {
    id: 'tam-tien',
    name: 'Tám Tiền',
    image: '/assets/the28.jpg',
    sound: '/sound-online/Tam_Tien.mp3',
    soundOffline: '/sound-offline/Tam-Tien.mp3'
  },
  {
    id: 'chin-ghe',
    name: 'Chín Ghe',
    image: '/assets/the29.jpg',
    sound: '/sound-online/Chin_Ghe.mp3',
    soundOffline: '/sound-offline/Chin-Ghe.mp3'
  },
  {
    id: 'ong-am',
    name: 'Ông Âm',
    image: '/assets/the30.jpg',
    sound: '/sound-online/Ong_Am.mp3',
    soundOffline: '/sound-offline/Ong-Am.mp3'
  },
]

export const showcaseCards = [...CARDS]
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

export function getCardPho(cardIndex: number): { phoName: string; tagClass: string } {
  if (cardIndex < 10) return { phoName: 'Pho Văn', tagClass: 'bg-amber-600/80 text-amber-100 border-amber-400/50' }
  if (cardIndex < 20) return { phoName: 'Pho Vạn', tagClass: 'bg-emerald-600/80 text-emerald-100 border-emerald-400/50' }
  return { phoName: 'Pho Hạch', tagClass: 'bg-rose-600/80 text-rose-100 border-rose-400/50' }
}

function generateDramaticDeck(
  playerTreesOrHand: PlayerTree[] | Card[],
  botHands: Card[][],
  allCards: Card[]
): Card[] {
  const playerTrees: { id: string; cards: Card[] }[] =
    Array.isArray(playerTreesOrHand) && playerTreesOrHand.length > 0 && 'cards' in playerTreesOrHand[0]
      ? (playerTreesOrHand as PlayerTree[])
      : [{ id: 'tree-1', cards: playerTreesOrHand as Card[] }]

  const allPlayerCards = playerTrees.flatMap((t) => t.cards)
  const allOwnedIds = new Set([
    ...allPlayerCards.map((c) => c.id),
    ...botHands.flatMap((h) => h.map((c) => c.id))
  ])
  const blankCards = shuffle(allCards.filter((c) => !allOwnedIds.has(c.id)))

  // Người chơi chọn nhiều cây thì cơ hội thắng càng cao
  const winRate = playerTrees.length <= 1 ? 0.72 : playerTrees.length === 2 ? 0.86 : 0.95
  const playerWins = Math.random() < winRate
  const targetTurns = Math.random() < 0.5 ? 6 : 7

  const drawnSequence: Card[] = []
  const usedCardIds = new Set<string>()

  // Chọn 1 cây bài của người chơi làm tâm điểm
  const chosenTree = playerTrees[Math.floor(Math.random() * playerTrees.length)]
  const shuffledTreeCards = shuffle([...chosenTree.cards])

  // Chọn 1 bot làm đối thủ chính
  const rivalBotIndex = Math.floor(Math.random() * botHands.length)
  const rivalHand = shuffle([...botHands[rivalBotIndex]])
  const otherBots = botHands.filter((_, idx) => idx !== rivalBotIndex)

  if (playerWins) {
    const p0 = shuffledTreeCards[0]
    const p1 = shuffledTreeCards[1]
    const pWinner = shuffledTreeCards[2]

    const r0 = rivalHand[0]
    const r1 = rivalHand[1]

    const otherBotCard = shuffle(otherBots.flatMap((b) => b))[0]
    const blankCard = blankCards[0] || shuffle(allCards.filter((c) => c.id !== pWinner?.id))[0]

    if (targetTurns === 6) {
      drawnSequence.push(p0, r0, otherBotCard, p1, r1, pWinner)
    } else {
      drawnSequence.push(r0, p0, otherBotCard, p1, blankCard, r1, pWinner)
    }
  } else {
    const r0 = rivalHand[0]
    const r1 = rivalHand[1]
    const rWinner = rivalHand[2]

    const p0 = shuffledTreeCards[0]
    const p1 = shuffledTreeCards[1]

    const otherBotCard = shuffle(otherBots.flatMap((b) => b))[0]
    const blankCard = blankCards[0] || shuffle(allCards.filter((c) => c.id !== rWinner?.id))[0]

    if (targetTurns === 6) {
      drawnSequence.push(p0, r0, p1, otherBotCard, r1, rWinner)
    } else {
      drawnSequence.push(p0, r0, p1, blankCard, otherBotCard, r1, rWinner)
    }
  }

  drawnSequence.forEach((c) => {
    if (c) usedCardIds.add(c.id)
  })
  const remainingCards = shuffle(allCards.filter((c) => !usedCardIds.has(c.id)))

  return [...drawnSequence.filter(Boolean), ...remainingCards]
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

export default function BaiChoiGame({
  onClose,
  initialAudioMode = 'online'
}: {
  onClose: () => void
  initialAudioMode?: 'online' | 'offline'
}) {
  const [audioMode, setAudioMode] = useState<'online' | 'offline'>(initialAudioMode)
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
  const [puzzleLevel, setPuzzleLevel] = useState<PuzzleLevel>(1)
  const [currentCallingCard, setCurrentCallingCard] = useState<Card | null>(null)
  const [showPuzzleModal, setShowPuzzleModal] = useState(false)
  const puzzleCompletedManuallyRef = useRef(false)
  const fallbackTimerRef = useRef<number | null>(null)
  const [chantLyricIndex, setChantLyricIndex] = useState(0)

  // ==========================================
  // QUẢN LÝ XU & ĐA CÂY BÀI (DATABASE & SUPABASE)
  // ==========================================
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser())
  const [userCoins, setUserCoins] = useState<number>(() => {
    const user = authService.getCurrentUser()
    return user?.coins ?? 50
  })
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false)

  // Cây bài của người chơi trong ván đấu
  const [playerTrees, setPlayerTrees] = useState<PlayerTree[]>([])

  // State chọn thẻ bài (1 Cây = 3 Thẻ, 1 Thẻ = 1 Xu)
  const [draftTrees, setDraftTrees] = useState<{ id: string; name: string; cards: Card[] }[]>([
    { id: 'tree-1', name: 'Cây Bài #1', cards: [] }
  ])
  const [activeDraftTreeIndex, setActiveDraftTreeIndex] = useState(0)
  const [phoFilter, setPhoFilter] = useState<'all' | 'van' | 'van2' | 'hach'>('all')
  const [pickingError, setPickingError] = useState('')
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false)
  const [pendingExitAction, setPendingExitAction] = useState<'leave' | 'back' | null>(null)

  // Tự động chuyển câu hò mỗi ~7 giây khi Chị Hiệu đang hô
  useEffect(() => {
    if (!isCalling || !currentCallingCard) {
      setChantLyricIndex(0)
      return
    }
    setChantLyricIndex(0)
    const timer = setInterval(() => {
      setChantLyricIndex((prev) => (prev < 3 ? prev + 1 : prev))
    }, 7000)
    return () => clearInterval(timer)
  }, [isCalling, currentCallingCard?.id])

  const currentCard = revealedCard
  const canClaim = Boolean(
    currentCard &&
      (onlineMode
        ? hand.some((card) => card.id === currentCard.id) && !claimed.includes(currentCard.id)
        : playerTrees.length > 0
        ? playerTrees.some(
            (tree) =>
              tree.cards.some((c) => c.id === currentCard.id) &&
              !tree.claimedCardIds.includes(currentCard.id)
          )
        : hand.some((card) => card.id === currentCard.id) && !claimed.includes(currentCard.id))
  )
  const players = useMemo(() => onlineMode ? onlinePlayers.map((player) => player.name) : [playerName, ...BOT_NAMES], [onlineMode, onlinePlayers, playerName])

  const goToCardPicking = () => {
    const user = authService.getCurrentUser() || authService.getOrInitCurrentUser(playerName)
    setCurrentUser(user)
    setUserCoins(user.coins ?? 50)
    setDraftTrees([{ id: 'tree-1', name: 'Cây Bài #1', cards: [] }])
    setActiveDraftTreeIndex(0)
    setPickingError('')
    setScreen('card-picking')
  }

  useEffect(() => {
    if (screen !== 'matchmaking') return
    if (countdown <= 0) {
      goToCardPicking()
      return
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown, screen])

  const stopAudio = (release = true) => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
    audioRef.current.onended = null
    audioRef.current.onerror = null
    if (release) {
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
      audioRef.current = null
    }
  }

const unlockAudio = async () => {
  const audio = new Audio('/sound-online/silent.mp3')
  audio.volume = 0
  audio.preload = 'auto'

  try {
    await audio.play()
    audio.pause()
    audio.currentTime = 0
    console.log('Âm thanh đã được mở')
  } catch (error) {
    console.error('Không thể mở âm thanh:', error)
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
  ? '/sound-online/video-daugame-dienthoai.mp4'
  : '/sound-online/video-daugame.mp4'

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
    setCurrentCallingCard(null)
    setPuzzleLevel(1)
    setScreen('mode')
  }

  const handleConfirmExit = () => {
    setShowExitConfirmModal(false)
    const action = pendingExitAction
    setPendingExitAction(null)
    if (action === 'leave') {
      leaveGame()
    } else {
      backToMode()
    }
  }

  const handleCancelExit = () => {
    setShowExitConfirmModal(false)
    setPendingExitAction(null)
  }

  const handleRequestLeave = () => {
    if (screen === 'playing') {
      setPendingExitAction('leave')
      setShowExitConfirmModal(true)
      return
    }
    leaveGame()
  }

  const handleRequestBack = () => {
    if (screen === 'playing') {
      setPendingExitAction('back')
      setShowExitConfirmModal(true)
      return
    }
    goBack()
  }

  // Cảnh báo trình duyệt nếu tải lại trang hoặc đóng tab khi đang chơi ván đấu
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (screen === 'playing') {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [screen])

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

    // Màn chọn thẻ → quay lại chọn chế độ
    if (screen === 'card-picking') {
      setScreen('mode')
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
  setCurrentCallingCard(card)
  puzzleCompletedManuallyRef.current = false
  setIsCalling(true)
  setShowPuzzleModal(true) // Tự động mở popup xếp hình nổi khi bắt đầu hô
  setMessage('Lắng nghe Chị Hiệu hô & Xếp hình giải mã…')

  const chosenSound = (audioMode === 'offline' && card.soundOffline) ? card.soundOffline : card.sound
  const fallbackDuration = audioMode === 'offline' ? 32000 : 16000

  const audio = audioRef.current || new Audio()

  audio.src = chosenSound
  audio.preload = 'auto'
  audio.volume = 1
  audio.currentTime = 0

  audioRef.current = audio

  const revealCard = () => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }

    setRevealedCard(card)
    setIsCalling(false)
    setShowPuzzleModal(false) // Tự động đóng modal xếp hình khi kết thúc câu hò
    setMessage(`Quân ${card.name}! Nếu có thẻ, hãy gõ mõ.`)

    // Cập nhật cờ cho các bot sau khi bài đã được công bố chính thức
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

    // Cơ chế Phục thù & Thăng cấp theo thực lực người chơi
    if (puzzleCompletedManuallyRef.current) {
      setPuzzleLevel((prev) => {
        if (prev < 4) return (prev + 1) as PuzzleLevel
        return Math.random() > 0.5 ? 3 : 4
      })
    }
  }

  audio.onended = revealCard
  audio.onerror = () => {
    console.warn('Không thể tải file âm thanh:', chosenSound)
    if (!fallbackTimerRef.current) {
      fallbackTimerRef.current = window.setTimeout(revealCard, fallbackDuration)
    }
  }

  try {
    await audio.play()
  } catch (error) {
    console.error('Không thể phát âm thanh:', error)
    // Nếu trình duyệt chặn âm thanh, duy trì thời gian hô
    setMessage('Đang hô… (Bấm "🔊 Bật âm thanh" nếu chưa nghe tiếng)')
    if (!fallbackTimerRef.current) {
      fallbackTimerRef.current = window.setTimeout(revealCard, fallbackDuration)
    }
  }
}

const handlePuzzleComplete = () => {
  puzzleCompletedManuallyRef.current = true
  setMessage(`Đã ghép xong Quân ${currentCallingCard?.name || ''}! Chờ Chị Hiệu xướng tên.`)
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

  if (card) {
    drawnCardRef.current = card
    setRevealedCard(null)
    setDrawIndex(data.drawIndex)

    const delay = Math.max(
      0,
      (data.callStartedAt ?? Date.now()) - Date.now()
    )

    window.setTimeout(() => {
      void playCall(card)
    }, delay)
  }
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

    // Một bộ xáo riêng để chia bài cho các chòi
    const dealDeck = shuffle(CARDS)

    // Người chơi nhận 3 quân
    const playerHand = dealDeck.slice(0, 3)

    // 4 bot, mỗi bot nhận 3 quân riêng
    const nextBotHands = BOT_NAMES.map((_, botIndex) => {
      const start = 3 + botIndex * 3
      return dealDeck.slice(start, start + 3)
    })

    // Sinh bộ bài kịch tính kết thúc ở lượt 6 hoặc 7 (khoảng 3 - 3.5 phút)
    const nextDeck = generateDramaticDeck(playerHand, nextBotHands, CARDS)

    setDeck(nextDeck)
    setHand(playerHand)
    setBotHands(nextBotHands)

    setDrawIndex(-1)
    setClaimed([])
    setRevealedCard(null)
    setCurrentCallingCard(null)
    setPuzzleLevel(1)
    puzzleCompletedManuallyRef.current = false
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
    setMessage('Lắng nghe Chị Hiệu hô & Xếp hình giải mã…')
    await playCall(card)
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
    if (winnerName === playerName) {
      try {
        const updated = authService.addCoins(15, 'Thưởng thắng TỚI trong hội Bài Chòi')
        setUserCoins(updated.coins ?? (userCoins + 15))
      } catch (e) {
        console.warn('Lỗi thưởng xu:', e)
      }
    }
    stopAudio(false)
    const audio = audioRef.current || new Audio()
    audio.src = '/sound-online/Toi-Goi.mp3'
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

    if (playerTrees.length > 0) {
      let isAnyTreeWon = false
      const updatedTrees = playerTrees.map((tree) => {
        const hasCard = tree.cards.some((c) => c.id === currentCard.id)
        if (hasCard && !tree.claimedCardIds.includes(currentCard.id)) {
          const nextClaimedIds = [...tree.claimedCardIds, currentCard.id]
          if (nextClaimedIds.length >= 3) {
            isAnyTreeWon = true
          }
          return { ...tree, claimedCardIds: nextClaimedIds }
        }
        return tree
      })

      setPlayerTrees(updatedTrees)
      const nextClaimed = [...claimed, currentCard.id]
      setClaimed(nextClaimed)
      setMessage(`Có đây! Thẻ ${currentCard.name} đã được cắm cờ.`)

      if (isAnyTreeWon) {
        window.setTimeout(() => finishGame(playerName), 500)
      }
    } else {
      const nextClaimed = [...claimed, currentCard.id]
      setClaimed(nextClaimed)
      setMessage(`Có đây! Bạn nhận cờ thứ ${nextClaimed.length}.`)
      if (nextClaimed.length === 3) window.setTimeout(() => finishGame(playerName), 500)
    }
  }

  // =========================================================
  // XỬ LÝ CHỌN 30 LÁ BÀI & MUA NHIỀU CÂY BÀI (1 THẺ = 1 XU)
  // Cho phép chọn lại lá bài đã chọn ở cây khác, nhưng kiểm tra
  // tổ hợp 3 lá của mỗi cây phải độc nhất (không trùng nhau).
  // =========================================================
  const getTreeSignature = (cards: Card[]): string => {
    return [...cards].map((c) => c.id).sort().join('|')
  }

  const totalCardsPicked = useMemo(() => {
    return draftTrees.reduce((sum, tree) => sum + tree.cards.length, 0)
  }, [draftTrees])

  const totalCostCoins = totalCardsPicked

  const filteredCards = useMemo(() => {
    if (phoFilter === 'van') return CARDS.slice(0, 10)
    if (phoFilter === 'van2') return CARDS.slice(10, 20)
    if (phoFilter === 'hach') return CARDS.slice(20, 30)
    return CARDS
  }, [phoFilter])

  const handleToggleCardPick = (card: Card) => {
    setPickingError('')
    const activeTree = draftTrees[activeDraftTreeIndex]
    if (!activeTree) return

    // 1. Kiểm tra xem thẻ này đã có trong CÂY HIỆN TẠI chưa
    const isAlreadyInActiveTree = activeTree.cards.some((c) => c.id === card.id)

    if (isAlreadyInActiveTree) {
      // Bỏ chọn: gỡ thẻ này ra khỏi cây hiện tại
      setDraftTrees((prev) =>
        prev.map((tree, idx) => {
          if (idx !== activeDraftTreeIndex) return tree
          return {
            ...tree,
            cards: tree.cards.filter((c) => c.id !== card.id)
          }
        })
      )
      return
    }

    // 2. Thẻ chưa có trong cây hiện tại -> Thêm thẻ vào cây hiện tại
    if (activeTree.cards.length >= 3) {
      // Tìm xem có cây nào khác chưa đủ 3 thẻ không
      const incompleteTreeIndex = draftTrees.findIndex((t) => t.cards.length < 3)
      if (incompleteTreeIndex >= 0) {
        setActiveDraftTreeIndex(incompleteTreeIndex)
        setPickingError(
          `${activeTree.name} đã đủ 3 thẻ. Hệ thống đã chuyển sang ${draftTrees[incompleteTreeIndex].name} để bạn chọn tiếp.`
        )
      } else {
        setPickingError(
          `${activeTree.name} đã đủ 3 thẻ! Bạn có thể bấm "+ Mua Thêm Cây Mới (3 Xu)" nếu muốn lập thêm cây khác.`
        )
      }
      return
    }

    // Kiểm tra số dư Xu (1 thẻ = 1 Xu)
    if (totalCardsPicked + 1 > userCoins) {
      setPickingError(
        `Số dư Xu không đủ! Mỗi thẻ giá 1 Xu. Bạn đang có ${userCoins} Xu và đã chọn ${totalCardsPicked} thẻ. Vui lòng nạp thêm Xu.`
      )
      return
    }

    const nextCards = [...activeTree.cards, card]

    // 3. Nếu thêm thẻ này mà cây đủ 3 thẻ -> CHECK TRÙNG TỔ HỢP VỚI CÂY KHÁC!
    if (nextCards.length === 3) {
      const newSignature = getTreeSignature(nextCards)
      const duplicateTree = draftTrees.find(
        (otherTree, idx) =>
          idx !== activeDraftTreeIndex &&
          otherTree.cards.length === 3 &&
          getTreeSignature(otherTree.cards) === newSignature
      )

      if (duplicateTree) {
        setPickingError(
          `Tổ hợp 3 lá này (${nextCards.map((c) => c.name).join(', ')}) bị trùng hoàn toàn với ${duplicateTree.name}! Bạn được chọn lại thẻ đã có ở cây khác, nhưng tổ hợp 3 lá của mỗi cây phải khác nhau.`
        )
        return
      }
    }

    // Hợp lệ -> Thêm thẻ vào cây hiện tại
    setDraftTrees((prev) =>
      prev.map((tree, idx) => {
        if (idx !== activeDraftTreeIndex) return tree
        return {
          ...tree,
          cards: nextCards
        }
      })
    )
  }

  const handleAddNewTree = () => {
    setPickingError('')

    const coinsLeft = userCoins - totalCardsPicked
    if (coinsLeft < 3) {
      setPickingError(
        `Bạn cần còn ít nhất 3 Xu để mua thêm 1 Cây Bài mới (Hiện còn: ${coinsLeft} Xu). Vui lòng nạp thêm Xu.`
      )
      return
    }

    const nextIndex = draftTrees.length
    setDraftTrees((prev) => [
      ...prev,
      {
        id: `tree-${nextIndex + 1}`,
        name: `Cây Bài #${nextIndex + 1}`,
        cards: []
      }
    ])
    setActiveDraftTreeIndex(nextIndex)
  }

  const handleRemoveDraftTree = (treeIndex: number) => {
    if (draftTrees.length <= 1) {
      setPickingError('Bạn cần giữ lại ít nhất 1 Cây Bài.')
      return
    }
    setDraftTrees((prev) => prev.filter((_, idx) => idx !== treeIndex))
    setActiveDraftTreeIndex((prev) => Math.max(0, prev >= treeIndex ? prev - 1 : prev))
    setPickingError('')
  }

  const handleAutoPickTree = (treeIndex: number) => {
    setPickingError('')
    const targetTree = draftTrees[treeIndex]
    if (!targetTree) return

    const neededCount = 3 - targetTree.cards.length
    if (neededCount <= 0) return

    const coinsLeft = userCoins - totalCardsPicked
    if (coinsLeft < neededCount) {
      setPickingError(`Số dư Xu không đủ! Cần thêm ${neededCount} Xu để hoàn thành cây này.`)
      return
    }

    // Lấy các thẻ chưa có trong chính cây này
    const availableForThisTree = CARDS.filter(
      (c) => !targetTree.cards.some((existing) => existing.id === c.id)
    )

    // Tập hợp signature của các cây khác đã đủ 3 thẻ
    const existingSignatures = new Set(
      draftTrees
        .filter((_, idx) => idx !== treeIndex && _.cards.length === 3)
        .map((t) => getTreeSignature(t.cards))
    )

    let foundCandidate: Card[] | null = null
    for (let attempt = 0; attempt < 100; attempt++) {
      const randomCards = shuffle(availableForThisTree).slice(0, neededCount)
      const combined = [...targetTree.cards, ...randomCards]
      if (combined.length === 3) {
        const sig = getTreeSignature(combined)
        if (!existingSignatures.has(sig)) {
          foundCandidate = combined
          break
        }
      }
    }

    if (foundCandidate) {
      setDraftTrees((prev) =>
        prev.map((tree, idx) => {
          if (idx !== treeIndex) return tree
          return {
            ...tree,
            cards: foundCandidate!
          }
        })
      )
    } else {
      setPickingError('Không thể tạo tổ hợp ngẫu nhiên mới không trùng. Hãy tự tay chọn các thẻ bài!')
    }
  }

  const handleStartGameFromPicking = () => {
    setPickingError('')

    if (draftTrees.length === 0) {
      setPickingError('Vui lòng chọn ít nhất 1 Cây Bài hoàn chỉnh để vào hội.')
      return
    }

    for (let i = 0; i < draftTrees.length; i++) {
      const tree = draftTrees[i]
      if (tree.cards.length !== 3) {
        setPickingError(
          `${tree.name} mới có ${tree.cards.length}/3 thẻ. Hãy chọn đủ 3 thẻ (1 Xu/thẻ) hoặc xóa cây chưa xong.`
        )
        setActiveDraftTreeIndex(i)
        return
      }
    }

    // KIỂM TRA TRÙNG TỔ HỢP 3 LÁ GIỮA CÁC CÂY
    const signatureMap = new Map<string, string>()
    for (let i = 0; i < draftTrees.length; i++) {
      const tree = draftTrees[i]
      const sig = getTreeSignature(tree.cards)
      if (signatureMap.has(sig)) {
        const dupName = signatureMap.get(sig)
        setPickingError(
          `Cây "${tree.name}" có tổ hợp 3 lá trùng hoàn toàn với "${dupName}". Vui lòng đổi ít nhất 1 lá để tạo tổ hợp mới!`
        )
        setActiveDraftTreeIndex(i)
        return
      }
      signatureMap.set(sig, tree.name)
    }

    const cost = draftTrees.length * 3
    const spendResult = authService.spendCoins(
      cost,
      `Mua ${draftTrees.length} Cây Bài (${cost} thẻ) vào hội chơi với máy`
    )

    if (!spendResult.success) {
      setPickingError(spendResult.message || 'Không thể trừ xu. Vui lòng nạp thêm Xu.')
      return
    }

    setUserCoins(spendResult.user?.coins ?? (userCoins - cost))

    // Chia bài cho 4 chòi máy sao cho các cây của máy không trùng với người chơi và không trùng nhau
    const playerSignatures = new Set(Array.from(signatureMap.keys()))
    const botSignatures = new Set<string>()
    const nextBotHands: Card[][] = []

    // Các thẻ mà người chơi chưa chọn ở bất kỳ cây nào
    const playerChosenCardIds = new Set(draftTrees.flatMap((t) => t.cards.map((c) => c.id)))
    const unchosenCards = CARDS.filter((c) => !playerChosenCardIds.has(c.id))

    for (let b = 0; b < BOT_NAMES.length; b++) {
      let botCards: Card[] = []
      for (let attempt = 0; attempt < 100; attempt++) {
        // Ưu tiên chia các lá người chơi chưa chọn nếu còn đủ
        const pool = unchosenCards.length >= 3 ? unchosenCards : CARDS
        const candidate = shuffle(pool).slice(0, 3)
        if (candidate.length === 3) {
          const sig = getTreeSignature(candidate)
          if (!playerSignatures.has(sig) && !botSignatures.has(sig)) {
            botCards = candidate
            botSignatures.add(sig)
            break
          }
        }
      }
      if (botCards.length < 3) {
        botCards = shuffle(CARDS).slice(0, 3)
      }
      nextBotHands.push(botCards)
    }

    const initialPlayerTrees: PlayerTree[] = draftTrees.map((tree) => ({
      id: tree.id,
      name: tree.name,
      cards: [...tree.cards],
      claimedCardIds: []
    }))

    const nextDeck = generateDramaticDeck(initialPlayerTrees, nextBotHands, CARDS)

    setOnlineMode(false)
    setPlayerTrees(initialPlayerTrees)
    setHand(initialPlayerTrees.flatMap((t) => t.cards))
    setBotHands(nextBotHands)
    setDeck(nextDeck)

    setDrawIndex(-1)
    setClaimed([])
    setRevealedCard(null)
    setCurrentCallingCard(null)
    setPuzzleLevel(1)
    puzzleCompletedManuallyRef.current = false
    setIsCalling(false)
    setBotFlags([0, 0, 0, 0])
    setWinner('')

    setMessage('Hội đã khai! Mời bạn lắng nghe câu hô đầu tiên của Chị Hiệu.')
    setScreen('playing')
  }

  const createRoom = () => {
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
      screen === 'playing' || screen === 'card-picking'
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
  onClick={handleRequestBack}
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

      {/* HUY HIỆU VÍ XU TRÊN ĐẦU (GÓC TRÊN BÊN PHẢI) */}
      {(screen === 'card-picking' || screen === 'playing') && (
        <div className="fixed right-16 top-3 sm:right-20 sm:top-5 z-[80] flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#f6d274]/50 bg-[#073f43]/90 px-2.5 sm:px-3.5 py-1 sm:py-1.5 backdrop-blur-md shadow-xl transition-all">
          <ChoiCoin size="sm" glow animate />
          <span className="text-xs sm:text-sm font-bold text-[#fce893] whitespace-nowrap">{userCoins} Xu</span>
          <button
            type="button"
            onClick={() => setIsTopupModalOpen(true)}
            className="ml-0.5 sm:ml-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-slate-900 shadow hover:brightness-110 active:scale-95 transition"
          >
            + Nạp
          </button>
        </div>
      )}

      <button onClick={handleRequestLeave} className="fixed right-3 top-3 sm:right-5 sm:top-5 z-[80] grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full border-2 border-white/70 bg-[#075f63]/80 text-2xl sm:text-3xl font-light leading-none text-white shadow-xl backdrop-blur-sm transition hover:scale-105 hover:bg-[#c44837]" aria-label="Đóng trò chơi">×</button>
      <main
        className={`
          relative
          mx-auto
          flex
          w-full
          justify-center
          p-0
          ${
            screen === 'card-picking'
              ? 'min-h-full h-auto items-start overflow-visible pt-16 sm:pt-20 pb-16 max-w-[1360px] px-3 sm:px-6'
              : screen === 'playing'
              ? 'min-h-full h-auto items-start overflow-visible py-4 sm:py-6 max-w-6xl'
              : 'h-full items-center overflow-hidden max-w-6xl'
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
                src="/sound-online/video-daugame.mp4"
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

        <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/30 p-1 text-[11px] sm:text-xs">
          <button
            type="button"
            onClick={() => setAudioMode('online')}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              audioMode === 'online'
                ? 'bg-[#f29963] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            ⚡ Hô Online (Gọn)
          </button>
          <button
            type="button"
            onClick={() => setAudioMode('offline')}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              audioMode === 'offline'
                ? 'bg-[#c44837] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            🎙️ Hô Offline (Đầy đủ)
          </button>
        </div>
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
            <button onClick={goToCardPicking} className="mt-8 rounded-full border border-white/25 px-6 py-3 font-semibold hover:bg-white/10">Chơi với máy ngay</button>
          </section>
        )}

        {screen === 'card-picking' && (
          <section className="relative z-10 w-full max-w-[1360px] pb-24 lg:pb-12 animate-fadeIn">
            <FlyingClouds />

            {/* HEADER KHỐI CHỌN THẺ */}
            <div className="text-center mb-5 sm:mb-7">
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#f6d274]/20 border border-[#f6d274]/40 text-[#fce893] text-xs font-bold uppercase tracking-[.2em] mb-2 shadow-sm">
                🏮 Khai Canh Lập Cây • 1 Thẻ = 1 Xu
              </span>
              <h2
                className="text-2xl sm:text-4xl font-black text-[#ffecb3] drop-shadow-md"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                CHỌN 30 LÁ BÀI • LẬP CÂY BÀI VÀO HỘI
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-white/80 max-w-2xl mx-auto leading-relaxed">
                Mỗi Cây Bài gồm đúng <strong>3 thẻ</strong> (<strong>3 Xu</strong>). Bạn được phép chọn lại thẻ đã chọn ở cây khác, miễn là <strong>tổ hợp 3 thẻ</strong> ghép lại của mỗi Cây không bị trùng lặp nhau!
              </p>
            </div>

            {/* THÔNG BÁO LỖI NẾU CÓ */}
            {pickingError && (
              <div className="mb-5 mx-auto max-w-2xl rounded-xl border border-rose-500/60 bg-rose-950/90 p-3 sm:p-3.5 text-center text-xs sm:text-sm font-semibold text-rose-200 shadow-xl animate-shake">
                ⚠️ {pickingError}
              </div>
            )}

            {/* BỐ CỤC 2 CỘT: TRÁI = BÀI (30 QUÂN), PHẢI = CHỖ CHỌN (CÂY BÀI) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
              
              {/* === CỘT TRÁI: BÀI (30 QUÂN BÀI CHÒI + BỘ LỌC PHO) === */}
              <div className="lg:col-span-7 xl:col-span-7 flex flex-col rounded-2xl border border-white/15 bg-[#0b5558]/85 p-3.5 sm:p-5 backdrop-blur-md shadow-2xl">
                {/* Header thanh lọc pho */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎴</span>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white">
                        Toàn Bộ 30 Quân Bài Chòi
                      </h3>
                      <p className="text-[11px] text-white/60">
                        Nhấp thẻ để gán vào cây đang chọn (hoặc bỏ chọn)
                      </p>
                    </div>
                  </div>

                  {/* BỘ LỌC 3 PHO BÀI */}
                  <div className="flex items-center gap-1 rounded-full border border-white/20 bg-black/30 p-1 text-[11px] sm:text-xs self-start sm:self-auto overflow-x-auto max-w-full">
                    <button
                      type="button"
                      onClick={() => setPhoFilter('all')}
                      className={`rounded-full px-2.5 sm:px-3 py-1 font-semibold transition whitespace-nowrap ${
                        phoFilter === 'all'
                          ? 'bg-[#f29963] text-white shadow-md'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Tất cả (30)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoFilter('van')}
                      className={`rounded-full px-2 sm:px-2.5 py-1 font-semibold transition whitespace-nowrap ${
                        phoFilter === 'van'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Pho Văn (1-10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoFilter('van2')}
                      className={`rounded-full px-2 sm:px-2.5 py-1 font-semibold transition whitespace-nowrap ${
                        phoFilter === 'van2'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Pho Vạn (11-20)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhoFilter('hach')}
                      className={`rounded-full px-2 sm:px-2.5 py-1 font-semibold transition whitespace-nowrap ${
                        phoFilter === 'hach'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      Pho Hạch (21-30)
                    </button>
                  </div>
                </div>

                {/* LƯỚI 30 LÁ BÀI */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-2.5 max-h-[72vh] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredCards.map((card) => {
                    const globalIndex = CARDS.findIndex((c) => c.id === card.id)
                    const phoInfo = getCardPho(globalIndex)

                    // Thẻ đã chọn trong CÂY HIỆN TẠI chưa
                    const isPickedInCurrent = Boolean(
                      draftTrees[activeDraftTreeIndex]?.cards.some((c) => c.id === card.id)
                    )

                    // Danh sách các cây KHÁC cũng có chọn thẻ này
                    const otherTreesWithCard = draftTrees
                      .map((t, idx) => ({ name: t.name, idx }))
                      .filter(
                        (item) =>
                          item.idx !== activeDraftTreeIndex &&
                          draftTrees[item.idx].cards.some((c) => c.id === card.id)
                      )

                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleToggleCardPick(card)}
                        className={`relative group flex flex-col rounded-xl p-1 transition-all text-left duration-200 border-2 select-none ${
                          isPickedInCurrent
                            ? 'bg-amber-400/25 border-[#f6d274] ring-2 ring-[#f6d274] scale-95 shadow-lg'
                            : otherTreesWithCard.length > 0
                            ? 'bg-emerald-950/40 border-emerald-400/60 hover:border-amber-300 hover:scale-105 shadow-md'
                            : 'bg-white/10 border-white/15 hover:border-amber-300/80 hover:bg-white/20 hover:scale-105 shadow-md'
                        }`}
                      >
                        {/* ẢNH THẺ BÀI */}
                        <div className="overflow-hidden rounded-lg bg-white p-0.5">
                          <img
                            src={card.image}
                            alt={card.name}
                            className="aspect-[3/4] w-full rounded-md object-cover"
                            draggable={false}
                          />
                        </div>

                        {/* TÊN THẺ BÀI */}
                        <span className="mt-1 block text-center text-[10px] sm:text-xs font-bold text-white truncate px-0.5">
                          {card.name}
                        </span>

                        {/* TAG PHO & HUY HIỆU */}
                        <div className="mt-0.5 flex items-center justify-between px-0.5">
                          <span className={`text-[8px] font-semibold px-1 rounded border ${phoInfo.tagClass}`}>
                            {phoInfo.phoName.replace('Pho ', '')}
                          </span>

                          {isPickedInCurrent ? (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-[#f6d274] text-[#173a3a] shadow-sm">
                              ✓ Đang chọn
                            </span>
                          ) : otherTreesWithCard.length > 0 ? (
                            <span
                              className="text-[8px] font-bold px-1 rounded bg-emerald-600/80 text-emerald-100"
                              title={`Đã có ở ${otherTreesWithCard.map((t) => t.name).join(', ')} (Vẫn chọn được tiếp!)`}
                            >
                              Cây #{otherTreesWithCard.map((t) => t.idx + 1).join(',#')} +1x
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#fce893]">
                              <ChoiCoin size={10} /> 1
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* === CỘT PHẢI: CHỖ CHỌN (CÁC CÂY BÀI CỦA BẠN & THAO TÁC) === */}
              <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20 flex flex-col gap-4">
                <div className="rounded-2xl border border-[#f6d274]/35 bg-[#0b5558]/95 p-4 sm:p-5 backdrop-blur-md shadow-2xl">
                  {/* HEADER CHỖ CHỌN */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🎋</span>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-white">
                          Các Cây Bài Của Bạn
                        </h3>
                        <p className="text-[11px] text-[#ffda86]">
                          {draftTrees.length} cây • {totalCardsPicked} thẻ đã chọn
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddNewTree}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#e69756] to-[#f29963] text-[#173a3a] font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition"
                    >
                      <span>+</span>
                      <span>Mua Thêm Cây Mới (3 Xu)</span>
                    </button>
                  </div>

                  {/* TABS DANH SÁCH CÁC CÂY BÀI */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
                    {draftTrees.map((tree, idx) => {
                      const isComplete = tree.cards.length === 3
                      const isActive = activeDraftTreeIndex === idx
                      return (
                        <button
                          key={tree.id}
                          type="button"
                          onClick={() => {
                            setActiveDraftTreeIndex(idx)
                            setPickingError('')
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                            isActive
                              ? 'bg-[#f6d274] text-[#173a3a] border-[#fff0a4] shadow-lg scale-105'
                              : isComplete
                              ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40 hover:bg-emerald-800/60'
                              : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
                          }`}
                        >
                          <span>{tree.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                              isComplete ? 'bg-emerald-600 text-white' : 'bg-black/30 text-white/90'
                            }`}
                          >
                            {tree.cards.length}/3
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* CHI TIẾT CÂY BÀI ĐANG ĐƯỢC CHỌN (SLOTS) */}
                  {draftTrees[activeDraftTreeIndex] && (
                    <div className="rounded-xl bg-black/30 border border-white/10 p-3 sm:p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[#ffda86]">
                            {draftTrees[activeDraftTreeIndex].name}
                          </span>
                          <span className={`text-xs font-semibold ${
                            draftTrees[activeDraftTreeIndex].cards.length === 3
                              ? 'text-emerald-300'
                              : 'text-amber-300/80'
                          }`}>
                            ({draftTrees[activeDraftTreeIndex].cards.length === 3
                              ? '✓ Đã đủ 3 thẻ'
                              : `Còn thiếu ${3 - draftTrees[activeDraftTreeIndex].cards.length} thẻ`})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAutoPickTree(activeDraftTreeIndex)}
                            className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#fce893] transition flex items-center gap-1"
                            title="Chọn nhanh ngẫu nhiên đủ 3 thẻ cho cây này"
                          >
                            <span>⚡</span>
                            <span>Chọn 3 thẻ</span>
                          </button>

                          {draftTrees.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDraftTree(activeDraftTreeIndex)}
                              className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-800 text-rose-300 transition"
                              title="Hủy cây bài này"
                            >
                              ✕ Xóa cây
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 3 SLOTS CỦA CÂY NÀY */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {[0, 1, 2].map((slotIdx) => {
                          const card = draftTrees[activeDraftTreeIndex].cards[slotIdx]
                          if (card) {
                            return (
                              <div
                                key={card.id}
                                className="relative group rounded-xl border-2 border-amber-300/80 bg-white p-1 shadow-md transition transform hover:-translate-y-0.5"
                              >
                                <img
                                  src={card.image}
                                  alt={card.name}
                                  className="aspect-[3/4] w-full rounded-lg object-cover"
                                />
                                <div className="mt-1 text-center">
                                  <span className="block text-[10px] sm:text-xs font-bold text-slate-800 truncate">
                                    {card.name}
                                  </span>
                                </div>
                                {/* Nút gỡ thẻ */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleCardPick(card)}
                                  className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-white font-black text-[10px] shadow-lg hover:bg-rose-700 active:scale-95 transition"
                                  title="Gỡ thẻ ra khỏi cây"
                                >
                                  ✕
                                </button>
                              </div>
                            )
                          }
                          return (
                            <div
                              key={`empty-slot-${slotIdx}`}
                              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#f6d274]/50 bg-white/5 aspect-[3/4] p-2 text-center text-white/50 hover:border-[#f6d274] hover:bg-white/10 transition"
                            >
                              <span className="text-xl sm:text-2xl text-[#f6d274]">+</span>
                              <span className="text-[10px] sm:text-xs font-semibold mt-0.5 text-[#fce893]">
                                Thẻ {slotIdx + 1}
                              </span>
                              <span className="text-[9px] text-white/50">1 Xu</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* KHỐI TỔNG KẾT CHI PHÍ VÀ SỐ DƯ */}
                  <div className="rounded-xl bg-black/20 border border-white/10 p-3 sm:p-3.5 mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-white/70">Tổng chi phí mua thẻ:</span>
                      <span className="font-black text-[#ffda86] flex items-center gap-1">
                        <ChoiCoin size={14} />
                        {totalCostCoins} Xu
                        <span className="text-[11px] font-normal text-white/60">
                          ({draftTrees.length} cây • {totalCardsPicked} thẻ)
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm pt-1.5 border-t border-white/10">
                      <span className="text-white/70">Số dư sau khi mua:</span>
                      <span className={`font-bold flex items-center gap-1 ${
                        userCoins < totalCostCoins ? 'text-rose-400' : 'text-emerald-300'
                      }`}>
                        <ChoiCoin size={14} />
                        {Math.max(0, userCoins - totalCostCoins)} Xu
                      </span>
                    </div>

                    {userCoins < totalCostCoins && (
                      <div className="pt-1 flex items-center justify-between text-[11px] text-rose-300">
                        <span>Số dư không đủ!</span>
                        <button
                          type="button"
                          onClick={() => setIsTopupModalOpen(true)}
                          className="font-bold underline text-amber-300 hover:text-amber-200"
                        >
                          Nạp thêm Xu ngay →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* NÚT VÀO HỘI KHAI CANH NGAY TRONG PANEL BÊN PHẢI */}
                  <button
                    type="button"
                    onClick={handleStartGameFromPicking}
                    className="w-full py-3 sm:py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#e86a38] via-[#d34e3a] to-[#c44837] text-white font-black text-sm sm:text-base tracking-wide shadow-[0_4px_20px_rgba(232,106,56,0.5)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <span>VÀO HỘI KHAI CANH</span>
                    <span className="text-lg leading-none">→</span>
                  </button>

                  <p className="mt-2.5 text-center text-[10px] text-white/50 leading-relaxed">
                    💡 Bạn được chọn lại thẻ đã chọn ở cây khác, miễn là tổ hợp 3 lá của mỗi cây không trùng nhau!
                  </p>
                </div>
              </div>

            </div>

            {/* THANH ĐIỀU KHIỂN DƯỚI CÙNG TRÊN MOBILE (STICKY DÀNH CHO MÀN HÌNH NHỎ) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#04282b]/95 border-t border-[#f6d274]/30 backdrop-blur-md px-3 sm:px-6 py-2.5 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <ChoiCoin size="sm" glow animate />
                  <div>
                    <div className="text-[10px] text-white/70">Tổng: {totalCostCoins} Xu</div>
                    <div className="text-xs font-bold text-emerald-300">
                      Còn: {Math.max(0, userCoins - totalCostCoins)} Xu
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartGameFromPicking}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#e86a38] to-[#c44837] text-white font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition"
                >
                  Vào Hội →
                </button>
              </div>
            </div>
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
                  onClick={() => { connectRoom('joinRoom') }}


                  disabled={!/^CHOI-\d{6}$/.test(joinCode) || socketStatus === 'connecting'}
                  className="mt-3 w-full rounded-xl bg-[#e69756] px-4 py-3 font-bold text-[#173a3a] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Vào hội
                </button>
              </div>
            </div> : <div className="mt-7">
              <div className="rounded-2xl border border-[#f29963]/40 bg-black/10 p-5 text-center"><p className="text-xs uppercase tracking-[.2em] text-white/55">Mã hội của bạn</p><div className="mt-2 text-3xl font-black tracking-[.2em] text-[#f29963]">{roomCode}</div><button onClick={() => void copyRoomCode()} className="mt-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white">{roomCodeCopied ? 'Đã sao chép ✓' : 'Sao chép mã'}</button></div>
              <div className="mt-4 space-y-2">{onlinePlayers.map((player) => <div key={player.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"><span className="font-semibold">{player.name} {player.id === hostId && '👑'}</span><span className={player.ready ? 'text-[#f29963]' : 'text-white/45'}>{player.ready ? 'Sẵn sàng' : 'Chưa sẵn sàng'}</span></div>)}</div>
             {playerId !== hostId && (
  <button
    onClick={() => {
      socketRef.current?.send(
        JSON.stringify({
          type: 'ready',
          ready: !onlinePlayers.find(
            (player) => player.id === playerId
          )?.ready
        })
      )
    }}
    className="mt-5 w-full rounded-xl bg-[#e69756] px-4 py-3 font-bold text-[#173a3a]"
  >
    {onlinePlayers.find((player) => player.id === playerId)?.ready
      ? 'Hủy sẵn sàng'
      : 'Tôi đã sẵn sàng'}
  </button>
)}

<button
  onClick={() => void unlockAudio()}
  className="mt-5 w-full rounded-xl bg-[#f29963] px-4 py-3 font-bold text-[#173a3a]"
>
  🔊 Bật âm thanh
</button>

{playerId === hostId && (
  <button
    onClick={() => {
      socketRef.current?.send(
        JSON.stringify({ type: 'startGame' })
      )
    }}
    disabled={
      onlinePlayers.length < 2 ||
      onlinePlayers.some((player) => !player.ready)
    }
    className="mt-5 w-full rounded-xl bg-[#c44837] px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-35"
  >
    {onlinePlayers.length < 2
      ? 'Chờ ít nhất một người bạn…'
      : onlinePlayers.some((player) => !player.ready)
      ? 'Chờ mọi người sẵn sàng…'
      : 'Khai hội'}
  </button>
)}

            </div>}
            {roomError && <p className="mt-4 rounded-xl bg-[#7c2421]/50 px-4 py-3 text-sm text-[#ffd3c2]">{roomError}</p>}
            </section>
          </>
        )}

      {screen === 'playing' && (
  <section className="w-full px-3 pb-16 sm:px-4 sm:pb-12">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs uppercase tracking-[.2em] text-[#f29963]">Hội Bài Chòi • 5 chòi</p><h2 className="text-2xl font-black">Ván đang diễn ra</h2></div>
              <div className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm">Cờ của bạn: <strong className="text-[#f29963]">{playerTrees.length > 0 ? Math.max(0, ...playerTrees.map(t => t.claimedCardIds.length)) : claimed.length}/3</strong></div>
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

  {/* NÚT MỞ LẠI XẾP HÌNH NẾU ĐÃ THOÁT RA BÀN CHƠI (Khi đang hô) */}
  {isCalling && currentCallingCard && !showPuzzleModal && (
    <button
      onClick={() => setShowPuzzleModal(true)}
      className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f29963] hover:bg-[#ffb07f] active:scale-95 text-[#072d2e] font-black text-xs shadow-lg transition"
    >
      <span className="text-sm">🧩</span>
      <span>Vào Xếp Hình</span>
    </button>
  )}

  {/* LÁ BÀI TRÊN SÂN KHẤU CHÍNH (GIỮ NGUYÊN KHÔNG THAY ĐỔI) */}
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
    {isCalling && currentCallingCard ? (
      <div className="flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full bg-black/60 border border-[#f6d274]/40 backdrop-blur-md shadow-lg transition-all duration-300">
        <span className="text-xs text-[#f6d274] animate-pulse">🎶</span>
        <span className="text-xs sm:text-[13px] font-semibold italic text-[#ffe58b] tracking-wide font-serif leading-snug">
          "{getChantLyrics(currentCallingCard.id, currentCallingCard.name)[chantLyricIndex]}"
        </span>
      </div>
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
                  <p className="mb-4 text-xs font-bold uppercase tracking-[.2em] text-[#f29963]">
                    {playerTrees.length > 1
                      ? `Các cây bài của bạn (${playerTrees.length} Cây • ${hand.length} Thẻ)`
                      : 'Ba thẻ trong chòi của bạn'}
                  </p>

                  {playerTrees.length > 1 ? (
                    <div className="space-y-4">
                      {playerTrees.map((tree) => (
                        <div key={tree.id} className="rounded-2xl bg-black/25 border border-white/10 p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs sm:text-sm font-bold text-[#ffda86] flex items-center gap-1.5">
                              <span>🎋</span>
                              <span>{tree.name}</span>
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              tree.claimedCardIds.length >= 3
                                ? 'bg-amber-500 text-slate-900 border-amber-300 font-black'
                                : 'bg-[#f29963]/20 text-[#f29963] border-[#f29963]/30'
                            }`}>
                              ⚑ {tree.claimedCardIds.length}/3 Cờ
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {tree.cards.map((card) => {
                              const isClaimed = tree.claimedCardIds.includes(card.id)
                              const isHit = !isCalling && currentCard?.id === card.id && !isClaimed
                              return (
                                <div
                                  key={card.id}
                                  className={`hand-card ${isHit ? 'hand-card-hit' : ''} ${isClaimed ? 'hand-card-claimed' : ''}`}
                                >
                                  <div className="hand-card-image">
                                    <img src={card.image} alt={card.name} draggable={false} />
                                  </div>
                                  <p className="hand-card-name">
                                    {isClaimed ? '⚑ ' : ''}{card.name}
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
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {hand.map((card) => {
                        const isClaimed = claimed.includes(card.id)
                        const isHit = !isCalling && currentCard?.id === card.id && !isClaimed
                        return (
                          <div
                            key={card.id}
                            className={`hand-card ${isHit ? 'hand-card-hit' : ''} ${isClaimed ? 'hand-card-claimed' : ''}`}
                          >
                            <div className="hand-card-image">
                              <img src={card.image} alt={card.name} draggable={false} />
                            </div>
                            <p className="hand-card-name">
                              {isClaimed ? '⚑ ' : ''}{card.name}
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
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {players.map((player, index) => <div key={`${player}-${index}`} className={`rounded-2xl border p-3 text-center ${(onlineMode ? onlinePlayers[index]?.id === playerId : index === 0) ? 'border-[#f29963] bg-[#c44837]/25' : 'border-white/15 bg-[#0b5558]/80'}`}><div className="mx-auto mb-2 grid h-9 w-9 place-items-center rounded-full bg-white/10">{onlineMode ? '☺' : index === 0 ? '☺' : '⚙'}</div><p className="truncate text-xs font-bold">{player}</p><p className="mt-1 text-[11px] text-[#f29963]">⚑ {onlineMode ? onlinePlayers[index]?.flags || 0 : index === 0 ? (playerTrees.length > 0 ? Math.max(0, ...playerTrees.map(t => t.claimedCardIds.length)) : claimed.length) : botFlags[index - 1]}/3</p></div>)}
                </div>
              </div>
            </div>
          
        {/* MODAL POPUP XẾP HÌNH JIGSAW NỔI TRÊN MÀN HÌNH (LÀM TỐI PHÍA SAU) */}
        {showPuzzleModal && isCalling && currentCallingCard && (
          <div className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 select-none overflow-y-auto animate-fadeIn">
            <div className="w-full max-w-[460px] flex flex-col items-center my-auto">
              {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG */}
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <button
                  type="button"
                  onClick={() => setShowPuzzleModal(false)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#c44837] hover:bg-[#a33829] active:scale-95 text-white font-bold text-xs shadow-xl transition"
                >
                  <span>←</span>
                  <span>Quay lại bàn chơi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPuzzleModal(false)}
                  className="text-xs font-semibold text-white/75 hover:text-white px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition"
                >
                  Bỏ qua ✕
                </button>
              </div>

              {/* BÀN CHƠI JIGSAW */}
              <div className="w-full">
                <BaiChoiPuzzle
                  card={currentCallingCard}
                  isCalling={isCalling}
                  level={puzzleLevel}
                  lyricIndex={chantLyricIndex}
                  onComplete={handlePuzzleComplete}
                  onClose={() => setShowPuzzleModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </section>
        )}

        {screen === 'result' && (
          <section className="w-full max-w-xl rounded-[2rem] border border-[#f29963]/50 bg-[#0b5558]/95 p-8 text-center shadow-2xl sm:p-12">
            <div className="text-6xl">{winner === playerName ? '🎊' : '🏁'}</div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[.25em] text-[#f29963]">Kết thúc ván</p>
            <h2 className="mt-2 text-4xl font-black" style={{ fontFamily: 'var(--font-display)' }}>{winner === playerName ? 'Bạn đã hô TỚI!' : `${winner} chiến thắng!`}</h2>
            <p className="mt-4 text-white/65">Cảm ơn {playerName} đã cùng vào hội.</p>
            {winner === playerName && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-sm font-bold text-[#ffda86]">
                <ChoiCoin size="sm" glow animate />
                <span>Thưởng thắng cuộc: +15 Xu Chòi (Số dư: {userCoins} Xu)</span>
              </div>
            )}
            <div className="mt-8 grid grid-cols-2 gap-3"><button onClick={() => { stopAudio(); onlineMode ? backToMode() : goToCardPicking() }} className="rounded-xl bg-[#c44837] px-4 py-3 font-bold">{onlineMode ? 'Về phòng hội' : 'Chơi ván nữa'}</button><button onClick={backToMode} className="rounded-xl border border-white/20 px-4 py-3 font-bold hover:bg-white/10">Về sảnh hội</button></div>
          </section>
        )}
      </main>

      {/* MODAL NẠP XU (ĐỒNG BỘ SUPABASE DATABASE) */}
      <CoinTopupModal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        currentUser={currentUser}
        onSuccess={(newCoins) => {
          setUserCoins(newCoins)
          const updated = authService.getCurrentUser()
          setCurrentUser(updated)
        }}
      />

      {/* MODAL CẢNH BÁO THOÁT VÁN CHƠI (KHÔNG HOÀN XU) */}
      {showExitConfirmModal && (
        <div
          className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-3xl border-2 border-[#f6d274]/60 bg-gradient-to-b from-[#0b5558] via-[#073f43] to-[#04282b] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white">
            {/* NÚT ĐÓNG X */}
            <button
              type="button"
              onClick={handleCancelExit}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition"
              aria-label="Đóng cảnh báo"
            >
              ✕
            </button>

            {/* ICON CẢNH BÁO */}
            <div className="mx-auto mb-3.5 grid h-16 w-16 place-items-center rounded-full border-2 border-amber-400/60 bg-amber-500/20 text-3xl shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse">
              ⚠️
            </div>

            {/* TIÊU ĐỀ */}
            <h3
              className="text-xl sm:text-2xl font-black text-[#ffecb3] tracking-wide"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              RỜI KHỎI VÁN CHƠI?
            </h3>

            {/* NỘI DUNG CẢNH BÁO */}
            <div className="mt-3.5 space-y-2.5 text-xs sm:text-sm text-white/85 leading-relaxed">
              <p>
                Ván chơi đang diễn ra sôi nổi! Nếu bạn tự ý thoát ra lúc này:
              </p>

              <div className="rounded-2xl border border-rose-500/40 bg-rose-950/70 p-3.5 text-rose-200 font-semibold shadow-inner text-left">
                <div className="flex items-center gap-2 text-rose-300 font-black text-sm mb-1">
                  <span>⛔</span>
                  <span>KHÔNG ĐƯỢC HOÀN XU</span>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed">
                  Số Xu bạn đã bỏ ra để mua thẻ/cây bài vào hội{' '}
                  <strong className="text-[#ffda86]">
                    ({(playerTrees.length > 0 ? playerTrees.length * 3 : (draftTrees.length * 3 || 3))} Xu)
                  </strong>{' '}
                  sẽ bị mất và <strong>không được hoàn lại</strong>!
                </p>
              </div>

              <p className="font-semibold text-[#fce893] pt-1">
                Bạn có đồng ý thoát không?
              </p>
            </div>

            {/* CÁC NÚT LỰA CHỌN */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleConfirmExit}
                className="w-full rounded-xl border border-rose-500/50 bg-rose-900/40 hover:bg-rose-800 text-rose-200 font-bold py-3 px-4 text-xs sm:text-sm transition active:scale-95 shadow-md"
              >
                Đồng ý thoát
              </button>
              <button
                type="button"
                onClick={handleCancelExit}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 text-white font-black py-3 px-4 text-xs sm:text-sm transition active:scale-95 shadow-[0_4px_20px_rgba(16,185,129,0.35)]"
              >
                Ở lại chơi tiếp ✦
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
