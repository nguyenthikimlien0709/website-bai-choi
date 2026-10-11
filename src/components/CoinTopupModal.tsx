import { useState, useEffect } from 'react'
import type { UserProfile, CoinTransaction } from '../types/auth'
import { authService } from '../lib/authService'
import ChoiCoin from './ChoiCoin'

interface CoinTopupModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: UserProfile | null
  onOpenAuth?: (mode?: 'login' | 'register') => void
  onSuccess?: (newCoins: number) => void
}

interface CoinPackage {
  id: string
  vnd: number
  baseCoins: number
  bonusCoins: number
  totalCoins: number
  tag?: string
  popular?: boolean
  description: string
}

// 6 gói nạp chuẩn đối xứng (3x2 grid), mệnh giá thực tế theo chuẩn ngân hàng & game
const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'pkg_10k',
    vnd: 10000,
    baseCoins: 20,
    bonusCoins: 0,
    totalCoins: 20,
    tag: 'Gói Cơ Bản',
    description: 'Thử nghiệm tính năng hội chơi',
  },
  {
    id: 'pkg_20k',
    vnd: 20000,
    baseCoins: 40,
    bonusCoins: 15,
    totalCoins: 55,
    tag: 'Phổ Biến',
    popular: true,
    description: 'Tặng thêm +15 Xu (+27%)',
  },
  {
    id: 'pkg_50k',
    vnd: 50000,
    baseCoins: 100,
    bonusCoins: 45,
    totalCoins: 145,
    tag: 'Tiết Kiệm',
    description: 'Tặng thêm +45 Xu (+31%)',
  },
  {
    id: 'pkg_100k',
    vnd: 100000,
    baseCoins: 200,
    bonusCoins: 120,
    totalCoins: 320,
    tag: 'Ưu Đãi Hot',
    popular: true,
    description: 'Tặng thêm +120 Xu (+37%)',
  },
  {
    id: 'pkg_200k',
    vnd: 200000,
    baseCoins: 400,
    bonusCoins: 300,
    totalCoins: 700,
    tag: 'Gói Lớn',
    description: 'Tặng thêm +300 Xu (+42%)',
  },
  {
    id: 'pkg_500k',
    vnd: 500000,
    baseCoins: 1000,
    bonusCoins: 850,
    totalCoins: 1850,
    tag: 'Đại Phú VIP',
    description: 'Tặng thêm +850 Xu (+45%)',
  },
]

