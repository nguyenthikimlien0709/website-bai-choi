import { useState, useEffect } from 'react'

const STORAGE_COOKIE_KEY = 'bai_choi_cookie_consent_decision'

interface CookieSettings {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

interface CookieBannerProps {
  lang?: 'VIE' | 'ENG'
  onOpenPolicy?: (id?: string) => void
}

export default function CookieBanner({ lang = 'VIE', onOpenPolicy }: CookieBannerProps) {
  const [visible, setVisible] = useState(false)
  const [view, setView] = useState<'main' | 'customize'>('main')

  // Cấu hình cookie
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [marketingEnabled, setMarketingEnabled] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_COOKIE_KEY)
    if (!saved) {
      // Hiển thị nhẹ nhàng sau 0.8s khi vào web
      const timer = setTimeout(() => {
        setVisible(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const saveAndClose = (settings: CookieSettings) => {
    localStorage.setItem(STORAGE_COOKIE_KEY, JSON.stringify(settings))
    setVisible(false)
  }

  // Tắt tạm thời phiên hiện tại
  const handleCloseTemporary = () => {
    setVisible(false)
  }

  const handleAcceptAll = () => {
    saveAndClose({
      necessary: true,
      analytics: true,
      marketing: true,
    })
  }

  const handleAcceptEssential = () => {
    saveAndClose({
      necessary: true,
      analytics: false,
      marketing: false,
    })
  }

  const handleSaveCustom = () => {
    saveAndClose({
      necessary: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
    })
  }

  if (!visible) return null

  const isVie = lang === 'VIE'

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={isVie ? 'Thông báo Cookie' : 'Cookie Notice'}
      className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-[90] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="relative pointer-events-auto w-[calc(100vw-1.5rem)] sm:w-[420px] overflow-hidden rounded-2xl bg-white shadow-xl border border-[#006368]/20 ring-1 ring-black/5">
        {/* Dải viền đồng điệu 3 màu di sản Bài Chòi */}
        <div className="h-1 w-full bg-gradient-to-r from-[#006368] via-[#F29963] to-[#C44837]" />

        {/* Nút đóng tinh tế góc trên phải */}
        <button
          type="button"
          onClick={handleCloseTemporary}
          className="absolute top-2.5 right-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer text-xs"
          aria-label={isVie ? 'Đóng tạm thời' : 'Close'}
          title={isVie ? 'Đóng tạm thời' : 'Close'}
        >
          ✕
        </button>

        {/* ── MÀN HÌNH 1: BANNER CHÍNH (THANH LỊCH & ĐƠN GIẢN) ── */}
        {view === 'main' && (
          <div className="p-4 sm:p-4.5">
            <div className="flex items-start gap-3">
              {/* Icon Cookie / Bảo mật ấm áp */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#006368]/8 border border-[#006368]/15 text-[#006368]">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                  <path d="M8.5 8.5v.01" />
                  <path d="M7 13v.01" />
                  <path d="M12 15v.01" />
                  <path d="M16 12v.01" />
                </svg>
              </div>

              {/* Tiêu đề & nội dung */}
              <div className="min-w-0 flex-1 pr-4">
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {isVie ? 'Quyền riêng tư & Cookie' : 'Privacy & Cookies'}
                </h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {isVie
                    ? 'Website sử dụng cookie thiết yếu để bảo mật phiên đăng nhập và duy trì trải nghiệm tốt nhất cho bạn.'
                    : 'We use essential cookies to maintain login security and deliver the best folk heritage experience.'}
                </p>
                {onOpenPolicy && (
                  <button
                    type="button"
                    onClick={() => onOpenPolicy('cookie')}
                    className="mt-1 inline-block text-[11px] font-semibold text-[#006368] hover:underline cursor-pointer"
                  >
                    {isVie ? 'Xem chính sách Cookie & Lưu trữ' : 'View Cookie Policy'}
                  </button>
                )}
              </div>
            </div>

            {/* Các nút hành động lịch sự */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setView('customize')}
                className="text-xs font-semibold text-slate-500 hover:text-[#006368] transition cursor-pointer px-1 py-1"
              >
                {isVie ? 'Tùy chỉnh' : 'Preferences'}
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAcceptEssential}
                  className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer active:scale-95"
                >
                  {isVie ? 'Chỉ cần thiết' : 'Essential Only'}
                </button>

                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="rounded-xl bg-[#006368] hover:bg-[#004d50] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer active:scale-95"
                >
                  {isVie ? 'Chấp nhận tất cả' : 'Accept All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MÀN HÌNH 2: TÙY CHỈNH COOKIE (GỌN GÀNG, RÕ RÀNG) ── */}
        {view === 'customize' && (
          <div className="p-4 sm:p-4.5">
            {/* Header tùy chỉnh */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3 pr-6">
              <div className="flex items-center gap-2">
                <span className="text-base">⚙️</span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {isVie ? 'Tùy chọn quyền riêng tư & Cookie' : 'Cookie Preferences'}
                </h3>
              </div>
            </div>

            {/* Danh sách 3 loại Cookie */}
            <div className="space-y-2">
              {/* 1. Cookie cần thiết */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/70 p-2.5">
                <div className="pr-2">
                  <h4 className="text-xs font-bold text-slate-800">
                    {isVie ? 'Cookie cần thiết (Bắt buộc)' : 'Essential (Required)'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {isVie
                      ? 'Duy trì bảo mật hệ thống và phiên đăng nhập.'
                      : 'Maintain system security and session.'}
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {isVie ? 'Bắt buộc' : 'Required'}
                </span>
              </div>

              {/* 2. Cookie phân tích & hiệu năng */}
              <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-2.5 hover:border-slate-300 transition">
                <div className="pr-2">
                  <h4 className="text-xs font-bold text-slate-800">
                    {isVie ? 'Cookie phân tích & hiệu năng' : 'Analytics & Performance'}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    {isVie
                      ? 'Đo lường lượng tương tác nhằm hoàn thiện trải nghiệm.'
                      : 'Measure usage to improve overall service.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                  className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition cursor-pointer ${
                    analyticsEnabled
                      ? 'bg-[#006368] border-[#006368] text-white'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                  aria-label="Toggle analytics"
                >
                  {analyticsEnabled && (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </div>

              {/* 3. Cookie tiếp thị & thông báo */}
              <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-2.5 hover:border-slate-300 transition">
                <div className="pr-2">
                  <h4 className="text-xs font-bold text-slate-800">
                    {isVie ? 'Cookie tiếp thị & thông báo' : 'Marketing & Notices'}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    {isVie
                      ? 'Gợi ý các sự kiện và ấn phẩm phù hợp sở thích.'
                      : 'Suggest events and heritage publications.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMarketingEnabled(!marketingEnabled)}
                  className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition cursor-pointer ${
                    marketingEnabled
                      ? 'bg-[#006368] border-[#006368] text-white'
                      : 'border-slate-300 bg-white hover:border-slate-400'
                  }`}
                  aria-label="Toggle marketing"
                >
                  {marketingEnabled && (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Các nút hành động tùy chỉnh */}
            <div className="mt-3.5 pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setView('main')}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                {isVie ? 'Quay lại' : 'Back'}
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="rounded-xl bg-[#006368] hover:bg-[#004d50] px-3.5 py-1.5 text-xs font-bold text-white transition cursor-pointer shadow-xs"
              >
                {isVie ? 'Lưu tùy chọn' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
