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
          onOpenGameOffline={() => {
            if (!currentUser) {
              onOpenAuth('login')
              return
            }
            setIsPlayingGame(true)
          }}
        />
      </main>

      {/* ── GAME FULLSCREEN OVERLAY IF PLAYING ── */}
      {isPlayingGame && (
        <BaiChoiGame
          onClose={() => setIsPlayingGame(false)}
          initialAudioMode="offline"
        />
      )}

      {/* ── FOOTER ĐỒNG BỘ 100% THEO PHONG CÁCH TRANG CHỦ ── */}
      <footer
        className="relative text-white border-t-2 border-amber-300/40 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #182e4b 0%, #112239 60%, #0a1524 100%)',
          boxShadow: '0 -10px 40px rgba(10, 21, 36, 0.45)',
        }}
      >
        {/* Họa tiết hoa văn truyền thống trang trí mờ phía nền */}
        <div
          className="pointer-events-none absolute inset-0 opacity-5 mix-blend-overlay"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* CỘT 1: LOGO, MÔ TẢ DỰ ÁN & HUY HIỆU COLOR UP 2026 */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/choi-transparent.png"
                  alt="Logo Bài Chòi"
                  className="h-14 sm:h-16 w-auto object-contain filter drop-shadow-sm"
                />
                <div>
                  <h3
                    className="text-2xl sm:text-3xl font-black tracking-widest text-white uppercase font-serif"
                    style={{ fontFamily: 'var(--font-display, serif)' }}
                  >
                    BÀI CHÒI
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-amber-200">
                    Di sản văn hóa phi vật thể UNESCO
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-md font-normal">
                {isVie
                  ? 'Dự án truyền thông & thiết kế văn hóa tôn vinh di sản nghệ thuật '
                  : 'Media & cultural design project honoring the art heritage of '}
                <strong className="text-white font-bold">
                  {isVie ? 'Bài Chòi Trung Bộ' : 'Central Vietnam Bài Chòi'}
                </strong>
                {isVie
                  ? ' — Di sản văn hóa phi vật thể đại diện của nhân loại được UNESCO vinh danh.'
                  : ' — Intangible Cultural Heritage of Humanity recognized by UNESCO.'}
              </p>

              {/* Huy hiệu tham dự Color Up 2026 */}
              <div>
                <button
                  type="button"
                  onClick={() => onOpenPolicy?.('du-an')}
                  className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs text-white font-medium transition cursor-pointer backdrop-blur-xs shadow-sm group"
                >
                  <span className="text-sm">🎖️</span>
                  <span>
                    Dự án tham dự cuộc thi <strong className="font-bold underline-offset-2 group-hover:underline">Color Up 2026</strong>
                  </span>
                </button>
              </div>
            </div>

            {/* CỘT 2: KHÁM PHÁ / ĐIỀU HƯỚNG */}
            <div className="lg:col-span-2 space-y-3 text-left">
              <h4
                className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-200 font-serif"
                style={{ fontFamily: 'var(--font-display, serif)' }}
              >
                {isVie ? 'Khám Phá' : 'Explore'}
              </h4>
              <ul className="space-y-2 text-xs sm:text-[13px] text-white/85">
                <li>
                  <button
                    type="button"
                    onClick={onBackToSite}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer block"
                  >
                    ← {isVie ? 'Về Trang chủ' : 'Home'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onGoToShop}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer block font-semibold text-amber-100"
                  >
                    {isVie ? 'Cửa hàng & Vé sự kiện 🎟️' : 'Heritage Shop 🛍️'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('du-an')}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer block"
                  >
                    {isVie ? 'Câu chuyện văn hóa' : 'Cultural Story'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('dieu-khoan')}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer block"
                  >
                    {isVie ? 'Luật chơi & Cách tham gia' : 'Game Rules & Guide'}
                  </button>
                </li>
              </ul>
            </div>

            {/* CỘT 3: CHÍNH SÁCH & QUY ĐỊNH (8 MỤC ĐẦY ĐỦ NHẤP MỞ MODAL) */}
            <div className="lg:col-span-3 space-y-3 text-left">
              <h4
                className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-200 font-serif"
                style={{ fontFamily: 'var(--font-display, serif)' }}
              >
                {isVie ? 'Chính Sách & Quy Định' : 'Policies & Terms'}
              </h4>
              <ul className="space-y-1.5 text-xs sm:text-[13px] text-white/85">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('dieu-khoan')}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <span className="text-amber-300">•</span>
                    <span>{isVie ? 'Điều khoản sử dụng' : 'Terms of Service'}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('bao-mat')}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <span className="text-amber-300">•</span>
                    <span>{isVie ? 'Chính sách bảo mật' : 'Privacy Policy'}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('cookie')}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <span className="text-amber-300">•</span>
                    <span>{isVie ? 'Chính sách Cookie & Lưu trữ' : 'Cookie Policy'}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('thanh-toan')}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <span className="text-amber-300">•</span>
                    <span>{isVie ? 'Chính sách thanh toán (COD)' : 'Payment Policy'}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('giao-hang')}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <span className="text-amber-300">•</span>
                    <span>{isVie ? 'Chính sách giao hàng' : 'Shipping Policy'}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('doi-tra')}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <span className="text-amber-300">•</span>
                    <span>{isVie ? 'Chính sách đổi trả & hoàn tiền' : 'Return & Refund Policy'}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('khieu-nai')}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                  >
                    <span className="text-amber-300">•</span>
                    <span>{isVie ? 'Chính sách xử lý khiếu nại' : 'Dispute Policy'}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy?.('du-an')}
                    className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left font-semibold text-amber-200"
                  >
                    <span className="text-amber-300">•</span>
                    <span>{isVie ? 'Thông tin dự án & Giới thiệu' : 'About Project & Info'}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* CỘT 4: LIÊN HỆ & KẾT NỐI */}
            <div className="lg:col-span-3 space-y-3.5 text-left">
              <h4
                className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-200 font-serif"
                style={{ fontFamily: 'var(--font-display, serif)' }}
              >
                {isVie ? 'Liên Hệ & Kết Nối' : 'Contact & Connect'}
              </h4>

              <div className="space-y-2.5 text-xs sm:text-[13px] text-white/90">
                <a
                  href="mailto:lienntk.ce190812@gmail.com"
                  className="flex items-center gap-2.5 hover:text-amber-200 transition group"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white shrink-0 group-hover:bg-white/25">
                    ✉️
                  </span>
                  <span className="break-all">lienntk.ce190812@gmail.com</span>
                </a>

                <a
                  href="tel:0848180081"
                  className="flex items-center gap-2.5 hover:text-amber-200 transition group"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white shrink-0 group-hover:bg-white/25">
                    📞
                  </span>
                  <span>0848 180 081 / 0905 123 456</span>
                </a>

                <div className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white shrink-0 mt-0.5">
                    📍
                  </span>
                  <span className="leading-relaxed">
                    {isVie
                      ? 'Quy Nhơn (Bình Định) & Phố cổ Hội An (Quảng Nam)'
                      : 'Quy Nhon (Binh Dinh) & Hoi An Ancient Town (Quang Nam)'}
                  </span>
                </div>
              </div>

              {/* Nút Theo dõi Fanpage dự án Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center gap-3 rounded-2xl bg-white text-slate-900 p-2.5 sm:p-3 transition hover:bg-slate-50 shadow-md group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2] text-white font-black text-2xl shrink-0 shadow-xs">
                  f
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold text-slate-900 group-hover:text-[#182e4b] transition">
                    {isVie ? 'Theo dõi Fanpage dự án' : 'Follow our Fanpage'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isVie ? 'Cập nhật tin tức & sự kiện mới nhất' : 'Get latest updates & events'}
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* ── THANH BẢN QUYỀN ĐÁY ── */}
          <div className="mt-12 pt-6 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/80">
            <p className="text-center md:text-left">
              © 2026 Bài Chòi — Dự án tham dự cuộc thi Color Up 2026. Mọi quyền được bảo lưu.
            </p>

            {/* Họa tiết hoa văn truyền thống tâm đáy */}
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-300/40 rotate-45 flex items-center justify-center p-1 shadow-xs">
                <div className="w-5 h-5 rounded-sm bg-amber-300/40 -rotate-45 flex items-center justify-center text-[10px] text-amber-200">
                  🎴
                </div>
              </div>
            </div>

            {/* Liên kết điều khoản bảo mật nhanh */}
            <div className="flex items-center gap-3 font-medium text-white/90">
              <button
                type="button"
                onClick={() => onOpenPolicy?.('dieu-khoan')}
                className="hover:text-amber-200 transition cursor-pointer"
              >
                {isVie ? 'Điều khoản' : 'Terms'}
              </button>
              <span className="text-white/40">·</span>
              <button
                type="button"
                onClick={() => onOpenPolicy?.('bao-mat')}
                className="hover:text-amber-200 transition cursor-pointer"
              >
                {isVie ? 'Bảo mật & Cookie' : 'Privacy & Cookies'}
              </button>
              <span className="text-white/40">·</span>
              <button
                type="button"
                onClick={() => onOpenPolicy?.('du-an')}
                className="hover:text-amber-200 transition cursor-pointer"
              >
                {isVie ? 'Thông tin dự án' : 'Project Info'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