export default function CoinTopupModal({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onSuccess,
}: CoinTopupModalProps) {
  const [activeTab, setActiveTab] = useState<'packages' | 'history' | 'policy'>('packages')
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage>(COIN_PACKAGES[1])
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'momo'>('vietqr')
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<CoinTransaction[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [countdown, setCountdown] = useState(899) // 14:59

  // Đếm ngược phiên thanh toán như cổng ngân hàng thật
  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 899))
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && currentUser) {
      setTransactions(authService.getCoinTransactions(currentUser.id))
      setSuccessMessage(null)
      setCopiedField(null)
    }
  }, [isOpen, currentUser])

  if (!isOpen) return null

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleCopy = (text: string, field: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
    }
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleTopup = () => {
    if (!currentUser) {
      onClose()
      onOpenAuth?.('login')
      return
    }

    setIsProcessing(true)
    setTimeout(() => {
      const methodName =
        paymentMethod === 'vietqr'
          ? 'VietQR Napas 24/7 (MBBank)'
          : 'Ví Điện Tử MoMo'

      const updated = authService.addCoins(
        selectedPkg.totalCoins,
        `Nạp ${selectedPkg.totalCoins} Xu (${selectedPkg.vnd.toLocaleString('vi-VN')}đ - ${selectedPkg.tag || 'Gói nạp'})`,
        methodName
      )

      setIsProcessing(false)
      setSuccessMessage(
        `Thanh toán hoàn tất! Đã cộng +${selectedPkg.totalCoins} Xu Chòi vào tài khoản thành công.`
      )
      setTransactions(authService.getCoinTransactions(currentUser.id))
      onSuccess?.(updated.coins ?? selectedPkg.totalCoins)
    }, 1000)
  }

  const currentCoins = currentUser?.coins ?? 50
  const orderId = `NAP-${currentUser?.id ? currentUser.id.slice(0, 4).toUpperCase() : '8492'}-${selectedPkg.vnd / 1000}K`
  const transferCode = `NAPXU ${currentUser?.username ? currentUser.username.toUpperCase() : 'KIMLIEN'}`

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Backdrop chuẩn fintech ngân hàng */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Cửa Sổ Cổng Thanh Toán Chuẩn Thực Tế (Fintech Payment Portal) */}
      <div
        className={`relative w-full ${
          isFullscreen
            ? 'max-w-[98vw] h-[96vh]'
            : 'max-w-4xl max-h-[min(94vh,780px)]'
        } flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-700/50 overflow-hidden z-10 my-auto animate-in fade-in zoom-in-95 duration-200 font-sans`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================== */}
        {/* 1. THANH TIÊU ĐỀ CỔNG NẠP CHÍNH THỨC (NAVY FINTECH HEADER) */}
        {/* ============================================================== */}
        <div className="bg-gradient-to-r from-[#0B192C] via-[#0E2838] to-[#0B192C] text-white shrink-0 select-none border-b border-slate-700">
          {/* Viền chỉ vàng sang trọng */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-[#F29963] to-transparent" />

          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Thương hiệu Cổng Thanh Toán */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-1 flex items-center justify-center shadow-md shrink-0">
                <ChoiCoin size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-white uppercase">
                    Cổng Thanh Toán Bài Chòi
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Chính Thức
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 hidden min-[480px]:block">
                  Hệ thống nạp Xu tự động Napas 24/7 · Tỷ lệ quy đổi niêm yết 1.000đ ≈ 2 Xu
                </p>
              </div>
            </div>

            {/* Điều khiển cửa sổ (Fullscreen & Đóng) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="hidden sm:flex h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white items-center justify-center transition cursor-pointer text-xs"
                title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M4 10h6m0 0V4m0 6L3 3m17 7h-6m0 0V4m0 6l7-7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-red-600/80 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer text-sm font-bold shadow-xs active:scale-95"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Dải Thẻ Hội Viên Tích Hợp (Member Status Strip) */}
          <div className="bg-black/35 border-t border-slate-700/60 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-400 text-[11px]">Tài khoản thụ hưởng:</span>
              <strong className="text-white font-semibold flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-[#006368] text-white flex items-center justify-center text-[10px] uppercase font-bold">
                  {currentUser?.username?.[0] || 'K'}
                </span>
                {currentUser?.username || currentUser?.fullName || 'Khách vãng lai'}
              </strong>
              <span className="text-[10px] text-slate-400 font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/5">
                ID: #{currentUser?.id ? currentUser.id.slice(0, 6).toUpperCase() : '84920'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Số dư hiện tại:</span>
              <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 px-2 py-0.5 rounded-full">
                <ChoiCoin size={16} />
                <span className="font-extrabold font-mono text-amber-300 text-sm">
                  {currentCoins.toLocaleString()}
                </span>
                <span className="text-amber-200 text-[11px] font-semibold">Xu Chòi</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. TAB ĐIỀU HƯỚNG CỔNG THANH TOÁN */}
        {/* ============================================================== */}
        <div className="flex border-b border-slate-200 bg-slate-100/90 px-4 sm:px-6 shrink-0 gap-6 select-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('packages')
              setSuccessMessage(null)
            }}
            className={`py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'packages'
                ? 'border-[#006368] text-[#006368]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Nạp Xu Trực Tuyến</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-[#006368] text-[#006368]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Lịch Sử Giao Dịch ({transactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('policy')}
            className={`py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'policy'
                ? 'border-[#006368] text-[#006368]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Bảng Tỷ Giá & Quyền Lợi</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* 3. NỘI DUNG CHÍNH (BỐ CỤC 2 CỘT CHUẨN FINTECH TRÊN DESKTOP) */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-slate-50/70 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          {/* Thông báo thanh toán thành công */}
          {successMessage && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-300 p-3.5 text-xs text-emerald-950 font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  ✓
                </span>
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 text-sm font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── TAB 1: NẠP XU TRỰC TUYẾN (BỐ CỤC 2 CỘT ĐỈNH CAO) ── */}
          {activeTab === 'packages' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* ── CỘT TRÁI: KÊNH THANH TOÁN & BẢNG MỆNH GIÁ (7 CỘT) ── */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. KÊNH THANH TOÁN CHÍNH THỨC */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-[#006368] text-white flex items-center justify-center text-[10px]">
                        1
                      </span>
                      Chọn phương thức thanh toán
                    </h3>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      0% Phí giao dịch
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Kênh 1: VietQR Napas 24/7 */}
                    <div
                      onClick={() => setPaymentMethod('vietqr')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 overflow-hidden ${
                        paymentMethod === 'vietqr'
                          ? 'border-[#0054A6] bg-blue-50/70 shadow-xs ring-2 ring-[#0054A6]/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-11 rounded-md bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                          <div className="flex flex-col items-center leading-none">
                            <span className="text-[9px] font-black text-[#0054A6] tracking-tighter">Viet</span>
                            <span className="text-[8px] font-black text-[#ED1C24] tracking-tighter">QR</span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">VietQR 24/7</span>
                            <span className="text-[8.5px] font-bold text-blue-700 bg-blue-100 px-1 py-0.2 rounded">
                              Tự động
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 truncate mt-0.5">Mọi ngân hàng VN</p>
                        </div>
                      </div>

                      <div
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 mr-0.5 transition-colors ${
                          paymentMethod === 'vietqr'
                            ? 'border-[#0054A6] bg-[#0054A6]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'vietqr' && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    {/* Kênh 2: Ví MoMo */}
                    <div
                      onClick={() => setPaymentMethod('momo')}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 overflow-hidden ${
                        paymentMethod === 'momo'
                          ? 'border-[#A50064] bg-pink-50/70 shadow-xs ring-2 ring-[#A50064]/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-md bg-gradient-to-b from-[#bd106d] to-[#990059] flex items-center justify-center shrink-0 shadow-2xs text-white">
                          <span className="text-[9px] font-black leading-none font-sans">MoMo</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">Ví MoMo</span>
                            <span className="text-[8.5px] font-bold text-pink-700 bg-pink-100 px-1 py-0.2 rounded">
                              Quét QR
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 truncate mt-0.5">Ứng dụng MoMo</p>
                        </div>
                      </div>

                      <div
                        className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 mr-0.5 transition-colors ${
                          paymentMethod === 'momo'
                            ? 'border-[#A50064] bg-[#A50064]'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'momo' && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. BẢNG MỆNH GIÁ NẠP CHÍNH THỨC (6 GÓI ĐỐI XỨNG 3x2) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-[#006368] text-white flex items-center justify-center text-[10px]">
                        2
                      </span>
                      Chọn mệnh giá quy đổi
                    </h3>
                    <span className="text-[11px] text-slate-500">Đơn vị: VNĐ</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {COIN_PACKAGES.map((pkg) => {
                      const isSelected = selectedPkg.id === pkg.id
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPkg(pkg)}
                          className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#006368] bg-white shadow-md ring-2 ring-[#006368]/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                          }`}
                        >
                          {/* Huy hiệu ưu đãi góc */}
                          {pkg.tag && (
                            <span
                              className={`absolute -top-2 right-2 px-1.5 py-0.2 rounded text-[8.5px] font-extrabold uppercase tracking-wider shadow-2xs ${
                                pkg.popular
                                  ? 'bg-[#c8382b] text-white'
                                  : 'bg-emerald-700 text-white'
                              }`}
                            >
                              {pkg.tag}
                            </span>
                          )}

                          {/* Số tiền VNĐ */}
                          <div>
                            <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                              {pkg.vnd.toLocaleString('vi-VN')} đ
                            </div>

                            {/* Số Xu nhận được */}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <ChoiCoin size={18} />
                              <span className="text-xs font-black text-[#006368]">
                                {pkg.totalCoins} Xu
                              </span>
                              {pkg.bonusCoins > 0 && (
                                <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">
                                  +{pkg.bonusCoins}
                                </span>
                              )}
                            </div>

                            <p className="text-[9.5px] text-slate-400 mt-1 line-clamp-1">
                              {pkg.description}
                            </p>
                          </div>

                          {/* Radio indicator */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <span className={isSelected ? 'font-bold text-[#006368]' : 'text-slate-400'}>
                              {isSelected ? 'Đang chọn' : 'Chọn gói'}
                            </span>
                            <span
                              className={`h-4 w-4 rounded-full border flex items-center justify-center text-[9px] ${
                                isSelected
                                  ? 'border-[#006368] bg-[#006368] text-white font-bold'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && '✓'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── CỘT PHẢI: HÓA ĐƠN ĐIỆN TỬ & KHUNG CHUYỂN KHOẢN (5 CỘT) ── */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-md p-4 sm:p-5 space-y-4">
                {/* Tiêu đề Hóa Đơn Điện Tử */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase">
                        Hóa Đơn Thanh Toán
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Mã: {orderId}
                      </p>
                    </div>
                  </div>

                  {/* Đếm ngược thời gian hết hạn đơn */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Thời gian giữ đơn</span>
                    <span className="text-xs font-black font-mono text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                      ⏱ {formatTimer(countdown)}
                    </span>
                  </div>
                </div>

                {/* Tóm tắt số tiền */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span>Quy đổi:</span>
                    <strong className="text-slate-900 font-bold flex items-center gap-1">
                      <ChoiCoin size={15} />
                      {selectedPkg.totalCoins} Xu Chòi
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phí xử lý:</span>
                    <span className="text-emerald-600 font-bold">0 đ (Miễn phí)</span>
                  </div>
                  <div className="pt-2 mt-1 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-900">Tổng thanh toán:</span>
                    <span className="text-base font-black text-[#c8382b] font-mono">
                      {selectedPkg.vnd.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                {/* KHUNG THANH TOÁN THEO KÊNH ĐANG CHỌN */}
                {paymentMethod === 'vietqr' && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3 text-xs space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        Quét Mã VietQR Ngân Hàng
                      </span>
                      <span className="text-blue-700 font-medium">MBBank (Quân Đội)</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {/* Stylized VietQR Card */}
                      <div className="bg-white p-2 rounded-xl border border-blue-200 shadow-2xs flex flex-col items-center shrink-0">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[9px] font-black text-[#0054A6]">Viet</span>
                          <span className="text-[9px] font-black text-[#ED1C24]">QR</span>
                          <span className="text-[7.5px] text-slate-400">| Napas247</span>
                        </div>
                        {/* Real VietQR Pattern Matrix */}
                        <svg viewBox="0 0 29 29" className="w-22 h-22 sm:w-24 sm:h-24" fill="#0054A6">
                          <path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z" />
                          <path d="M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z" />
                          <path d="M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z" />
                          <rect x="9" y="2" width="2" height="2" />
                          <rect x="13" y="0" width="2" height="4" />
                          <rect x="17" y="2" width="2" height="2" />
                          <rect x="9" y="6" width="3" height="2" />
                          <rect x="15" y="5" width="2" height="4" />
                          <rect x="2" y="9" width="3" height="2" />
                          <rect x="6" y="11" width="3" height="3" />
                          <rect x="11" y="10" width="3" height="2" />
                          <rect x="16" y="11" width="2" height="3" />
                          <rect x="20" y="9" width="4" height="2" />
                          <rect x="25" y="11" width="3" height="2" />
                          <rect x="10" y="14" width="4" height="4" fill="#ED1C24" />
                          <rect x="9" y="20" width="2" height="4" />
                          <rect x="13" y="19" width="3" height="2" />
                          <rect x="18" y="21" width="3" height="3" />
                          <rect x="23" y="19" width="2" height="2" />
                          <rect x="26" y="21" width="3" height="3" />
                          <rect x="14" y="25" width="4" height="2" />
                          <rect x="20" y="25" width="2" height="3" />
                          <rect x="24" y="26" width="4" height="2" />
                        </svg>
                        <span className="text-[8.5px] font-mono text-slate-500 mt-0.5">
                          Quét trên App Ngân Hàng
                        </span>
                      </div>

                      {/* Bảng sao chép chi tiết */}
                      <div className="flex-1 w-full space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between bg-white p-1.5 px-2 rounded-lg border border-slate-200">
                          <span className="text-slate-500">Số tài khoản:</span>
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono font-bold text-slate-900">0907775897</code>
                            <button
                              type="button"
                              onClick={() => handleCopy('0907775897', 'stk')}
                              className="text-[9.5px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 font-medium cursor-pointer"
                            >
                              {copiedField === 'stk' ? '✓ Đã chép' : 'Sao chép'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white p-1.5 px-2 rounded-lg border border-slate-200">
                          <span className="text-slate-500">Chủ tài khoản:</span>
                          <strong className="text-slate-900 font-semibold text-[10px] uppercase">
                            NGUYEN THI KIM LIEN
                          </strong>
                        </div>

                        <div className="flex items-center justify-between bg-amber-50 p-1.5 px-2 rounded-lg border border-amber-200">
                          <span className="text-amber-900 font-medium">Nội dung CK:</span>
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono font-bold text-amber-950">{transferCode}</code>
                            <button
                              type="button"
                              onClick={() => handleCopy(transferCode, 'nd')}
                              className="text-[9.5px] text-amber-800 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300 font-bold cursor-pointer"
                            >
                              {copiedField === 'nd' ? '✓ Đã chép' : 'Sao chép'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'momo' && (
                  <div className="rounded-xl border border-pink-200 bg-pink-50/40 p-3 text-xs space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A50064]" />
                        Thanh Toán Ví MoMo
                      </span>
                      <span className="text-pink-700 font-medium">MoMo Pay 24/7</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="bg-white p-2 rounded-xl border border-pink-200 shadow-2xs flex flex-col items-center shrink-0">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[9px] font-black text-[#A50064]">momo</span>
                          <span className="text-[7.5px] text-slate-400">| QR Pay</span>
                        </div>
                        <svg viewBox="0 0 29 29" className="w-22 h-22 sm:w-24 sm:h-24" fill="#A50064">
                          <path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z" />
                          <path d="M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z" />
                          <path d="M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z" />
                          <rect x="9" y="2" width="2" height="2" />
                          <rect x="13" y="0" width="2" height="4" />
                          <rect x="17" y="2" width="2" height="2" />
                          <rect x="9" y="6" width="3" height="2" />
                          <rect x="15" y="5" width="2" height="4" />
                          <rect x="2" y="9" width="3" height="2" />
                          <rect x="6" y="11" width="3" height="3" />
                          <rect x="11" y="10" width="3" height="2" />
                          <rect x="16" y="11" width="2" height="3" />
                          <rect x="20" y="9" width="4" height="2" />
                          <rect x="25" y="11" width="3" height="2" />
                          <rect x="10" y="14" width="4" height="4" fill="#D82D8B" />
                          <rect x="9" y="20" width="2" height="4" />
                          <rect x="13" y="19" width="3" height="2" />
                          <rect x="18" y="21" width="3" height="3" />
                          <rect x="23" y="19" width="2" height="2" />
                          <rect x="26" y="21" width="3" height="3" />
                          <rect x="14" y="25" width="4" height="2" />
                          <rect x="20" y="25" width="2" height="3" />
                          <rect x="24" y="26" width="4" height="2" />
                        </svg>
                        <span className="text-[8.5px] font-mono text-slate-500 mt-0.5">
                          Quét trên App MoMo
                        </span>
                      </div>

                      <div className="flex-1 w-full space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between bg-white p-1.5 px-2 rounded-lg border border-slate-200">
                          <span className="text-slate-500">Số MoMo:</span>
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono font-bold text-[#A50064]">0907775897</code>
                            <button
                              type="button"
                              onClick={() => handleCopy('0907775897', 'momo_sdt')}
                              className="text-[9.5px] text-pink-700 bg-pink-50 hover:bg-pink-100 px-1.5 py-0.5 rounded border border-pink-200 font-medium cursor-pointer"
                            >
                              {copiedField === 'momo_sdt' ? '✓ Đã chép' : 'Sao chép'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white p-1.5 px-2 rounded-lg border border-slate-200">
                          <span className="text-slate-500">Người nhận:</span>
                          <strong className="text-slate-900 font-semibold text-[10px] uppercase">
                            NGUYEN THI KIM LIEN
                          </strong>
                        </div>

                        <div className="flex items-center justify-between bg-pink-50 p-1.5 px-2 rounded-lg border border-pink-200">
                          <span className="text-pink-900 font-medium">Lời nhắn MoMo:</span>
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono font-bold text-[#A50064]">{transferCode}</code>
                            <button
                              type="button"
                              onClick={() => handleCopy(transferCode, 'momo_msg')}
                              className="text-[9.5px] text-pink-800 bg-pink-100 hover:bg-pink-200 px-1.5 py-0.5 rounded border border-pink-300 font-bold cursor-pointer"
                            >
                              {copiedField === 'momo_msg' ? '✓ Đã chép' : 'Sao chép'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}



                {/* Nút hành động thanh toán */}
                <div className="pt-1">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleTopup()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c8382b] to-[#a0261b] hover:from-[#b02f23] hover:to-[#8a1e14] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Đang xác thực giao dịch...</span>
                      </>
                    ) : (
                      <>
                        <span>Xác Nhận Nạp {selectedPkg.totalCoins} Xu ({selectedPkg.vnd.toLocaleString('vi-VN')} đ)</span>
                        <span>➔</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Footer chứng nhận an toàn */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Mã hóa SSL 256-Bit</span>
                  </div>
                  <span>Napas 247 · PCI-DSS</span>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: LỊCH SỬ GIAO DỊCH (CHUẨN SAO KÊ NGÂN HÀNG) ── */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    Sao Kê Biến Động Số Dư
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ghi nhận toàn bộ giao dịch nạp và sử dụng Xu Chòi
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  Tổng {transactions.length} bản ghi
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">
                  Chưa có lịch sử giao dịch xu nào trên tài khoản này.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10.5px] uppercase font-bold text-slate-600">
                        <tr>
                          <th className="p-3">Thời gian</th>
                          <th className="p-3">Nội dung giao dịch</th>
                          <th className="p-3">Kênh thanh toán</th>
                          <th className="p-3 text-right">Biến động</th>
                          <th className="p-3 text-right">Số dư sau</th>
                          <th className="p-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/60 transition">
                            <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap font-mono">
                              {new Date(tx.createdAt).toLocaleString('vi-VN')}
                            </td>
                            <td className="p-3 font-semibold text-slate-900">
                              {tx.description}
                            </td>
                            <td className="p-3 text-[11px] text-slate-600 whitespace-nowrap">
                              {tx.paymentMethod || 'Hệ thống'}
                            </td>
                            <td className="p-3 text-right font-black font-mono whitespace-nowrap">
                              <span
                                className={
                                  tx.type === 'spend'
                                    ? 'text-red-600'
                                    : 'text-emerald-700'
                                }
                              >
                                {tx.type === 'spend' ? '-' : '+'}
                                {tx.amount.toLocaleString()} Xu
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-slate-600 font-semibold whitespace-nowrap">
                              {tx.balanceAfter.toLocaleString()}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <span className="w-1 h-1 rounded-full bg-emerald-600" />
                                Thành công
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: BẢNG TỶ GIÁ & CHÍNH SÁCH ── */}
          {activeTab === 'policy' && (
            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase">
                  Biểu Phí & Quy Định Sử Dụng Xu Chòi
                </h3>
                <p className="text-[11px] text-slate-500">
                  Thông tin công khai minh bạch theo quy chế bảo tồn di sản văn hóa phi vật thể
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                    ⚖️
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Tỷ Lệ Quy Đổi Niêm Yết</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    1.000 VNĐ = 2 Xu Chòi. Mọi mệnh giá từ 20.000đ trở lên đều có chính sách thưởng thêm từ +15% đến +45%.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                    🎮
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Mục Đích Sử Dụng</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Xu Chòi dùng để tham gia các ván chơi hội làng trực tuyến, tích lũy cờ thưởng và quy đổi quà lưu niệm di sản văn hóa.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                    🛡️
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">Bảo Vệ Người Dùng</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Hỗ trợ đối soát và hoàn tiền 100% trong trường hợp lỗi giao dịch ngân hàng qua Hotline & Zalo: <strong>0907775897</strong> (24/7).
                  </p>
                </div>
              </div>

              {/* Bảng so sánh mệnh giá */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="font-bold text-slate-900 text-xs mb-2">Bảng Quy Đổi Mệnh Giá Chuẩn</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-[11px]">
                  {COIN_PACKAGES.map((p) => (
                    <div key={p.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="font-bold text-slate-900">{p.vnd.toLocaleString('vi-VN')} đ</div>
                      <div className="font-black text-[#006368] mt-0.5">{p.totalCoins} Xu</div>
                      <div className="text-[9px] text-emerald-600 font-semibold">{p.tag}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
