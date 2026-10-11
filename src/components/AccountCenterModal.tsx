import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { UserProfile } from '../types/auth'
import { authService } from '../lib/authService'
import { eventTicketService, type TicketRecord } from '../lib/eventTicketService'
import { orderService, type OrderItem } from '../lib/orderService'

export type AccountTabKey = 'profile' | 'tickets' | 'tracking' | 'history'

interface AccountCenterModalProps {
  currentUser: UserProfile
  initialTab?: AccountTabKey
  initialOrderId?: string
  onClose: () => void
  onLogout: () => void
  onViewTicketPass?: (ticket: TicketRecord) => void
}

export default function AccountCenterModal({
  currentUser,
  initialTab = 'profile',
  initialOrderId,
  onClose,
  onLogout,
  onViewTicketPass,
}: AccountCenterModalProps) {
  const validInitialTab: AccountTabKey =
    initialTab === 'tickets' || initialTab === 'history' || initialTab === 'tracking' ? initialTab : 'profile'
  const [activeTab, setActiveTab] = useState<AccountTabKey>(validInitialTab)
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string>(initialOrderId || '')
  const [copiedTrackingCode, setCopiedTrackingCode] = useState(false)
  const [trackingSearchInput, setTrackingSearchInput] = useState('')
  const [simulateSuccessMsg, setSimulateSuccessMsg] = useState('')

  // Sub-filter inside 'tickets' tab: 'history' | 'spending'
  const [ticketSubTab, setTicketSubTab] = useState<'history' | 'spending'>('history')

  // Real-time user profile state
  const [profile, setProfile] = useState<UserProfile>(currentUser)

  // Form state for Thông tin tài khoản
  const [formUsername, setFormUsername] = useState(profile.username || '')
  const [formEmail, setFormEmail] = useState(profile.email || '')
  const [formFullName, setFormFullName] = useState(profile.fullName || '')
  const [formPhone, setFormPhone] = useState(profile.phone || '')
  const [formIdCard, setFormIdCard] = useState(profile.idCard || '')
  const [formDob, setFormDob] = useState(profile.dob || '2005-09-07')
  const [formGender, setFormGender] = useState(profile.gender || 'Nữ')
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || '')
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)

  // Sync profile when currentUser prop changes
  useEffect(() => {
    setProfile(currentUser)
    setFormUsername(currentUser.username || '')
    setFormEmail(currentUser.email || '')
    setFormFullName(currentUser.fullName || '')
    setFormPhone(currentUser.phone || '')
    setFormIdCard(currentUser.idCard || '')
    setFormDob(currentUser.dob || '2005-09-07')
    setFormGender(currentUser.gender || 'Nữ')
    setAvatarPreview(currentUser.avatar || '')
  }, [currentUser])

  // Subscribe to auth updates
  useEffect(() => {
    const unsub = authService.subscribe((u) => {
      if (u) {
        setProfile(u)
      }
    })
    return () => unsub()
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Synced Tickets & Orders data
  const [allTickets, setAllTickets] = useState<TicketRecord[]>(() => eventTicketService.getTickets())
  const [allOrders, setAllOrders] = useState<OrderItem[]>(() => orderService.getOrders())

  useEffect(() => {
    const unsubTickets = eventTicketService.subscribe(() => {
      setAllTickets(eventTicketService.getTickets())
    })
    const unsubOrders = orderService.subscribe(() => {
      setAllOrders(orderService.getOrders())
    })
    return () => {
      unsubTickets()
      unsubOrders()
    }
  }, [])

  // Filter tickets belonging to this user (by email, phone, or name)
  const userTickets = useMemo(() => {
    return allTickets.filter((t) => {
      const matchEmail = profile.email && t.phone === profile.phone
      const matchPhone = profile.phone && t.phone === profile.phone
      const matchName = profile.fullName && t.customerName.toLowerCase().includes(profile.fullName.toLowerCase())
      // Also if demo user, show the sample tickets for demo
      return matchEmail || matchPhone || matchName || allTickets.length <= 4
    })
  }, [allTickets, profile])

  // Filter orders
  const userOrders = useMemo(() => {
    return allOrders.filter((o) => {
      const matchPhone = profile.phone && o.phone === profile.phone
      const matchName = profile.fullName && o.customerName.toLowerCase().includes(profile.fullName.toLowerCase())
      return matchPhone || matchName || allOrders.length <= 4
    })
  }, [allOrders, profile])

  // Đơn hàng đang được xem theo dõi
  const currentTrackingOrder = useMemo(() => {
    if (selectedTrackingOrderId) {
      const found = allOrders.find((o) => o.id === selectedTrackingOrderId)
      if (found) return found
    }
    return userOrders[0] || allOrders[0] || null
  }, [allOrders, userOrders, selectedTrackingOrderId])

  // Chi tiết lộ trình vận chuyển & bưu cục
  const trackingDetail = useMemo(() => {
    if (!currentTrackingOrder) return null
    return orderService.getOrderTrackingDetail(currentTrackingOrder)
  }, [currentTrackingOrder])

  // Mô phỏng cập nhật tiến độ cho nhà đầu tư / thuyết trình
  const handleSimulateStatus = async (newStatus: OrderItem['status']) => {
    if (!currentTrackingOrder) return
    await orderService.updateOrderStatus(currentTrackingOrder.id, newStatus)
    const label = newStatus === 'delivered' ? 'Giao thành công' : newStatus === 'shipping' ? 'Đang giao hàng' : 'Đang đóng gói'
    setSimulateSuccessMsg(`⚡ Đã mô phỏng cập nhật tiến độ đơn #${currentTrackingOrder.id} thành "${label}"!`)
    setTimeout(() => setSimulateSuccessMsg(''), 4000)
  }

  // Aggregate Stats
  const ticketsBoughtCount = userTickets.length
  const ticketsHeldCount = userTickets.filter((t) => t.status === 'unused').length
  const ticketSpent = userTickets.reduce((sum, t) => sum + (t.price || 0), 0)
  const merchSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const totalSpent = ticketSpent + merchSpent

  // Handle saving profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoading(true)
    setSaveSuccessMsg('')

    try {
      const updated = authService.updateProfile(
        {
          username: formUsername.trim(),
          fullName: formFullName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim(),
          idCard: formIdCard.trim(),
          dob: formDob,
          gender: formGender,
          avatar: avatarPreview,
        },
        profile || currentUser
      )

      if (updated) {
        setProfile(updated)
        setFormUsername(updated.username || '')
        setFormFullName(updated.fullName || '')
        setFormEmail(updated.email || '')
        setFormPhone(updated.phone || '')
        setFormIdCard(updated.idCard || '')
        setFormDob(updated.dob || '2005-09-07')
        setFormGender(updated.gender || 'Nữ')
        setAvatarPreview(updated.avatar || '')
        setSaveSuccessMsg('✅ Đã lưu thay đổi thông tin tài khoản thành công!')
        setTimeout(() => setSaveSuccessMsg(''), 4000)
      }
    } catch (err) {
      console.error('Lỗi lưu thông tin tài khoản:', err)
      setSaveSuccessMsg('❌ Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.')
    } finally {
      setSaveLoading(false)
    }
  }

  // Handle avatar file selection with client-side image compression & instant persistence
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      const img = new Image()
      img.onload = () => {
        // Nén ảnh sang kích thước tiêu chuẩn 256x256 để lưu trữ siêu nhẹ vào LocalStorage (< 30KB)
        const canvas = document.createElement('canvas')
        const maxDim = 256
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
          setAvatarPreview(compressedDataUrl)
          const updated = authService.updateProfile({ avatar: compressedDataUrl }, profile || currentUser)
          if (updated) {
            setProfile(updated)
            setSaveSuccessMsg('✅ Đã cập nhật ảnh đại diện thành công!')
            setTimeout(() => setSaveSuccessMsg(''), 4000)
          }
        }
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const handleCopyTrackingCode = (code: string) => {
    if (!code) return
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code)
      setCopiedTrackingCode(true)
      setTimeout(() => setCopiedTrackingCode(false), 2500)
    }
  }

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault()
    const q = trackingSearchInput.trim().toLowerCase()
    if (!q) return
    const found = allOrders.find(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        (o.trackingCode && o.trackingCode.toLowerCase().includes(q))
    )
    if (found) {
      setSelectedTrackingOrderId(found.id)
      setSimulateSuccessMsg(`🔎 Đã tìm thấy lộ trình đơn hàng #${found.id}!`)
      setTimeout(() => setSimulateSuccessMsg(''), 3500)
    } else {
      alert(`Không tìm thấy đơn hàng hoặc mã vận đơn phù hợp với "${trackingSearchInput}".`)
    }
  }

  // Sidebar Menu items: Thông tin tài khoản, Vé của tôi, Theo dõi đơn hàng, Lịch sử giao dịch
  const menuItems: { key: AccountTabKey; icon: string; title: string; subtitle: string }[] = [
    {
      key: 'profile',
      icon: '👤',
      title: 'Thông tin tài khoản',
      subtitle: 'Hồ sơ, ảnh đại diện, liên hệ',
    },
    {
      key: 'tickets',
      icon: '🎟️',
      title: 'Vé của tôi',
      subtitle: 'Xem chi tiết vé và ghế',
    },
    {
      key: 'tracking',
      icon: '🚚',
      title: 'Theo dõi đơn hàng',
      subtitle: 'Lộ trình vận chuyển & bưu cục',
    },
    {
      key: 'history',
      icon: '✉️',
      title: 'Lịch sử giao dịch',
      subtitle: 'Vé, chi tiêu, thanh toán',
    },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/60 p-2 sm:p-4 md:p-6 backdrop-blur-md animate-fade-in text-slate-800">
      <div className="max-w-6xl mx-auto my-2 sm:my-4 rounded-3xl bg-slate-50 shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* ── TOP BAR: Quay lại & Đăng xuất ── */}
        <div className="bg-white px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <span>←</span>
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Trang quản lý tài khoản thành viên
            </span>
            <button
              type="button"
              onClick={() => {
                onClose()
                onLogout()
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <span>↪</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* ─────────────────────────────────────────────────────────────
              HEADER CARD: USER PROFILE SUMMARY & QUICK STATS (Ảnh 3)
          ────────────────────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 overflow-hidden shrink-0 shadow-inner">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={profile.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl">👤</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider mb-0.5">
                  <span>⚙️</span>
                  <span>Cài đặt tài khoản</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {profile.fullName || profile.username || 'Người dùng Bài Chòi'}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  {profile.username && (
                    <span className="font-semibold text-slate-700">@{profile.username}</span>
                  )}
                  {profile.username && profile.email && <span>•</span>}
                  {profile.email && <span>{profile.email}</span>}
                </div>
                <span className="inline-block mt-1.5 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  Thành viên Chòi Heritage
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 min-w-[100px] text-left">
                <span className="text-[11px] text-slate-500 font-medium block">Vé đã mua</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{ticketsBoughtCount}</span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 min-w-[100px] text-left">
                <span className="text-[11px] text-slate-500 font-medium block">Đang giữ</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">{ticketsHeldCount}</span>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 min-w-[120px] text-left">
                <span className="text-[11px] text-slate-500 font-medium block">Tổng chi tiêu</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  {totalSpent.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              MAIN CONTENT: LEFT SIDEBAR MENU + RIGHT TAB CONTENT
          ────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ── LEFT SIDEBAR MENU (4 cols) ── */}
            <div className="lg:col-span-4 space-y-2">
              {menuItems.map((item) => {
                const isActive = activeTab === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full text-left p-3.5 rounded-2xl transition cursor-pointer flex items-center gap-3.5 border ${
                      isActive
                        ? 'bg-slate-950 text-white border-slate-950 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </p>
                      <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* ── RIGHT CONTENT PANEL (8 cols) ── */}
            <div className="lg:col-span-8">
              
              {/* ──────────────────────────────────────────────────────────
                  TAB 1: THÔNG TIN TÀI KHOẢN (ẢNH 3)
              ─────────────────────────────────────────────────────────── */}
              {activeTab === 'profile' && (
                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Hồ sơ cá nhân</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cập nhật thông tin cá nhân và ảnh đại diện của tài khoản.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Đang hoạt động
                    </span>
                  </div>

                  {saveSuccessMsg && (
                    <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 animate-fade-in">
                      {saveSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Avatar preview block */}
                    <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="relative h-20 w-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shadow-xs shrink-0">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt={formFullName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-4xl">👤</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{formFullName || formUsername || 'Chưa đặt họ tên'}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          {formUsername && <span className="font-semibold text-slate-700">@{formUsername}</span>}
                          {formUsername && formEmail && <span>•</span>}
                          <span>{formEmail}</span>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2.5 rounded-xl border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>✏️</span>
                          <span>Đổi ảnh</span>
                        </button>
                      </div>
                    </div>

                    {/* Form Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Tên đăng nhập</label>
                        <input
                          type="text"
                          value={formUsername}
                          onChange={(e) => setFormUsername(e.target.value)}
                          placeholder="Tên đăng nhập"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 bg-slate-50 focus:bg-white focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Email</label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Họ và tên</label>
                        <input
                          type="text"
                          value={formFullName}
                          onChange={(e) => setFormFullName(e.target.value)}
                          placeholder="Nguyễn Thị Kim Liên"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
                        <input
                          type="tel"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="0987 367 487"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">CCCD / CMND</label>
                        <input
                          type="text"
                          value={formIdCard}
                          onChange={(e) => setFormIdCard(e.target.value)}
                          placeholder="Nhập số CCCD/CMND"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Ngày sinh</label>
                        <input
                          type="date"
                          value={formDob}
                          onChange={(e) => setFormDob(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-bold text-slate-700 block mb-1">Giới tính</label>
                        <select
                          value={formGender}
                          onChange={(e) => setFormGender(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-red-500 focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="Nữ">Nữ</option>
                          <option value="Nam">Nam</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      {saveSuccessMsg && (
                        <span className="text-xs font-bold text-emerald-600 animate-fade-in flex items-center gap-1">
                          <span>✅</span>
                          <span>Đã lưu thành công!</span>
                        </span>
                      )}
                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="rounded-xl bg-gradient-to-r from-[#c8382b] to-[#92261b] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                      >
                        {saveLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────
                  TAB 4: VÉ CỦA TÔI (ẢNH 4)
              ─────────────────────────────────────────────────────────── */}
              {activeTab === 'tickets' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top 3 Stat Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white border border-slate-200 p-4 text-left shadow-xs">
                      <div className="h-8 w-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-sm mb-2 font-bold">
                        🎟️
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block">Vé đã thanh toán</span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">{ticketsBoughtCount}</span>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-200 p-4 text-left shadow-xs">
                      <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm mb-2 font-bold">
                        ✉️
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block">Tổng chi tiêu</span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">
                        {ticketSpent.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-200 p-4 text-left shadow-xs">
                      <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm mb-2 font-bold">
                        🕒
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block">Vé đang giữ chỗ</span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">{ticketsHeldCount}</span>
                    </div>
                  </div>

                  {/* Sub-filter tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTicketSubTab('history')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        ticketSubTab === 'history'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>🎟️</span>
                      <span>Lịch sử vé</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTicketSubTab('spending')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        ticketSubTab === 'spending'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>✉️</span>
                      <span>Chi tiêu</span>
                    </button>
                  </div>

                  {/* Ticket List Content */}
                  <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs min-h-[300px]">
                    {ticketSubTab === 'history' && (
                      userTickets.length === 0 ? (
                        /* Empty State */
                        <div className="py-16 text-center space-y-3">
                          <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-2xl border border-slate-200 shadow-inner">
                            🎟️
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-slate-900">Bạn chưa có vé nào</h5>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Các vé đã đặt sẽ xuất hiện tại đây.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* List of Tickets with Official Mockup Pass */
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                            <span>Danh sách vé điện tử hợp lệ ({userTickets.length} vé)</span>
                            <span>Mã QR có thể quét tại cổng</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {userTickets.map((t) => {
                              const isCheckedIn = t.status === 'checked_in'
                              return (
                                <div
                                  key={t.ticketCode}
                                  className="rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-4 shadow-xs relative overflow-hidden flex flex-col justify-between"
                                >
                                  {/* Status tag */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <span
                                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                        isCheckedIn
                                          ? 'bg-slate-200 text-slate-700'
                                          : 'bg-emerald-500 text-white shadow-2xs'
                                      }`}
                                    >
                                      {isCheckedIn ? '✓ Đã check-in' : '● Chưa soát vé'}
                                    </span>
                                    <span className="text-[11px] font-bold text-[#c8382b]">
                                      {(t.price || 50000).toLocaleString('vi-VN')} đ
                                    </span>
                                  </div>

                                  <div>
                                    <h5 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight">
                                      {t.eventTitle}
                                    </h5>
                                    <p className="text-[11px] text-slate-600 mt-1">
                                      Khách: <strong>{t.customerName}</strong> ({t.phone})
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Ngày mua: {t.createdAt}</p>
                                  </div>

                                  <div className="mt-3 pt-3 border-t border-amber-200/80 flex items-center justify-between">
                                    <div className="font-mono text-xs font-black text-red-700">
                                      {t.ticketCode}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onViewTicketPass?.(t)}
                                      className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 transition cursor-pointer"
                                    >
                                      Xem phôi vé
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    )}

                    {ticketSubTab === 'spending' && (
                      <div className="space-y-3 py-4 text-xs">
                        <h5 className="font-bold text-sm text-slate-900 mb-2">Chi tiết chi tiêu vé sự kiện</h5>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center font-bold">
                          <span>Tổng cộng đã thanh toán:</span>
                          <span className="text-base text-[#c8382b]">{ticketSpent.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────
                  TAB 3: THEO DÕI ĐƠN HÀNG (LỘ TRÌNH VẬN CHUYỂN & BƯU CỤC)
              ─────────────────────────────────────────────────────────── */}
              {activeTab === 'tracking' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Top Bar: Selector & Search */}
                  <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🚚</span>
                          <h4 className="text-base font-bold text-slate-900">
                            Theo dõi vận chuyển & Bưu cục
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Hệ thống theo dõi bưu kiện thời gian thực liên kết Viettel Post Express.
                        </p>
                      </div>

                      {/* Search Form */}
                      <form onSubmit={handleSearchTracking} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Mã đơn (#ORD...) hoặc Mã VTP..."
                          value={trackingSearchInput}
                          onChange={(e) => setTrackingSearchInput(e.target.value)}
                          className="w-56 sm:w-64 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition"
                        />
                        <button
                          type="submit"
                          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 transition cursor-pointer shrink-0"
                        >
                          Tra cứu
                        </button>
                      </form>
                    </div>

                    {/* Order Selection Pills */}
                    {allOrders.length > 0 && (
                      <div className="pt-3.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                        <span className="text-slate-400 font-semibold shrink-0 text-[11px]">Chọn đơn hàng:</span>
                        {allOrders.map((ord) => {
                          const isSelected = currentTrackingOrder?.id === ord.id
                          return (
                            <button
                              key={ord.id}
                              type="button"
                              onClick={() => setSelectedTrackingOrderId(ord.id)}
                              className={`rounded-xl px-3 py-1.5 font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 text-xs border ${
                                isSelected
                                  ? 'bg-red-700 text-white border-red-700 shadow-xs'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              <span>#{ord.id}</span>
                              <span className="opacity-80 hidden sm:inline">({ord.itemSummary.slice(0, 20)}...)</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                                isSelected ? 'bg-red-800/80 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {ord.status === 'delivered' ? '✓ Đã nhận' : ord.status === 'shipping' ? '🚚 Đang giao' : '● Chờ gửi'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Notification Banner when Simulated */}
                  {simulateSuccessMsg && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-bounce-subtle">
                      <span className="text-base">🚀</span>
                      <span>{simulateSuccessMsg}</span>
                    </div>
                  )}

                  {!currentTrackingOrder || !trackingDetail ? (
                    <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center text-xs text-slate-400">
                      Chưa tìm thấy thông tin đơn hàng để theo dõi. Vui lòng chọn một đơn hàng từ danh sách.
                    </div>
                  ) : (
                    <>
                      {/* Main Tracking Overview Card */}
                      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white p-6 shadow-md relative overflow-hidden">
                        <span className="absolute -right-6 -bottom-6 text-9xl opacity-10 select-none pointer-events-none">
                          🚚
                        </span>

                        <div className="relative z-10 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shrink-0">
                                📦
                              </span>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-sm tracking-wide">
                                    ĐƠN HÀNG #{trackingDetail.orderId}
                                  </span>
                                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                    trackingDetail.status === 'delivered'
                                      ? 'bg-emerald-500 text-white'
                                      : trackingDetail.status === 'shipping'
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-amber-400 text-slate-900'
                                  }`}>
                                    {trackingDetail.statusLabel}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-0.5">
                                  {currentTrackingOrder.itemSummary} • Tổng tiền:{' '}
                                  <strong className="text-amber-300">
                                    {currentTrackingOrder.totalAmount.toLocaleString('vi-VN')} đ
                                  </strong>
                                </p>
                              </div>
                            </div>

                            {/* Tracking code & Copy */}
                            <div className="flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl backdrop-blur-md">
                              <div className="text-right">
                                <span className="text-[10px] uppercase text-slate-300 block font-semibold">
                                  Mã vận đơn ({trackingDetail.carrierName})
                                </span>
                                <span className="font-mono font-bold text-xs text-amber-200">
                                  {trackingDetail.trackingCode}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyTrackingCode(trackingDetail.trackingCode)}
                                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition cursor-pointer"
                                title="Sao chép mã vận đơn"
                              >
                                {copiedTrackingCode ? '✓ Đã chép' : 'Sao chép'}
                              </button>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 text-slate-200">
                              <span className="text-emerald-400">●</span>
                              <span>Dự kiến giao: <strong>{trackingDetail.estimatedDeliveryDate}</strong></span>
                            </div>
                            <div className="text-slate-300 text-[11px]">
                              Đơn vị vận chuyển: <strong className="text-white">{trackingDetail.carrierName}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4-Stage Visual Progress Stepper */}
                      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-6">
                          <h5 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            <span>🧭</span>
                            <span>Tiến độ bưu kiện</span>
                          </h5>
                          <span className="text-xs text-slate-500 font-medium">
                            Bước {trackingDetail.currentStepIndex + 1}/4
                          </span>
                        </div>

                        <div className="relative">
                          {/* Progress Line */}
                          <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 -z-0 hidden md:block">
                            <div
                              className="h-full bg-red-600 transition-all duration-500 rounded-full"
                              style={{
                                width: `${(trackingDetail.currentStepIndex / (trackingDetail.steps.length - 1)) * 100}%`,
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                            {trackingDetail.steps.map((st, idx) => {
                              return (
                                <div
                                  key={idx}
                                  className={`flex flex-col items-center text-center p-3 rounded-xl transition ${
                                    st.isCurrent
                                      ? 'bg-red-50/80 border border-red-200'
                                      : st.isCompleted
                                      ? 'bg-slate-50/60'
                                      : 'opacity-50'
                                  }`}
                                >
                                  <div
                                    className={`h-10 w-10 rounded-full flex items-center justify-center text-base font-bold shadow-xs mb-2.5 transition ${
                                      st.isCurrent
                                        ? 'bg-red-600 text-white ring-4 ring-red-100 scale-110'
                                        : st.isCompleted
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 text-slate-500'
                                    }`}
                                  >
                                    {st.isCompleted && !st.isCurrent ? '✓' : st.icon}
                                  </div>
                                  <span className={`text-xs font-bold leading-tight ${
                                    st.isCurrent ? 'text-red-700' : 'text-slate-800'
                                  }`}>
                                    {st.title}
                                  </span>
                                  <span className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                    {st.subtitle}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 2-Column: Live Timeline Logs + Shipper / Delivery Info */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        
                        {/* Left Column: Timeline logs (7 cols) */}
                        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              <h5 className="font-bold text-sm text-slate-900">
                                Hành trình chi tiết
                              </h5>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400">
                              Cập nhật thời gian thực
                            </span>
                          </div>

                          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 pl-8 pt-1">
                            {trackingDetail.timelineLogs.map((log, lIdx) => (
                              <div key={lIdx} className="relative group">
                                <div
                                  className={`absolute -left-8 top-0.5 h-7 w-7 rounded-full flex items-center justify-center text-xs shadow-xs border ${
                                    log.isCurrent
                                      ? 'bg-red-600 text-white border-red-600 ring-4 ring-red-100'
                                      : 'bg-white text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {log.icon}
                                </div>

                                <div className={`p-3 rounded-xl border text-xs transition ${
                                  log.isCurrent
                                    ? 'bg-red-50/50 border-red-200 shadow-2xs'
                                    : 'bg-slate-50/50 border-slate-200/80'
                                }`}>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`font-bold ${log.isCurrent ? 'text-red-700' : 'text-slate-900'}`}>
                                      {log.title}
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                                      {log.time} • {log.date}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                    {log.detail}
                                  </p>
                                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <span>📍</span>
                                    <span>{log.location}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Column: Courier & Recipient Details (5 cols) */}
                        <div className="lg:col-span-5 space-y-4">
                          
                          {/* Courier / Shipper Card */}
                          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                              <div className="h-11 w-11 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center text-xl shrink-0">
                                🛵
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                  Bưu tá giao hàng (Shipper)
                                </span>
                                <h6 className="font-bold text-sm text-slate-900 truncate">
                                  {trackingDetail.shipperName}
                                </h6>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {trackingDetail.carrierName}
                                </p>
                              </div>
                              <a
                                href={`tel:${trackingDetail.shipperPhone.replace(/\s+/g, '')}`}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                              >
                                <span>📞</span>
                                <span>Gọi</span>
                              </a>
                            </div>

                            <div className="pt-3 space-y-2 text-xs text-slate-600">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Số điện thoại:</span>
                                <span className="font-mono font-bold text-slate-800">{trackingDetail.shipperPhone}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Phương tiện:</span>
                                <span className="font-medium text-slate-800">{trackingDetail.shipperVehicle}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 italic pt-1">
                                * Tài xế sẽ gọi trước khi giao từ 10 - 15 phút.
                              </p>
                            </div>
                          </div>

                          {/* Recipient Card */}
                          <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-2 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block pb-1 border-b border-slate-100">
                              Thông tin người nhận
                            </span>
                            <div className="space-y-1.5 pt-1">
                              <div>
                                <strong className="text-slate-900">{trackingDetail.customerName}</strong>
                                <span className="text-slate-500 ml-2 font-mono">({trackingDetail.customerPhone})</span>
                              </div>
                              <p className="text-slate-600 leading-relaxed">
                                📍 {trackingDetail.shippingAddress}
                              </p>
                              <div className="pt-1 text-[11px] text-slate-500">
                                Thanh toán: <strong className="text-slate-800">{trackingDetail.paymentMethodText}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Heritage Assurance Badge */}
                          <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 text-xs text-amber-900 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span>🛡️</span>
                              <span>Đồng kiểm & Bảo hiểm hiện vật</span>
                            </div>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              Ấn phẩm Bài Chòi được đóng gói bằng hộp định hình carton 3 lớp chống va đập. Quý khách có quyền đồng kiểm trước khi ký nhận.
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* ──────────────────────────────────────────────────────────
                          INVESTOR & DEMO SIMULATION CONTROLS (Thuyết trình & Gọi vốn)
                      ─────────────────────────────────────────────────────────── */}
                      <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 p-5 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💼</span>
                            <div>
                              <h5 className="font-extrabold text-xs uppercase tracking-wide text-indigo-900">
                                Công cụ trình diễn mô phỏng (Dành cho Demo & Gọi vốn đầu tư)
                              </h5>
                              <p className="text-[11px] text-indigo-700/80 mt-0.5">
                                Thử nghiệm chuyển đổi trạng thái đơn #{trackingDetail.orderId} để kiểm tra giao diện thời gian thực.
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 self-start sm:self-auto">
                            Interactive Demo Mode
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => handleSimulateStatus('pending')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                              trackingDetail.status === 'pending'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-200'
                            }`}
                          >
                            <span>📦</span>
                            <span>1. Đang đóng gói</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSimulateStatus('shipping')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                              trackingDetail.status === 'shipping'
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-200'
                            }`}
                          >
                            <span>🚚</span>
                            <span>2. Đang giao hàng</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSimulateStatus('delivered')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                              trackingDetail.status === 'delivered'
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200'
                            }`}
                          >
                            <span>✅</span>
                            <span>3. Giao thành công</span>
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-2.5 text-center">
                          * Khi dự án chính thức vận hành thương mại, dữ liệu trạng thái sẽ được đồng bộ tự động 100% qua API Webhook từ bưu tá Viettel Post / GHN.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ──────────────────────────────────────────────────────────
                  TAB 4: LỊCH SỬ GIAO DỊCH
              ─────────────────────────────────────────────────────────── */}
              {activeTab === 'history' && (
                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs animate-fade-in space-y-4">
                  <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Lịch sử giao dịch & Thanh toán</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Tổng hợp các giao dịch mua vé và đặt mua ấn phẩm.</p>
                    </div>
                    {userOrders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (userOrders[0]) setSelectedTrackingOrderId(userOrders[0].id)
                          setActiveTab('tracking')
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                      >
                        <span>🚚</span>
                        <span>Xem toàn bộ lộ trình vận chuyển</span>
                      </button>
                    )}
                  </div>

                  {userOrders.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Chưa có đơn hàng ấn phẩm nào.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-300 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">#{ord.id}</span>
                              <span className="text-[11px] text-slate-400">• {ord.createdAt}</span>
                            </div>
                            <p className="font-bold text-slate-900 text-sm">{ord.itemSummary}</p>
                            <p className="text-[11px] text-slate-500">
                              Hình thức: {ord.paymentMethod === 'cod' ? 'Tại quầy / COD' : 'Chuyển khoản'}
                              {ord.carrier && <span className="ml-2 font-medium text-slate-600">• {ord.carrier}</span>}
                            </p>
                          </div>
                          <div className="flex flex-col sm:items-end gap-2 shrink-0">
                            <div className="text-right">
                              <span className="font-black text-base text-[#c8382b] block">
                                {ord.totalAmount.toLocaleString('vi-VN')} đ
                              </span>
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                ord.status === 'delivered'
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                  : ord.status === 'shipping'
                                  ? 'text-blue-700 bg-blue-50 border-blue-200'
                                  : 'text-amber-700 bg-amber-50 border-amber-200'
                              }`}>
                                {ord.status === 'delivered' ? '✓ Đã nhận hàng' : ord.status === 'shipping' ? '🚚 Đang giao hàng' : '● Đang chuẩn bị'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTrackingOrderId(ord.id)
                                setActiveTab('tracking')
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                            >
                              <span>🚚</span>
                              <span>Theo dõi vận chuyển</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
