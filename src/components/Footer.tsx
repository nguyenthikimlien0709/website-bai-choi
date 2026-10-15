import React from 'react'

export interface FooterProps {
  c?: any
  lang?: 'VIE' | 'ENG'
  isVietnamese?: boolean
  onOpenPolicy?: (policyId: string) => void
  onNavigateSection?: (sectionId: string) => void
  onBackToSite?: () => void
}

export default function Footer({
  c,
  lang = 'VIE',
  isVietnamese = true,
  onOpenPolicy,
  onNavigateSection,
  onBackToSite,
}: FooterProps) {
  const isVie = isVietnamese ?? (lang === 'VIE') ?? Boolean(c)

  const handleNav = (secId: string) => {
    if (onNavigateSection) {
      onNavigateSection(secId)
      return
    }
    if (secId === 'shop') {
      const el = document.getElementById('shop-items')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    if (onBackToSite) {
      onBackToSite()
      setTimeout(() => {
        const el = document.getElementById(secId)
        el?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  const handlePolicy = (id: string) => {
    if (onOpenPolicy) {
      onOpenPolicy(id)
    }
  }

  return (
    <footer
      className="relative text-white border-t-2 border-amber-300/40 overflow-hidden w-full"
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
              Dự án truyền thông & thiết kế văn hóa tôn vinh di sản nghệ thuật{' '}
              <strong className="text-white font-bold">Bài Chòi Trung Bộ</strong> — Di sản văn hóa phi vật thể đại diện của nhân loại được UNESCO vinh danh.
            </p>

            {/* Huy hiệu tham dự Color Up 2026 */}
            <div>
              <button
                type="button"
                onClick={() => handlePolicy('du-an')}
                className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs text-white font-medium transition cursor-pointer backdrop-blur-xs shadow-sm group"
              >
                <span className="text-sm">🎖️</span>
                <span>
                  Dự án tham dự cuộc thi <strong className="font-bold underline-offset-2 group-hover:underline">Color Up 2026</strong>
                </span>
              </button>
            </div>
          </div>

          {/* CỘT 2: KHÁM PHÁ */}
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
                  onClick={() => handleNav('history')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer block"
                >
                  Câu chuyện văn hóa
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('cards')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer block"
                >
                  Bộ bài 30 thẻ & 3 Pho
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('rules')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer block"
                >
                  Luật chơi & Cách tham gia
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('game')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer block font-semibold text-amber-200"
                >
                  Ống Rút Bài Quản Trò 🎋
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNav('shop')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer block font-semibold text-amber-100"
                >
                  Cửa hàng & Vé sự kiện 🎟️
                </button>
              </li>
            </ul>
          </div>

          {/* CỘT 3: CHÍNH SÁCH & QUY ĐỊNH */}
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
                  onClick={() => handlePolicy('dieu-khoan')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <span className="text-amber-300">•</span>
                  <span>Điều khoản sử dụng</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handlePolicy('bao-mat')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <span className="text-amber-300">•</span>
                  <span>Chính sách bảo mật</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handlePolicy('cookie')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <span className="text-amber-300">•</span>
                  <span>Chính sách Cookie & Lưu trữ</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handlePolicy('thanh-toan')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <span className="text-amber-300">•</span>
                  <span>Chính sách thanh toán (COD)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handlePolicy('giao-hang')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <span className="text-amber-300">•</span>
                  <span>Chính sách giao hàng</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handlePolicy('doi-tra')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <span className="text-amber-300">•</span>
                  <span>Chính sách đổi trả & hoàn tiền</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handlePolicy('khieu-nai')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left"
                >
                  <span className="text-amber-300">•</span>
                  <span>Chính sách xử lý khiếu nại</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handlePolicy('du-an')}
                  className="hover:text-amber-200 hover:translate-x-1 transition cursor-pointer flex items-center gap-1.5 text-left font-semibold text-amber-200"
                >
                  <span className="text-amber-300">•</span>
                  <span>Thông tin dự án & Giới thiệu</span>
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
                  Quy Nhơn (Bình Định) & Phố cổ Hội An (Quảng Nam)
                </span>
              </div>
            </div>

            {/* Nút Theo dõi Fanpage dự án */}
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
                  Theo dõi Fanpage dự án
                </div>
                <div className="text-[10px] text-slate-500">
                  Cập nhật tin tức & sự kiện mới nhất
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
              onClick={() => handlePolicy('dieu-khoan')}
              className="hover:text-amber-200 transition cursor-pointer"
            >
              Điều khoản
            </button>
            <span className="text-white/40">·</span>
            <button
              type="button"
              onClick={() => handlePolicy('bao-mat')}
              className="hover:text-amber-200 transition cursor-pointer"
            >
              Bảo mật & Cookie
            </button>
            <span className="text-white/40">·</span>
            <button
              type="button"
              onClick={() => handlePolicy('du-an')}
              className="hover:text-amber-200 transition cursor-pointer"
            >
              Thông tin dự án
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
