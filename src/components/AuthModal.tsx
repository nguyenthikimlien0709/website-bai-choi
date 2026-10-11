import { useState, useEffect, useRef } from 'react'
import { authService } from '../lib/authService'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { UserProfile } from '../types/auth'
import ChoiCoin from './ChoiCoin'

interface AuthModalProps {
  isOpen: boolean
  initialMode?: 'login' | 'register' | 'otp' | 'forgot' | 'reset'
  onClose: () => void
  onSuccess?: (user: UserProfile) => void
}

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'forgot' | 'reset'>(initialMode)

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [otpSuccess, setOtpSuccess] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Forgot Password state
  const [forgotEmailInput, setForgotEmailInput] = useState('')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  // Reset Password state
  const [resetOtpDigits, setResetOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [forgotCountdown, setForgotCountdown] = useState(30)
  const resetOtpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setLoginError('')
      setRegisterError('')
      setOtpError('')
      setOtpSuccess(false)
      setForgotError('')
      setForgotEmailInput('')
      setResetError('')
      setResetSuccess(false)
    }
  }, [isOpen, initialMode])

  // Countdown timer cho OTP đăng ký
  useEffect(() => {
    if (mode !== 'otp' || countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [mode, countdown])

  // Countdown timer cho OTP quên mật khẩu
  useEffect(() => {
    if (mode !== 'reset' || forgotCountdown <= 0) return
    const timer = setInterval(() => {
      setForgotCountdown((c) => (c > 0 ? c - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [mode, forgotCountdown])

  if (!isOpen) return null

  // Password rules validation
  const ruleMinLength = password.length >= 8
  const ruleHasUppercase = /[A-Z]/.test(password)
  const ruleHasNumber = /[0-9]/.test(password)
  const ruleHasSpecial = /[^A-Za-z0-9]/.test(password)
  const isPasswordValid = ruleMinLength && ruleHasUppercase && ruleHasNumber && ruleHasSpecial

  // Xử lý đăng nhập
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    if (!loginIdentifier.trim()) {
      setLoginError('Vui lòng nhập tên đăng nhập hoặc email.')
      return
    }
    if (!loginPassword) {
      setLoginError('Vui lòng nhập mật khẩu.')
      return
    }

    setLoginLoading(true)
    try {
      const res = await authService.login(loginIdentifier, loginPassword)
      if (res.success && res.user) {
        onSuccess?.(res.user)
        onClose()
      } else {
        setLoginError(res.message || 'Đăng nhập không thành công.')
      }
    } finally {
      setLoginLoading(false)
    }
  }

  // Xử lý tạo tài khoản
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')

    if (!username.trim()) return setRegisterError('Vui lòng nhập tên đăng nhập.')
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
      return setRegisterError('Tên đăng nhập từ 3 - 20 ký tự (chỉ gồm chữ, số và dấu gạch dưới).')
    }
    if (!fullName.trim()) return setRegisterError('Vui lòng nhập họ và tên.')
    if (!phone.trim() || !/^(0|\+84)[0-9]{9,10}$/.test(phone.trim())) {
      return setRegisterError('Số điện thoại không hợp lệ.')
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return setRegisterError('Địa chỉ email không hợp lệ.')
    }
    if (!isPasswordValid) {
      return setRegisterError('Mật khẩu chưa đáp ứng đủ 4 tiêu chuẩn bảo mật.')
    }
    if (password !== confirmPassword) {
      return setRegisterError('Mật khẩu xác nhận không khớp.')
    }

    setRegisterLoading(true)
    try {
      const res = await authService.startRegistration({
        username: username.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      })

      if (res.success) {
        setOtpDigits(['', '', '', '', '', ''])
        setCountdown(30)
        setMode('otp')
      } else {
        setRegisterError(res.message || 'Đăng ký không thành công.')
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  // Xử lý nhập 6 số OTP
  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Paste chuỗi số
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('')
      const next = [...otpDigits]
      pasted.forEach((char, i) => {
        if (i < 6) next[i] = char
      })
      setOtpDigits(next)
      const nextFocus = Math.min(pasted.length, 5)
      otpInputRefs.current[nextFocus]?.focus()
      return
    }

    const cleanChar = value.replace(/\D/g, '')
    const next = [...otpDigits]
    next[index] = cleanChar
    setOtpDigits(next)

    // Tự động nhảy ô tiếp theo
    if (cleanChar && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  // Xác thực OTP
  const handleVerifyOtp = async () => {
    const fullOtp = otpDigits.join('')
    if (fullOtp.length < 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã xác thực.')
      return
    }

    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await authService.verifyOtp(fullOtp)
      if (res.success) {
        setOtpSuccess(true)
        setTimeout(() => {
          setMode('login')
          setLoginIdentifier(res.user?.username || '')
          setLoginPassword('')
          setOtpSuccess(false)
        }, 1500)
      } else {
        setOtpError(res.message || 'Mã xác thực không hợp lệ.')
      }
    } finally {
      setOtpLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    const res = await authService.resendOtp()
    if (res.success) {
      setCountdown(30)
      setOtpError('')
      setOtpDigits(['', '', '', '', '', ''])
    } else {
      setOtpError(res.message || 'Không thể gửi lại mã vào lúc này.')
    }
  }

  // Xử lý gửi yêu cầu quên mật khẩu (chỉ sử dụng email)
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')

    const cleanEmail = forgotEmailInput.trim()
    if (!cleanEmail) {
      setForgotError('Vui lòng nhập địa chỉ email của bạn.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setForgotError('Vui lòng nhập đúng định dạng email (ví dụ: your@email.com).')
      return
    }

    setForgotLoading(true)
    try {
      const res = await authService.startForgotPassword(cleanEmail)
      if (res.success && res.email) {
        setForgotEmail(res.email)
        setResetOtpDigits(['', '', '', '', '', ''])
        setNewPassword('')
        setConfirmNewPassword('')
        setResetError('')
        setForgotCountdown(30)
        setMode('reset')
      } else {
        setForgotError(res.message || 'Không tìm thấy tài khoản với địa chỉ email này.')
      }
    } finally {
      setForgotLoading(false)
    }
  }

  // Xử lý 6 số OTP reset mật khẩu
  const handleResetOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('')
      const next = [...resetOtpDigits]
      pasted.forEach((char, i) => {
        if (i < 6) next[i] = char
      })
      setResetOtpDigits(next)
      const nextFocus = Math.min(pasted.length, 5)
      resetOtpInputRefs.current[nextFocus]?.focus()
      return
    }

    const cleanChar = value.replace(/\D/g, '')
    const next = [...resetOtpDigits]
    next[index] = cleanChar
    setResetOtpDigits(next)

    if (cleanChar && index < 5) {
      resetOtpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleResetOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !resetOtpDigits[index] && index > 0) {
      resetOtpInputRefs.current[index - 1]?.focus()
    }
  }

  // Tiêu chuẩn mật khẩu mới
  const ruleNewMinLength = newPassword.length >= 8
  const ruleNewHasUppercase = /[A-Z]/.test(newPassword)
  const ruleNewHasNumber = /[0-9]/.test(newPassword)
  const ruleNewHasSpecial = /[^A-Za-z0-9]/.test(newPassword)
  const isNewPasswordValid = ruleNewMinLength && ruleNewHasUppercase && ruleNewHasNumber && ruleNewHasSpecial

  // Xử lý đặt lại mật khẩu mới
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')

    const fullOtp = resetOtpDigits.join('')
    let hasEmailSession = false
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session?.user) {
          hasEmailSession = true
        }
      } catch {
        // Ignored
      }
    }

    if (!hasEmailSession && fullOtp.length < 6) {
      setResetError('Vui lòng nhập đủ 6 chữ số mã xác thực OTP (hoặc bấm vào liên kết trong email của bạn).')
      return
    }

    if (!isNewPasswordValid) {
      setResetError('Mật khẩu mới chưa đáp ứng đủ 4 tiêu chuẩn bảo mật.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setResetError('Mật khẩu xác nhận không khớp.')
      return
    }

    setResetLoading(true)
    try {
      const res = await authService.resetPassword(fullOtp, newPassword)
      if (res.success) {
        setResetSuccess(true)
        setTimeout(() => {
          setMode('login')
          setLoginIdentifier(forgotEmail || forgotEmailInput)
          setLoginPassword('')
          setLoginError('')
          setResetSuccess(false)
        }, 1500)
      } else {
        setResetError(res.message || 'Đặt lại mật khẩu thất bại.')
      }
    } finally {
      setResetLoading(false)
    }
  }

  const handleResendForgotOtp = async () => {
    if (forgotCountdown > 0) return
    const res = await authService.resendForgotOtp()
    if (res.success) {
      setForgotCountdown(30)
      setResetError('')
      setResetOtpDigits(['', '', '', '', '', ''])
    } else {
      setResetError(res.message || 'Không thể gửi lại mã vào lúc này.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[460px] max-h-[min(92vh,760px)] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER CỐ ĐỊNH: LOGO BÀI CHÒI & NÚT ĐÓNG */}
        <div className="relative flex items-center justify-center py-3.5 px-6 border-b border-slate-100 bg-white/95 backdrop-blur-xs shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#c8382b] to-[#92261b] text-white font-serif font-black shadow-md text-base">
              🎴
            </span>
            <span className="font-serif text-lg font-bold tracking-tight text-slate-900">
              BÀI CHÒI <span className="text-[#c8382b]">DI SẢN</span>
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* NỘI DUNG CUỘN NỘI BỘ (KHÔNG BỊ TRÀN MÀN HÌNH) */}
        <div className="overflow-y-auto px-5 py-3.5 sm:px-6 sm:py-4 flex-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          {/* ============================================================== */}
          {/* 1. MÀN HÌNH ĐĂNG KÝ (ĐÃ BỎ NGÀY SINH) */}
          {/* ============================================================== */}
          {mode === 'register' && (
            <div>
              {/* 50 Xu Welcome Callout */}
              <div className="mb-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/80 p-2.5 px-3 flex items-center gap-2.5 shadow-2xs">
                <ChoiCoin size={32} glow animate />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-black tracking-wide text-amber-950">QUÀ TÂN THỦ: TẶNG 50 XU CHÒI</span>
                    <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded-full uppercase">Miễn phí</span>
                  </div>
                  <p className="text-[10.5px] text-amber-900/90 leading-tight mt-0.5">
                    Đăng ký nhận ngay <strong>50 Xu Chòi</strong> vào ví để chơi game và đổi quà!
                  </p>
                </div>
              </div>

              <p className="mb-3 text-center text-xs text-slate-500 font-medium leading-relaxed">
                Tham gia Không gian Di sản Bài Chòi và bắt đầu trải nghiệm ngay hôm nay
              </p>

              {registerError && (
                <div className="mb-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                  {registerError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                {/* Tên đăng nhập */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Tên đăng nhập</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">
                      👤
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                      required
                    />
                  </div>
                </div>

                {/* Họ và tên */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Họ và tên</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">
                      ✍️
                    </span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                      required
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Số điện thoại</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">
                      📞
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                      required
                    />
                  </div>
                </div>

                {/* Địa chỉ email */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Địa chỉ email</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">
                      ✉️
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                      required
                    />
                  </div>
                </div>

                {/* Mật khẩu */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Mật khẩu</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">
                      🔒
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>

                  {/* 4 Tiêu chuẩn mật khẩu (Ảnh 1) */}
                  <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10.5px]">
                    <div className={`flex items-center gap-1 ${ruleMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span>{ruleMinLength ? '●' : '○'}</span> Tối thiểu 8 ký tự
                    </div>
                    <div className={`flex items-center gap-1 ${ruleHasUppercase ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span>{ruleHasUppercase ? '●' : '○'}</span> Ít nhất 1 chữ in hoa
                    </div>
                    <div className={`flex items-center gap-1 ${ruleHasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span>{ruleHasNumber ? '●' : '○'}</span> Ít nhất 1 chữ số
                    </div>
                    <div className={`flex items-center gap-1 ${ruleHasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      <span>{ruleHasSpecial ? '●' : '○'}</span> 1 ký tự đặc biệt
                    </div>
                  </div>
                </div>

                {/* Xác nhận mật khẩu */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">
                      🔒
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                {/* Nút Tạo tài khoản */}
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="mt-2.5 w-full rounded-xl bg-[#2e3748] py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg hover:bg-slate-800 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
                >
                  {registerLoading ? 'Đang khởi tạo...' : 'Tạo tài khoản'}
                </button>
              </form>

              <div className="mt-3.5 text-center text-xs text-slate-500">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="font-bold text-[#c8382b] hover:underline cursor-pointer"
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          )}

        {/* ============================================================== */}
        {/* 2. MÀN HÌNH XÁC THỰC EMAIL OTP 6 SỐ (ẢNH 2 & 3) */}
        {/* ============================================================== */}
        {mode === 'otp' && (
          <div className="text-center">
            <h3
              className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight"
              style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
            >
              Xác thực email
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Chúng tôi đã gửi mã xác thực 6 chữ số đến email của bạn. Vui lòng kiểm tra hộp thư (hoặc mục Thư rác/Spam) để lấy mã.
            </p>

            {/* Email hiển thị dạng disabled */}
            <div className="mx-auto mt-4 max-w-sm rounded-xl bg-slate-500 py-2.5 px-4 text-sm font-medium text-white shadow-inner">
              {email}
            </div>

            {/* 6 Ô nhập OTP - Chặn triệt để Autocomplete / Gợi ý email của trình duyệt */}
            <div className="mt-6 flex justify-center gap-2 sm:gap-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el
                  }}
                  type="text"
                  name={`digit-${idx}`}
                  id={`otp-input-${idx}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  data-lpignore="true"
                  data-form-type="other"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="h-12 w-11 sm:h-14 sm:w-12 rounded-xl border-2 border-slate-200 bg-white text-center text-xl font-bold text-slate-800 shadow-sm focus:border-[#e57373] focus:outline-none focus:ring-2 focus:ring-[#e57373]/30"
                />
              ))}
            </div>

            {/* Thông báo thành công (Ảnh 3) */}
            {otpSuccess && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 animate-in fade-in">
                Xác thực thành công! Đang chuyển đến trang đăng nhập...
              </div>
            )}

            {otpError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {otpError}
              </div>
            )}

            {/* Nút Xác thực */}
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={otpLoading || otpSuccess}
              className="mt-6 w-full rounded-xl bg-[#e57373] py-3 text-sm font-bold text-white shadow-md hover:bg-[#d95c5c] active:scale-[0.99] transition disabled:opacity-50"
            >
              {otpLoading ? 'Đang xác thực...' : 'Xác thực & kích hoạt'}
            </button>

            {/* Gửi lại OTP & Quay lại */}
            <div className="mt-5 text-xs text-slate-500">
              Không nhận được mã?{' '}
              {countdown > 0 ? (
                <span className="font-medium text-slate-400">Gửi lại sau {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-bold text-amber-600 hover:underline"
                >
                  Gửi lại OTP
                </button>
              )}
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Quay lại đăng ký
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. MÀN HÌNH ĐĂNG NHẬP (ẢNH 4) */}
        {/* ============================================================== */}
        {mode === 'login' && (
          <div>
            <h3 className="text-center font-serif text-2xl font-bold text-slate-800">Chào mừng trở lại</h3>
            <p className="mt-1 text-center text-xs text-slate-500">
              Đăng nhập để tiếp tục hành trình khám phá di sản Bài Chòi
            </p>

            {loginError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
              {/* Tên đăng nhập hoặc Email */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Tên đăng nhập hoặc Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    👤
                  </span>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Nhập tên đăng nhập hoặc email"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                    required
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = loginIdentifier.trim()
                      setForgotEmailInput(trimmed.includes('@') ? trimmed : '')
                      setForgotError('')
                      setMode('forgot')
                    }}
                    className="text-xs font-medium text-slate-400 hover:text-[#c8382b] transition cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    🔒
                  </span>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Nút Đăng nhập */}
              <button
                type="submit"
                disabled={loginLoading}
                className="mt-2 w-full rounded-xl bg-[#2e3748] py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                {loginLoading ? 'Đang xác thực...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-bold text-[#c8382b] hover:underline cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. MÀN HÌNH QUÊN MẬT KHẨU (BƯỚC 1: CHỈ NHẬP ĐỊA CHỈ EMAIL) */}
        {/* ============================================================== */}
        {mode === 'forgot' && (
          <div>
            <h3 className="text-center font-serif text-2xl font-bold text-slate-800">
              Khôi phục mật khẩu
            </h3>
            <p className="mt-1.5 text-center text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Nhập địa chỉ email của bạn. Hệ thống sẽ gửi mã OTP 6 số để bạn đặt mật khẩu mới.
            </p>

            {forgotError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Địa chỉ email
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    ✉️
                  </span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={forgotEmailInput}
                    onChange={(e) => {
                      setForgotEmailInput(e.target.value)
                      if (forgotError) setForgotError('')
                    }}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full rounded-xl bg-[#2e3748] py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                {forgotLoading ? 'Đang gửi mã xác thực...' : 'Gửi mã xác thực OTP'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ← Quay lại Đăng nhập
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. MÀN HÌNH ĐẶT LẠI MẬT KHẨU MỚI (BƯỚC 2: NHẬP OTP & MẬT KHẨU MỚI) */}
        {/* ============================================================== */}
        {mode === 'reset' && (
          <div>
            <h3 className="text-center font-serif text-2xl font-bold text-slate-800">
              Đặt lại mật khẩu mới
            </h3>
            <p className="mt-1.5 text-center text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Chúng tôi đã gửi mã xác thực 6 chữ số đến email của bạn.
            </p>

            {/* Email hiển thị dạng disabled */}
            <div className="mx-auto mt-3 max-w-sm rounded-xl bg-slate-500 py-2.5 px-4 text-center text-sm font-medium text-white shadow-inner">
              {forgotEmail}
            </div>

            {/* 6 Ô nhập OTP */}
            <div className="mt-4 flex justify-center gap-2 sm:gap-2.5">
              {resetOtpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    resetOtpInputRefs.current[idx] = el
                  }}
                  type="text"
                  name={`reset-digit-${idx}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleResetOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleResetOtpKeyDown(idx, e)}
                  className="h-11 w-10 sm:h-12 sm:w-11 rounded-xl border-2 border-slate-200 bg-white text-center text-lg font-bold text-slate-800 shadow-sm focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/30"
                />
              ))}
            </div>

            {resetSuccess && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 animate-in fade-in">
                ✅ Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...
              </div>
            )}

            {resetError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="mt-4 space-y-3">
              {/* Mật khẩu mới */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Mật khẩu mới</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    🔒
                  </span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>

                {/* 4 Tiêu chuẩn mật khẩu */}
                <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10.5px]">
                  <div className={`flex items-center gap-1 ${ruleNewMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <span>{ruleNewMinLength ? '●' : '○'}</span> Tối thiểu 8 ký tự
                  </div>
                  <div className={`flex items-center gap-1 ${ruleNewHasUppercase ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <span>{ruleNewHasUppercase ? '●' : '○'}</span> Ít nhất 1 chữ hoa
                  </div>
                  <div className={`flex items-center gap-1 ${ruleNewHasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <span>{ruleNewHasNumber ? '●' : '○'}</span> Ít nhất 1 chữ số
                  </div>
                  <div className={`flex items-center gap-1 ${ruleNewHasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                    <span>{ruleNewHasSpecial ? '●' : '○'}</span> 1 ký tự đặc biệt
                  </div>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    🔒
                  </span>
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#c8382b] focus:outline-none focus:ring-2 focus:ring-[#c8382b]/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {/* Nút Đặt lại mật khẩu */}
              <button
                type="submit"
                disabled={resetLoading || resetSuccess}
                className="mt-2 w-full rounded-xl bg-[#c8382b] py-3 text-sm font-bold text-white shadow-lg hover:bg-[#b02f23] active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                {resetLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
              </button>
            </form>

            {/* Gửi lại OTP & Quay lại */}
            <div className="mt-4 text-center text-xs text-slate-500">
              Không nhận được mã?{' '}
              {forgotCountdown > 0 ? (
                <span className="font-medium text-slate-400">Gửi lại sau {forgotCountdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendForgotOtp}
                  className="font-bold text-amber-600 hover:underline cursor-pointer"
                >
                  Gửi lại OTP
                </button>
              )}
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ← Quay lại Đăng nhập
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
