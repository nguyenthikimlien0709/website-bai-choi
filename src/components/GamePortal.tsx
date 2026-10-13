import { useState, useRef, useEffect } from 'react'
import type { UserProfile } from '../types/auth'
import BaiChoiGame from '../BaiChoiGame'
import OfflinePlay from '../OfflinePlay'
import ChoiCoin from './ChoiCoin'

export type GamePortalTab = 'caller'

interface GamePortalProps {
  lang: 'VIE' | 'ENG'
  setLang: (l: 'VIE' | 'ENG') => void
  currentUser: UserProfile | null
  initialTab?: any
  onBackToSite: () => void
  onGoToShop: () => void
  onOpenAuth: (mode?: 'login' | 'register') => void
  onLogout: () => void
  onOpenPolicy: (id?: string) => void
  onOpenCoins?: () => void
}

export default function GamePortal({
  lang,
  currentUser,
  onBackToSite,
  onGoToShop,
  onOpenAuth,
  onLogout,
  onOpenPolicy,
  onOpenCoins,
}: GamePortalProps) {
  const isVie = lang === 'VIE'
  const [isPlayingGame, setIsPlayingGame] = useState(false)

  // User menu state
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

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
                    {isVie ? 'ỐNG RÚT QUẢN TRÒ' : 'VIRTUAL CALLER'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#006368]/70 flex items-center gap-1 whitespace-nowrap">
                  <span>←</span> <span>{isVie ? 'Trang chủ' : 'Home'}</span>
                </p>
              </div>
            </button>
          </div>

          {/* Center Navigation Badge */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#006368]/10 border border-[#006368]/20 text-[#006368] font-bold text-sm">
            <span>🎋</span>
            <span>{isVie ? 'Ống Rút Thẻ & Anh Hiệu Ảo' : 'Virtual Caller Tube'}</span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
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
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-white border border-[#006368]/25 hover:border-[#006368] transition shadow-xs cursor-pointer"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullName || currentUser.username}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#006368] to-[#04374F] text-white flex items-center justify-center text-xs font-bold">
                      {(currentUser.fullName || currentUser.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-bold text-slate-800 max-w-[100px] truncate">
                    {currentUser.fullName || currentUser.username}
                  </span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    {/* Coin Row in GamePortal Dropdown */}
                    <div className="px-3 py-2 my-1 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ChoiCoin size={20} glow />
                        <div>
                          <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">Số dư Xu Chòi</p>
                          <p className="font-mono text-sm font-black text-amber-950">
                            {(currentUser.coins ?? 50).toLocaleString()} <span className="text-xs font-bold">Xu</span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false)
                          onOpenCoins?.()
                        }}
                        className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black shadow-2xs transition active:scale-95 cursor-pointer"
                      >
                        Nạp
                      </button>
                    </div>

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
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* HERO BANNER SECTION */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#006368]/30 bg-white/80 px-4 py-1.5 backdrop-blur-md shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#C44837] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#006368]">
              {isVie ? 'CÔNG CỤ QUẢN TRÒ BÀI CHÒI TRUYỀN THỐNG' : 'TRADITIONAL FOLK CALLER TOOL'}
            </span>
          </div>

          <h1
            className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-[#006368] tracking-tight font-serif"
            style={{ fontFamily: 'var(--font-display, serif)' }}
          >
            {isVie ? 'ỐNG RÚT BÀI QUẢN TRÒ & ANH HIỆU ẢO' : 'VIRTUAL CALLER TUBE & FOLK CHANTS'}
          </h1>

          <p className="mx-auto mt-3 max-w-3xl text-sm sm:text-base leading-relaxed text-[#006368]/85">
            {isVie
              ? 'Hệ thống ống tre 30 thẻ bài nguyên bản, hỗ trợ Quản trò / Anh Hiệu ảo lắc ống, rút thẻ và phát âm thanh câu hò thai truyền thống. Phục vụ đắc lực cho hội chơi thực tế, gia đình, lớp học và các sự kiện lễ hội dân gian.'
              : 'Authentic 30-card bamboo tube caller tool with original chants. Perfect for real-life gatherings, classrooms, and folk cultural festivals.'}
          </p>
        </div>

        {/* ── ỐNG RÚT THẺ & ANH HIỆU ẢO (OFFLINE PLAY) ── */}
        <div className="rounded-3xl bg-white/90 border border-[#006368]/20 shadow-xl overflow-hidden backdrop-blur-md">
          <OfflinePlay
            lang={lang}
            onOpenGameOffline={() => {
              setIsPlayingGame(true)
            }}
          />
        </div>
      </main>

      {/* ── GAME FULLSCREEN OVERLAY IF PLAYING ── */}
      {isPlayingGame && (
        <BaiChoiGame
          onClose={() => setIsPlayingGame(false)}
          initialAudioMode="offline"
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
                  ? 'Công cụ Quản trò Bài Chòi trực quan, gìn giữ trọn vẹn nét văn hóa diễn xướng hò thai truyền thống miền Trung.'
                  : 'Intuitive Bài Chòi Folk Caller tool, preserving the authentic traditional chanting culture of Central Vietnam.'}
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
