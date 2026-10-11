import { useState, useRef, useEffect } from 'react'
import type { UserProfile } from '../types/auth'
import { CARDS, Card } from '../BaiChoiGame'
import BaiChoiGame from '../BaiChoiGame'
import OfflinePlay from '../OfflinePlay'
import BaiChoiPuzzle, { PuzzleLevel } from '../BaiChoiPuzzle'
import ChoiCoin from './ChoiCoin'

export type GamePortalTab = 'arena' | 'caller' | 'browse' | 'puzzle'

interface GamePortalProps {
  lang: 'VIE' | 'ENG'
  setLang: (l: 'VIE' | 'ENG') => void
  currentUser: UserProfile | null
  initialTab?: GamePortalTab
  onBackToSite: () => void
  onGoToShop: () => void
  onOpenAuth: (mode?: 'login' | 'register') => void
  onLogout: () => void
  onOpenPolicy: (id?: string) => void
  onOpenCoins?: () => void
}

export default function GamePortal({
  lang,
  setLang,
  currentUser,
  initialTab = 'arena',
  onBackToSite,
  onGoToShop,
  onOpenAuth,
  onLogout,
  onOpenPolicy,
  onOpenCoins,
}: GamePortalProps) {
  const isVie = lang === 'VIE'
  const [activeTab, setActiveTab] = useState<GamePortalTab>(initialTab)
  const [isPlayingGame, setIsPlayingGame] = useState(false)
  const [gameAudioMode, setGameAudioMode] = useState<'online' | 'offline'>('online')

  // Puzzle Tab state
  const [selectedPuzzleCard, setSelectedPuzzleCard] = useState<Card>(CARDS[0])
  const [puzzleLevel, setPuzzleLevel] = useState<PuzzleLevel>(1)
  const [puzzleSuccess, setPuzzleSuccess] = useState(false)

  // User menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Close user menu on outside click
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

  return (
    <div
      className="min-h-screen text-slate-800 flex flex-col relative"
      style={{
        backgroundColor: '#EEF6F1',
        backgroundImage: 'linear-gradient(rgba(238,246,241,0.85), rgba(238,246,241,0.92)), url("/assets/Background-toan.jpg")',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
      }}
    >
      {/* ── TOP HEADER / NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#006368]/20 shadow-sm transition-all">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#006368] via-[#F29963] to-[#C44837]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
          {/* Brand & Back Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToSite}
              className="flex items-center gap-2 group cursor-pointer"
              title={isVie ? 'Quay lại Trang Chủ Bài Chòi' : 'Back to Home'}
            >
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-[#006368] to-[#04374F] p-1.5 flex items-center justify-center shadow-md group-hover:scale-105 transition">
                <img
                  src="/assets/choi-transparent.png"
                  alt="Logo Chòi"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <div className="text-left whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black tracking-normal text-[#006368] whitespace-nowrap font-sans">
                    BÀI CHÒI
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {isVie ? 'HỘI CHƠI' : 'GAME ARENA'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#006368]/70 flex items-center gap-1 whitespace-nowrap">
                  <span>←</span> <span>{isVie ? 'Trang chủ' : 'Home'}</span>
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#006368]/5 p-1.5 rounded-2xl border border-[#006368]/15">
            <button
              type="button"
              onClick={() => setActiveTab('arena')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'arena'
                  ? 'bg-[#006368] text-white shadow-md'
                  : 'text-[#006368] hover:bg-white/80'
              }`}
            >
              <span>🎮</span>
              <span>{isVie ? 'Đấu Trường Game' : 'Game Arena'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('caller')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'caller'
                  ? 'bg-[#006368] text-white shadow-md'
                  : 'text-[#006368] hover:bg-white/80'
              }`}
            >
              <span>🎋</span>
              <span>{isVie ? 'Ống Rút Quản Trò' : 'Virtual Caller'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'browse'
                  ? 'bg-[#006368] text-white shadow-md'
                  : 'text-[#006368] hover:bg-white/80'
              }`}
            >
              <span>📻</span>
              <span>{isVie ? '30 Điệu Hò Dài' : '30 Chants'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('puzzle')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'puzzle'
                  ? 'bg-[#006368] text-white shadow-md'
                  : 'text-[#006368] hover:bg-white/80'
              }`}
            >
              <span>🧩</span>
              <span>{isVie ? 'Ghép Tranh Thẻ' : 'Card Puzzle'}</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="hidden sm:flex rounded-full overflow-hidden border border-[#006368]/30">
              <button
                type="button"
                onClick={() => setLang('VIE')}
                className={`px-2.5 py-1 text-xs font-bold transition ${
                  lang === 'VIE' ? 'bg-[#006368] text-white' : 'text-[#006368] hover:bg-white'
                }`}
              >
                VIE
              </button>
              <button
                type="button"
                onClick={() => setLang('ENG')}
                className={`px-2.5 py-1 text-xs font-bold transition ${
                  lang === 'ENG' ? 'bg-[#006368] text-white' : 'text-[#006368] hover:bg-white'
                }`}
              >
                ENG
              </button>
            </div>

            {/* Coin Wallet Button in GamePortal */}
            {currentUser && (
              <button
                type="button"
                onClick={onOpenCoins}
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold transition shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                title="Ví Xu Chòi - Bấm để nạp thêm hoặc xem lịch sử"
              >
                <ChoiCoin size={18} animate glow />
                <span className="font-mono text-xs sm:text-sm font-black text-amber-900">
                  {(currentUser.coins ?? 50).toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-amber-800 hidden min-[480px]:inline">
                  Xu
                </span>
                <span className="h-4 w-4 rounded-full bg-[#006368] text-white flex items-center justify-center text-[10px] font-black ml-0.5 shadow-2xs">
                  +
                </span>
              </button>
            )}

            {/* User Capsule */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 shadow-xs transition hover:scale-105 cursor-pointer"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullName}
                      className="h-4.5 w-4.5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <span>👤</span>
                  )}
                  <span className="max-w-[80px] sm:max-w-[110px] truncate">
                    {currentUser.username || currentUser.fullName}
                  </span>
                  <span className="text-[10px] opacity-60">▼</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white p-3 shadow-2xl border border-slate-100 z-50">
                    <div className="border-b border-slate-100 pb-2 mb-2">
                      <p className="text-xs font-bold text-slate-800 truncate">{currentUser.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>

                    {/* Coin Row in GamePortal Dropdown */}
                    <div className="mb-2.5 p-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ChoiCoin size={20} glow />
                        <div>
                          <span className="text-[10px] text-amber-800 font-semibold block leading-tight">Ví Xu Chòi:</span>
                          <span className="text-xs font-black text-amber-950 font-mono">
                            {(currentUser.coins ?? 50).toLocaleString()} Xu
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false)
                          onOpenCoins?.()
                        }}
                        className="text-[10px] bg-[#006368] hover:bg-[#004d50] text-white font-bold px-2 py-1 rounded-lg transition shadow-2xs cursor-pointer shrink-0"
                      >
                        + Nạp Xu
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        onBackToSite()
                      }}
                      className="w-full text-left rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-2 mb-1"
                    >
                      <span>🏠</span>
                      <span>{isVie ? 'Về Trang chủ' : 'Home'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        onGoToShop()
                      }}
                      className="w-full text-left rounded-xl px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition cursor-pointer flex items-center gap-2 mb-1"
                    >
                      <span>🛍️</span>
                      <span>{isVie ? 'Cửa Hàng Di Sản' : 'Heritage Store'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        onLogout()
                      }}
                      className="w-full text-left rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer flex items-center gap-2"
                    >
                      <span>🚪</span>
                      <span>{isVie ? 'Đăng xuất' : 'Logout'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border border-[#006368]/30 text-[#006368] hover:bg-white transition cursor-pointer shadow-xs"
              >
                <span>👤</span>
                <span>{isVie ? 'Đăng nhập' : 'Sign in'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around border-t border-[#006368]/10 bg-white/90 px-2 py-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('arena')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1 ${
              activeTab === 'arena' ? 'bg-[#006368] text-white' : 'text-[#006368]'
            }`}
          >
            <span>🎮</span>
            <span>{isVie ? 'Đấu Trường' : 'Arena'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('caller')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1 ${
              activeTab === 'caller' ? 'bg-[#006368] text-white' : 'text-[#006368]'
            }`}
          >
            <span>🎋</span>
            <span>{isVie ? 'Quản Trò' : 'Caller'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1 ${
              activeTab === 'browse' ? 'bg-[#006368] text-white' : 'text-[#006368]'
            }`}
          >
            <span>📻</span>
            <span>{isVie ? '30 Điệu Hò' : 'Chants'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('puzzle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1 ${
              activeTab === 'puzzle' ? 'bg-[#006368] text-white' : 'text-[#006368]'
            }`}
          >
            <span>🧩</span>
            <span>{isVie ? 'Ghép Tranh' : 'Puzzle'}</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* HERO BANNER SECTION */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#006368]/30 bg-white/80 px-4 py-1.5 backdrop-blur-md shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#C44837] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#006368]">
              {isVie ? 'KHÔNG GIAN HỘI CHƠI BÀI CHÒI TRUYỀN THỐNG' : 'TRADITIONAL FOLK BAI CHOI ARENA'}
            </span>
          </div>

          <h1
            className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-[#006368] tracking-tight font-serif"
            style={{ fontFamily: 'var(--font-display, serif)' }}
          >
            {isVie ? 'HỘI CHƠI BÀI CHÒI & ĐẤU TRƯỜNG DÂN GIAN' : 'FOLK BAI CHOI GAME & HERITAGE ARENA'}
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-[#006368]/85">
            {isVie
              ? 'Trải nghiệm trọn vẹn văn hóa Bài Chòi miền Trung: từ bàn chơi trực tuyến đối kháng với máy hoặc bạn bè, công cụ Quản trò / Anh Hiệu ảo cho hội chơi thực tế, đến kho tàng 30 câu hò thai nguyên bản.'
              : 'Immerse in Central Vietnam folk Bài Chòi: interactive matches against bots or friends, a virtual caller tool for real-life events, and the complete library of 30 traditional chants.'}
          </p>

          {/* 4 FEATURE QUICK SELECTOR CARDS */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto text-left">
            {/* Card 1: Game Arena */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('arena')
                setIsPlayingGame(true)
              }}
              className={`p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                activeTab === 'arena'
                  ? 'bg-gradient-to-br from-[#006368] to-[#04374F] text-white border-transparent shadow-xl ring-2 ring-[#006368]'
                  : 'bg-white/80 hover:bg-white text-slate-800 border-[#006368]/20 shadow-sm'
              }`}
            >
              <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition">🎮</div>
              <h3 className={`text-sm sm:text-base font-extrabold font-serif ${activeTab === 'arena' ? 'text-white' : 'text-[#006368]'}`}>
                {isVie ? 'Đấu Trường Game' : 'Match Arena'}
              </h3>
              <p className={`text-[11px] sm:text-xs mt-1 line-clamp-2 ${activeTab === 'arena' ? 'text-white/80' : 'text-slate-600'}`}>
                {isVie ? 'Đấu với máy, bạn bè, hò thai nhận cờ & hô Tới!' : 'Play vs bots, friends, claim flags and win!'}
              </p>
            </button>

            {/* Card 2: Virtual Caller */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('caller')
              }}
              className={`p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                activeTab === 'caller'
                  ? 'bg-gradient-to-br from-[#006368] to-[#04374F] text-white border-transparent shadow-xl ring-2 ring-[#006368]'
                  : 'bg-white/80 hover:bg-white text-slate-800 border-[#006368]/20 shadow-sm'
              }`}
            >
              <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition">🎋</div>
              <h3 className={`text-sm sm:text-base font-extrabold font-serif ${activeTab === 'caller' ? 'text-white' : 'text-[#006368]'}`}>
                {isVie ? 'Ống Rút Thẻ Quản Trò' : 'Virtual Caller'}
              </h3>
              <p className={`text-[11px] sm:text-xs mt-1 line-clamp-2 ${activeTab === 'caller' ? 'text-white/80' : 'text-slate-600'}`}>
                {isVie ? 'Ống 30 quân, quản trò cho hội chơi ngoài đời & lớp học' : 'Bamboo drawer for real-life gatherings & hosts'}
              </p>
            </button>

            {/* Card 3: 30 Chants */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('browse')
              }}
              className={`p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-gradient-to-br from-[#006368] to-[#04374F] text-white border-transparent shadow-xl ring-2 ring-[#006368]'
                  : 'bg-white/80 hover:bg-white text-slate-800 border-[#006368]/20 shadow-sm'
              }`}
            >
              <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition">📻</div>
              <h3 className={`text-sm sm:text-base font-extrabold font-serif ${activeTab === 'browse' ? 'text-white' : 'text-[#006368]'}`}>
                {isVie ? '30 Điệu Hò Dài' : '30 Folk Chants'}
              </h3>
              <p className={`text-[11px] sm:text-xs mt-1 line-clamp-2 ${activeTab === 'browse' ? 'text-white/80' : 'text-slate-600'}`}>
                {isVie ? 'Kho âm thanh hò thai nguyên bản, lời thơ cổ truyền' : 'Full-length traditional chants and poetic lyrics'}
              </p>
            </button>

            {/* Card 4: Puzzle */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('puzzle')
              }}
              className={`p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                activeTab === 'puzzle'
                  ? 'bg-gradient-to-br from-[#006368] to-[#04374F] text-white border-transparent shadow-xl ring-2 ring-[#006368]'
                  : 'bg-white/80 hover:bg-white text-slate-800 border-[#006368]/20 shadow-sm'
              }`}
            >
              <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition">🧩</div>
              <h3 className={`text-sm sm:text-base font-extrabold font-serif ${activeTab === 'puzzle' ? 'text-white' : 'text-[#006368]'}`}>
                {isVie ? 'Ghép Tranh Thẻ Bài' : 'Card Puzzle'}
              </h3>
              <p className={`text-[11px] sm:text-xs mt-1 line-clamp-2 ${activeTab === 'puzzle' ? 'text-white/80' : 'text-slate-600'}`}>
                {isVie ? 'Thử thách trí tuệ ghép tranh dân gian theo cấp độ' : 'Folk puzzle challenge with 4 difficulty levels'}
              </p>
            </button>
          </div>
        </div>

        {/* ── TAB 1: ĐẤU TRƯỜNG GAME INTERACTIVE ── */}
        {activeTab === 'arena' && (
          <div className="rounded-3xl bg-white/90 border border-[#006368]/20 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
            <div className="max-w-4xl mx-auto">
              {/* Header Box */}
              <div className="text-center mb-8 border-b border-[#006368]/15 pb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C44837] bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                  {isVie ? 'ĐẤU TRƯỜNG TƯƠNG TÁC TRỰC TUYẾN' : 'ONLINE FOLK MATCHMAKING'}
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-black text-[#006368] mt-3 font-serif"
                  style={{ fontFamily: 'var(--font-display, serif)' }}
                >
                  {isVie ? 'KHỞI ĐỘNG BÀN CHƠI BÀI CHÒI DÂN GIAN' : 'LAUNCH BAI CHOI MATCH'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                  {isVie
                    ? 'Bạn sẽ nhận 3 lá bài gỗ ngẫu nhiên. Lắng nghe Chị Hiệu cất tiếng hò, nhận diện quân bài để gom đủ 3 lá cờ và hô vang "TỚI RỒI!" trước các đối thủ!'
                    : 'You will receive 3 random wooden cards. Listen to the folk caller chants, match your cards to earn flags, and be the first to call "TOI ROI!"'}
                </p>
              </div>

              {/* Sound Mode Toggle */}
              <div className="mb-8 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl">🔊</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-amber-950">
                      {isVie ? 'Chế độ âm thanh hô thai:' : 'Chanting Sound Mode:'}
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      {gameAudioMode === 'online'
                        ? (isVie ? 'Sound-Online: Nhịp điệu nhanh, âm thanh gọn gàng, phù hợp thi đấu trực tuyến' : 'Sound-Online: Fast pace, concise chants')
                        : (isVie ? 'Sound-Offline: Điệu hò dài cổ truyền 30 câu nguyên bản sâu lắng' : 'Sound-Offline: Full-length authentic folk chants')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center rounded-xl bg-white p-1 border border-amber-300 shrink-0">
                  <button
                    type="button"
                    onClick={() => setGameAudioMode('online')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      gameAudioMode === 'online'
                        ? 'bg-[#006368] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⚡ {isVie ? 'Sound Online' : 'Online Sound'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameAudioMode('offline')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      gameAudioMode === 'offline'
                        ? 'bg-[#C44837] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📻 {isVie ? 'Sound Offline' : 'Offline Sound'}
                  </button>
                </div>
              </div>

              {/* Game Modes Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Mode 1 */}
                <div className="rounded-2xl border-2 border-[#006368]/20 bg-gradient-to-b from-white to-slate-50 p-5 flex flex-col justify-between hover:border-[#006368] transition group shadow-sm">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-2xl mb-3 shadow-xs">
                      🤖
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 font-serif" style={{ fontFamily: 'var(--font-display)' }}>
                      {isVie ? 'Chơi Với Máy (Bot Solo)' : 'Play vs Smart Bots'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {isVie
                        ? 'Đấu với 3 đối thủ máy (Ba Bò, Chín Chúc, Bảy Búa). Trải nghiệm nhịp phách dân gian tức thì mà không cần chờ đợi.'
                        : 'Battle 3 smart AI bots with genuine folk rhythm and instant matchmaking.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPlayingGame(true)}
                    className="mt-5 w-full py-2.5 rounded-xl bg-[#006368] hover:bg-[#004d50] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    {isVie ? 'Vào Chơi Với Máy ➔' : 'Play vs Bots ➔'}
                  </button>
                </div>

                {/* Mode 2 */}
                <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/40 to-white p-5 flex flex-col justify-between hover:border-amber-500 transition group shadow-sm">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center text-2xl mb-3 shadow-xs">
                      👥
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 font-serif" style={{ fontFamily: 'var(--font-display)' }}>
                      {isVie ? 'Phòng Chơi Bạn Bè' : 'Friend Room'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {isVie
                        ? 'Tạo phòng thi đấu riêng hoặc nhập mã hội CHOI-xxxxxx để so tài trực tiếp cùng bạn bè ở mọi miền tổ quốc.'
                        : 'Create a private room or enter room code CHOI-xxxxxx to play with friends anywhere.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPlayingGame(true)}
                    className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#C44837] to-[#7C2421] text-white text-xs font-bold transition shadow-md hover:scale-[1.02] cursor-pointer"
                  >
                    {isVie ? 'Tạo / Vào Phòng ➔' : 'Create / Join Room ➔'}
                  </button>
                </div>

                {/* Mode 3 */}
                <div className="rounded-2xl border-2 border-teal-200 bg-gradient-to-b from-teal-50/40 to-white p-5 flex flex-col justify-between hover:border-teal-400 transition group shadow-sm">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center text-2xl mb-3 shadow-xs">
                      🎲
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 font-serif" style={{ fontFamily: 'var(--font-display)' }}>
                      {isVie ? 'Ghép Trận Ngẫu Nhiên' : 'Random Matchmaking'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {isVie
                        ? 'Tìm kiếm và thi tài ngẫu nhiên với các hội viên Bài Chòi đang cùng có mặt trên đấu trường trực tuyến.'
                        : 'Match randomly with other Bài Chòi enthusiasts currently online.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPlayingGame(true)}
                    className="mt-5 w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    {isVie ? 'Tìm Trận Ngẫu Nhiên ➔' : 'Find Match ➔'}
                  </button>
                </div>
              </div>

              {/* Big Launch Button */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsPlayingGame(true)}
                  className="inline-flex items-center gap-3 px-8 sm:px-12 py-4 rounded-2xl bg-gradient-to-r from-[#C44837] via-[#D35400] to-[#7C2421] text-white text-base sm:text-lg font-black shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <span className="text-2xl">🎮</span>
                  <span>{isVie ? 'KHỞI ĐỘNG VÁN CHƠI BÀI CHÒI NGAY' : 'START BAI CHOI GAME NOW'}</span>
                  <span>➔</span>
                </button>
                <p className="text-[11px] text-slate-500 mt-3">
                  {isVie
                    ? 'Bấm nút để mở bàn cờ tương tác toàn màn hình. Bạn có thể nhấn quay lại để đổi chế độ bất cứ lúc nào.'
                    : 'Click to launch full-screen interactive game. You can return to switch modes anytime.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: ỐNG RÚT THẺ & ANH HIỆU ẢO (OFFLINE PLAY) ── */}
        {activeTab === 'caller' && (
          <div className="rounded-3xl bg-white/90 border border-[#006368]/20 shadow-xl overflow-hidden backdrop-blur-md">
            <OfflinePlay
              lang={lang}
              initialTab="caller"
              onOpenGameOffline={() => {
                setActiveTab('arena')
                setGameAudioMode('offline')
                setIsPlayingGame(true)
              }}
            />
          </div>
        )}

        {/* ── TAB 3: 30 ĐIỆU HÒ DÀI CỔ TRUYỀN ── */}
        {activeTab === 'browse' && (
          <div className="rounded-3xl bg-white/90 border border-[#006368]/20 shadow-xl overflow-hidden backdrop-blur-md">
            <OfflinePlay
              lang={lang}
              initialTab="browse"
              onOpenGameOffline={() => {
                setActiveTab('arena')
                setGameAudioMode('offline')
                setIsPlayingGame(true)
              }}
            />
          </div>
        )}

        {/* ── TAB 4: THỬ THÁCH GHÉP TRANH BÀI CHÒI (PUZZLE) ── */}
        {activeTab === 'puzzle' && (
          <div className="rounded-3xl bg-white/90 border border-[#006368]/20 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
            <div className="max-w-4xl mx-auto">
              {/* Header Box */}
              <div className="text-center mb-8 border-b border-[#006368]/15 pb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-[#006368] bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
                  {isVie ? 'TRÒ CHƠI DÂN GIAN TRÍ TUỆ' : 'FOLK PUZZLE CHALLENGE'}
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-black text-[#006368] mt-3 font-serif"
                  style={{ fontFamily: 'var(--font-display, serif)' }}
                >
                  {isVie ? 'THỬ THÁCH GHÉP TRANH THẺ BÀI CHÒI' : 'BAI CHOI CARD PUZZLE'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto">
                  {isVie
                    ? 'Kéo thả các mảnh tranh để tái hiện diện mạo nguyên bản của các quân bài Bài Chòi cổ truyền. Lắng nghe câu hò thai tương ứng khi hoàn thành!'
                    : 'Drag and snap puzzle pieces to assemble traditional Bài Chòi cards while enjoying their folk chants!'}
                </p>
              </div>

              {/* Selector Bar: Card & Level */}
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Chọn quân bài */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {isVie ? 'Chọn quân bài muốn ghép:' : 'Select card to puzzle:'}
                  </label>
                  <select
                    value={selectedPuzzleCard.id}
                    onChange={(e) => {
                      const found = CARDS.find((c) => c.id === e.target.value)
                      if (found) {
                        setSelectedPuzzleCard(found)
                        setPuzzleSuccess(false)
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-xs focus:border-[#006368] focus:outline-none"
                  >
                    {CARDS.map((card, idx) => (
                      <option key={card.id} value={card.id}>
                        {idx + 1}. {card.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chọn cấp độ */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {isVie ? 'Độ khó thử thách:' : 'Difficulty level:'}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { lv: 1, name: 'Dễ (4)', color: 'border-emerald-400' },
                      { lv: 2, name: 'Vừa (9)', color: 'border-sky-400' },
                      { lv: 3, name: 'Khó (Ẩn)', color: 'border-purple-400' },
                      { lv: 4, name: 'Cực khó', color: 'border-orange-400' },
                    ].map((item) => (
                      <button
                        key={item.lv}
                        type="button"
                        onClick={() => {
                          setPuzzleLevel(item.lv as PuzzleLevel)
                          setPuzzleSuccess(false)
                        }}
                        className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition cursor-pointer text-center ${
                          puzzleLevel === item.lv
                            ? 'bg-[#006368] text-white border-[#006368] shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-50 ' + item.color
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Puzzle Container */}
              <div className="relative rounded-2xl bg-slate-900 p-4 sm:p-6 shadow-xl border-4 border-[#006368]/40 min-h-[460px] flex items-center justify-center">
                <BaiChoiPuzzle
                  card={selectedPuzzleCard}
                  isCalling={true}
                  level={puzzleLevel}
                  onComplete={() => {
                    setPuzzleSuccess(true)
                  }}
                />

                {/* Victory Overlay if solved */}
                {puzzleSuccess && (
                  <div className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20">
                    <span className="text-5xl animate-bounce mb-3">🎉</span>
                    <h3 className="text-2xl font-black text-amber-300 font-serif">
                      {isVie ? 'XUẤT SẮC! BẠN ĐÃ HOÀN THÀNH!' : 'EXCELLENT! PUZZLE COMPLETED!'}
                    </h3>
                    <p className="text-sm text-white/90 mt-2 max-w-sm">
                      {isVie
                        ? `Bạn đã ghép hoàn chỉnh thẻ bài "${selectedPuzzleCard.name}". Hãy thử thách với các quân bài và cấp độ khó hơn nhé!`
                        : `You have successfully assembled the "${selectedPuzzleCard.name}" card.`}
                    </p>
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPuzzleSuccess(false)}
                        className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        🔄 {isVie ? 'Chơi lại quân này' : 'Play again'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx = (CARDS.findIndex((c) => c.id === selectedPuzzleCard.id) + 1) % CARDS.length
                          setSelectedPuzzleCard(CARDS[nextIdx])
                          setPuzzleSuccess(false)
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#006368] hover:bg-[#004d50] text-white text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        ➔ {isVie ? 'Thử quân tiếp theo' : 'Next card'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── GAME FULLSCREEN OVERLAY IF PLAYING ── */}
      {isPlayingGame && (
        <BaiChoiGame
          onClose={() => setIsPlayingGame(false)}
          initialAudioMode={gameAudioMode}
        />
      )}

      {/* ── FOOTER ĐỎ TRUYỀN THỐNG ĐỒNG BỘ ── */}
      <footer
        className="mt-16 text-white border-t-4 border-amber-400/80"
        style={{
          background: 'linear-gradient(180deg, #96281e 0%, #701c15 60%, #4a120d 100%)',
          boxShadow: '0 -10px 30px rgba(74, 18, 13, 0.35)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Cột 1: Thông tin thương hiệu */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-white/10 p-2 border border-white/20 flex items-center justify-center">
                  <img src="/assets/choi-transparent.png" alt="Logo Chòi" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-wider text-amber-200 font-serif" style={{ fontFamily: 'var(--font-display)' }}>
                    BÀI CHÒI
                  </h3>
                  <p className="text-xs text-white/80 font-medium">Di sản văn hóa phi vật thể nhân loại</p>
                </div>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-white/90">
                {isVie
                  ? 'Không gian trải nghiệm hội chơi Bài Chòi đa chiều, hòa quyện nghệ thuật dân gian và công nghệ số.'
                  : 'Multi-dimensional Bài Chòi folk gaming space, blending heritage traditions with modern interactive technology.'}
              </p>
            </div>

            {/* Cột 2: Điều hướng nhanh */}
            <div className="lg:col-span-2 space-y-3 text-left">
              <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-200 font-serif">
                {isVie ? 'Điều Hướng' : 'Navigation'}
              </h4>
              <ul className="space-y-2 text-xs sm:text-[13px] text-white/85">
                <li>
                  <button type="button" onClick={onBackToSite} className="hover:text-amber-200 transition cursor-pointer">
                    ← {isVie ? 'Về Trang chủ' : 'Home'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setActiveTab('arena')} className="hover:text-amber-200 transition cursor-pointer">
                    🎮 {isVie ? 'Đấu Trường Game' : 'Game Arena'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setActiveTab('caller')} className="hover:text-amber-200 transition cursor-pointer">
                    🎋 {isVie ? 'Ống Rút Quản Trò' : 'Virtual Caller'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setActiveTab('browse')} className="hover:text-amber-200 transition cursor-pointer">
                    📻 {isVie ? '30 Điệu Hò Dài' : '30 Chants'}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onGoToShop} className="hover:text-amber-200 transition cursor-pointer font-bold text-amber-100">
                    🛍️ {isVie ? 'Cửa Hàng Di Sản' : 'Heritage Store'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Cột 3: Chính sách & Quy định (8 mục) */}
            <div className="lg:col-span-3 space-y-3 text-left">
              <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-200 font-serif">
                {isVie ? 'Chính Sách & Quy Định' : 'Policies & Terms'}
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-[13px] text-white/85">
                <li>
                  <button type="button" onClick={() => onOpenPolicy('dieu-khoan')} className="hover:text-amber-200 transition cursor-pointer">
                    • Điều khoản sử dụng
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onOpenPolicy('bao-mat')} className="hover:text-amber-200 transition cursor-pointer">
                    • Chính sách bảo mật
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onOpenPolicy('thanh-toan')} className="hover:text-amber-200 transition cursor-pointer">
                    • Chính sách thanh toán (COD)
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onOpenPolicy('doi-tra')} className="hover:text-amber-200 transition cursor-pointer">
                    • Đổi trả & Hoàn tiền
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onOpenPolicy('du-an')} className="hover:text-amber-200 transition cursor-pointer font-bold text-amber-200">
                    • Giới thiệu dự án Color Up 2026
                  </button>
                </li>
              </ul>
            </div>

            {/* Cột 4: Liên hệ */}
            <div className="lg:col-span-3 space-y-3 text-left">
              <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-200 font-serif">
                {isVie ? 'Liên Hệ & Kết Nối' : 'Contact & Connect'}
              </h4>
              <div className="space-y-2 text-xs sm:text-[13px] text-white/90">
                <a href="mailto:lienntk.ce190812@gmail.com" className="flex items-center gap-2 hover:text-amber-200 transition">
                  <span>✉️</span>
                  <span className="break-all">lienntk.ce190812@gmail.com</span>
                </a>
                <a href="tel:0848180081" className="flex items-center gap-2 hover:text-amber-200 transition">
                  <span>📞</span>
                  <span>0848 180 081 / 0905 123 456</span>
                </a>
                <p className="flex items-start gap-2">
                  <span>📍</span>
                  <span>Quy Nhơn (Bình Định) & Hội An (Quảng Nam)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Thanh đáy */}
          <div className="mt-12 pt-6 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/80">
            <p>© 2026 Bài Chòi — Dự án tham dự cuộc thi Color Up 2026. Mọi quyền được bảo lưu.</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => onOpenPolicy('dieu-khoan')} className="hover:text-amber-200 transition cursor-pointer">
                Điều khoản
              </button>
              <span>·</span>
              <button type="button" onClick={() => onOpenPolicy('bao-mat')} className="hover:text-amber-200 transition cursor-pointer">
                Bảo mật
              </button>
              <span>·</span>
              <button type="button" onClick={() => onOpenPolicy('du-an')} className="hover:text-amber-200 transition cursor-pointer">
                Thông tin dự án
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
