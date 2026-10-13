import { useState, useEffect } from 'react'
import type { UserProfile } from '../types/auth'
import BaiChoiGame from '../BaiChoiGame'
import OfflinePlay from '../OfflinePlay'

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

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return (
    <div
      className="min-h-screen text-slate-800 flex flex-col relative"
      style={{
        backgroundColor: '#72D9DD',
        backgroundImage: 'linear-gradient(180deg, #62D5DC 0%, #A2EBDC 25%, #E3F2EE 65%, #F4F8F6 100%)',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
      }}
    >
      {/* ── MAIN CONTENT CONTAINER (QUANTRO STAGE AS PRIMARY INTERFACE) ── */}
      <main className="flex-1 w-full max-w-[2000px] mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col items-center justify-center">
        <OfflinePlay
          lang={lang}
          currentUser={currentUser}
          onOpenCoins={onOpenCoins}
          onOpenAuth={onOpenAuth}
          onLogout={onLogout}
          onGoToShop={onGoToShop}
          onBackToSite={onBackToSite}
          onOpenGameOffline={() => setIsPlayingGame(true)}
        />
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
        className="mt-8 text-white border-t-4 border-amber-400/80"
        style={{
          background: 'linear-gradient(180deg, #96281e 0%, #701c15 60%, #4a120d 100%)',
          boxShadow: '0 -10px 30px rgba(74, 18, 13, 0.35)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
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

            {/* Cột 3: Chính sách & Quy định */}
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
          <div className="mt-8 pt-4 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/80">
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
