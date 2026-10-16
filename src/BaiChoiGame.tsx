import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import { getChantLyrics } from './chantLyrics';
import { authService } from './lib/authService';
import ChoiCoin from './components/ChoiCoin';
import CoinTopupModal from './components/CoinTopupModal';
import AuthModal from './components/AuthModal';
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

function ModeCardsStage({ cards, isMobile }: { cards: Card[]; isMobile?: boolean }) {
  const cardWidth = isMobile ? 32 : 72
  const cardHeight = Math.round(cardWidth * 2.06)

  return (
    <div className="relative w-full h-[68px] sm:h-[150px] md:h-[200px] flex items-center justify-center gap-1 sm:gap-3 select-none pointer-events-none">
      {cards.map((card, index) => (
        <div
          key={card.id}
          className="relative will-change-transform pointer-events-auto group"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            animation: 'modeCardWave 3.4s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite',
            animationDelay: `-${index * 0.55}s`,
          }}
        >
          <div
            className="w-full h-full overflow-hidden select-none transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_0_24px_rgba(246,210,116,0.85)]"
            style={{
              borderRadius: Math.max(5, Math.round(cardWidth * 0.08)),
              background: '#FFFDEB',
              border: '2px solid rgba(216,176,105,0.92)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(0,99,104,0.16)',
            }}
          >
            <img
              src={card.image}
              alt={card.name}
              draggable={false}
              decoding="async"
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          </div>
        </div>
      ))}
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

  // 5 lá bài ngẫu nhiên từ 3 phô cho màn hình chọn chế độ
  const [modeCards, setModeCards] = useState<Card[]>(() => {
    const shuffled = [...CARDS].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 5)
  })
  const [countdown, setCountdown] = useState(8)
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [deck, setDeck] = useState<Card[]>([])
  const [hand, setHand] = useState<Card[]>([])
  const [drawIndex, setDrawIndex] = useState(-1)
  const [claimed, setClaimed] = useState<string[]>([])
  const [botFlags, setBotFlags] = useState([0, 0, 0, 0])
  const [botHands, setBotHands] = useState<Card[][]>([])
  const [message, setMessage] = useState('')
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
  const [currentCallingCard, setCurrentCallingCard] = useState<Card | null>(null)
  const fallbackTimerRef = useRef<number | null>(null)
  const [chantLyricIndex, setChantLyricIndex] = useState(0)

  // ==========================================
  // QUẢN LÝ XU & ĐA CÂY BÀI (DATABASE & SUPABASE)
  // ==========================================
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser())
  const [userCoins, setUserCoins] = useState<number>(() => {
    const user = authService.getCurrentUser()
    return user?.coins ?? 0
  })
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')

  // Đăng ký đồng bộ thông tin tài khoản thật từ authService
  useEffect(() => {
    return authService.subscribe((user) => {
      setCurrentUser(user)
      setUserCoins(user?.coins ?? 0)
    })
  }, [])

  // Cây bài của người chơi trong ván đấu
  const [playerTrees, setPlayerTrees] = useState<PlayerTree[]>([])

  // State chọn thẻ bài (1 Cây = 3 Thẻ, 1 Thẻ = 5 Xu, 1 Cây = 15 Xu)
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
    const user = authService.getCurrentUser()
    setCurrentUser(user)
    setUserCoins(user?.coins ?? 0)
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
      window.innerWidth < 1024 &&
      window.innerHeight > window.innerWidth
    )
  })

  const [dismissOrientationPrompt, setDismissOrientationPrompt] = useState(false)

  // Style cho sân khấu chính 2000 x 1009 (Luôn tràn viền 100% toàn màn hình laptop & điện thoại, không bao giờ bị hở viền 2 bên)
  const stageStyle = useMemo(() => {
    if (isMobilePortrait) {
      return {
        width: 'max(100dvh, calc(100dvw * (2000 / 1009)))',
        height: 'max(100dvw, calc(100dvh * (1009 / 2000)))',
      }
    }
    return {
      width: 'max(100vw, calc(100vh * (2000 / 1009)))',
      height: 'max(100vh, calc(100vw * (1009 / 2000)))',
    }
  }, [isMobilePortrait])

  // Style cho sân khấu video Hô Tới 1304 x 658 (Luôn tràn viền 100% toàn màn hình)
  const resultStageStyle = useMemo(() => {
    if (isMobilePortrait) {
      return {
        width: 'max(100dvh, calc(100dvw * (1304 / 658)))',
        height: 'max(100dvw, calc(100dvh * (658 / 1304)))',
      }
    }
    return {
      width: 'max(100vw, calc(100vh * (1304 / 658)))',
      height: 'max(100vh, calc(100vw * (658 / 1304)))',
    }
  }, [isMobilePortrait])

  useEffect(() => {
    const checkOrientation = () => {
      setIsMobilePortrait(window.innerWidth < 1024 && window.innerHeight > window.innerWidth)
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
    setIsCalling(true)
    setMessage('Lắng nghe Chị Hiệu hô câu thai…')

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
    const shuffled = [...CARDS].sort(() => Math.random() - 0.5)
    setModeCards(shuffled.slice(0, 5))
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
    if (winnerName === playerName && currentUser) {
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
  // XỬ LÝ CHỌN 30 LÁ BÀI & MUA NHIỀU CÂY BÀI (1 THẺ = 5 XU, 1 CÂY = 15 XU)
  // Cho phép chọn lại lá bài đã chọn ở cây khác, nhưng kiểm tra
  // tổ hợp 3 lá của mỗi cây phải độc nhất (không trùng nhau).
  // =========================================================
  const getTreeSignature = (cards: Card[]): string => {
    return [...cards].map((c) => c.id).sort().join('|')
  }

  const CARD_PRICE = 5
  const TREE_PRICE = 15

  const totalCardsPicked = useMemo(() => {
    return draftTrees.reduce((sum, tree) => sum + tree.cards.length, 0)
  }, [draftTrees])

  const totalCostCoins = totalCardsPicked * CARD_PRICE

  const filteredCards = useMemo(() => {
    if (phoFilter === 'van') return CARDS.slice(0, 10)
    if (phoFilter === 'van2') return CARDS.slice(10, 20)
    if (phoFilter === 'hach') return CARDS.slice(20, 30)
    return CARDS
  }, [phoFilter])

  const handleToggleCardPick = (card: Card) => {
    setPickingError('')

    // Kiểm tra tài khoản thật trước khi chọn bài
    if (!currentUser) {
      setPickingError(
        'Bạn chưa đăng nhập! Vui lòng Đăng nhập hoặc Đăng ký bằng Email / Số điện thoại để nạp Xu và chọn thẻ bài.'
      )
      setAuthModalMode('login')
      setIsAuthModalOpen(true)
      return
    }

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
          `${activeTree.name} đã đủ 3 thẻ! Bạn có thể bấm "+ Thêm cây (15 Xu)" nếu muốn lập thêm cây khác.`
        )
      }
      return
    }

    // Kiểm tra số dư Xu (1 thẻ = 5 Xu)
    if ((totalCardsPicked + 1) * CARD_PRICE > userCoins) {
      setPickingError(
        `Số dư Xu không đủ! Mỗi thẻ giá 5 Xu (1 Cây 3 thẻ = 15 Xu). Bạn đang có ${userCoins} Xu và đã chọn ${totalCardsPicked} thẻ (${totalCostCoins} Xu). Vui lòng nạp thêm Xu.`
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

    if (!currentUser) {
      setPickingError('Bạn chưa đăng nhập! Vui lòng Đăng nhập / Đăng ký tài khoản để mua thêm cây bài.')
      setAuthModalMode('login')
      setIsAuthModalOpen(true)
      return
    }

    if (draftTrees.length >= 5) {
      setPickingError('Mỗi người chơi chỉ được chọn tối đa 5 Cây Bài trong một ván đấu.')
      return
    }

    const coinsLeft = userCoins - totalCostCoins
    if (coinsLeft < TREE_PRICE) {
      setPickingError(
        `Bạn cần có ít nhất 15 Xu để mua thêm 1 Cây Bài mới (Hiện còn: ${coinsLeft} Xu). Vui lòng nạp thêm Xu.`
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

    if (!currentUser) {
      setPickingError('Bạn chưa đăng nhập! Vui lòng Đăng nhập / Đăng ký tài khoản để chọn thẻ bài.')
      setAuthModalMode('login')
      setIsAuthModalOpen(true)
      return
    }

    const targetTree = draftTrees[treeIndex]
    if (!targetTree) return

    const neededCount = 3 - targetTree.cards.length
    if (neededCount <= 0) return

    const neededCoins = neededCount * CARD_PRICE
    const coinsLeft = userCoins - totalCostCoins
    if (coinsLeft < neededCoins) {
      setPickingError(
        `Số dư Xu không đủ! Cần thêm ${neededCoins} Xu (${neededCount} thẻ x 5 Xu) để hoàn thành cây này. Hiện còn: ${coinsLeft} Xu.`
      )
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

    if (!currentUser) {
      setPickingError('Bạn chưa đăng nhập! Vui lòng Đăng nhập hoặc Đăng ký bằng Email / Số điện thoại để vào hội.')
      setAuthModalMode('login')
      setIsAuthModalOpen(true)
      return
    }

    if (draftTrees.length === 0) {
      setPickingError('Vui lòng chọn ít nhất 1 Cây Bài hoàn chỉnh để vào hội.')
      return
    }

    for (let i = 0; i < draftTrees.length; i++) {
      const tree = draftTrees[i]
      if (tree.cards.length !== 3) {
        setPickingError(
          `${tree.name} mới có ${tree.cards.length}/3 thẻ. Hãy chọn đủ 3 thẻ (5 Xu/thẻ, 15 Xu/cây) hoặc xóa cây chưa xong.`
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

    const cost = draftTrees.length * TREE_PRICE
    const spendResult = authService.spendCoins(
      cost,
      `Mua ${draftTrees.length} Cây Bài (${cost} Xu) vào hội chơi với máy`
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

    ${screen === 'playing' || screen === 'card-picking'
          ? 'overflow-y-auto overflow-x-hidden touch-pan-y overscroll-y-contain'
          : 'overflow-hidden touch-none'
        }
  `}
      role="dialog"
      aria-modal="true"
      aria-label="Trò chơi Bài Chòi"
    >
      {/* KHUNG HIỂN THỊ CHÍNH (ĐỒNG NHẤT 100% VỚI LAPTOP - TỰ ĐỘNG XOAY NGANG TRÊN ĐIỆN THOẠI) */}
      <div
        className="w-full h-full relative overflow-hidden flex items-center justify-center"
        style={
          isMobilePortrait
            ? {
                position: 'fixed',
                left: '50%',
                top: '50%',
                width: '100dvh',
                height: '100dvw',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                transformOrigin: 'center center',
                overflow: 'hidden',
              }
            : {
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }
        }
      >
        <div className="pointer-events-none fixed inset-0 opacity-20" style={{ backgroundImage: 'url(/assets/Background-toan.jpg)', backgroundSize: 'cover' }} />

      {/* NÚT QUAY LẠI (THU NHỎ LẠI MỘT XÍU, GỌN GÀNG TINH TẾ) */}
      <button
        onClick={handleRequestBack}
        className="absolute z-[80] flex items-center justify-center gap-1 rounded-full border border-white/60 bg-[#075f63]/85 text-white shadow-lg backdrop-blur-sm transition hover:scale-105 hover:bg-[#c44837] cursor-pointer left-2 top-2 sm:left-4 sm:top-3 h-6 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs font-bold"
        aria-label="Quay lại"
        title="Quay lại trang trước"
      >
        <span className="text-xs sm:text-base leading-none">←</span>
        <span>Quay lại</span>
      </button>

      {/* HUY HIỆU VÍ XU TRÊN ĐẦU (ẨN KHI ĐANG CHƠI ĐỂ KHÔNG ĐÈ LÊN BIỂN NGƯỜI THAM GIA) */}
      {screen === 'card-picking' && (
        <div
          className="absolute z-[80] flex items-center rounded-full border border-[#f6d274]/50 bg-[#073f43]/90 backdrop-blur-md shadow-xl transition-all right-9 top-2 sm:right-13 sm:top-2.5 h-6 sm:h-8 px-2 sm:px-2.5 gap-1.5 text-[10px] sm:text-xs"
        >
          {currentUser ? (
            <>
              <ChoiCoin size={12} glow animate />
              <span className="font-bold text-[#fce893] whitespace-nowrap">{userCoins} Xu</span>
              <button
                type="button"
                onClick={() => setIsTopupModalOpen(true)}
                className="ml-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-900 shadow hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                + Nạp
              </button>
            </>
          ) : (
            <>
              <span className="font-bold text-amber-200/90 whitespace-nowrap text-[10px] sm:text-[11px]">Chưa đăng nhập</span>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login')
                  setIsAuthModalOpen(true)
                }}
                className="ml-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-slate-950 shadow hover:brightness-110 active:scale-95 transition cursor-pointer"
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>
      )}

      {/* NÚT ĐÓNG (×) - ẨN KHI ĐANG TRONG BÀN CHƠI */}
      {screen !== 'playing' && (
        <button
          onClick={handleRequestLeave}
          className="absolute z-[80] grid place-items-center rounded-full border-2 border-white/70 bg-[#075f63]/85 text-white shadow-xl backdrop-blur-sm transition hover:scale-105 hover:bg-[#c44837] cursor-pointer right-2 top-2 sm:right-3.5 sm:top-2.5 h-6 w-6 sm:h-8 sm:w-8 text-sm sm:text-lg font-light leading-none"
          aria-label="Đóng trò chơi"
          title="Đóng trò chơi"
        >
          ×
        </button>
      )}
      <main className="relative flex w-full h-full items-center justify-center p-0 overflow-hidden">
        {screen === 'name' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#031d22] overflow-hidden select-none">
            {/* Lớp nền mờ lan tỏa màu teal sâu của tranh Bài Chòi */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background: 'radial-gradient(circle at 50% 50%, #0d4a52 0%, #031c21 75%, #011114 100%)',
              }}
            />

            {/* Sân khấu game chính: Luôn tràn 100% toàn màn hình, không bao giờ bị hở 2 bên */}
            <div
              className="relative flex-none flex items-center justify-center overflow-hidden"
              style={stageStyle}
            >
              {/* Ảnh nền giao diện mới: /assets/game/game.png */}
              <img
                src="/assets/game/game.png"
                alt="Giao diện Đi Chơi Bài Chòi"
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />

              {/* Ô NHẬP TÊN TRÊN BẢN ĐỒ GỐC (DÙNG TRÊN DESKTOP HOẶC KHI XOAY NGANG) */}
              <div
                className="absolute z-10 -translate-x-1/2 flex items-center justify-center"
                style={{
                  left: '50.0%',
                  top: '64.8%',
                  width: '20.0%',
                  height: '5.2%',
                }}
              >
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value)
                    if (error) setError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitName()
                  }}
                  maxLength={20}
                  placeholder="Nhập tên của bạn..."
                  className="w-full h-full bg-transparent text-center font-bold text-[#0c403f] placeholder:text-[#0c403f]/40 outline-none border-none text-xs sm:text-base md:text-lg lg:text-xl selection:bg-[#20d2c4]/40"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>

              {/* THÔNG BÁO LỖI NẾU CHƯA NHẬP TÊN */}
              {error && (
                <div
                  className="absolute z-20 left-1/2 -translate-x-1/2 text-center pointer-events-none"
                  style={{
                    top: '71.2%',
                    width: '24.0%',
                  }}
                >
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-600/90 text-white font-bold text-[10px] sm:text-xs shadow-md animate-bounce">
                    ⚠️ {error}
                  </span>
                </div>
              )}

              {/* NÚT MŨI TÊN "VÀO HỘI" CÓ CHUYỂN ĐỘNG NHỊP NHỊP GÂY ẤN TƯỢNG */}
              <button
                type="button"
                onClick={submitName}
                title="Bấm để vào hội Bài Chòi"
                className="absolute z-20 cursor-pointer select-none outline-none focus:outline-none transition-transform active:scale-95 group"
                style={{
                  left: '58.05%',
                  top: '60.65%',
                  width: '9.35%',
                  height: '10.9%',
                }}
              >
                <img
                  src="/assets/game/arrow-vaohoi.png"
                  alt="Vào hội"
                  className="w-full h-full object-contain pointer-events-none animate-heartbeat-arrow"
                  draggable={false}
                />
              </button>
            </div>
          </div>
        )}

        {screen === 'mode' && (
          <section className="absolute inset-0 z-10 flex items-center justify-center bg-[#8f9eb6] overflow-hidden select-none">
            {/* Lớp nền tràn viền 100% toàn màn hình với Chedo.png */}
            <div
              className="relative flex-none flex items-center justify-center overflow-hidden"
              style={stageStyle}
            >
              <img
                src="/assets/game/Chedo.png"
                alt="Chọn Chế Độ Chơi Bài Chòi"
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />

              {/* VÙNG NỘI DUNG CHÍNH Ở KHOẢNG GIỮA CỦA 2 NHÂN VẬT */}
              <div
                className="absolute z-10 flex flex-col items-center justify-between"
                style={{
                  left: isMobilePortrait ? '14.0%' : '21.0%',
                  width: isMobilePortrait ? '72.0%' : '58.0%',
                  top: '5.5%',
                  height: '89.0%',
                }}
              >
                {/* 1. TIÊU ĐỀ */}
                <div className="w-full text-center flex flex-col items-center shrink-0">
                  <p className="text-[8px] sm:text-xs font-bold uppercase tracking-[.25em] text-[#ffea9f] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] mb-0.5 sm:mb-1">
                    Xin chào, {playerName || 'Người chơi'}
                  </p>

                  <h2
                    className="text-sm sm:text-xl md:text-3xl lg:text-4xl font-black text-white drop-shadow-[0_3px_12px_rgba(7,40,55,0.85)] tracking-wide leading-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    CHỌN CHẾ ĐỘ CHƠI
                  </h2>

                  <p className="mt-0.5 text-[8px] sm:text-xs font-semibold text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                    Chọn một cách vào hội để bắt đầu
                  </p>
                </div>

                {/* 2. SÂN KHẤU 5 LÁ BÀI XOAY VÒNG RỒI DÀN HÀNG NGANG & LƯỢN SÓNG */}
                <div className="w-full flex-1 min-h-0 flex items-center justify-center my-0 sm:my-auto">
                  <ModeCardsStage cards={modeCards} isMobile={isMobilePortrait} />
                </div>

                {/* 3. HAI NÚT LỰA CHỌN CHẾ ĐỘ (ĐÃ XÍCH LÊN CAO RÁO, VỪA KHÍT MỌI ĐIỆN THOẠI) */}
                <div className="w-full max-w-[500px] grid grid-cols-2 gap-2 sm:gap-4 shrink-0 mb-0.5 sm:mb-2">
                  {/* CHẾ ĐỘ 01: CHƠI NGAY */}
                  <button
                    type="button"
                    onClick={() => {
                      setCountdown(8)
                      setScreen('matchmaking')
                    }}
                    className="group rounded-xl sm:rounded-3xl border-2 border-[#f6d274] bg-[#fffdf0]/95 hover:bg-white p-1.5 sm:p-3 text-center shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:shadow-[0_10px_28px_rgba(246,210,116,0.35)] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  >
                    <span className="block text-[7.5px] sm:text-[10px] font-black uppercase tracking-[.15em] text-[#bd6648]">
                      CHẾ ĐỘ 01
                    </span>
                    <strong
                      className="mt-0.5 block text-xs sm:text-lg md:text-xl font-black text-[#075f63] group-hover:text-[#c44837] transition-colors leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Chơi ngay
                    </strong>
                    <span className="mt-0.5 block text-[7.5px] sm:text-[10px] leading-tight text-[#075f63]/75 font-medium">
                      Ghép hội nhanh với các chòi máy
                    </span>
                  </button>

                  {/* CHẾ ĐỘ 02: MỞ HỘI CÙNG BẠN */}
                  <button
                    type="button"
                    onClick={() => setScreen('friend')}
                    className="group rounded-xl sm:rounded-3xl border-2 border-[#7edbd5] bg-[#f0fffb]/95 hover:bg-white p-1.5 sm:p-3 text-center shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:shadow-[0_10px_28px_rgba(126,219,213,0.35)] transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  >
                    <span className="block text-[7.5px] sm:text-[10px] font-black uppercase tracking-[.15em] text-[#006368]">
                      CHẾ ĐỘ 02
                    </span>
                    <strong
                      className="mt-0.5 block text-xs sm:text-lg md:text-xl font-black text-[#075f63] group-hover:text-[#008f96] transition-colors leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Mở hội cùng bạn
                    </strong>
                    <span className="mt-0.5 block text-[7.5px] sm:text-[10px] leading-tight text-[#075f63]/75 font-medium">
                      Tạo mã hoặc tham gia phòng bạn bè
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {screen === 'matchmaking' && (
          <section className="absolute inset-0 z-10 flex items-center justify-center bg-[#151a30] overflow-hidden select-none">
            {/* Lớp nền tràn viền 100% toàn màn hình với choivoimay.png */}
            <div
              className="relative flex-none flex items-center justify-center overflow-hidden"
              style={stageStyle}
            >
              <img
                src="/assets/game/choivoimay.png"
                alt="Chơi Với Máy"
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />

              {/* VÙNG ĐẾM NGƯỢC (COUNTDOWN NUMBER) ĐẶT TRÙNG KHỚP VÀO HÌNH TRÒN CỦA BIỂU TƯỢNG ĐÌNH CHÒI */}
              <div
                className="absolute z-20 flex items-center justify-center rounded-full pointer-events-none select-none"
                style={{
                  left: '50.0%',
                  top: '43.0%',
                  width: '6.7%',
                  height: '13.3%',
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(circle, #345e65 0%, #284c52 75%, #1d393e 100%)',
                  boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.45), 0 0 16px rgba(52, 94, 101, 0.55)',
                }}
              >
                <span
                  key={countdown}
                  className="font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] text-4xl sm:text-5xl md:text-6xl animate-scale-pop select-none"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {countdown}
                </span>
              </div>

              {/* 3 CHẤM NHẢY LƯỢN SÓNG (ĐÈ LÊN 3 CHẤM TĨNH TRONG ẢNH CHOIVOIMAY.PNG) */}
              <div
                className="absolute z-20 flex items-center justify-between pointer-events-none select-none"
                style={{
                  left: '60.75%',
                  top: '54.11%',
                  width: '4.2%',
                  height: '2.4%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Lớp nền hòa sắc che 3 chấm tĩnh gốc */}
                <div
                  className="absolute inset-[-4px] rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at center, #ad9eb0 0%, #ad9eb0 70%, transparent 100%)',
                  }}
                />
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="relative z-10 rounded-full bg-[#cbf6f0]"
                    style={{
                      width: '24%',
                      aspectRatio: '1 / 1',
                      animation: 'dotWaveBounce 1.2s ease-in-out infinite',
                      animationDelay: `${i * 0.22}s`,
                      boxShadow: '0 0 6px rgba(203, 246, 240, 0.85)',
                    }}
                  />
                ))}
              </div>

              {/* NÚT BẤM "CHƠI VỚI MÁY NGAY" (ĐÈ CHÍNH XÁC LÊN VIÊN THUỐC TRONG ẢNH CHOIVOIMAY.PNG) */}
              <button
                type="button"
                onClick={goToCardPicking}
                title="Bấm để vào chọn cây bài ngay"
                aria-label="Chơi với máy ngay"
                className="absolute z-30 cursor-pointer rounded-full outline-none focus:outline-none transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.97] group pointer-events-auto"
                style={{
                  left: '39.75%',
                  top: '63.23%',
                  width: '20.5%',
                  height: '6.94%',
                }}
              >
                <div className="w-full h-full rounded-full border-2 border-transparent group-hover:border-[#cbf6f0]/80 group-hover:bg-[#cbf6f0]/15 group-hover:shadow-[0_0_25px_rgba(203,246,240,0.6)] transition-all flex items-center justify-center cursor-pointer" />
              </button>
            </div>
          </section>
        )}

        {screen === 'card-picking' && (
          <section className="absolute inset-0 z-50 flex items-center justify-center bg-[#151a30] overflow-hidden select-none animate-fadeIn">
            {/* SÂN KHẤU CHỌN BÀI: TRÀN VIỀN 100% TOÀN MÀN HÌNH ĐỒNG BỘ VỚI CHOIVOIMAY VÀ CHOIVOIBAN (KHÔNG CÒN 2 KHOẢNG ĐEN Ở 2 BÊN) */}
            <div
              className="relative flex-none flex items-center justify-center overflow-hidden"
              style={stageStyle}
            >
              {/* ẢNH GIAO DIỆN NỀN GỐC 18.PNG TRÀN VIỀN 100% */}
              <img
                src="/assets/game/18.png"
                alt="Chọn 30 lá bài vào hội"
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />



              {/* === KHU VỰC 1: TIÊU ĐỀ & HUY HIỆU ĐẶT TRONG KHOẢNG TRỐNG BẦU TRỜI === */}
              <div
                className="absolute z-20 flex flex-col justify-start text-left pointer-events-auto"
                style={{
                  left: '7.5%',
                  top: '8.5%',
                  width: '45.0%',
                }}
              >
                <div>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-white/90 backdrop-blur-md border border-[#1b4e4a]/30 text-[#123e3b] font-black text-[10px] sm:text-xs uppercase tracking-[.14em] shadow-sm mb-1.5">
                    🏮 Khai Canh Lập Cây • 5 Xu / Thẻ • 15 Xu / Cây (3 Thẻ)
                  </span>
                </div>
                {/* DÙNG THẺ DIV VỚI FONT-SIZE TRỰC TIẾP (TRÁNH BỊ DÍNH LUẬT CSS H2 TOÀN CỤC CỦA INDEX.CSS) */}
                <div
                  className="font-black text-[#0f3431] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] tracking-tight leading-tight whitespace-nowrap"
                  style={{
                    fontSize: 'clamp(14px, 1.1vw, 19px)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Chọn lá bài • Lập cây bài vào hội
                </div>

                {/* THÔNG BÁO LỖI NẾU CÓ */}
                {pickingError && (
                  <div
                    className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border border-rose-500/80 bg-rose-900/90 text-rose-100 font-bold shadow-md animate-shake max-w-max text-[10px] sm:text-xs"
                  >
                    ⚠️ {pickingError}
                  </div>
                )}
              </div>

              {/* === KHU VỰC 2: 4 TAB PHO BÀI (XÍCH LÊN ĐỐI DIỆN VỚI LOGO CHÒI, TRÊN DÒNG KẺ GẠCH NỐI) === */}
              <div
                className="absolute z-20 flex items-center justify-end gap-1.5 pointer-events-auto"
                style={{
                  left: '16.0%',
                  top: '26.5%',
                  width: '35.0%',
                  height: '5.0%',
                }}
              >
                {[
                  { id: 'all', label: 'Tất cả (30)' },
                  { id: 'van', label: 'Pho Văn' },
                  { id: 'van2', label: 'Pho Vạn' },
                  { id: 'hach', label: 'Pho Hạch' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPhoFilter(tab.id as any)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shadow-sm ${phoFilter === tab.id
                      ? 'bg-[#1b4e4a] text-amber-200 border-[#1b4e4a] shadow'
                      : 'bg-white/80 text-[#1b4e4a] border-white/60 hover:bg-white'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* === KHU VỰC 3: LƯỚI 30 LÁ BÀI (DƯỚI DÒNG KẺ GẠCH NỐI TRONG KHUNG HỒNG, SÁT VÀO LINE) === */}
              <div
                className="absolute z-20 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-teal-600/50 pointer-events-auto"
                style={{
                  left: '7.8%',
                  top: '40.9%',
                  width: '44.0%',
                  height: '45.6%',
                }}
              >
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {filteredCards.map((card) => {
                    const globalIndex = CARDS.findIndex((c) => c.id === card.id)
                    const phoInfo = getCardPho(globalIndex)

                    const isPickedInCurrent = Boolean(
                      draftTrees[activeDraftTreeIndex]?.cards.some((c) => c.id === card.id)
                    )

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
                        className={`relative group flex flex-col rounded-xl p-1 transition-all text-left duration-200 border-2 select-none cursor-pointer ${isPickedInCurrent
                          ? 'bg-amber-400/40 border-amber-500 ring-2 ring-amber-400 scale-[0.97] shadow-lg'
                          : otherTreesWithCard.length > 0
                            ? 'bg-emerald-950/20 border-emerald-500/70 hover:border-amber-400 hover:scale-[1.02] shadow-sm'
                            : 'bg-white/90 border-[#1b4e4a]/20 hover:border-amber-400 hover:bg-white hover:scale-[1.02] shadow-sm'
                          }`}
                      >
                        <div className="overflow-hidden rounded-lg bg-white p-0.5 flex items-center justify-center">
                          <img
                            src={card.image}
                            alt={card.name}
                            className="aspect-[3/4] w-full max-h-[66px] sm:max-h-[74px] rounded-md object-contain pointer-events-none"
                            draggable={false}
                          />
                        </div>

                        <span
                          className="mt-0.5 block text-center font-black text-[#103431] truncate px-0.5"
                          style={{ fontSize: 'clamp(8px, 0.65cqw, 10px)' }}
                        >
                          {card.name}
                        </span>

                        <div className="mt-0.5 flex items-center justify-between px-0.5">
                          <span
                            className={`font-bold px-1 rounded border ${phoInfo.tagClass}`}
                            style={{ fontSize: 'clamp(7px, 0.55cqw, 8px)' }}
                          >
                            {phoInfo.phoName.replace('Pho ', '')}
                          </span>

                          {isPickedInCurrent ? (
                            <span
                              className="font-black px-1 rounded bg-amber-400 text-[#173a3a]"
                              style={{ fontSize: 'clamp(7px, 0.55cqw, 8px)' }}
                            >
                              ✓ Chọn
                            </span>
                          ) : otherTreesWithCard.length > 0 ? (
                            <span
                              className="font-bold px-0.5 rounded bg-emerald-600 text-white"
                              style={{ fontSize: 'clamp(7px, 0.55cqw, 8px)' }}
                            >
                              +{otherTreesWithCard.length}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center font-bold text-[#103431]"
                              style={{ fontSize: 'clamp(7px, 0.55cqw, 8px)' }}
                            >
                              5 Xu
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* === KHU VỰC 4A: NÚT "THÊM CÂY" (GẮN VỪA KHÍT VIÊN THUỐC CÓ SẴN TRÊN NỀN 18.PNG, TỐI ĐA 5 CÂY) === */}
              <button
                type="button"
                onClick={handleAddNewTree}
                disabled={draftTrees.length >= 5}
                className={`absolute z-20 flex items-center justify-center pl-5 rounded-full font-black transition-all border-0 shadow-none outline-none select-none ${draftTrees.length >= 5
                  ? 'opacity-40 cursor-not-allowed text-[#083a3f]/60'
                  : 'text-[#083a3f] hover:text-[#041a1c] cursor-pointer hover:bg-white/15 active:scale-95 group pointer-events-auto'
                  }`}
                style={{
                  left: '73.0%',
                  top: '10.6%',
                  width: '10.9%',
                  height: '4.56%',
                  fontSize: 'clamp(9px, 0.72cqw, 12.5px)',
                }}
                title={draftTrees.length >= 5 ? 'Đã đạt tối đa 5 cây bài' : 'Mua thêm cây mới (Tối đa 5 cây)'}
              >
                <span className="drop-shadow-sm tracking-wide">
                  {draftTrees.length >= 5 ? 'Đủ 5 cây' : 'Thêm cây'}
                </span>
              </button>

              {/* === KHU VỰC 4B: HÀNG TAB CÂY BÀI (HỖ TRỢ 1 ĐẾN TỐI ĐA 5 CÂY BÀI) === */}
              <div
                className={`absolute z-20 flex items-center pointer-events-auto transition-all ${draftTrees.length === 1
                  ? 'overflow-hidden'
                  : 'rounded-full bg-[#073238]/85 backdrop-blur-sm p-1 border border-[#5ae3dd]/40 shadow-md gap-1'
                  }`}
                style={{
                  left: '59.5%',
                  top: '17.94%',
                  width: draftTrees.length === 1 ? '9.4%' : '23.3%',
                  height: '4.56%',
                }}
              >
                {draftTrees.map((tree, idx) => {
                  const isComplete = tree.cards.length === 3
                  const isActive = activeDraftTreeIndex === idx
                  const isSingle = draftTrees.length === 1

                  if (isSingle) {
                    return (
                      <button
                        key={tree.id}
                        type="button"
                        onClick={() => {
                          setActiveDraftTreeIndex(idx)
                          setPickingError('')
                        }}
                        className="w-full h-full flex items-center justify-center gap-1.5 px-2 rounded-full font-black text-[#083a3f] bg-transparent hover:bg-white/10 active:scale-95 transition-all cursor-pointer select-none border-0 shadow-none"
                        style={{ fontSize: 'clamp(9px, 0.72cqw, 12px)' }}
                      >
                        <span className="tracking-tight">{tree.name}</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-[#083a3f]/15 text-[#083a3f] font-bold">
                          {tree.cards.length}/3
                        </span>
                      </button>
                    )
                  }

                  return (
                    <button
                      key={tree.id}
                      type="button"
                      onClick={() => {
                        setActiveDraftTreeIndex(idx)
                        setPickingError('')
                      }}
                      className={`flex-1 h-full min-w-0 flex items-center justify-center gap-1 px-1 rounded-full font-black transition-all cursor-pointer whitespace-nowrap shadow-sm select-none ${isActive
                        ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-[#073238] shadow-md ring-1 ring-amber-100/70 scale-[1.02]'
                        : isComplete
                          ? 'bg-emerald-600/85 hover:bg-emerald-600 text-white'
                          : 'bg-white/20 hover:bg-white/30 text-white/90'
                        }`}
                      style={{ fontSize: 'clamp(8px, 0.65cqw, 11px)' }}
                      title={`Cây Bài #${idx + 1} (${tree.cards.length}/3 thẻ)`}
                    >
                      <span className="truncate">
                        {draftTrees.length <= 3 ? `Cây #${idx + 1}` : `Cây ${idx + 1}`}
                      </span>
                      <span
                        className={`px-1 py-0.2 rounded-full font-bold text-[8.5px] ${isActive
                          ? 'bg-[#073238]/15 text-[#073238]'
                          : 'bg-black/25 text-white'
                          }`}
                      >
                        {tree.cards.length}/3
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* === NÚT "⚡ CHỌN 3 THẺ" (GẮN VỪA KHÍT VÀO KHUNG BUTTON CÓ SẴN TRÊN NỀN 18.PNG) === */}
              <button
                type="button"
                onClick={() => handleAutoPickTree(activeDraftTreeIndex)}
                className="absolute z-30 flex items-center justify-center font-bold text-white hover:text-amber-200 transition cursor-pointer select-none active:scale-95 bg-transparent hover:bg-white/15 rounded-full border-0 shadow-none outline-none pointer-events-auto"
                style={{
                  left: '75.35%',
                  top: '24.98%',
                  width: '6.2%',
                  height: '2.68%',
                  fontSize: 'clamp(8px, 0.62cqw, 10.5px)',
                }}
                title="Chọn nhanh ngẫu nhiên đủ 3 thẻ cho cây này"
              >
                ⚡ Chọn 3 thẻ
              </button>

              {/* === KHU VỰC 5: 3 Ô THẺ BÀI ĐÃ CHỌN (TRÊN HỘP XÁM CỦA BẢNG XANH DƯƠNG) === */}
              {/* Tiêu đề cây bài đang chọn */}
              <div
                className="absolute z-20 flex items-center pointer-events-auto"
                style={{
                  left: '60.5%',
                  top: '25.0%',
                  width: '14.5%',
                  height: '2.68%',
                }}
              >
                <span
                  className="font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] truncate"
                  style={{ fontSize: 'clamp(9.5px, 0.72cqw, 12px)' }}
                >
                  {draftTrees[activeDraftTreeIndex]?.name || 'Cây Bài #1'}
                  <span className="ml-1 font-bold text-amber-200">
                    ({draftTrees[activeDraftTreeIndex]?.cards.length === 3
                      ? 'Đủ 3 thẻ'
                      : `Thiếu ${3 - (draftTrees[activeDraftTreeIndex]?.cards.length || 0)}`})
                  </span>
                </span>

                {draftTrees.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDraftTree(activeDraftTreeIndex)}
                    className="ml-1.5 font-bold px-1.5 py-0.2 rounded bg-rose-800/80 hover:bg-rose-700 text-rose-100 transition cursor-pointer text-[10px]"
                    title="Xóa cây bài này"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Lưới 3 ô thẻ bài */}
              <div
                className="absolute z-20 pointer-events-auto grid grid-cols-3 gap-2 px-1"
                style={{
                  left: '59.8%',
                  top: '28.5%',
                  width: '22.7%',
                  height: '25.0%',
                  gridTemplateRows: '100%',
                }}
              >
                {[0, 1, 2].map((slotIdx) => {
                  const card = draftTrees[activeDraftTreeIndex]?.cards[slotIdx]
                  if (card) {
                    return (
                      <div
                        key={card.id}
                        className="relative h-full w-full min-h-0 min-w-0"
                      >
                        <div className="h-full w-full rounded border-2 border-[#5ae3dd]/60 bg-[#0c404e]/30 overflow-hidden flex items-center justify-center p-0.5 group">
                          <img
                            src={card.image}
                            alt={card.name}
                            className="h-full w-full max-h-full max-w-full object-contain pointer-events-none drop-shadow-sm select-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleCardPick(card)}
                          className="absolute -top-2 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] shadow-lg ring-2 ring-white/90 hover:scale-110 active:scale-95 transition cursor-pointer z-30"
                          title="Gỡ thẻ"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  }
                  return (
                    <div
                      key={`empty-slot-${slotIdx}`}
                      className="h-full w-full min-h-0 min-w-0 flex flex-col items-center justify-center rounded border-2 border-dashed border-[#5ae3dd]/40 bg-[#0c404e]/25 text-center text-teal-100/70 hover:border-[#5ae3dd]/70 transition-all select-none"
                    >
                      <span className="text-sm font-bold text-amber-300 leading-none mb-1">+</span>
                      <span
                        className="font-bold text-teal-100 leading-tight"
                        style={{ fontSize: 'clamp(8px, 0.65cqw, 10px)' }}
                      >
                        Thẻ {slotIdx + 1}
                      </span>
                      <span
                        className="text-teal-300/70"
                        style={{ fontSize: 'clamp(7px, 0.55cqw, 8px)' }}
                      >
                        5 Xu
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* === KHU VỰC 6: TỔNG KẾT CHI PHÍ VÀ SỐ DƯ (TRÊN VIÊN THUỐC TEAL CỦA BẢNG XANH DƯƠNG) === */}
              <div
                className="absolute z-20 flex flex-col justify-between px-3 py-1.5 text-[#063339] font-bold pointer-events-auto"
                style={{
                  left: '59.5%',
                  top: '56.0%',
                  width: '23.3%',
                  height: '9.6%',
                  fontSize: 'clamp(10px, 0.75cqw, 12px)',
                }}
              >
                {/* NỬA TRÊN CỦA VIÊN THUỐC (TRÊN DÒNG KẺ GỐC) */}
                <div className="flex items-center justify-between">
                  <span>Tổng chi phí:</span>
                  <span className="text-[#c44837] font-black flex items-center gap-0.5">
                    <ChoiCoin size={12} /> {totalCostCoins} Xu
                    <span className="text-[10px] text-[#063339]/70 font-normal">
                      ({draftTrees.length} cây • {totalCardsPicked} thẻ • 5 Xu/thẻ)
                    </span>
                  </span>
                </div>

                {/* NỬA DƯỚI CỦA VIÊN THUỐC (DƯỚI DÒNG KẺ GỐC) */}
                <div className="flex items-center justify-between">
                  <span>Số dư sau khi mua:</span>
                  <span className={`flex items-center gap-0.5 font-black ${userCoins < totalCostCoins ? 'text-rose-600' : 'text-emerald-800'
                    }`}>
                    <ChoiCoin size={12} /> {Math.max(0, userCoins - totalCostCoins)} Xu
                  </span>
                </div>

                {(!currentUser || userCoins < totalCostCoins) && (
                  <div className="flex items-center justify-between text-[10px] text-rose-700 font-bold">
                    <span>{!currentUser ? 'Chưa đăng nhập tài khoản' : 'Số dư không đủ!'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) {
                          setAuthModalMode('login')
                          setIsAuthModalOpen(true)
                        } else {
                          setIsTopupModalOpen(true)
                        }
                      }}
                      className="underline text-amber-800 hover:text-amber-900 cursor-pointer"
                    >
                      {!currentUser ? 'Đăng nhập ngay →' : 'Nạp Xu ngay →'}
                    </button>
                  </div>
                )}
              </div>

              {/* === KHU VỰC 7: NÚT MŨI TÊN "VÀO HỘI KHAI CANH" CÓ CHUYỂN ĐỘNG NHỊP NHỊP TƯƠNG TỰ NÚT VÀO HỘI === */}
              <button
                type="button"
                onClick={handleStartGameFromPicking}
                title="Bấm để Vào Hội Khai Canh"
                aria-label="Vào hội khai canh"
                className="absolute z-20 cursor-pointer select-none outline-none focus:outline-none transition-transform active:scale-95 group pointer-events-auto"
                style={{
                  left: '69.8%',
                  top: '65.8%',
                  width: '14.0%',
                  height: '15.6%',
                }}
              >
                <img
                  src="/assets/game/khaihoi.png"
                  alt="Vào Hội Khai Canh"
                  className="w-full h-full object-contain pointer-events-none animate-heartbeat-arrow"
                  draggable={false}
                />
              </button>
            </div>
          </section>
        )}

        {screen === 'friend' && (
          <section className="absolute inset-0 z-10 flex items-center justify-center bg-[#092233] overflow-hidden select-none">
            {/* Lớp nền tràn viền 100% toàn màn hình với choivoiban.png */}
            <div
              className="relative flex-none flex items-center justify-center overflow-hidden"
              style={stageStyle}
            >
              <img
                src="/assets/game/choivoiban.png"
                alt="Mở Hội Cùng Bạn"
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />

              {!roomCode ? (
                <>
                  {/* BÊN TRÁI: NÚT TƯƠNG TÁC "TẠO MÃ HỘI" (KHỚP NÚT MINH HỌA TRONG CHOIVOIBAN.PNG) */}
                  <button
                    type="button"
                    onClick={createRoom}
                    disabled={socketStatus === 'connecting'}
                    title="Bấm để tạo mã hội mới"
                    aria-label="Tạo mã hội"
                    className="absolute z-20 cursor-pointer rounded-full outline-none focus:outline-none transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.97] group disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      left: '41.33%',
                      top: '60.85%',
                      width: '13.75%',
                      height: '7.14%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {socketStatus === 'connecting' ? (
                      <div className="w-full h-full rounded-full bg-[#2c8485] border-2 border-white/80 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-lg animate-pulse">
                        Đang kết nối…
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-full border-2 border-transparent group-hover:border-white/80 group-hover:bg-white/15 group-hover:shadow-[0_0_24px_rgba(255,255,255,0.4)] transition-all" />
                    )}
                  </button>

                  {/* BÊN PHẢI: KHỐI NHẬP MÃ & VÀO HỘI (ĂN KHỚP KHUNG "VÀO HỘI BẰNG MÃ") */}
                  <div
                    className="absolute z-20 flex flex-col items-center justify-center"
                    style={{
                      left: '60.50%',
                      top: '61.2%',
                      width: '14.0%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
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
                      className="w-full h-8 sm:h-10 md:h-12 rounded-xl sm:rounded-2xl border-2 border-[#165a64] bg-[#0b383f]/95 text-white font-black text-center tracking-widest text-xs sm:text-sm md:text-base outline-none placeholder:text-white/40 shadow-inner focus:border-[#20d2c4] focus:shadow-[0_0_15px_rgba(32,210,196,0.5)] transition"
                    />

                    <button
                      type="button"
                      onClick={() => connectRoom('joinRoom')}
                      disabled={!/^CHOI-\d{6}$/.test(joinCode) || socketStatus === 'connecting'}
                      className="mt-2 sm:mt-2.5 w-full h-8 sm:h-10 md:h-12 rounded-xl sm:rounded-2xl font-black text-white text-xs sm:text-sm md:text-base transition-all duration-200 shadow-md transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 bg-gradient-to-r from-[#2c8485] to-[#1c5d64] hover:from-[#359aa0] hover:to-[#226e76] border-2 border-[#41b2bb]/60 cursor-pointer flex items-center justify-center"
                    >
                      {socketStatus === 'connecting' ? 'Đang kết nối…' : 'Vào hội'}
                    </button>
                  </div>
                </>
              ) : (
                /* GIAO DIỆN PHÒNG CHỜ MỚI (LOBBY THEO KHUNGGAME.PNG) */
                <>
                  {/* LỚP ẢNH KHUNG GAME CHUẨN THEO ASSETS/GAME/KHUNGGAME.PNG */}
                  <img
                    src="/assets/game/khunggame.png"
                    alt="Khung Phòng Hội"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-20 animate-fadeIn"
                    draggable={false}
                  />

                  {/* VÙNG NỘI DUNG TƯƠNG TÁC PHÒNG CHỜ NẰM TRỌN TRONG KHUNG VÀNG */}
                  <div
                    className="absolute z-30 flex flex-col justify-between items-center select-none"
                    style={{
                      left: '50.8%',
                      top: '60.85%',
                      width: '36.5%',
                      height: '39.5%',
                      transform: 'translate(-50%, -50%)',
                      padding: '0.6% 1.8%',
                    }}
                  >
                    {/* NÚT RỜI HỘI Ở GÓC PHẢI */}
                    <button
                      type="button"
                      onClick={() => {
                        socketRef.current?.close()
                        socketRef.current = null
                        setSocketStatus('idle')
                        setRoomCode('')
                        setOnlineMode(false)
                        setOnlinePlayers([])
                        setRoomError('')
                      }}
                      title="Rời hội này"
                      className="absolute top-0 right-0 z-40 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-[#005d67] hover:text-rose-700 bg-white/75 hover:bg-white border border-[#005d67]/20 shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      ✕ <span className="hidden sm:inline">Rời hội</span>
                    </button>

                    {/* MÃ HỘI */}
                    <div className="w-full text-center flex flex-col items-center">
                      <p className="text-[9px] sm:text-xs font-black uppercase tracking-[.22em] text-[#005d67] drop-shadow-xs leading-none">
                        Mã hội của bạn
                      </p>
                      <div
                        className="my-0.5 text-lg sm:text-2xl md:text-3xl font-black tracking-[.2em] text-[#e04f26] drop-shadow-[0_1px_3px_rgba(224,79,38,0.2)] select-text leading-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {roomCode}
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyRoomCode()}
                        className="inline-flex items-center gap-1 rounded-full border border-[#005d67]/30 bg-white/85 hover:bg-white px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#005d67] shadow-xs hover:shadow transition transform hover:scale-105 active:scale-95 cursor-pointer leading-none"
                      >
                        {roomCodeCopied ? 'Đã sao chép ✓' : '📋 Sao chép mã'}
                      </button>
                    </div>

                    {/* DANH SÁCH BẠN BÈ (ĐỦ 5 CHÒI) */}
                    <div className="w-full flex-1 flex flex-col justify-start my-1 overflow-hidden min-h-0">
                      <div className="w-full flex items-center justify-between px-1 mb-1 text-[10px] sm:text-xs font-bold text-[#005d67]">
                        <span>Người trong hội</span>
                        <span className="font-semibold bg-[#005d67]/10 text-[#005d67] px-2 py-0.2 rounded-full text-[9px] sm:text-[10px]">
                          {onlinePlayers.length}/5 người
                        </span>
                      </div>
                      <div className="w-full flex-1 space-y-1 overflow-y-auto max-h-[130px] sm:max-h-[155px] pr-0.5">
                        {Array.from({ length: 5 }, (_, i) => onlinePlayers[i] || null).map((player, index) =>
                          player ? (
                            <div
                              key={player.id}
                              className="flex items-center justify-between rounded-md sm:rounded-lg border border-[#005d67]/15 bg-white/95 hover:bg-white px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold shadow-xs transition"
                            >
                              <span className="flex items-center gap-1 text-[#004d56] font-bold truncate">
                                <span className="text-[9px] text-[#005d67]/60 font-semibold">Chòi {index + 1}:</span>
                                {player.name} {player.id === hostId && <span title="Chủ hội">👑</span>}
                              </span>
                              <span
                                className={
                                  player.ready
                                    ? 'inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex-shrink-0'
                                    : 'inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-semibold bg-amber-100/70 text-amber-800/80 border border-amber-200 flex-shrink-0'
                                }
                              >
                                {player.ready ? '✓ Sẵn sàng' : 'Chờ sẵn sàng'}
                              </span>
                            </div>
                          ) : (
                            <div
                              key={`empty-slot-${index}`}
                              className="flex items-center justify-between rounded-md sm:rounded-lg border border-dashed border-[#005d67]/25 bg-white/45 px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs transition"
                            >
                              <span className="flex items-center gap-1 text-[#005d67]/50 italic">
                                <span className="text-[9px] font-semibold text-[#005d67]/40 not-italic">Chòi {index + 1}:</span>
                                Đang chờ bạn vào…
                              </span>
                              <span className="text-[8px] sm:text-[9px] text-[#005d67]/40 px-1.5 py-0.2 rounded-full bg-white/40 border border-dashed border-[#005d67]/20 flex-shrink-0">
                                Còn trống
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* CÁC NÚT ĐIỀU KHIỂN */}
                    <div className="w-full space-y-0.5 sm:space-y-1 pt-0.5">
                      {playerId !== hostId && (
                        <button
                          type="button"
                          onClick={() => {
                            socketRef.current?.send(
                              JSON.stringify({
                                type: 'ready',
                                ready: !onlinePlayers.find((p) => p.id === playerId)?.ready,
                              })
                            )
                          }}
                          className="w-full h-6 sm:h-7 rounded-md sm:rounded-lg font-black text-[10px] sm:text-[11px] transition text-white bg-gradient-to-r from-[#e67e22] to-[#d35400] hover:from-[#f39c12] hover:to-[#e67e22] shadow-xs transform active:scale-98 cursor-pointer flex items-center justify-center"
                        >
                          {onlinePlayers.find((p) => p.id === playerId)?.ready
                            ? 'Hủy sẵn sàng'
                            : 'Tôi đã sẵn sàng ✓'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => void unlockAudio()}
                        className="w-full h-6 sm:h-7 rounded-md sm:rounded-lg font-bold text-[10px] sm:text-xs text-[#005d67] bg-white/85 hover:bg-white border border-[#005d67]/25 hover:border-[#005d67]/60 shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        🔊 Bật âm thanh
                      </button>

                      {playerId === hostId && (
                        <button
                          type="button"
                          onClick={() => {
                            socketRef.current?.send(JSON.stringify({ type: 'startGame' }))
                          }}
                          disabled={
                            onlinePlayers.length < 2 ||
                            onlinePlayers.some((p) => !p.ready)
                          }
                          className="w-full h-6.5 sm:h-7.5 rounded-md sm:rounded-lg font-black text-[10px] sm:text-xs text-white transition disabled:cursor-not-allowed disabled:opacity-50 bg-gradient-to-r from-[#c44837] to-[#a83222] hover:from-[#d65240] hover:to-[#b83827] shadow-xs transform active:scale-98 disabled:hover:scale-100 cursor-pointer flex items-center justify-center"
                        >
                          {onlinePlayers.length < 2
                            ? 'Chờ ít nhất một người bạn…'
                            : onlinePlayers.some((p) => !p.ready)
                              ? 'Chờ mọi người sẵn sàng…'
                              : 'Khai hội ngay 🎊'}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* THÔNG BÁO LỖI NẾU CÓ */}
              {roomError && (
                <div
                  className="absolute z-30 -translate-x-1/2 px-4 py-1.5 rounded-full bg-rose-900/95 border border-rose-400 text-rose-100 text-xs sm:text-sm font-bold shadow-xl animate-shake pointer-events-none"
                  style={{
                    left: '50.0%',
                    top: '78.5%',
                  }}
                >
                  ⚠️ {roomError}
                </div>
              )}
            </div>
          </section>
        )}

        {screen === 'playing' && (() => {
          // Xác định số cây bài người chơi đang giữ (từ 1 đến 5)
          const currentTreeCount = Math.max(1, Math.min(5, playerTrees.length || 1))

          // Ánh xạ ảnh nền: 1 cây (22.png), 2 cây (26.png), 3 cây (25.png), 4 cây (24.png), 5 cây (23.png)
          const playingBackgroundSrc =
            currentTreeCount === 1
              ? '/assets/game/22.png'
              : currentTreeCount === 2
                ? '/assets/game/26.png'
                : currentTreeCount === 3
                  ? '/assets/game/25.png'
                  : currentTreeCount === 4
                    ? '/assets/game/24.png'
                    : '/assets/game/23.png'

          const effectiveTrees: PlayerTree[] =
            playerTrees.length > 0
              ? playerTrees
              : [{ id: 'tree-1', name: 'Cây Bài của bạn', cards: hand, claimedCardIds: claimed }]

          const getPaddleStyle = (treeCount: number, treeIndex: number) => {
            if (treeCount === 1) {
              return {
                left: '50.6%',
                top: '25.0%',
                width: '27.0%',
                height: '48.0%',
              }
            }
            if (treeCount === 2) {
              return {
                left: treeIndex === 0 ? '43.1%' : '63.6%',
                top: '34.0%',
                width: '15.8%',
                height: '19.5%',
              }
            }
            if (treeCount === 3) {
              const lefts = ['39.1%', '53.1%', '66.1%']
              return {
                left: lefts[treeIndex] || '53.1%',
                top: '36.5%',
                width: '10.4%',
                height: '16.2%',
              }
            }
            if (treeCount === 4) {
              if (treeIndex < 3) {
                const lefts = ['39.1%', '52.7%', '66.1%']
                return {
                  left: lefts[treeIndex],
                  top: '21.0%',
                  width: '10.4%',
                  height: '16.2%',
                }
              }
              return {
                left: '52.7%',
                top: '62.6%',
                width: '10.4%',
                height: '16.2%',
              }
            }
            // treeCount === 5
            if (treeIndex < 3) {
              const lefts = ['39.1%', '52.7%', '66.1%']
              return {
                left: lefts[treeIndex],
                top: '21.0%',
                width: '10.4%',
                height: '16.2%',
              }
            }
            const bottomRowLefts = ['46.0%', '60.4%']
            return {
              left: bottomRowLefts[treeIndex - 3] || '46.0%',
              top: '62.6%',
              width: '10.4%',
              height: '16.2%',
            }
          }

          const plankTops = ['20.3%', '29.8%', '39.2%', '48.6%', '58.0%']

          return (
            <section className="absolute inset-0 z-10 flex items-center justify-center bg-[#151a30] overflow-hidden select-none animate-fadeIn">
              {/* SÂN KHẤU TRÒ CHƠI TOÀN MÀN HÌNH THEO TỈ LỆ 2000 x 1009 */}
              <div
                className="relative flex-none flex items-center justify-center overflow-hidden"
                style={stageStyle}
              >
                {/* ẢNH GIAO DIỆN NỀN ĐỘNG (22.PNG ĐẾN 26.PNG) */}
                <img
                  src={playingBackgroundSrc}
                  alt="Bàn chơi Bài Chòi"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  draggable={false}
                />

                {/* THÔNG BÁO TIN NHẮN / TRẠNG THÁI NỔI PHÍA TRÊN */}
                {message && (
                  <div className="absolute top-[3.5%] left-[30.0%] right-[30.0%] z-30 flex items-center justify-center pointer-events-none">
                    <div className="px-4 py-1.5 rounded-full bg-[#07353b]/90 border border-[#5ae3dd]/50 backdrop-blur-md text-[#cbf6f0] font-black text-xs sm:text-sm shadow-xl animate-fadeIn text-center truncate">
                      {message}
                    </div>
                  </div>
                )}

                {/* === KHU VỰC 1: SÂN KHẤU RÚT THẺ CỦA CHỊ HIỆU / ANH HIỆU (BÊN TRÁI) === */}
                <div
                  className="absolute z-20 flex flex-col items-center justify-center pointer-events-auto"
                  style={{
                    left: currentTreeCount === 1 ? '15.4%' : '13.75%',
                    top: '24.8%',
                    width: currentTreeCount === 1 ? '17.55%' : '17.6%',
                    height: '44.5%',
                  }}
                >
                  {/* VÙNG LÁ BÀI RÚT (CANH CHÍNH GIỮA TUYỆT ĐỐI KHUNG SÂN KHẤU VÀ ĐÀI SÁNG) */}
                  {(isCalling || currentCard) ? (
                    <div className="relative flex flex-col items-center justify-center w-full h-full">
                      <div
                        className={`draw-card-wrapper ${isCalling ? 'draw-card-calling' : ''}`}
                        style={{
                          height: '90%',
                          aspectRatio: '510 / 1417',
                        }}
                      >
                        <div className={`draw-card-inner ${currentCard ? 'draw-card-flipped' : ''}`}>
                          {/* MẶT SAU */}
                          <div className="draw-card-face draw-card-back shadow-2xl rounded-xl overflow-hidden ">
                            <img
                              src="/assets/phiasau.png"
                              alt="Mặt sau quân Bài Chòi"
                              className="w-full h-full object-cover"
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
                          <div className="draw-card-face draw-card-front shadow-2xl rounded-xl overflow-hidden border border-amber-300/40">
                            {currentCard && (
                              <img
                                src={currentCard.image}
                                alt={currentCard.name}
                                className="w-full h-full object-contain"
                                draggable={false}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* === KHU VỰC 2: HAI NÚT BẤM DƯỚI SÂN KHẤU (ĂN KHỚP 2 VIÊN THUỐC TRÊN ẢNH NỀN) === */}
                {/* NÚT 1: HÔ BÀI */}
                <button
                  type="button"
                  onClick={drawNext}
                  disabled={
                    Boolean(winner) ||
                    isCalling ||
                    (onlineMode ? playerId !== hostId : drawIndex >= deck.length - 1)
                  }
                  title="Rút quân bài tiếp theo"
                  aria-label="Rút quân bài"
                  className="absolute z-20 flex items-center justify-center font-black transition-all cursor-pointer rounded-full outline-none select-none hover:scale-[1.03] active:scale-[0.97] group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 pointer-events-auto"
                  style={{
                    left: '12.0%',
                    top: currentTreeCount === 1 ? '75.2%' : '77.0%',
                    width: '10.3%',
                    height: '4.8%',
                    fontSize: 'clamp(10px, 0.8cqw, 13.5px)',
                  }}
                >
                  <span className="text-[#093c40] font-black drop-shadow-sm tracking-wide">
                    {isCalling
                      ? 'Đang hô…'
                      : onlineMode && playerId !== hostId
                        ? 'Chờ chủ hội'
                        : drawIndex < 0
                          ? 'Bắt đầu hô'
                          : 'Hô tiếp'}
                  </span>
                </button>

                {/* NÚT 2: GÕ MÕ (CHỮ XANH NHẢY KHI CÓ THỂ GÕ, KHÔNG CÓ KHUNG VIỀN VÀNG) */}
                <button
                  type="button"
                  onClick={claimCard}
                  disabled={isCalling || !currentCard || Boolean(winner)}
                  title="Gõ mõ nhận thẻ trúng cờ"
                  aria-label="Gõ mõ"
                  className="absolute z-20 flex items-center justify-center font-black transition-all cursor-pointer rounded-full outline-none select-none hover:scale-[1.03] active:scale-[0.97] group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 pointer-events-auto"
                  style={{
                    left: '25.8%',
                    top: currentTreeCount === 1 ? '75.2%' : '77.0%',
                    width: '10.2%',
                    height: '4.8%',
                    fontSize: 'clamp(11px, 0.9cqw, 15px)',
                  }}
                >
                  <span className={`font-black drop-shadow-sm tracking-wide ${canClaim && !isCalling ? 'text-[#065f64] animate-bounce font-black inline-block' : 'text-[#093c40]'
                    }`}>
                    GÕ MÕ
                  </span>
                </button>

                {/* === TIÊU ĐỀ & SỐ CỜ TRÊN BẢNG CHÒI (CHO FORM 1 ĐẾN 5 CÂY BÀI) === */}
                {currentTreeCount === 1 && (
                  <>
                    {/* Ô DÀI: TÊN CÂY BÀI */}
                    <div
                      className="absolute z-20 flex items-center justify-center font-black tracking-wider text-[#063f47] text-xs sm:text-sm select-none truncate pointer-events-none"
                      style={{
                        left: '51.2%',
                        top: '16.3%',
                        width: '17.1%',
                        height: '4.3%',
                      }}
                    >
                      {effectiveTrees[0]?.name?.toUpperCase() === 'CÂY BÀI CỦA BẠN' ? 'CÂY BÀI #1' : (effectiveTrees[0]?.name?.toUpperCase() || 'CÂY BÀI #1')}
                    </div>

                    {/* Ô NGẮN: SỐ CỜ TRÚNG (DƯỚI LÁ CỜ VÀNG) */}
                    <div
                      className="absolute z-20 flex items-center justify-center font-black text-[#063f47] text-xs sm:text-sm select-none pointer-events-none"
                      style={{
                        left: '72.6%',
                        top: '16.2%',
                        width: '5.3%',
                        height: '4.3%',
                      }}
                    >
                      {effectiveTrees[0]?.claimedCardIds?.length || 0}/3
                    </div>
                  </>
                )}

                {/* FORM 2 CÂY (ẢNH 26.PNG) */}
                {currentTreeCount === 2 && (
                  <>
                    {[
                      {
                        titleLeft: '44.1%',
                        titleTop: '29.9%',
                        titleWidth: '8.55%',
                        titleHeight: '2.2%',
                        flagLeft: '54.5%',
                        flagTop: '26.4%',
                        flagWidth: '1.6%',
                        flagHeight: '3.4%',
                        pillLeft: '54.0%',
                        pillTop: '29.9%',
                        pillWidth: '3.6%',
                        pillHeight: '2.2%',
                      },
                      {
                        titleLeft: '64.7%',
                        titleTop: '29.9%',
                        titleWidth: '8.5%',
                        titleHeight: '2.2%',
                        flagLeft: '75.1%',
                        flagTop: '26.4%',
                        flagWidth: '1.6%',
                        flagHeight: '3.4%',
                        pillLeft: '74.6%',
                        pillTop: '29.9%',
                        pillWidth: '3.6%',
                        pillHeight: '2.2%',
                      },
                    ].map((cfg, idx) => (
                      <Fragment key={`h2-${idx}`}>
                        {/* VIÊN THUỐC DÀI BÊN TRÁI: TÊN CÂY BÀI */}
                        <div
                          className="absolute z-20 flex items-center justify-center font-black tracking-wider text-[#063f47] text-[10px] sm:text-xs select-none truncate pointer-events-none"
                          style={{
                            left: cfg.titleLeft,
                            top: cfg.titleTop,
                            width: cfg.titleWidth,
                            height: cfg.titleHeight,
                          }}
                        >
                          {effectiveTrees[idx]?.name?.toUpperCase()?.replace('CỦA BẠN', '#1') || `CÂY BÀI #${idx + 1}`}
                        </div>

                        {/* LÁ CỜ VÀNG CẮM BÊN TRÊN VIÊN THUỐC NGẮN */}
                        <div
                          className="absolute z-20 pointer-events-none select-none"
                          style={{
                            left: cfg.flagLeft,
                            top: cfg.flagTop,
                            width: cfg.flagWidth,
                            height: cfg.flagHeight,
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm overflow-visible" fill="none">
                            <line x1="4" y1="2" x2="4" y2="23" stroke="#2d5e68" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M4.5 3 C10 1.8 15 5.2 22 3.8 C18.5 8.5 14 10.5 4.5 12 Z" fill="#feee7c" stroke="#eed14d" strokeWidth="0.8" strokeLinejoin="round" />
                          </svg>
                        </div>

                        {/* VIÊN THUỐC NGẮN BÊN PHẢI: SỐ CỜ 0/3 */}
                        <div
                          className="absolute z-20 flex items-center justify-center rounded-full bg-[#8cc9dd] border border-[#6ab4cc]/40 font-black text-[#063f47] text-[10px] sm:text-xs select-none pointer-events-none shadow-sm"
                          style={{
                            left: cfg.pillLeft,
                            top: cfg.pillTop,
                            width: cfg.pillWidth,
                            height: cfg.pillHeight,
                          }}
                        >
                          {effectiveTrees[idx]?.claimedCardIds?.length || 0}/3
                        </div>
                      </Fragment>
                    ))}
                  </>
                )}

                {/* FORM 3 CÂY (ẢNH 25.PNG) */}
                {currentTreeCount === 3 && (
                  <>
                    {[
                      {
                        titleLeft: '39.15%',
                        titleTop: '32.89%',
                        titleWidth: '5.8%',
                        titleHeight: '2.28%',
                        flagLeft: '46.8%',
                        flagTop: '28.8%',
                        flagWidth: '1.4%',
                        flagHeight: '3.3%',
                        pillLeft: '46.4%',
                        pillTop: '32.14%',
                        pillWidth: '2.7%',
                        pillHeight: '2.28%',
                      },
                      {
                        titleLeft: '53.25%',
                        titleTop: '33.34%',
                        titleWidth: '5.8%',
                        titleHeight: '2.28%',
                        flagLeft: '60.5%',
                        flagTop: '29.4%',
                        flagWidth: '1.4%',
                        flagHeight: '3.3%',
                        pillLeft: '60.1%',
                        pillTop: '32.74%',
                        pillWidth: '2.7%',
                        pillHeight: '2.28%',
                      },
                      {
                        titleLeft: '66.1%',
                        titleTop: '33.45%',
                        titleWidth: '6.8%',
                        titleHeight: '2.28%',
                        flagLeft: '73.8%',
                        flagTop: '29.4%',
                        flagWidth: '1.4%',
                        flagHeight: '3.3%',
                        pillLeft: '73.4%',
                        pillTop: '32.74%',
                        pillWidth: '2.7%',
                        pillHeight: '2.28%',
                      },
                    ].map((cfg, idx) => (
                      <Fragment key={`h3-${idx}`}>
                        <div
                          className="absolute z-20 flex items-center justify-center font-black tracking-wider text-[#063f47] text-[8.5px] sm:text-[10px] select-none truncate pointer-events-none"
                          style={{
                            left: cfg.titleLeft,
                            top: cfg.titleTop,
                            width: cfg.titleWidth,
                            height: cfg.titleHeight,
                          }}
                        >
                          {effectiveTrees[idx]?.name?.toUpperCase()?.replace('CỦA BẠN', '#1') || `CÂY BÀI #${idx + 1}`}
                        </div>

                        <div
                          className="absolute z-20 pointer-events-none select-none"
                          style={{
                            left: cfg.flagLeft,
                            top: cfg.flagTop,
                            width: cfg.flagWidth,
                            height: cfg.flagHeight,
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm overflow-visible" fill="none">
                            <line x1="4" y1="2" x2="4" y2="23" stroke="#2d5e68" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M4.5 3 C10 1.8 15 5.2 22 3.8 C18.5 8.5 14 10.5 4.5 12 Z" fill="#feee7c" stroke="#eed14d" strokeWidth="0.8" strokeLinejoin="round" />
                          </svg>
                        </div>

                        <div
                          className="absolute z-20 flex items-center justify-center rounded-full bg-[#8cc9dd] border border-[#6ab4cc]/40 font-black text-[#063f47] text-[8.5px] sm:text-[10px] select-none pointer-events-none shadow-sm"
                          style={{
                            left: cfg.pillLeft,
                            top: cfg.pillTop,
                            width: cfg.pillWidth,
                            height: cfg.pillHeight,
                          }}
                        >
                          {effectiveTrees[idx]?.claimedCardIds?.length || 0}/3
                        </div>
                      </Fragment>
                    ))}
                  </>
                )}

                {/* FORM 4 CÂY (ẢNH 24.PNG) */}
                {currentTreeCount === 4 && (
                  <>
                    {[
                      {
                        titleLeft: '39.9%',
                        titleTop: '18.2%',
                        titleWidth: '5.5%',
                        titleHeight: '2.0%',
                        flagLeft: '46.4%',
                        flagTop: '15.3%',
                        flagWidth: '1.4%',
                        flagHeight: '2.8%',
                        pillLeft: '46.1%',
                        pillTop: '18.2%',
                        pillWidth: '2.6%',
                        pillHeight: '2.0%',
                      },
                      {
                        titleLeft: '53.35%',
                        titleTop: '18.2%',
                        titleWidth: '5.5%',
                        titleHeight: '2.0%',
                        flagLeft: '59.8%',
                        flagTop: '15.3%',
                        flagWidth: '1.4%',
                        flagHeight: '2.8%',
                        pillLeft: '59.5%',
                        pillTop: '18.2%',
                        pillWidth: '2.6%',
                        pillHeight: '2.0%',
                      },
                      {
                        titleLeft: '66.85%',
                        titleTop: '18.2%',
                        titleWidth: '5.5%',
                        titleHeight: '2.0%',
                        flagLeft: '73.3%',
                        flagTop: '15.3%',
                        flagWidth: '1.4%',
                        flagHeight: '2.8%',
                        pillLeft: '73.0%',
                        pillTop: '18.2%',
                        pillWidth: '2.6%',
                        pillHeight: '2.0%',
                      },
                      {
                        titleLeft: '53.3%',
                        titleTop: '59.8%',
                        titleWidth: '5.5%',
                        titleHeight: '2.0%',
                        flagLeft: '59.8%',
                        flagTop: '56.9%',
                        flagWidth: '1.4%',
                        flagHeight: '2.8%',
                        pillLeft: '59.5%',
                        pillTop: '59.8%',
                        pillWidth: '2.6%',
                        pillHeight: '2.0%',
                      },
                    ].map((cfg, idx) => (
                      <Fragment key={`h4-${idx}`}>
                        <div
                          className="absolute z-20 flex items-center justify-center font-black tracking-wider text-[#063f47] text-[8.5px] sm:text-[10px] select-none truncate pointer-events-none"
                          style={{
                            left: cfg.titleLeft,
                            top: cfg.titleTop,
                            width: cfg.titleWidth,
                            height: cfg.titleHeight,
                          }}
                        >
                          {effectiveTrees[idx]?.name?.toUpperCase()?.replace('CỦA BẠN', '#1') || `CÂY BÀI #${idx + 1}`}
                        </div>

                        <div
                          className="absolute z-20 pointer-events-none select-none"
                          style={{
                            left: cfg.flagLeft,
                            top: cfg.flagTop,
                            width: cfg.flagWidth,
                            height: cfg.flagHeight,
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm overflow-visible" fill="none">
                            <line x1="4" y1="2" x2="4" y2="23" stroke="#2d5e68" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M4.5 3 C10 1.8 15 5.2 22 3.8 C18.5 8.5 14 10.5 4.5 12 Z" fill="#feee7c" stroke="#eed14d" strokeWidth="0.8" strokeLinejoin="round" />
                          </svg>
                        </div>

                        <div
                          className="absolute z-20 flex items-center justify-center rounded-full bg-[#8cc9dd] border border-[#6ab4cc]/40 font-black text-[#063f47] text-[8.5px] sm:text-[10px] select-none pointer-events-none shadow-sm"
                          style={{
                            left: cfg.pillLeft,
                            top: cfg.pillTop,
                            width: cfg.pillWidth,
                            height: cfg.pillHeight,
                          }}
                        >
                          {effectiveTrees[idx]?.claimedCardIds?.length || 0}/3
                        </div>
                      </Fragment>
                    ))}
                  </>
                )}

                {/* FORM 5 CÂY (ẢNH 23.PNG) */}
                {currentTreeCount === 5 && (
                  <>
                    {[
                      {
                        titleLeft: '39.9%',
                        titleTop: '18.2%',
                        titleWidth: '5.5%',
                        titleHeight: '2.0%',
                        flagLeft: '46.4%',
                        flagTop: '15.3%',
                        flagWidth: '1.4%',
                        flagHeight: '2.8%',
                        pillLeft: '46.1%',
                        pillTop: '18.2%',
                        pillWidth: '2.6%',
                        pillHeight: '2.0%',
                      },
                      {
                        titleLeft: '53.35%',
                        titleTop: '18.2%',
                        titleWidth: '5.5%',
                        titleHeight: '2.0%',
                        flagLeft: '59.8%',
                        flagTop: '15.3%',
                        flagWidth: '1.4%',
                        flagHeight: '2.8%',
                        pillLeft: '59.5%',
                        pillTop: '18.2%',
                        pillWidth: '2.6%',
                        pillHeight: '2.0%',
                      },
                      {
                        titleLeft: '66.85%',
                        titleTop: '18.2%',
                        titleWidth: '5.5%',
                        titleHeight: '2.0%',
                        flagLeft: '73.3%',
                        flagTop: '15.3%',
                        flagWidth: '1.4%',
                        flagHeight: '2.8%',
                        pillLeft: '73.0%',
                        pillTop: '18.2%',
                        pillWidth: '2.6%',
                        pillHeight: '2.0%',
                      },
                      {
                        titleLeft: '46.65%',
                        titleTop: '59.4%',
                        titleWidth: '5.5%',
                        titleHeight: '2.0%',
                        flagLeft: '53.1%',
                        flagTop: '56.9%',
                        flagWidth: '1.4%',
                        flagHeight: '2.8%',
                        pillLeft: '52.8%',
                        pillTop: '59.8%',
                        pillWidth: '2.6%',
                        pillHeight: '2.0%',
                      },
                      {
                        titleLeft: '61.0%',
                        titleTop: '59.4%',
                        titleWidth: '5.5%',
                        titleHeight: '2.0%',
                        flagLeft: '67.5%',
                        flagTop: '56.9%',
                        flagWidth: '1.4%',
                        flagHeight: '2.8%',
                        pillLeft: '67.2%',
                        pillTop: '59.8%',
                        pillWidth: '2.6%',
                        pillHeight: '2.0%',
                      },
                    ].map((cfg, idx) => (
                      <Fragment key={`h5-${idx}`}>
                        <div
                          className="absolute z-20 flex items-center justify-center font-black tracking-wider text-[#063f47] text-[8.5px] sm:text-[10px] select-none truncate pointer-events-none"
                          style={{
                            left: cfg.titleLeft,
                            top: cfg.titleTop,
                            width: cfg.titleWidth,
                            height: cfg.titleHeight,
                          }}
                        >
                          {effectiveTrees[idx]?.name?.toUpperCase()?.replace('CỦA BẠN', '#1') || `CÂY BÀI #${idx + 1}`}
                        </div>

                        <div
                          className="absolute z-20 pointer-events-none select-none"
                          style={{
                            left: cfg.flagLeft,
                            top: cfg.flagTop,
                            width: cfg.flagWidth,
                            height: cfg.flagHeight,
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-sm overflow-visible" fill="none">
                            <line x1="4" y1="2" x2="4" y2="23" stroke="#2d5e68" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M4.5 3 C10 1.8 15 5.2 22 3.8 C18.5 8.5 14 10.5 4.5 12 Z" fill="#feee7c" stroke="#eed14d" strokeWidth="0.8" strokeLinejoin="round" />
                          </svg>
                        </div>

                        <div
                          className="absolute z-20 flex items-center justify-center rounded-full bg-[#8cc9dd] border border-[#6ab4cc]/40 font-black text-[#063f47] text-[8.5px] sm:text-[10px] select-none pointer-events-none shadow-sm"
                          style={{
                            left: cfg.pillLeft,
                            top: cfg.pillTop,
                            width: cfg.pillWidth,
                            height: cfg.pillHeight,
                          }}
                        >
                          {effectiveTrees[idx]?.claimedCardIds?.length || 0}/3
                        </div>
                      </Fragment>
                    ))}
                  </>
                )}

                {/* === KHU VỰC 3: CÁC BẢNG CHÒI CỦA NGƯỜI CHƠI (CHỈ HIỆN LÁ BÀI, KHÔNG HIỆN CHỮ) === */}
                {effectiveTrees.slice(0, currentTreeCount).map((tree, idx) => {
                  const paddleStyle = getPaddleStyle(currentTreeCount, idx)

                  return (
                    <div
                      key={tree.id || idx}
                      className="absolute z-20 pointer-events-auto select-none"
                      style={paddleStyle}
                    >
                      {/* VÙNG 3 LÁ BÀI BÊN TRONG BẢNG CHÒI - DÀN HÀNG ĐỀU NHAU TUYỆT ĐỐI */}
                      <div className={`w-full h-full flex items-center justify-center p-0.5 ${currentTreeCount === 1
                        ? 'gap-2 sm:gap-3.5'
                        : currentTreeCount === 2
                          ? 'gap-1.5 sm:gap-2'
                          : 'gap-0.5 sm:gap-1'
                        }`}>
                        {tree.cards.map((card) => {
                          const isClaimed = tree.claimedCardIds.includes(card.id)
                          const isHit = !isCalling && currentCard?.id === card.id && !isClaimed

                          return (
                            <button
                              key={card.id}
                              type="button"
                              onClick={isHit ? claimCard : undefined}
                              title={card.name}
                              className={`relative flex items-center justify-center h-full aspect-[510/1417] p-0.5 rounded-lg transition-all duration-200 outline-none select-none cursor-pointer ${isHit
                                ? 'bg-amber-400/40 ring-2 ring-amber-300 animate-pulse scale-105 shadow-xl'
                                : isClaimed
                                  ? 'opacity-85 ring-2 ring-amber-400/90 shadow-md'
                                  : 'hover:scale-102 hover:brightness-105'
                                }`}
                            >
                              <div className="w-full h-full flex items-center justify-center overflow-hidden rounded">
                                <img
                                  src={card.image}
                                  alt={card.name}
                                  className="h-full w-full object-cover pointer-events-none drop-shadow"
                                  draggable={false}
                                />
                              </div>
                              {isClaimed && (
                                <span className="absolute top-0.5 right-0.5 text-xs drop-shadow pointer-events-none select-none">
                                  🚩
                                </span>
                              )}
                              {isHit && (
                                <span className="absolute -top-1 -right-1 text-xs animate-ping font-black text-amber-300 pointer-events-none">
                                  ✦
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* === KHU VỰC 4: DANH SÁCH NGƯỜI THAM GIA (5 TẤM BẢNG GỖ BÊN PHẢI) === */}
                {players.slice(0, 5).map((player, index) => {
                  const isMe = onlineMode ? onlinePlayers[index]?.id === playerId : index === 0
                  const flags = onlineMode
                    ? onlinePlayers[index]?.flags || 0
                    : index === 0
                      ? (playerTrees.length > 0 ? Math.max(0, ...playerTrees.map((t) => t.claimedCardIds.length)) : claimed.length)
                      : botFlags[index - 1] || 0

                  return (
                    <div
                      key={`${player}-${index}`}
                      className="absolute z-20 flex items-center justify-between px-3.5 rounded-xl pointer-events-auto transition-all select-none"
                      style={{
                        left: '84.0%',
                        top: plankTops[index],
                        width: '13.4%',
                        height: '8.9%',
                      }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm sm:text-base">
                          {onlineMode ? '☺' : index === 0 ? '☺' : '⚙'}
                        </span>
                        <span className="truncate font-black text-white text-[10px] sm:text-xs">
                          {player} {isMe ? '(Bạn)' : ''}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-black text-[#ffda86] shrink-0 bg-black/40 px-2 py-0.5 rounded-full border border-amber-400/30">
                        ⚑ {flags}/3
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })()}

        {screen === 'result' && (() => {
          const isWinnerMe = winner === playerName
          const winningTree = playerTrees.find((t) => t.claimedCardIds.length >= 3) || playerTrees[0]

          // Lấy 3 lá bài chiến thắng để vinh danh
          const winningBotIndex = BOT_NAMES.indexOf(winner)
          const winningCards = isWinnerMe
            ? (winningTree?.cards?.length === 3 ? winningTree.cards : hand.slice(0, 3))
            : (winningBotIndex >= 0 && botHands[winningBotIndex]?.length === 3
                ? botHands[winningBotIndex]
                : [])

          return (
            <section className="absolute inset-0 z-50 flex items-center justify-center bg-[#031d22] overflow-hidden select-none animate-fadeIn">
              {/* Lớp nền lan tỏa màu lễ hội truyền thống */}
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, #0c4d56 0%, #031d22 75%, #010f12 100%)',
                }}
              />

              {/* Sân khấu video Hô Tới: Tràn viền chuẩn tỷ lệ 1304x658 của video hotoi.mp4 */}
              <div
                className="relative flex-none flex items-center justify-center overflow-hidden"
                style={resultStageStyle}
              >
                {/* Video nền lễ hội Hô Tới sôi động */}
                <video
                  src="/assets/game/hotoi.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover pointer-events-none select-none"
                />

                {/* KHU VỰC NỘI DUNG NẰM GỌN TRONG KHUÔN CHÒI XANH (ĐỒNG NHẤT GIỮA ĐIỆN THOẠI & LAPTOP) */}
                <div
                  className="absolute z-20 flex flex-col items-center justify-between pointer-events-auto text-center"
                  style={{
                    left: '50.0%',
                    top: '25.0%',
                    transform: 'translateX(-50%)',
                    width: '18.2%',
                    height: '61.5%',
                  }}
                >
                  {/* 1. HUY HIỆU ĐỈNH NÓC ĐÌNH CHÒI */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400/25 via-amber-300/35 to-amber-400/25 border border-amber-300/60 shadow-xs px-2 py-0.5 text-amber-200 font-extrabold text-[7.5px] sm:text-[8.5px] md:text-[9.5px] uppercase tracking-wider">
                      <span className="text-[8px]">🏮</span>
                      <span>KẾT THÚC VÁN ĐẤU</span>
                      <span className="text-[8px]">🏮</span>
                    </div>
                  </div>

                  {/* 2. TIÊU ĐỀ HÔ TỚI & LỜI CHÚC MỪNG */}
                  <div className="shrink-0 text-center my-0.5 px-0.5">
                    <h2
                      className="text-xs sm:text-sm md:text-base lg:text-lg font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fffbe0] via-[#ffd54f] to-[#f59e0b] drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] leading-tight tracking-normal"
                      style={{
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {isWinnerMe ? 'BẠN ĐÃ HÔ TỚI!' : `${winner.toUpperCase()} ĐÃ TỚI!`}
                    </h2>
                    <p className="text-[7px] sm:text-[8px] md:text-[9.5px] text-teal-100/90 font-medium leading-tight mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] px-0.5">
                      {isWinnerMe
                        ? `Chúc mừng ${playerName} đã rinh trọn ba cờ chiến thắng!`
                        : `Ván đấu đã khép lại, chúc ${playerName} may mắn ở hội sau!`}
                    </p>
                  </div>

                  {/* 3. BỘ 3 LÁ BÀI CHIẾN THẮNG */}
                  {winningCards.length === 3 && (
                    <div className="w-full flex flex-col items-center shrink-0 my-0.5">
                      <div className="text-[6.5px] sm:text-[7.5px] md:text-[8.5px] text-amber-300 font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 drop-shadow-sm">
                        <span>⚑</span>
                        <span>
                          {isWinnerMe
                            ? `${winningTree?.name?.toUpperCase() || 'CÂY BÀI #1'} • ĐỦ 3/3 CỜ`
                            : `CÂY BÀI CỦA ${winner.toUpperCase()}`}
                        </span>
                        <span>⚑</span>
                      </div>

                      <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full">
                        {winningCards.map((card) => (
                          <div
                            key={card.id}
                            className="w-7 sm:w-8 md:w-9 relative flex flex-col items-center group"
                          >
                            <div className="w-full aspect-[510/1417] rounded overflow-hidden border border-amber-300/80 bg-amber-100/10 shadow-xs p-0.5">
                              <img
                                src={card.image}
                                alt={card.name}
                                className="w-full h-full object-cover rounded-xs pointer-events-none"
                                draggable={false}
                              />
                            </div>
                            <span className="mt-0.5 text-[6px] sm:text-[7px] md:text-[8px] font-bold text-white/90 truncate max-w-full drop-shadow">
                              {card.name}
                            </span>
                            <span className="absolute -top-1 -right-0.5 text-[7px] sm:text-[8px] filter drop-shadow">
                              🚩
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. VIÊN THUỐC THƯỞNG XU / TRẠNG THÁI */}
                  {isWinnerMe ? (
                    <div className="shrink-0 w-full px-1.5 py-0.5 sm:py-1 rounded-full border border-amber-300/40 bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 backdrop-blur-sm flex items-center justify-center gap-1 shadow-xs text-center">
                      <ChoiCoin size={11} glow animate />
                      <span className="text-[7px] sm:text-[8px] md:text-[9.5px] font-bold text-[#ffda86] drop-shadow-sm leading-none">
                        Thưởng: <strong className="text-white font-black">+15 Xu</strong>{' '}
                        {currentUser ? `(Dư: ${userCoins})` : ''}
                      </span>
                      {!currentUser && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthModalMode('login')
                            setIsAuthModalOpen(true)
                          }}
                          className="font-bold underline hover:text-white cursor-pointer ml-1 text-amber-300 text-[6.5px] sm:text-[7.5px]"
                        >
                          Nhận xu
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="shrink-0 px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-[7px] sm:text-[8px] md:text-[9px] text-teal-100/80 font-medium text-center">
                      Hội vui có lúc, chúc bạn may mắn ván sau!
                    </div>
                  )}

                  {/* 5. HAI NÚT HÀNH ĐỘNG DƯỚI ĐÁY */}
                  <div className="shrink-0 w-full grid grid-cols-2 gap-1 sm:gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        stopAudio()
                        onlineMode ? backToMode() : goToCardPicking()
                      }}
                      className="w-full py-1 sm:py-1.5 px-1 rounded-xl bg-gradient-to-r from-[#d93829] via-[#c44837] to-[#a82a1d] hover:brightness-110 active:scale-95 text-white font-black text-[7.5px] sm:text-[8.5px] md:text-[10px] tracking-normal border border-amber-300/60 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 select-none"
                    >
                      <span className="text-[8px] sm:text-[9px]">↺</span>
                      <span>{onlineMode ? 'Về phòng hội' : 'Chơi ván nữa'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={backToMode}
                      className="w-full py-1 sm:py-1.5 px-1 rounded-xl bg-[#0c404e]/85 hover:bg-[#0c404e] active:scale-95 text-white font-bold text-[7.5px] sm:text-[8.5px] md:text-[10px] tracking-normal border border-white/30 hover:border-white/50 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1 select-none"
                    >
                      <span className="text-[8px] sm:text-[9px]">⌂</span>
                      <span>Về sảnh hội</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )
        })()}
      </main>

      {/* MODAL NẠP XU (ĐỒNG BỘ SUPABASE DATABASE) */}
      <CoinTopupModal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode === 'register' ? 'register' : 'login')
          setIsAuthModalOpen(true)
        }}
        onSuccess={(newCoins) => {
          setUserCoins(newCoins)
          const updated = authService.getCurrentUser()
          setCurrentUser(updated)
        }}
      />

      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ BẰNG EMAIL / SỐ ĐIỆN THOẠI */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user)
          setUserCoins(user.coins ?? 0)
          setIsAuthModalOpen(false)
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
    </div>
  )
}
