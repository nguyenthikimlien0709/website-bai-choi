import { useState, useEffect } from 'react'
import type { UserProfile } from '../types/auth'
import { eventTicketService, type EventItem, type TicketRecord } from '../lib/eventTicketService'

interface StaffPortalProps {
  currentUser: UserProfile
  onBackToSite: () => void
  onLogout: () => void
}

export default function StaffPortal({
  currentUser,
  onBackToSite,
  onLogout,
}: StaffPortalProps) {
  const [tab, setTab] = useState<'sell' | 'checkin' | 'history'>('sell')
  const [events, setEvents] = useState<EventItem[]>(() => eventTicketService.getEvents())
  const [tickets, setTickets] = useState<TicketRecord[]>(() => eventTicketService.getTickets())

  // Đồng bộ với eventTicketService
  useEffect(() => {
    return eventTicketService.subscribe(() => {
      setEvents(eventTicketService.getEvents())
      setTickets(eventTicketService.getTickets())
    })
  }, [])

  // Soát vé state
  const [inputCode, setInputCode] = useState('')
  const [searchedTicket, setSearchedTicket] = useState<TicketRecord | null>(null)
  const [searchNotFound, setSearchNotFound] = useState(false)
  const [checkinMessage, setCheckinMessage] = useState<{ text: string; isError?: boolean } | null>(null)

  // Bán vé tại quầy state
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    const list = eventTicketService.getEvents()
    const openEvt = list.find((e) => e.status === 'offline_sale')
    return openEvt?.id || list[0]?.id || ''
  })
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [ticketQuantity, setTicketQuantity] = useState(1)
  const [sellErrorMessage, setSellErrorMessage] = useState('')
  const [soldTicketsOutput, setSoldTicketsOutput] = useState<TicketRecord[]>([])

  // Sự kiện đang chọn để bán
  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0]
  const isDoorSaleOpen = currentEvent?.status === 'offline_sale'
  const remainingTickets = currentEvent ? Math.max(0, currentEvent.totalTickets - currentEvent.soldTickets) : 0

  // Thống kê ca trực
  const totalCheckedIn = tickets.filter((t) => t.status === 'checked_in').length
  const totalDoorSold = tickets.filter((t) => t.channel === 'offline_door').length
  const totalDoorCash = tickets
    .filter((t) => t.channel === 'offline_door')
    .reduce((sum, t) => sum + t.price, 0)

  // 1. Tìm vé để soát
  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchNotFound(false)
    setCheckinMessage(null)

    if (!inputCode.trim()) return

    const clean = inputCode.trim().toUpperCase()
    const all = eventTicketService.getTickets()
    const found = all.find((t) => t.ticketCode.toUpperCase() === clean)

    if (found) {
      setSearchedTicket(found)
    } else {
      setSearchedTicket(null)
      setSearchNotFound(true)
    }
  }

  // Xác nhận soát vé
  const handleConfirmCheckin = () => {
    if (!searchedTicket) return
    const res = eventTicketService.checkinTicket(searchedTicket.ticketCode)
    if (res.success && res.ticket) {
      setSearchedTicket(res.ticket)
      setCheckinMessage({ text: res.message || 'Check-in thành công!', isError: false })
      setInputCode('')
    } else {
      setCheckinMessage({ text: res.message || 'Không thể check-in vé này.', isError: true })
    }
  }

  // 2. Bán vé tại quầy
  const handleSellTicket = (e: React.FormEvent) => {
    e.preventDefault()
    setSellErrorMessage('')
    setSoldTicketsOutput([])

    if (!isDoorSaleOpen) {
      setSellErrorMessage('Sự kiện này chưa được mở bán tại quầy vì Admin chưa xác nhận đóng kênh bán online.')
      return
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setSellErrorMessage('Vui lòng nhập họ tên và số điện thoại khách mua vé.')
      return
    }

    if (ticketQuantity > remainingTickets) {
      setSellErrorMessage(`Số lượng vé yêu cầu (${ticketQuantity} vé) vượt quá số lượng còn lại (${remainingTickets} vé).`)
      return
    }

    const res = eventTicketService.sellDoorTickets(
      currentEvent.id,
      customerName.trim(),
      customerPhone.trim(),
      ticketQuantity
    )

    if (res.success && res.tickets) {
      setSoldTicketsOutput(res.tickets)
      setCustomerName('')
      setCustomerPhone('')
      setTicketQuantity(1)
    } else {
      setSellErrorMessage(res.message || 'Không thể xuất vé vào lúc này.')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* ── TOP HEADER (LIGHT THEME) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xl font-bold shadow-md shadow-blue-900/20">
              🎫
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-900 text-base sm:text-lg">
                  QUẦY VÉ <span className="text-blue-600">BÀI CHÒI</span>
                </span>
                <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                  Staff Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Nghiệp vụ Bán Vé Tại Quầy & Soát Vé Cửa</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-sm">👤</span>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-500">@{currentUser.username} (Nhân viên quầy)</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onBackToSite}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition active:scale-95 cursor-pointer"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">Về Website</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700 transition active:scale-95 cursor-pointer"
            >
              <span>🚪</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* KPI Mini Bar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4 text-center shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Đã Check-in Ca Này</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{totalCheckedIn} vé</div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4 text-center shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Vé Bán Tại Quầy</span>
            <div className="text-xl sm:text-2xl font-black text-sky-600 mt-1">{totalDoorSold} vé</div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4 text-center shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Tiền Mặt Thu Tại Quầy</span>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
              {totalDoorCash.toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>

        {/* Tab Switches */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 gap-2 shadow-xs">
          <button
            onClick={() => setTab('sell')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'sell' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🎟️</span>
            <span>Bán vé tại quầy (Door Sale)</span>
          </button>

          <button
            onClick={() => setTab('checkin')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'checkin' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🔍</span>
            <span>Soát vé & Check-in Cổng</span>
          </button>

          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              tab === 'history' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>📋</span>
            <span>Danh sách vé trong ca</span>
          </button>
        </div>

        {/* ── 1. BÁN VÉ TẠI QUẦY (DOOR SALE) ── */}
        {tab === 'sell' && (
          <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-8 space-y-6 shadow-xs">
            <div className="text-center max-w-lg mx-auto">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Quầy Bán Vé Trực Tiếp Cho Khách Vãng Lai</h3>
              <p className="text-xs text-slate-500 mt-1">
                Theo quy chế: Quầy vé tại cửa chỉ mở bán sau khi Quản trị viên (Admin) xác nhận đóng bán online
              </p>
            </div>

            <form onSubmit={handleSellTicket} className="max-w-lg mx-auto space-y-4">
              {/* Chọn sự kiện */}
              <div>
                <label className="text-xs text-slate-700 font-bold mb-1.5 block">
                  Chọn Hội / Sự Kiện Bài Chòi
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => {
                    setSelectedEventId(e.target.value)
                    setSellErrorMessage('')
                    setSoldTicketsOutput([])
                  }}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {events.map((evt) => {
                    const rem = evt.totalTickets - evt.soldTickets
                    const statusText =
                      evt.status === 'offline_sale'
                        ? `[ĐÃ MỞ BÁN TẠI QUẦY - Còn ${rem} vé]`
                        : evt.status === 'online_sale'
                        ? '[ĐANG BÁN ONLINE - Chưa mở tại quầy]'
                        : '[ĐÃ KẾT THÚC]'
                    return (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} — {statusText}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* CARD TRẠNG THÁI & HIỂN THỊ SỐ LƯỢNG VÉ CÒN LẠI */}
              {currentEvent && (
                <div>
                  {isDoorSaleOpen ? (
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Quầy vé ĐÃ MỞ (Admin đã xác nhận đóng online)
                        </span>
                        <span className="text-xs text-slate-600">
                          Giá vé: <strong className="text-emerald-700 font-bold">{currentEvent.ticketPrice.toLocaleString('vi-VN')} đ</strong>
                        </span>
                      </div>

                      <div className="pt-1 flex items-baseline justify-between border-t border-emerald-200">
                        <span className="text-xs text-slate-700 font-medium">
                          Số lượng vé còn lại tại quầy:
                        </span>
                        <div className="text-right">
                          <span className={`text-2xl sm:text-3xl font-black ${remainingTickets > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                            {remainingTickets}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 ml-1">
                            / {currentEvent.totalTickets} vé
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-emerald-800">
                        Nhân viên được phép bán trực tiếp tối đa <strong>{remainingTickets} vé</strong> cho khách vãng lai.
                      </p>
                    </div>
                  ) : currentEvent?.status === 'ended' ? (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
                        <span>⏸️</span>
                        <span>SỰ KIỆN ĐANG TẠM DỪNG / KẾT THÚC</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Sự kiện này hiện đang tạm dừng bán vé. Khi Quản trị viên (Admin) mở lại quầy vé, bạn sẽ có thể tiếp tục xuất vé cho khách ngay.
                      </p>
                      <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-1 flex items-center justify-between">
                        <span>Trạng thái: <strong className="text-slate-800">Đã kết thúc / Tạm dừng</strong></span>
                        <span>Vé còn trong hệ thống: <strong className="text-slate-900 font-bold">{remainingTickets} vé</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-xs sm:text-sm">
                        <span>⚠️</span>
                        <span>CHƯA ĐƯỢC PHÉP BÁN VÉ TẠI QUẦY</span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed">
                        Sự kiện này hiện vẫn đang trong giai đoạn <strong>Bán vé Online</strong>.
                        Theo quy định di sản, quầy vé của nhân viên <strong>chỉ được mở bán</strong> sau khi Quản trị viên (Admin) xác nhận đóng kênh bán vé online.
                      </p>
                      <div className="text-[11px] text-slate-500 border-t border-amber-200 pt-1 flex items-center justify-between">
                        <span>Trạng thái: <strong className="text-emerald-700 font-bold">Đang bán Online</strong></span>
                        <span>Vé còn trên hệ thống: <strong className="text-slate-900 font-bold">{remainingTickets} vé</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tên khách mua vé */}
              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Tên khách mua vé</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Trần Văn C"
                  disabled={!isDoorSaleOpen || remainingTickets <= 0}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Số điện thoại khách */}
              <div>
                <label className="text-xs text-slate-700 font-semibold mb-1 block">Số điện thoại khách</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0912 345 678"
                  disabled={!isDoorSaleOpen || remainingTickets <= 0}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {/* Chọn số lượng vé */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-700 font-semibold">Số lượng vé muốn mua</label>
                  <span className="text-xs text-amber-800 font-medium">
                    Còn lại: <strong>{remainingTickets} vé</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((q) => {
                    const isExceed = q > remainingTickets
                    return (
                      <button
                        key={q}
                        type="button"
                        disabled={!isDoorSaleOpen || isExceed}
                        onClick={() => setTicketQuantity(q)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                          ticketQuantity === q && !isExceed
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {q} vé
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tổng tiền thu */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Tổng tiền thu khách (Tiền mặt):</span>
                  <div className="text-lg font-black text-amber-600">
                    {((currentEvent?.ticketPrice || 50000) * ticketQuantity).toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {(currentEvent?.ticketPrice || 50000).toLocaleString('vi-VN')} đ × {ticketQuantity} vé
                </span>
              </div>

              {sellErrorMessage && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold">
                  ❌ {sellErrorMessage}
                </div>
              )}

              {/* Nút xuất vé */}
              <button
                type="submit"
                disabled={!isDoorSaleOpen || remainingTickets <= 0}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 active:scale-98 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {!isDoorSaleOpen
                  ? '🔒 CHƯA ĐƯỢC PHÉP BÁN VÉ TẠI QUẦY (ĐỢI ADMIN ĐÓNG ONLINE)'
                  : remainingTickets <= 0
                  ? '❌ SỰ KIỆN NÀY ĐÃ HẾT VÉ TẠI QUẦY'
                  : `🎟️ XUẤT ${ticketQuantity} VÉ & THU ${((currentEvent?.ticketPrice || 50000) * ticketQuantity).toLocaleString('vi-VN')} Đ`}
              </button>
            </form>

            {/* VÉ VỪA XUẤT THÀNH CÔNG */}
            {soldTicketsOutput.length > 0 && (
              <div className="max-w-lg mx-auto space-y-2 pt-2">
                <span className="text-xs font-bold text-emerald-700">
                  🎉 Vừa xuất thành công {soldTicketsOutput.length} vé cho khách (Số vé còn lại đã cập nhật):
                </span>
                {soldTicketsOutput.map((tk) => (
                  <div
                    key={tk.ticketCode}
                    className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <span className="font-mono text-sm font-black text-amber-700">#{tk.ticketCode}</span>
                      <div className="text-xs text-slate-900 font-medium mt-0.5">
                        {tk.customerName} - {tk.phone}
                      </div>
                      <span className="text-[10px] text-slate-500">{tk.eventTitle}</span>
                    </div>
                    <div className="text-right">
                      <span className="rounded bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1">
                        Đã thanh toán {tk.price.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 2. SOÁT VÉ CỬA & CHECK-IN (LIGHT THEME) ── */}
        {tab === 'checkin' && (
          <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-8 space-y-6 shadow-xs">
            <div className="text-center max-w-md mx-auto">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Quét / Nhập Mã Vé Soát Cửa</h3>
              <p className="text-xs text-slate-500 mt-1">
                Nhập mã vé của khán giả (VD: <strong>VE-2026-001</strong> hoặc mã vé xuất tại quầy) để soát vé
              </p>
            </div>

            <form onSubmit={handleSearchTicket} className="max-w-md mx-auto flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Nhập mã vé: VE-..."
                className="flex-1 rounded-xl bg-slate-50 border border-slate-300 px-4 py-3 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 uppercase"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 transition active:scale-95 shadow-sm cursor-pointer"
              >
                Kiểm tra
              </button>
            </form>

            {checkinMessage && (
              <div
                className={`max-w-md mx-auto rounded-xl p-3.5 text-center text-xs font-semibold ${
                  checkinMessage.isError
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                }`}
              >
                {checkinMessage.text}
              </div>
            )}

            {searchNotFound && (
              <div className="max-w-md mx-auto rounded-xl bg-red-50 border border-red-200 p-3.5 text-center text-xs font-semibold text-red-700">
                ❌ Không tìm thấy mã vé này trong hệ thống. Vui lòng kiểm tra lại!
              </div>
            )}

            {/* KẾT QUẢ TÌM THẤY VÉ */}
            {searchedTicket && (
              <div className="max-w-lg mx-auto rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-700">#{searchedTicket.ticketCode}</span>
                    <h4 className="text-base font-bold text-slate-900 mt-0.5">{searchedTicket.customerName}</h4>
                  </div>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase border ${
                      searchedTicket.status === 'unused'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {searchedTicket.status === 'unused' ? 'Vé Hợp Lệ (Chưa Soát)' : 'Đã Qua Cổng'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Số điện thoại:</span>
                    <span className="font-semibold text-slate-800">{searchedTicket.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kênh bán:</span>
                    <span className="font-semibold text-slate-800">
                      {searchedTicket.channel === 'online_early' ? 'Đặt Online Sớm' : 'Mua Tại Quầy'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Sự kiện:</span>
                    <span className="font-semibold text-slate-800">{searchedTicket.eventTitle}</span>
                  </div>
                  {searchedTicket.checkedInAt && (
                    <div className="col-span-2 text-red-600 font-medium">
                      ⚠️ Vé này đã được check-in vào lúc: {searchedTicket.checkedInAt}
                    </div>
                  )}
                </div>

                {searchedTicket.status === 'unused' ? (
                  <button
                    type="button"
                    onClick={handleConfirmCheckin}
                    className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 active:scale-98 transition shadow-sm cursor-pointer"
                  >
                    👉 XÁC NHẬN CHO KHÁCH VÀO CỔNG
                  </button>
                ) : (
                  <div className="rounded-xl bg-red-50 border border-red-200 py-2.5 text-center text-xs font-bold text-red-700">
                    KHÔNG CHO QUA - VÉ ĐÃ ĐƯỢC SỬ DỤNG TRƯỚC ĐÓ
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 3. DANH SÁCH VÉ TRONG CA (LIGHT THEME) ── */}
        {tab === 'history' && (
          <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Danh Sách Vé Của Ca Trực</h3>
                <p className="text-xs text-slate-500">Tất cả vé online đã đăng ký và vé bán tại quầy</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">Tổng: {tickets.length} vé</span>
            </div>

            <div className="space-y-2.5">
              {tickets.map((t) => (
                <div
                  key={t.ticketCode}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-amber-800">#{t.ticketCode}</span>
                      <span className="text-xs font-bold text-slate-900">{t.customerName}</span>
                      <span className="text-xs text-slate-500">({t.phone})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{t.eventTitle}</p>
                    <span className="text-[10px] text-slate-500">
                      {t.channel === 'online_early' ? '🌐 Đặt online' : '🎟️ Mua tại quầy'} • {t.createdAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-600">
                      {t.price.toLocaleString('vi-VN')} đ
                    </span>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase border ${
                        t.status === 'checked_in'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {t.status === 'checked_in' ? 'Đã check-in' : 'Chưa check-in'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
