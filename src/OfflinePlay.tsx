import { useState, useRef, useEffect, useMemo } from 'react'
import { CARDS, type Card } from './BaiChoiGame'
import { getChantLyrics } from './chantLyrics'
import type { UserProfile } from './types/auth'

interface OfflinePlayProps {
  c?: any
  lang: 'VIE' | 'ENG'
  initialTab?: 'caller' | 'browse'
  onOpenGameOffline?: () => void
  currentUser?: UserProfile | null
  onOpenCoins?: () => void
  onOpenAuth?: (mode?: 'login' | 'register') => void
  onLogout?: () => void
  onGoToShop?: () => void
  onBackToSite?: () => void
}

export default function OfflinePlay({
  lang,
  currentUser,
  onOpenCoins,
  onOpenAuth,
  onLogout,
  onGoToShop,
  onBackToSite,
}: OfflinePlayProps) {
  const isVie = lang === 'VIE'

  // Trạng thái rút thẻ offline
  const [drawnCards, setDrawnCards] = useState<Card[]>([])
  const [currentCard, setCurrentCard] = useState<Card | null>(null)
  const [isCalling, setIsCalling] = useState(false)
  const [lyricIndex, setLyricIndex] = useState(0)

  // Drawer xem lịch sử thẻ đã rút
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [celebrateWon, setCelebrateWon] = useState(false)

  // Hiệu ứng trình diễn thẻ bài xoay 360 độ và bay vào lịch sử
  const [showcaseCard, setShowcaseCard] = useState<Card | null>(null)
  const [showcasePhase, setShowcasePhase] = useState<'idle' | 'entering' | 'spinning' | 'flying'>('idle')
  const [historyPulse, setHistoryPulse] = useState(false)
  const showcaseTimersRef = useRef<number[]>([])

  // User menu state cho desktop canvas
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const clapperAudioRef = useRef<HTMLAudioElement | null>(null)
  const lyricTimerRef = useRef<number | null>(null)

  // Danh sách các thẻ chưa rút
  const remainingCards = useMemo(() => {
    const drawnIds = new Set(drawnCards.map((c) => c.id))
    return CARDS.filter((c) => !drawnIds.has(c.id))
  }, [drawnCards])

  // Lời câu hò hiện tại
  const currentLyrics = useMemo(() => {
    if (!currentCard) return []
    return getChantLyrics(currentCard.id)
  }, [currentCard])

  // Dừng âm thanh
  const stopAudio = () => {
    if (lyricTimerRef.current) {
      window.clearInterval(lyricTimerRef.current)
      lyricTimerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsCalling(false)
  }

  // Phát câu hò một quân bài
  const playCardChant = (card: Card) => {
    stopAudio()
    setCurrentCard(card)
    setIsCalling(true)
    setLyricIndex(0)

    const soundSrc = card.soundOffline || card.sound
    const audio = audioRef.current || new Audio()
    audio.src = soundSrc
    audio.volume = 1
    audio.currentTime = 0
    audioRef.current = audio

    lyricTimerRef.current = window.setInterval(() => {
      setLyricIndex((prev) => (prev < 3 ? prev + 1 : prev))
    }, 6500)

    audio.onended = () => {
      setIsCalling(false)
      if (lyricTimerRef.current) {
        window.clearInterval(lyricTimerRef.current)
        lyricTimerRef.current = null
      }
    }

    audio.onerror = () => {
      console.warn('Lỗi tải âm thanh:', soundSrc)
      setIsCalling(false)
    }

    void audio.play().catch(() => {
      setIsCalling(false)
    })
  }

  const clearShowcaseTimers = () => {
    showcaseTimersRef.current.forEach((t) => window.clearTimeout(t))
    showcaseTimersRef.current = []
  }

  // Bỏ qua hoặc kết thúc nhanh hoạt cảnh trình diễn
  const handleSkipShowcase = () => {
    clearShowcaseTimers()
    if (showcasePhase === 'entering' || showcasePhase === 'spinning') {
      setShowcasePhase('flying')
      const t1 = window.setTimeout(() => {
        setShowcasePhase('idle')
        setShowcaseCard(null)
        setHistoryPulse(true)
        const t2 = window.setTimeout(() => setHistoryPulse(false), 700)
        showcaseTimersRef.current.push(t2)
      }, 350)
      showcaseTimersRef.current.push(t1)
    } else {
      setShowcasePhase('idle')
      setShowcaseCard(null)
    }
  }

  // Lắc ống và rút thẻ ngẫu nhiên
  const handleDrawRandom = () => {
    if (remainingCards.length === 0) {
      alert(
        isVie
          ? 'Đã rút hết toàn bộ 30 thẻ bài trong ván! Hãy bấm "Ván mới" để bắt đầu lại hội chơi.'
          : 'All 30 cards drawn! Click "New Round" to reset.',
      )
      return
    }

    if (showcasePhase !== 'idle') return

    handlePlayMo() // gõ tiếng lộc cộc nhẹ khi lắc ống

    const randomIndex = Math.floor(Math.random() * remainingCards.length)
    const drawn = remainingCards[randomIndex]

    // 1. Giữ nguyên hiển thị ở ống bài hiệu truyền thống ngay lập tức
    setDrawnCards((prev) => [drawn, ...prev])
    playCardChant(drawn)

    // 2. Kích hoạt chuỗi hiệu ứng trình diễn trung tâm
    clearShowcaseTimers()
    setShowcaseCard(drawn)
    setShowcasePhase('entering')

    // Bước 1: 50ms chuyển sang xoay 360 độ (spinning) và làm tối nền
    const t1 = window.setTimeout(() => {
      setShowcasePhase('spinning')
    }, 50)
    showcaseTimersRef.current.push(t1)

    // Bước 2: Sau khi xoay xong 360 độ và người chơi xem rõ thẻ (1950ms), bay vào lịch sử
    const t2 = window.setTimeout(() => {
      setShowcasePhase('flying')
    }, 1950)
    showcaseTimersRef.current.push(t2)

    // Bước 3: Hoàn thành bay, kích hoạt hiệu ứng chớp sáng ở thanh lịch sử
    const t3 = window.setTimeout(() => {
      setShowcasePhase('idle')
      setShowcaseCard(null)
      setHistoryPulse(true)
      const t4 = window.setTimeout(() => {
        setHistoryPulse(false)
      }, 750)
      showcaseTimersRef.current.push(t4)
    }, 2550)
    showcaseTimersRef.current.push(t3)
  }

  // Bắt đầu ván mới
  const handleResetRound = () => {
    clearShowcaseTimers()
    setShowcasePhase('idle')
    setShowcaseCard(null)
    setHistoryPulse(false)
    stopAudio()
    setDrawnCards([])
    setCurrentCard(null)
    setCelebrateWon(false)
  }

  // Phát tiếng Gõ Mõ (Âm thanh thực tế Do-Mo.mp3)
  const handlePlayMo = () => {
    try {
      const audio = clapperAudioRef.current || new Audio('/sound-offline/Do-Mo.mp3')
      audio.currentTime = 0
      audio.volume = 1
      clapperAudioRef.current = audio
      void audio.play().catch(() => {
        // Fallback AudioContext
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(420, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.8, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
      })
    } catch {}
  }

  // Hô Tới Rồi (Báo thắng cuộc)
  const handleToiGoi = () => {
    stopAudio()
    setCelebrateWon(true)
    const audio = audioRef.current || new Audio()
    audio.src = '/sound-offline/Toi-Goi.mp3'
    audio.volume = 1
    audioRef.current = audio
    void audio.play().catch(() => undefined)
  }

  // Click outside user menu
  useEffect(() => {
    if (!userMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  useEffect(() => {
    return () => {
      stopAudio()
      clearShowcaseTimers()
    }
  }, [])

  return (
    <div className="w-full relative select-none">
      {/* =========================================================================
          1. GIAO DIỆN DESKTOP / MÀN HÌNH RỘNG (>= 1024px)
          Tái hiện 100% bố cục QUANTRO.png với các vùng tương tác trực tiếp
          ========================================================================= */}
      <div
        className="@container hidden lg:block relative w-full max-w-[2000px] aspect-[2000/1009] mx-auto overflow-hidden shadow-2xl rounded-3xl border-2 border-emerald-900/30"
        style={{ containerType: 'inline-size' }}
      >
        {/* Ảnh nền gốc QUANTRO.png (v=no-mid-box để ép trình duyệt bỏ cache cũ) */}
        <img
          src="/assets/quantro/QUANTRO.png?v=no-mid-box"
          alt="Giao diện Quản trò Bài Chòi"
          className="w-full h-full object-contain pointer-events-none select-none"
        />

        {/* ── TOP-LEFT: NÚT VỀ TRANG CHỦ (Đưa xuống thanh navbar chính của Canvas) ── */}
        <button
          type="button"
          onClick={onBackToSite}
          className="absolute z-30 px-3 py-1 rounded-full cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-all flex items-center gap-1.5 shadow-md hover:brightness-110"
          style={{
            left: '2.4%',
            top: '2.0%',
            height: '4.4%',
            backgroundColor: '#2b4968',
            border: '1.5px solid #48a5b8',
          }}
          title="Quay lại Trang Chủ Bài Chòi"
        >
          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-[#006368] to-[#04374F] p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
            <img src="/assets/choi-transparent.png" alt="Chòi" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-white text-[11px] sm:text-xs leading-none whitespace-nowrap">
            ← Trang chủ
          </span>
        </button>

        {/* ── HUY HIỆU: CHẾ ĐỘ BÀI CHÒI OFFLINE (KHUNG TRONG SUỐT GLASSMORPHISM CHUẨN ẢNH 2) ── */}
        <div
          className="absolute z-20 flex items-center justify-center pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: '50.8%',
            top: '15.2%',
          }}
        >
          <div
            className="rounded-full flex items-center justify-center gap-1.5 px-3 py-1 select-none"
            style={{
              background: 'rgba(255, 255, 255, 0.20)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1.2px solid rgba(255, 255, 255, 0.65)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.22), inset 0 1px 2px rgba(255, 255, 255, 0.45)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.95)] animate-pulse shrink-0" />
            <span
              className="font-bold text-white tracking-wider whitespace-nowrap uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans leading-none"
              style={{
                fontSize: 'clamp(7px, 0.42cqw, 8.2px)',
              }}
            >
              CHẾ ĐỘ BÀI CHÒI OFFLINE
            </span>
          </div>
        </div>

        {/* ── TOP-RIGHT 1: VIÊN THUỐC VÍ XU CHÒI (Chuẩn theo navbar Trang chủ) ── */}
        <button
          type="button"
          onClick={onOpenCoins}
          className="absolute z-30 rounded-full flex items-center justify-between px-2 sm:px-2.5 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-all shadow-xs hover:brightness-110"
          style={{
            left: '73.8%',
            top: '1.9%',
            width: '8.8%',
            height: '4.4%',
            backgroundColor: '#283c5d',
            border: '1.5px solid rgba(45, 184, 199, 0.65)',
          }}
          title="Ví Xu Chòi - Bấm để nạp thêm hoặc xem lịch sử"
        >
          {/* Icon đồng xu Chòi chuẩn matching Trang chủ */}
          <div className="h-[76%] aspect-square rounded-full overflow-hidden flex items-center justify-center shrink-0">
            <img
              src="/assets/xu-choi.png"
              alt="Xu Chòi"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {/* Số dư Xu THẬT của người dùng */}
          <span className="font-bold text-white text-xs sm:text-[13px] leading-none px-1.5 truncate">
            {(currentUser?.coins ?? 50).toLocaleString()}
          </span>

          {/* Dấu cộng nạp xu */}
          <span className="text-white/80 font-bold text-sm leading-none pl-0.5 shrink-0">
            +
          </span>
        </button>

        {/* ── TOP-RIGHT 2: VIÊN THUỐC TÀI KHOẢN (Chuẩn theo navbar Trang chủ) ── */}
        <div
          ref={userMenuRef}
          className="absolute z-30"
          style={{
            left: currentUser ? '83.8%' : '83.0%',
            top: '1.9%',
            width: currentUser ? '9.6%' : '11.0%',
            height: '4.4%',
          }}
        >
          {currentUser ? (
            /* Khi ĐÃ ĐĂNG NHẬP: Hiển thị Avatar thật + Tên người dùng thật (hoặc Admin) */
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-full h-full rounded-full flex items-center justify-between px-2 sm:px-2.5 cursor-pointer outline-none focus:outline-none focus:ring-0 select-none shadow-xs transition hover:brightness-110 active:scale-95"
              style={{
                backgroundColor: '#283c5d',
                border: '1.5px solid rgba(45, 184, 199, 0.65)',
              }}
              title={currentUser.username || currentUser.fullName}
            >
              {/* Avatar người dùng tròn cyan có icon 👤 */}
              <div className="h-[76%] aspect-square rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#27b8c7]">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-[#243b57] text-[10px] sm:text-xs font-bold leading-none">
                    👤
                  </span>
                )}
              </div>

              {/* Tên người dùng thật (thay đổi linh hoạt, không bị cố định là penhi) */}
              <span className="font-bold text-white text-[11px] sm:text-[12px] truncate px-1.5 max-w-[70px] sm:max-w-[95px] leading-none">
                {currentUser.username || currentUser.fullName}
              </span>

              {/* Mũi tên thả xuống */}
              <span className="text-[8px] sm:text-[10px] text-white/80 leading-none shrink-0 font-bold pr-0.5">
                {userMenuOpen ? '▲' : '▼'}
              </span>
            </button>
          ) : (
            /* Khi CHƯA ĐĂNG NHẬP: Hiển thị đúng nút "Đăng nhập / Đăng ký" theo Trang chủ */
            <button
              type="button"
              onClick={() => onOpenAuth?.('login')}
              className="w-full h-full rounded-full flex items-center justify-between px-2 sm:px-2.5 cursor-pointer outline-none focus:outline-none focus:ring-0 select-none shadow-xs transition hover:brightness-110 active:scale-95"
              style={{
                backgroundColor: '#283c5d',
                border: '1.5px solid rgba(45, 184, 199, 0.65)',
              }}
              title="Đăng nhập hoặc Đăng ký tài khoản"
            >
              <div className="h-[76%] aspect-square rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#27b8c7]">
                <span className="text-[#243b57] text-[10px] sm:text-xs font-bold leading-none">
                  👤
                </span>
              </div>
              <span className="font-bold text-white text-[10px] sm:text-[11px] truncate leading-none px-1.5">
                {isVie ? 'Đăng nhập / Đăng ký' : 'Sign in / Register'}
              </span>
            </button>
          )}

          {/* Menu Dropdown khi đã đăng nhập */}
          {userMenuOpen && currentUser && (
            <div className="absolute right-0 top-[118%] w-60 rounded-2xl bg-white p-3.5 shadow-2xl border border-slate-200 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150 text-left">
              {/* Header: Avatar, Tên, Email */}
              <div className="flex items-center gap-2.5 pb-2.5 mb-2.5 border-b border-slate-100">
                <div className="h-9 w-9 rounded-full bg-[#27b8c7] text-[#243b57] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base">👤</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.username || currentUser.fullName}
                    </p>
                    {currentUser.role === 'admin' && (
                      <span className="text-[9px] font-black bg-red-100 text-red-700 px-1.5 py-0.2 rounded shrink-0">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser.email || 'user@baichoi.vn'}</p>
                </div>
              </div>

              {/* Ô hiển thị số dư Xu Chòi */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/assets/xu-choi.png" alt="Xu Chòi" className="w-6 h-6 object-contain" />
                  <div>
                    <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">Số dư Xu Chòi</p>
                    <p className="font-mono text-xs font-black text-amber-950">
                      {(currentUser.coins ?? 50).toLocaleString()} Xu
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    onOpenCoins?.()
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black transition cursor-pointer shadow-2xs"
                >
                  + Nạp
                </button>
              </div>

              {/* Các liên kết điều hướng */}
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    onGoToShop?.()
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-amber-50 text-amber-900 font-semibold transition flex items-center gap-2 cursor-pointer"
                >
                  <span>🛍️</span>
                  <span>Cửa Hàng Di Sản</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    onBackToSite?.()
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium transition flex items-center gap-2 cursor-pointer"
                >
                  <span>←</span>
                  <span>Về Trang chủ</span>
                </button>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onLogout?.()
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-red-50 text-red-600 font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>🚪</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── TOP-RIGHT 3: NÚT MENU ☰ (Khớp vị trí 3 gạch trên ảnh) ── */}
        <button
          type="button"
          onClick={() => setMenuDrawerOpen(true)}
          className="absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform"
          style={{
            left: '94.0%',
            top: '1.8%',
            width: '3.2%',
            height: '4.6%',
          }}
          title="Mở Menu điều hướng"
        />

        {/* ── BẢNG TRÁI: ỐNG BÀI HIỆU TRUYỀN THỐNG ── */}
        {/* Số lượng đã rút: Đã rút: X/30 quân bài (Căn chuẩn vị trí và tỉ lệ dưới tiêu đề) */}
        <div
          className="absolute z-20 flex items-baseline pointer-events-none font-sans select-none"
          style={{
            left: '32.4%',
            top: '46.8%',
            transform: 'translateY(-50%)',
            fontSize: 'clamp(9px, 0.58cqw, 12px)',
          }}
        >
          <span className="text-[#b6dfe5] font-medium">Đã rút:&nbsp;</span>
          <span className="font-bold text-amber-300">{drawnCards.length}/30</span>
          <span className="text-[#b6dfe5] font-medium">&nbsp;quân bài</span>
        </div>

        {/* Nút Ván mới 🔄 (Khớp vị trí ô "Ván mới" x: 50.1%, y: 42.4%, w: 5.6%, h: 4.0%) */}
        <button
          type="button"
          onClick={handleResetRound}
          className="absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform rounded-xl hover:bg-white/10"
          style={{
            left: '50.1%',
            top: '42.2%',
            width: '5.6%',
            height: '4.2%',
          }}
          title="Bắt đầu ván chơi mới (Làm mới ống thẻ)"
        />

        {/* VÙNG HIỂN THỊ THẺ BÀI RÚT / ỐNG THẺ LẮC */}
        {/* Vị trí khung thẻ: x: 32.25%, y: 50.05%, w: 23.5%, h: 24.28% */}
        <div
          className="absolute z-20 flex items-center justify-center p-2"
          style={{
            left: '32.25%',
            top: '50.05%',
            width: '23.5%',
            height: '24.28%',
          }}
        >
          {currentCard ? (
            /* Khi đã rút thẻ: Hiện quân bài với khung trắng và nền trong suốt Glassmorphism */
            <div
              className="w-full h-full rounded-2xl p-2.5 flex items-center gap-3.5 transition-all animate-in fade-in duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255, 255, 255, 0.65)',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.22), inset 0 1px 2px rgba(255, 255, 255, 0.45)',
              }}
            >
              {/* Ảnh lá bài */}
              <div className="h-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-300 bg-white/95 p-0.5 shadow-md shrink-0 flex flex-col items-center">
                <img
                  src={currentCard.image}
                  alt={currentCard.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* Thông tin tên bài, câu hò và nút nghe lại (Khung viền trắng, nền trong suốt Glassmorphism) */}
              <div className="flex-1 min-w-0 flex flex-col justify-between items-center text-center h-full py-0.5 px-1">
                {/* 1. Tên lá bài: Kiểu chữ & kích thước chuẩn theo "Nhạc của Chòi", chữ to nằm giữa, hiệu ứng chữ nhảy nhảy khi hát */}
                <div className="w-full flex justify-center items-center py-0.5">
                  <div
                    className="tracking-normal flex items-center justify-center select-none"
                    style={{
                      fontFamily: 'var(--font-display, "Bricolage Grotesque", "Be Vietnam Pro", system-ui, sans-serif)',
                      fontSize: 'clamp(17px, 1.35cqw, 25px)',
                      fontWeight: 800,
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.85), 0 0 16px rgba(245, 158, 11, 0.6)',
                      lineHeight: 1.2,
                    }}
                  >
                    {currentCard.name.split('').map((char, i) => (
                      <span
                        key={i}
                        className={`inline-block transition-colors duration-300 ${
                          isCalling ? 'animate-bounce text-amber-300 font-extrabold' : 'text-white'
                        }`}
                        style={{
                          animationDelay: isCalling ? `${i * 110}ms` : '0ms',
                          animationDuration: '650ms',
                        }}
                      >
                        {char === ' ' ? '\u00A0' : char}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Phần lyric của bài */}
                <div
                  className="w-full my-auto px-2 py-1 rounded-xl text-center select-none"
                  style={{
                    background: 'rgba(0, 0, 0, 0.22)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255, 255, 255, 0.20)',
                  }}
                >
                  <p
                    className="leading-snug text-amber-100 italic line-clamp-2 font-serif"
                    style={{ fontSize: 'clamp(9px, 0.58cqw, 11.5px)' }}
                  >
                    &quot;{currentLyrics[lyricIndex] || currentLyrics[0] || currentCard.name}&quot;
                  </p>
                </div>

                {/* 3. Phần nghe lại / dừng hô */}
                <div className="w-full flex justify-center items-center">
                  {isCalling ? (
                    <button
                      type="button"
                      onClick={stopAudio}
                      className="px-3.5 py-1 rounded-full text-white font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95 hover:brightness-110"
                      style={{
                        background: 'rgba(239, 68, 68, 0.30)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1.4px solid rgba(255, 255, 255, 0.75)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
                        fontSize: 'clamp(9.5px, 0.65cqw, 12.5px)',
                      }}
                      title="Dừng bài hô"
                    >
                      <span className="text-red-300 animate-pulse text-xs">⏹</span>
                      <span>Dừng hô</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => playCardChant(currentCard)}
                      className="px-3.5 py-1 rounded-full text-white font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95 hover:brightness-110"
                      style={{
                        background: 'rgba(255, 255, 255, 0.20)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1.4px solid rgba(255, 255, 255, 0.75)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
                        fontSize: 'clamp(9.5px, 0.65cqw, 12.5px)',
                      }}
                      title="Nghe lại bài hô của quân bài"
                    >
                      <span className="text-emerald-300 text-xs">🔊</span>
                      <span>Nghe lại</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Khi chưa rút: Giữ nguyên khung ảnh gốc tĩnh đẹp mắt của QUANTRO.png */
            <div
              className="w-full h-full cursor-pointer"
              onClick={handleDrawRandom}
              title="Bấm để lắc ống và rút thẻ!"
            />
          )}
        </div>

        {/* ── 2 NÚT TÁC VỤ DƯỚI BẢNG TRÁI: LẮC ỐNG & HÔ TỚI (Đã bỏ Gõ Mõ theo yêu cầu) ── */}
        {/* Nút 1: Lắc Ống (Khung trái: x: 32.25%, y: 77.7%, w: 11.2%, h: 3.4%) */}
        <button
          type="button"
          onClick={handleDrawRandom}
          disabled={isCalling || showcasePhase !== 'idle'}
          className={`absolute z-30 rounded-xl cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-all flex items-center justify-center font-bold text-white select-none hover:bg-white/10 ${
            isCalling || showcasePhase !== 'idle' ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-125'
          }`}
          style={{
            left: '32.25%',
            top: '77.7%',
            width: '11.2%',
            height: '3.4%',
            fontSize: 'clamp(9px, 0.62cqw, 13px)',
          }}
          title="Lắc ống tre và rút ngẫu nhiên 1 quân bài"
        >
          <span className="leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Lắc Ống</span>
        </button>

        {/* Nút 2: Hô Tới! (Khung phải: x: 43.95%, y: 77.7%, w: 11.2%, h: 3.4%) */}
        <button
          type="button"
          onClick={handleToiGoi}
          className="absolute z-30 rounded-xl cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-all flex items-center justify-center font-bold text-white select-none hover:bg-white/10 hover:brightness-125"
          style={{
            left: '43.95%',
            top: '77.7%',
            width: '11.2%',
            height: '3.4%',
            fontSize: 'clamp(9px, 0.62cqw, 13px)',
          }}
          title="Chòi thắng cuộc hô TỚI RỒI! ăn thưởng"
        >
          <span className="leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Hô Tới!</span>
        </button>

        {/* ── BẢNG PHẢI: KHUNG TRE TRÚC (Cách tổ chức chơi offline) ── */}
        {/* Khoảng trống lọt lòng giữa 2 cụm thân tre: x: 60.0%, y: 47.5%, w: 8.2%, h: 31.5% */}
        <div
          className="absolute z-20 flex flex-col justify-center text-left pointer-events-auto"
          style={{
            left: '60.0%',
            top: '47.5%',
            width: '8.2%',
            height: '31.5%',
          }}
        >
          <div
            className="space-y-1.5 leading-tight text-white/95 font-medium"
            style={{ fontSize: 'clamp(7px, 0.40cqw, 8.8px)' }}
          >
            <div className="flex items-start gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[7px] shrink-0 mt-0.5 shadow-2xs">
                1
              </span>
              <p className="flex-1 min-w-0 break-words">Chuẩn bị 30 thẻ bài giấy chia người chơi (mỗi chòi 3 quân).</p>
            </div>

            <div className="flex items-start gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[7px] shrink-0 mt-0.5 shadow-2xs">
                2
              </span>
              <p className="flex-1 min-w-0 break-words">Mở điện thoại hoặc loa Bluetooth làm Anh Hiệu / Chị Hiệu ảo.</p>
            </div>

            <div className="flex items-start gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[7px] shrink-0 mt-0.5 shadow-2xs">
                3
              </span>
              <p className="flex-1 min-w-0 break-words">Bấm &quot;Lắc Ống&quot; để nghe bài hò thai nguyên bản truyền thống.</p>
            </div>

            <div className="flex items-start gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[7px] shrink-0 mt-0.5 shadow-2xs">
                4
              </span>
              <p className="flex-1 min-w-0 break-words">Trùng quân hô &quot;Có Đây!&quot;. Đủ 3 quân gõ mõ hô &quot;TỚI RỒI!&quot; nhận giải.</p>
            </div>
          </div>
        </div>

        {/* ── ĐÁY BẢNG: THANH &quot;LỊCH SỬ THẺ ĐÃ RÚT 👆&quot; ── */}
        {/* Vị trí thanh drawer: x: 33.75%, y: 86.7%, w: 34.25%, h: 8.4% */}
        <button
          type="button"
          onClick={() => setHistoryDrawerOpen(true)}
          className={`absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-98 transition-all duration-300 rounded-xl flex items-center justify-end pr-8 ${
            historyPulse
              ? 'ring-4 ring-amber-400 bg-amber-400/25 shadow-[0_0_35px_rgba(251,191,36,0.95)] scale-[1.03]'
              : 'hover:bg-white/10'
          }`}
          style={{
            left: '33.75%',
            top: '86.7%',
            width: '34.25%',
            height: '8.4%',
          }}
          title="Bấm để xem danh sách toàn bộ các quân bài đã rút"
        >
          {/* Badge số thẻ đã rút */}
          <span
            className={`px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 font-black text-xs shadow-md transition-all duration-300 ${
              historyPulse ? 'scale-125 bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,1)]' : ''
            }`}
          >
            {drawnCards.length} thẻ
          </span>
        </button>
      </div>

      {/* =========================================================================
          2. GIAO DIỆN MOBILE / TABLET (< 1024px)
          Tối ưu cảm ứng, giữ nguyên hình ảnh, phong cách và nhân vật của QUANTRO.png
          ========================================================================= */}
      <div className="lg:hidden flex flex-col items-center gap-4 p-3 sm:p-5">
        {/* ── THANH NAVBAR TRÊN MOBILE ── */}
        <div className="w-full max-w-xl flex items-center justify-between gap-2 px-1">
          {/* Nút Về Trang Chủ */}
          <button
            type="button"
            onClick={onBackToSite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
            style={{
              backgroundColor: '#283c5d',
              border: '1.5px solid rgba(45, 184, 199, 0.65)',
            }}
          >
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-[#006368] to-[#04374F] p-0.5 flex items-center justify-center shrink-0">
              <img src="/assets/choi-transparent.png" alt="Chòi" className="w-full h-full object-contain" />
            </div>
            <span>← Trang chủ</span>
          </button>

          {/* Cụm Xu, Tài khoản và Menu bên phải */}
          <div className="flex items-center gap-2">
            {/* Viên thuốc Xu */}
            <button
              type="button"
              onClick={onOpenCoins}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
              style={{
                backgroundColor: '#283c5d',
                border: '1.5px solid rgba(45, 184, 199, 0.65)',
              }}
              title="Ví Xu Chòi"
            >
              <div className="h-4 w-4 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                <img src="/assets/xu-choi.png" alt="Xu Chòi" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold">{(currentUser?.coins ?? 50).toLocaleString()}</span>
              <span className="text-white/80 font-bold">+</span>
            </button>

            {/* Viên thuốc Tài khoản */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer max-w-[130px]"
                style={{
                  backgroundColor: '#283c5d',
                  border: '1.5px solid rgba(45, 184, 199, 0.65)',
                }}
                title={currentUser.username || currentUser.fullName}
              >
                <div className="h-4 w-4 rounded-full overflow-hidden bg-[#27b8c7] flex items-center justify-center text-[10px] shrink-0">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#243b57]">👤</span>
                  )}
                </div>
                <span className="truncate">{currentUser.username || currentUser.fullName}</span>
                <span className="text-[9px] text-white/70 font-bold">▼</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth?.('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-xs shadow-md active:scale-95 transition cursor-pointer"
                style={{
                  backgroundColor: '#283c5d',
                  border: '1.5px solid rgba(45, 184, 199, 0.65)',
                }}
                title="Đăng nhập / Đăng ký"
              >
                <div className="h-4 w-4 rounded-full overflow-hidden bg-[#27b8c7] flex items-center justify-center text-[10px] shrink-0 text-[#243b57]">
                  👤
                </div>
                <span className="text-[11px] font-bold">{isVie ? 'Đăng nhập / Đăng ký' : 'Sign in / Register'}</span>
              </button>
            )}

            {/* Nút Menu ☰ trên mobile */}
            <button
              type="button"
              onClick={() => setMenuDrawerOpen(true)}
              className="h-8 w-8 rounded-full bg-[#283c5d] border border-teal-400/60 text-teal-300 font-bold text-base flex items-center justify-center cursor-pointer shadow-xs active:scale-95 transition"
              title="Menu điều hướng"
            >
              ☰
            </button>
          </div>
        </div>

        {/* HERO BANNER VỚI MÁI CHÒI & 2 NHÂN VẬT ANH HIỆU / CHỊ HIỆU */}
        <div className="w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#1b3f42] to-[#142e31] p-5 border-2 border-emerald-600/40 shadow-xl text-center relative overflow-hidden">
          {/* Huy hiệu Offline (Khung trong suốt Glassmorphism chuẩn Ảnh 2) */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3 select-none"
            style={{
              background: 'rgba(255, 255, 255, 0.20)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1.2px solid rgba(255, 255, 255, 0.65)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.22), inset 0 1px 2px rgba(255, 255, 255, 0.45)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.95)] animate-pulse shrink-0" />
            <span className="text-white text-[8px] sm:text-[8.5px] font-bold tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans leading-none">
              CHẾ ĐỘ BÀI CHÒI OFFLINE
            </span>
          </div>

          {/* Biển hiệu "NHẠC CỦA CHÒI" */}
          <div className="relative mx-auto max-w-[280px] sm:max-w-[340px] my-1">
            <img
              src="/assets/quantro/signboard.png"
              alt="Nhạc của Chòi"
              className="w-full object-contain filter drop-shadow-md"
            />
          </div>

          <p className="text-xs text-emerald-100/85 mt-2 max-w-md mx-auto leading-relaxed">
            Thích hợp làm Quản trò / Anh Hiệu ảo cho hội chơi thực tế ngoài đời, gia đình, lễ hội hoặc lớp học.
          </p>

          {/* Hai linh vật Anh Hiệu và Chị Hiệu đứng hai bên */}
          <div className="flex items-center justify-between px-2 mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-left">
              <img
                src="/assets/quantro/anh-hieu.png"
                alt="Anh Hiệu"
                className="w-14 h-20 sm:w-16 sm:h-24 object-contain filter drop-shadow"
              />
              <div>
                <p className="text-xs font-black text-amber-300">Anh Hiệu</p>
                <p className="text-[10px] text-emerald-200">Quản trò ảo</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right flex-row-reverse">
              <img
                src="/assets/quantro/chi-hieu.png"
                alt="Chị Hiệu"
                className="w-14 h-20 sm:w-16 sm:h-24 object-contain filter drop-shadow"
              />
              <div>
                <p className="text-xs font-black text-pink-300">Chị Hiệu</p>
                <p className="text-[10px] text-emerald-200">Hát hò thai</p>
              </div>
            </div>
          </div>
        </div>

        {/* ỐNG RÚT BÀI TRUYỀN THỐNG TRÊN MOBILE */}
        <div className="w-full max-w-xl rounded-3xl bg-[#1b3d40] border-2 border-emerald-500/30 p-5 shadow-xl text-white">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-600/30">
            <div>
              <h3 className="text-base font-black text-amber-300 tracking-wide">ỐNG BÀI HIỆU TRUYỀN THỐNG</h3>
              <p className="text-xs text-emerald-200 font-mono mt-0.5">
                Đã rút: <span className="font-bold text-amber-400">{drawnCards.length}/30</span> quân bài
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetRound}
              className="px-3 py-1.5 rounded-xl border border-emerald-400/40 bg-emerald-950/60 hover:bg-emerald-800 text-xs font-bold text-emerald-200 transition cursor-pointer"
            >
              🔄 Ván mới
            </button>
          </div>

          {/* VÙNG THẺ BÀI RÚT */}
          <div className="my-5 min-h-[180px] flex items-center justify-center">
            {currentCard ? (
              <div
                className="w-full rounded-2xl p-3.5 flex items-center gap-4 transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.14)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1.5px solid rgba(255, 255, 255, 0.60)',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
                }}
              >
                <div className="w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-400 bg-white p-0.5 shrink-0 shadow-lg">
                  <img src={currentCard.image} alt={currentCard.name} className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="flex-1 text-center flex flex-col justify-between items-center gap-2 py-1 min-h-[120px]">
                  {/* 1. Tên lá bài: Kiểu chữ & kích thước chuẩn theo "Nhạc của Chòi", chữ to nằm giữa, nhảy nhảy khi hát */}
                  <div className="w-full flex justify-center items-center py-1">
                    <div
                      className="tracking-normal text-xl sm:text-2xl flex items-center justify-center select-none"
                      style={{
                        fontFamily: 'var(--font-display, "Bricolage Grotesque", "Be Vietnam Pro", system-ui, sans-serif)',
                        fontWeight: 800,
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.85), 0 0 16px rgba(245, 158, 11, 0.6)',
                        lineHeight: 1.2,
                      }}
                    >
                      {currentCard.name.split('').map((char, i) => (
                        <span
                          key={i}
                          className={`inline-block transition-colors duration-300 ${
                            isCalling ? 'animate-bounce text-amber-300 font-extrabold' : 'text-white'
                          }`}
                          style={{
                            animationDelay: isCalling ? `${i * 110}ms` : '0ms',
                            animationDuration: '650ms',
                          }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 2. Phần lyric của bài */}
                  <div
                    className="w-full my-auto px-2.5 py-1.5 rounded-xl text-center select-none"
                    style={{
                      background: 'rgba(0, 0, 0, 0.22)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.20)',
                    }}
                  >
                    <p className="text-xs leading-snug text-amber-100 italic line-clamp-2 font-serif">
                      &quot;{currentLyrics[lyricIndex] || currentLyrics[0] || currentCard.name}&quot;
                    </p>
                  </div>

                  {/* 3. Phần nghe lại / dừng hô */}
                  <div className="w-full flex justify-center items-center">
                    {isCalling ? (
                      <button
                        type="button"
                        onClick={stopAudio}
                        className="px-4 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95"
                        style={{
                          background: 'rgba(239, 68, 68, 0.30)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          border: '1.4px solid rgba(255, 255, 255, 0.75)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        <span className="text-red-300 animate-pulse">⏹</span>
                        <span>Dừng hô</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => playCardChant(currentCard)}
                        className="px-4 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95"
                        style={{
                          background: 'rgba(255, 255, 255, 0.20)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          border: '1.4px solid rgba(255, 255, 255, 0.75)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        <span className="text-emerald-300">🔊</span>
                        <span>Nghe lại</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={handleDrawRandom}
                className="py-8 text-center cursor-pointer"
              >
                <p className="mt-3 text-xs text-emerald-200 max-w-xs mx-auto">
                  Ống thẻ đang sẵn sàng. Hãy bấm nút dưới đây để lắc ống và rút thẻ!
                </p>
              </div>
            )}
          </div>

          {/* 2 NÚT TÁC VỤ: LẮC ỐNG & HÔ TỚI */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDrawRandom}
              disabled={isCalling || showcasePhase !== 'idle'}
              className={`py-3 rounded-xl font-black text-xs text-white shadow-md active:scale-95 transition ${
                isCalling || showcasePhase !== 'idle'
                  ? 'bg-slate-600 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#d9534f] to-[#e67e3a]'
              }`}
            >
              🎋 Lắc Ống
            </button>

            <button
              type="button"
              onClick={handleToiGoi}
              className="py-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#c0392b] to-[#962d22] border border-amber-400/40 shadow-md active:scale-95 transition"
            >
              🎉 Hô Tới!
            </button>
          </div>

          {/* NÚT MỞ LỊCH SỬ THẺ ĐÃ RÚT */}
          <button
            type="button"
            onClick={() => setHistoryDrawerOpen(true)}
            className={`w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 border border-emerald-500/40 flex items-center justify-between px-4 font-bold text-xs cursor-pointer active:scale-98 transition-all duration-300 shadow ${
              historyPulse
                ? 'ring-4 ring-amber-400 bg-amber-400/25 shadow-[0_0_35px_rgba(251,191,36,0.95)] scale-[1.02]'
                : ''
            }`}
          >
            <span>Lịch sử thẻ đã rút 👆</span>
            <span
              className={`px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-black text-[11px] transition-all duration-300 ${
                historyPulse ? 'scale-125 bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,1)]' : ''
              }`}
            >
              {drawnCards.length} thẻ
            </span>
          </button>
        </div>

        {/* KHUNG CÁCH TỔ CHỨC CHƠI OFFLINE TRÊN MOBILE */}
        <div className="w-full max-w-xl rounded-3xl bg-[#1b3d40] border-2 border-emerald-500/30 p-5 shadow-xl text-white text-left">
          <h4 className="text-sm font-black text-amber-300 mb-3 flex items-center gap-2">
            <span>🎋</span>
            <span>CÁCH TỔ CHỨC CHƠI OFFLINE</span>
          </h4>
          <div className="space-y-2.5 text-xs text-emerald-100/90 leading-relaxed">
            <p>1. Chuẩn bị 30 thẻ bài giấy hoặc quân cờ chia cho các chòi/người chơi (mỗi chòi 3 quân).</p>
            <p>2. Đặt điện thoại hoặc loa Bluetooth ở giữa làm Anh Hiệu / Chị Hiệu ảo.</p>
            <p>3. Bấm &quot;Lắc Ống&quot; để nghe bài hát hò thai đầy đủ truyền thống.</p>
            <p>4. Chòi nào có thẻ trùng khớp hô &quot;Có Đây!&quot;. Đủ 3 quân thì gõ mõ hô &quot;TỚI RỒI!&quot; để nhận thưởng.</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. SLIDE-UP DRAWER: LỊCH SỬ THẺ ĐÃ RÚT (Áp dụng cho cả Desktop & Mobile)
          ========================================================================= */}
      {historyDrawerOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-2xl max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-[#1b3d40] border-2 border-emerald-500/40 p-5 sm:p-6 shadow-2xl text-white flex flex-col text-left">
            {/* Header Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <div>
                <h3 className="text-lg font-black text-amber-300 font-serif">
                  LỊCH SỬ THẺ ĐÃ RÚT ({drawnCards.length}/30)
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Danh sách các quân bài đã được Quản trò rút trong ván này
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryDrawerOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List thẻ */}
            <div className="flex-1 overflow-y-auto py-4 pr-1">
              {drawnCards.length === 0 ? (
                <div className="py-12 text-center text-sm text-emerald-200/70 italic">
                  Chưa có quân bài nào được rút trong ván chơi này. Hãy bấm &quot;Lắc Ống&quot; để bắt đầu!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {drawnCards.map((card, idx) => (
                    <div
                      key={`${card.id}-${idx}`}
                      className="p-2.5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between gap-3 hover:border-amber-400/50 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-6 w-6 rounded-full bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center shrink-0">
                          #{drawnCards.length - idx}
                        </span>
                        <div className="h-11 w-8 rounded-lg overflow-hidden border border-white/20 bg-white shrink-0">
                          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-sm text-white truncate">{card.name}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playCardChant(card)
                          setHistoryDrawerOpen(false)
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>🔊</span>
                        <span>Nghe lại</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Drawer */}
            <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-emerald-200">
              <span>Đã rút {drawnCards.length} / 30 quân</span>
              <button
                type="button"
                onClick={() => setHistoryDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MODAL THÔNG BÁO CHIẾN THẮNG: HÔ TỚI RỒI!
          ========================================================================= */}
      {celebrateWon && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border-4 border-amber-400 bg-gradient-to-b from-[#1b3d40] to-[#0d2224] p-8 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="text-6xl animate-bounce">🏆</div>
            <h3 className="mt-4 text-3xl font-black text-amber-300 font-serif">
              TỚI RỒI! BÁO THẮNG!
            </h3>
            <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
              Chúc mừng chòi thắng cuộc! Tiếng trống hội vang lừng, vinh danh người giữ trọn nhịp phách Bài Chòi.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleResetRound}
                className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg transition"
              >
                Chơi Ván Mới
              </button>
              <button
                type="button"
                onClick={() => setCelebrateWon(false)}
                className="flex-1 rounded-2xl bg-amber-500 hover:bg-amber-400 py-3 text-sm font-bold text-slate-900 shadow-lg transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. DRAWER MENU ĐIỀU HƯỚNG QUẢN TRÒ (TƯƠNG TỰ TRANG CHỦ)
          ========================================================================= */}
      {menuDrawerOpen && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xs sm:max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col justify-between text-left overflow-y-auto animate-in slide-in-from-right duration-300">
            <div>
              {/* Header Drawer */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#283c5d] p-1 flex items-center justify-center shadow-xs">
                    <img src="/assets/choi-transparent.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#006368] text-base leading-tight font-serif">BÀI CHÒI DI SẢN</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Hội Chơi Quản Trò</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuDrawerOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Danh sách mục chọn */}
              <div className="py-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuDrawerOpen(false)
                    onBackToSite?.()
                  }}
                  className="px-4 py-3 rounded-2xl font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition flex items-center gap-3 text-left cursor-pointer"
                >
                  <span className="text-base">🏠</span>
                  <span>{isVie ? 'Trang chủ' : 'Home'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuDrawerOpen(false)
                    onGoToShop?.()
                  }}
                  className="px-4 py-3 rounded-2xl font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition flex items-center gap-3 text-left cursor-pointer"
                >
                  <span className="text-base">🛍️</span>
                  <span>{isVie ? 'Cửa Hàng Di Sản' : 'Heritage Shop'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuDrawerOpen(false)
                    onOpenCoins?.()
                  }}
                  className="px-4 py-3 rounded-2xl font-bold text-amber-900 bg-amber-50/80 hover:bg-amber-100 transition flex items-center justify-between text-left cursor-pointer border border-amber-200/60"
                >
                  <div className="flex items-center gap-2.5">
                    <img src="/assets/xu-choi.png" alt="Xu Chòi" className="w-5 h-5 object-contain" />
                    <span>{isVie ? 'Ví Xu Chòi' : 'Choi Coin Wallet'}</span>
                  </div>
                  <span className="font-mono font-bold text-xs">{(currentUser?.coins ?? 50).toLocaleString()} Xu</span>
                </button>
              </div>
            </div>

            {/* Chân trang Drawer */}
            <div className="pt-4 border-t border-slate-100">
              {currentUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[#27b8c7] text-[#243b57] flex items-center justify-center font-bold text-xs">
                      👤
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{currentUser.username || currentUser.fullName}</p>
                      <p className="text-[10px] text-slate-400">{currentUser.email || 'user@baichoi.vn'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuDrawerOpen(false)
                      onLogout?.()
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuDrawerOpen(false)
                    onOpenAuth?.('login')
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#006368] hover:bg-[#004e52] text-white font-bold text-xs text-center transition cursor-pointer"
                >
                  {isVie ? 'Đăng nhập / Đăng ký' : 'Sign in / Register'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. CINEMATIC SHOWCASE: HIỆU ỨNG RÚT BÀI TRUNG TÂM, NỀN TỐI & XOAY 360 ĐỘ
          ========================================================================= */}
      {showcaseCard && showcasePhase !== 'idle' && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center select-none overflow-hidden">
          {/* Nền tối phía sau (Backdrop làm mờ và tối các thành phần hậu cảnh) */}
          <div
            onClick={handleSkipShowcase}
            className="absolute inset-0 transition-opacity duration-500 cursor-pointer"
            style={{
              backgroundColor: 'rgba(5, 12, 16, 0.82)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              opacity: showcasePhase === 'flying' ? 0 : showcasePhase === 'spinning' ? 1 : 0,
            }}
            title="Bấm để tiếp tục nhanh"
          />

          {/* Vầng hào quang hoàng kim tỏa sáng sau lưng lá bài */}
          <div
            className="absolute pointer-events-none transition-all duration-700 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
            style={{
              width: '520px',
              height: '520px',
              opacity: showcasePhase === 'spinning' ? 0.9 : 0,
              transform: `translate(-50%, -50%) scale(${showcasePhase === 'spinning' ? 1 : 0.3})`,
              background:
                'radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(217, 119, 6, 0.18) 45%, rgba(0, 0, 0, 0) 70%)',
            }}
          />

          {/* Vỏ chứa Thẻ Bài 3D: Xoay 360 độ và sau đó Bay xuống Lịch sử */}
          <div
            onClick={handleSkipShowcase}
            className="relative z-10 cursor-pointer flex flex-col items-center"
            style={{
              perspective: '1200px',
              pointerEvents: showcasePhase === 'flying' ? 'none' : 'auto',
              transform:
                showcasePhase === 'entering'
                  ? 'scale(0.25) translateY(0)'
                  : showcasePhase === 'spinning'
                  ? 'scale(1) translateY(0)'
                  : 'scale(0.12) translateY(42vh) rotate(-8deg)',
              opacity: showcasePhase === 'entering' ? 0 : showcasePhase === 'spinning' ? 1 : 0,
              transition:
                showcasePhase === 'entering'
                  ? 'none'
                  : showcasePhase === 'spinning'
                  ? 'transform 1300ms cubic-bezier(0.2, 0.85, 0.25, 1), opacity 250ms ease-out'
                  : 'transform 550ms cubic-bezier(0.4, 0, 0.2, 1), opacity 450ms ease-in',
            }}
          >
            {/* Khối thẻ bài 3D quay 360 độ */}
            <div
              className="w-[280px] sm:w-[320px] aspect-[1/1.42] relative rounded-3xl"
              style={{
                transformStyle: 'preserve-3d',
                transform:
                  showcasePhase === 'spinning' || showcasePhase === 'flying'
                    ? 'rotateY(360deg)'
                    : 'rotateY(0deg)',
                transition:
                  showcasePhase === 'spinning'
                    ? 'transform 1300ms cubic-bezier(0.2, 0.85, 0.25, 1)'
                    : 'none',
              }}
            >
              {/* MẶT TRƯỚC LÁ BÀI (Front Face) */}
              <div
                className="absolute inset-0 rounded-3xl p-3.5 flex flex-col justify-between text-center overflow-hidden border-2 border-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.65)]"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  backgroundColor: '#16363a',
                  backgroundImage:
                    'radial-gradient(circle at 50% 20%, rgba(45, 184, 199, 0.25) 0%, rgba(13, 34, 36, 0.95) 100%)',
                }}
              >
                {/* Header quân bài rút */}
                <div className="flex items-center justify-between px-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-black text-[11px] tracking-wider uppercase flex items-center gap-1 shadow-xs">
                    <span>🎋</span>
                    <span>Quân bài vừa rút</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-black/40 border border-amber-400/40 font-mono font-bold text-xs text-amber-200">
                    #{drawnCards.length}/30
                  </span>
                </div>

                {/* Ảnh lá bài chính phóng to sắc nét */}
                <div className="my-2 flex-1 w-full rounded-2xl overflow-hidden border-2 border-amber-400/80 bg-white shadow-2xl relative flex items-center justify-center p-1">
                  <img
                    src={showcaseCard.image}
                    alt={showcaseCard.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {/* Tia sáng quét ngang (Shimmer glare) */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-tr from-transparent via-white to-transparent"
                    style={{
                      transform: showcasePhase === 'spinning' ? 'translateX(100%)' : 'translateX(-100%)',
                      transition: 'transform 1000ms ease-in-out 300ms',
                    }}
                  />
                </div>

                {/* Banner tên quân bài và câu hò thai */}
                <div className="space-y-1.5">
                  <div className="inline-block px-5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-base sm:text-lg tracking-wide shadow-lg border border-amber-200/40">
                    {showcaseCard.name}
                  </div>
                  <p className="text-[11px] text-amber-100/90 italic line-clamp-1 px-2 font-serif">
                    &quot;{currentLyrics[0] || showcaseCard.name}&quot;
                  </p>
                </div>
              </div>

              {/* MẶT SAU LÁ BÀI (Back Face) - Lưng thẻ gỗ chạm khắc truyền thống */}
              <div
                className="absolute inset-0 rounded-3xl p-5 flex flex-col items-center justify-center text-center overflow-hidden border-2 border-amber-500/80 shadow-[0_0_35px_rgba(217,119,6,0.6)]"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  backgroundColor: '#431407',
                  backgroundImage:
                    'radial-gradient(circle at 50% 50%, #78350f 0%, #290d04 100%)',
                }}
              >
                {/* Họa tiết hoa văn truyền thống mặt lưng */}
                <div className="w-full h-full rounded-2xl border-2 border-dashed border-amber-400/40 p-4 flex flex-col items-center justify-center relative">
                  <div className="w-16 h-16 rounded-full bg-amber-400/15 border border-amber-400/60 flex items-center justify-center mb-3 text-3xl shadow-inner">
                    🎋
                  </div>
                  <h4 className="font-serif font-black text-amber-300 text-base sm:text-lg tracking-widest uppercase">
                    HỘI BÀI CHÒI
                  </h4>
                  <div className="w-16 h-0.5 bg-amber-400/60 my-2" />
                  <p className="text-[10px] font-sans font-bold text-amber-200/80 tracking-widest uppercase">
                    Di Sản Văn Hóa
                  </p>
                  <p className="text-[9px] text-amber-300/60 mt-1 font-mono">
                    VIỆT NAM
                  </p>
                </div>
              </div>
            </div>

            {/* Dòng chữ gợi ý dưới thẻ bài */}
            <div className="mt-4 text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-amber-200/80 text-[11px] font-medium border border-white/10">
                ✨ {showcasePhase === 'spinning' ? 'Đang quay công bố thẻ...' : 'Đang chuyển vào lịch sử...'} (Bấm để bỏ qua)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
