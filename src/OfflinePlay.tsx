import { useState, useRef, useEffect, useMemo } from 'react'
import { CARDS, type Card } from './BaiChoiGame'
import { getChantLyrics } from './chantLyrics'
import type { UserProfile } from './types/auth'

interface OfflinePlayProps {
  c?: any
  lang: 'VIE' | 'ENG'
  initialTab?: 'caller' | 'browse'
  onOpenGameOffline?: () => void
  onOpenQR?: () => void
  currentUser?: UserProfile | null
  onOpenCoins?: () => void
  onOpenAuth?: (mode?: 'login' | 'register') => void
  onLogout?: () => void
  onBackToSite?: () => void
}

export default function OfflinePlay({
  lang,
  onOpenQR,
  currentUser,
  onOpenCoins,
  onOpenAuth,
  onLogout,
  onBackToSite,
}: OfflinePlayProps) {
  const isVie = lang === 'VIE'

  // Trạng thái rút thẻ offline
  const [drawnCards, setDrawnCards] = useState<Card[]>([])
  const [currentCard, setCurrentCard] = useState<Card | null>(null)
  const [isCalling, setIsCalling] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [lyricIndex, setLyricIndex] = useState(0)

  // Drawer xem lịch sử thẻ đã rút
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [celebrateWon, setCelebrateWon] = useState(false)

  // User menu state cho desktop canvas
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const clapperAudioRef = useRef<HTMLAudioElement | null>(null)
  const lyricTimerRef = useRef<number | null>(null)

  // Danh sách các thẻ chưa rút
  const remainingCards = useMemo(() => {
    const drawnIds = new Set(drawnCards.map((c) => c.id))
    return CARDS.filter((c) => !drawnIds.has(c.id))
  }, [drawnCards])

  // Lời câu hò hiện tại
  const currentLyrics = useMemo(() => {
    if (!currentCard) return []
    return getChantLyrics(currentCard.id)
  }, [currentCard])

  // Dừng âm thanh
  const stopAudio = () => {
    if (lyricTimerRef.current) {
      window.clearInterval(lyricTimerRef.current)
      lyricTimerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsCalling(false)
  }

  // Phát câu hò một quân bài
  const playCardChant = (card: Card) => {
    stopAudio()
    setCurrentCard(card)
    setIsCalling(true)
    setLyricIndex(0)

    const soundSrc = card.soundOffline || card.sound
    const audio = audioRef.current || new Audio()
    audio.src = soundSrc
    audio.volume = 1
    audio.currentTime = 0
    audioRef.current = audio

    lyricTimerRef.current = window.setInterval(() => {
      setLyricIndex((prev) => (prev < 3 ? prev + 1 : prev))
    }, 6500)

    audio.onended = () => {
      setIsCalling(false)
      if (lyricTimerRef.current) {
        window.clearInterval(lyricTimerRef.current)
        lyricTimerRef.current = null
      }
    }

    audio.onerror = () => {
      console.warn('Lỗi tải âm thanh:', soundSrc)
      setIsCalling(false)
    }

    void audio.play().catch(() => {
      setIsCalling(false)
    })
  }

  // Lắc ống và rút thẻ ngẫu nhiên
  const handleDrawRandom = () => {
    if (remainingCards.length === 0) {
      alert(
        isVie
          ? 'Đã rút hết toàn bộ 30 thẻ bài trong ván! Hãy bấm "Ván mới" để bắt đầu lại hội chơi.'
          : 'All 30 cards drawn! Click "New Round" to reset.',
      )
      return
    }

    setIsShaking(true)
    handlePlayMo() // gõ tiếng lộc cộc nhẹ khi lắc ống

    setTimeout(() => {
      setIsShaking(false)
      const randomIndex = Math.floor(Math.random() * remainingCards.length)
      const drawn = remainingCards[randomIndex]
      setDrawnCards((prev) => [drawn, ...prev])
      playCardChant(drawn)
    }, 600)
  }

  // Bắt đầu ván mới
  const handleResetRound = () => {
    stopAudio()
    setDrawnCards([])
    setCurrentCard(null)
    setCelebrateWon(false)
  }

  // Phát tiếng Gõ Mõ (Âm thanh thực tế Do-Mo.mp3)
  const handlePlayMo = () => {
    try {
      const audio = clapperAudioRef.current || new Audio('/sound-offline/Do-Mo.mp3')
      audio.currentTime = 0
      audio.volume = 1
      clapperAudioRef.current = audio
      void audio.play().catch(() => {
        // Fallback AudioContext
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(420, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.8, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.14)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
      })
    } catch {}
  }

  // Hô Tới Rồi (Báo thắng cuộc)
  const handleToiGoi = () => {
    stopAudio()
    setCelebrateWon(true)
    const audio = audioRef.current || new Audio()
    audio.src = '/sound-offline/Toi-Goi.mp3'
    audio.volume = 1
    audioRef.current = audio
    void audio.play().catch(() => undefined)
  }

  // Click outside user menu
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

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [])

  return (
    <div className="w-full relative select-none">
      {/* =========================================================================
          1. GIAO DIỆN DESKTOP / MÀN HÌNH RỘNG (>= 1024px)
          Tái hiện 100% bố cục QUANTRO.png với các vùng tương tác trực tiếp
          ========================================================================= */}
      <div className="hidden lg:block relative w-full max-w-[2000px] aspect-[2000/1009] mx-auto overflow-hidden shadow-2xl rounded-3xl border-2 border-emerald-900/30">
        {/* Ảnh nền gốc QUANTRO.png */}
        <img
          src="/assets/quantro/QUANTRO.png"
          alt="Giao diện Quản trò Bài Chòi"
          className="w-full h-full object-contain pointer-events-none select-none"
        />

        {/* ── TOP RIGHT: CÁC NÚT ĐIỀU HƯỚNG TRÊN GIAO DIỆN ── */}
        {/* Nút Ví Xu Chòi (Khớp vị trí ô xu x: 74.5%, y: 2.2%, w: 8.2%, h: 4.2%) */}
        <button
          type="button"
          onClick={onOpenCoins}
          className="absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform"
          style={{
            left: '74.5%',
            top: '2.1%',
            width: '8.2%',
            height: '4.3%',
          }}
          title="Ví Xu Chòi - Bấm để nạp hoặc xem số dư"
        />

        {/* Nút Tài khoản người dùng (Khớp vị trí ô penhi x: 84.5%, y: 2.2%, w: 8.2%, h: 4.2%) */}
        <div
          ref={userMenuRef}
          className="absolute z-30"
          style={{
            left: '84.5%',
            top: '2.1%',
            width: '8.2%',
            height: '4.3%',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                setUserMenuOpen((v) => !v)
              } else {
                onOpenAuth?.('login')
              }
            }}
            className="w-full h-full cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform"
            title={currentUser ? currentUser.username : 'Đăng nhập'}
          />

          {/* User Menu Dropdown trên Desktop Canvas */}
          {userMenuOpen && currentUser && (
            <div className="absolute right-0 top-[120%] w-56 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
              <div className="pb-2 mb-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.username || currentUser.fullName}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    onOpenCoins?.()
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-amber-50 text-amber-900 font-semibold text-xs flex items-center justify-between"
                >
                  <span>🪙 Số dư:</span>
                  <span className="font-mono font-black">{(currentUser.coins ?? 50).toLocaleString()} Xu</span>
                </button>
              </div>
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    onBackToSite?.()
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-medium"
                >
                  ← Về Trang chủ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    onLogout?.()
                  }}
                  className="w-full text-left px-2 py-1 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold"
                >
                  🚪 Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nút Menu ☰ (Khớp vị trí icon menu x: 94.0%, y: 1.9%, w: 3.0%, h: 4.5%) */}
        <button
          type="button"
          onClick={onOpenQR}
          className="absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform"
          style={{
            left: '94.0%',
            top: '1.9%',
            width: '3.0%',
            height: '4.5%',
          }}
          title="Lấy mã QR Quản Trò"
        />

        {/* ── BẢNG TRÁI: ỐNG BÀI HIỆU TRUYỀN THỐNG ── */}
        {/* Số lượng đã rút: Đã rút: X/30 quân bài (Khớp vị trí text dưới tiêu đề) */}
        <div
          className="absolute z-20 flex items-center text-[#74c3c9] font-bold text-xs sm:text-[13px] font-mono pointer-events-none"
          style={{
            left: '32.25%',
            top: '45.8%',
          }}
        >
          <span>Đã rút:&nbsp;</span>
          <span className="text-amber-300 font-black">{drawnCards.length}/30</span>
          <span>&nbsp;quân bài</span>
        </div>

        {/* Nút Ván mới 🔄 (Khớp vị trí ô "Ván mới" x: 50.1%, y: 42.4%, w: 5.6%, h: 4.0%) */}
        <button
          type="button"
          onClick={handleResetRound}
          className="absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform rounded-xl hover:bg-white/10"
          style={{
            left: '50.1%',
            top: '42.2%',
            width: '5.6%',
            height: '4.2%',
          }}
          title="Bắt đầu ván chơi mới (Làm mới ống thẻ)"
        />

        {/* VÙNG HIỂN THỊ THẺ BÀI RÚT / ỐNG THẺ LẮC */}
        {/* Vị trí khung thẻ: x: 32.25%, y: 50.05%, w: 23.5%, h: 24.28% */}
        <div
          className="absolute z-20 flex items-center justify-center p-2"
          style={{
            left: '32.25%',
            top: '50.05%',
            width: '23.5%',
            height: '24.28%',
          }}
        >
          {currentCard ? (
            /* Khi đã rút thẻ: Hiện quân bài và câu hò tương tác ngay trong khung */
            <div className="w-full h-full rounded-2xl bg-[#1b3d40]/90 border border-[#74c3c9]/40 p-2.5 flex items-center gap-3 backdrop-blur-md shadow-inner animate-in fade-in duration-300">
              {/* Ảnh lá bài */}
              <div className="h-full aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-400 bg-white p-0.5 shadow-lg shrink-0 flex flex-col items-center">
                <img
                  src={currentCard.image}
                  alt={currentCard.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* Thông tin tên bài và câu hò thai */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5 text-left">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs sm:text-sm tracking-wide shadow-xs">
                      {currentCard.name}
                    </span>
                    <span className="text-[10px] text-amber-200/90 font-mono font-bold">
                      #{drawnCards.length}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{isCalling ? 'Chị Hiệu đang hô' : 'Đã công bố thẻ'}</span>
                  </div>
                </div>

                {/* Câu hò thai */}
                <div className="p-1.5 rounded-xl bg-black/25 border border-white/10 my-auto">
                  <p className="text-[11px] leading-tight text-amber-100 italic line-clamp-2">
                    "{currentLyrics[lyricIndex] || currentLyrics[0] || currentCard.name}"
                  </p>
                </div>

                {/* Nút điều khiển âm thanh nhỏ */}
                <div className="flex items-center gap-2 pt-1">
                  {isCalling ? (
                    <button
                      type="button"
                      onClick={stopAudio}
                      className="px-2 py-0.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold transition cursor-pointer"
                    >
                      ⏹ Dừng hô
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => playCardChant(currentCard)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] font-bold transition cursor-pointer"
                    >
                      🔊 Nghe lại
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Khi chưa rút: Hiển thị ống tre lắc linh hoạt */
            <div
              className={`w-full h-full flex flex-col items-center justify-center text-center cursor-pointer transition-transform ${
                isShaking ? 'scale-110 rotate-6' : ''
              }`}
              onClick={handleDrawRandom}
              title="Bấm để lắc ống và rút thẻ!"
            >
              {/* Khung gốc của QUANTRO.png đã có sẵn icon ống tre và text mờ,
                  khi lắc ta thêm hiệu ứng rung và tia hào quang */}
              {isShaking && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-5xl animate-bounce">🎋</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3 NÚT TÁC VỤ DƯỚI BẢNG TRÁI (Khớp 3 ô hình chữ nhật x: 76.2%) ── */}
        {/* Nút 1: Lắc Ống & Rút Thẻ (x: 32.25%, y: 76.2%, w: 7.6%, h: 4.6%) */}
        <button
          type="button"
          onClick={handleDrawRandom}
          disabled={isCalling}
          className={`absolute z-30 rounded-xl cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-all flex items-center justify-center font-black text-[11px] sm:text-[13px] text-white shadow-lg ${
            isCalling
              ? 'opacity-60 cursor-not-allowed bg-slate-600'
              : 'bg-gradient-to-r from-[#d9534f] to-[#e67e3a] hover:brightness-110 hover:shadow-orange-500/30'
          }`}
          style={{
            left: '32.25%',
            top: '76.2%',
            width: '7.6%',
            height: '4.6%',
          }}
          title="Lắc ống tre và rút ngẫu nhiên 1 quân bài"
        >
          <span className="truncate">🎋 Lắc Ống</span>
        </button>

        {/* Nút 2: Gõ Mõ (x: 40.25%, y: 76.2%, w: 7.6%, h: 4.6%) */}
        <button
          type="button"
          onClick={handlePlayMo}
          className="absolute z-30 rounded-xl cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-all flex items-center justify-center font-black text-[11px] sm:text-[13px] text-amber-200 bg-[#1c3e41]/90 hover:bg-[#255256] border border-amber-300/30 shadow-md hover:brightness-110"
          style={{
            left: '40.25%',
            top: '76.2%',
            width: '7.6%',
            height: '4.6%',
          }}
          title="Gõ mõ lộc cộc báo hiệu nhịp chơi"
        >
          <span className="truncate">🪵 Gõ Mõ</span>
        </button>

        {/* Nút 3: Hô Tới Rồi! (x: 48.25%, y: 76.2%, w: 7.6%, h: 4.6%) */}
        <button
          type="button"
          onClick={handleToiGoi}
          className="absolute z-30 rounded-xl cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-all flex items-center justify-center font-black text-[11px] sm:text-[13px] text-white bg-gradient-to-r from-[#c0392b] to-[#962d22] hover:brightness-110 border border-amber-400/50 shadow-md"
          style={{
            left: '48.25%',
            top: '76.2%',
            width: '7.6%',
            height: '4.6%',
          }}
          title="Chòi thắng cuộc hô TỚI RỒI! ăn thưởng"
        >
          <span className="truncate">🎉 Hô Tới!</span>
        </button>

        {/* ── BẢNG PHẢI: KHUNG TRE TRÚC (Cách tổ chức chơi offline) ── */}
        {/* Vị trí lòng khung tre: x: 57.2%, y: 46.0%, w: 13.8%, h: 36.0% */}
        <div
          className="absolute z-20 flex flex-col justify-center px-3 py-2 text-left pointer-events-auto"
          style={{
            left: '57.2%',
            top: '46.0%',
            width: '13.8%',
            height: '36.0%',
          }}
        >
          <div className="space-y-2 text-[10px] sm:text-[11px] leading-tight text-white/95">
            <div className="flex items-start gap-1.5">
              <span className="h-4 w-4 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-[9px] shrink-0">
                1
              </span>
              <p>Chuẩn bị 30 thẻ bài giấy chia người chơi (mỗi chòi 3 quân).</p>
            </div>

            <div className="flex items-start gap-1.5">
              <span className="h-4 w-4 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-[9px] shrink-0">
                2
              </span>
              <p>Mở điện thoại hoặc loa Bluetooth làm Anh Hiệu / Chị Hiệu ảo.</p>
            </div>

            <div className="flex items-start gap-1.5">
              <span className="h-4 w-4 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-[9px] shrink-0">
                3
              </span>
              <p>Bấm &quot;Lắc Ống&quot; để nghe bài hò thai nguyên bản truyền thống.</p>
            </div>

            <div className="flex items-start gap-1.5">
              <span className="h-4 w-4 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-[9px] shrink-0">
                4
              </span>
              <p>Trùng quân hô &quot;Có Đây!&quot;. Đủ 3 quân gõ mõ hô &quot;TỚI RỒI!&quot; nhận giải.</p>
            </div>
          </div>
        </div>

        {/* ── ĐÁY BẢNG: THANH &quot;LỊCH SỬ THẺ ĐÃ RÚT 👆&quot; ── */}
        {/* Vị trí thanh drawer: x: 33.75%, y: 86.7%, w: 34.25%, h: 8.4% */}
        <button
          type="button"
          onClick={() => setHistoryDrawerOpen(true)}
          className="absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-98 transition-transform rounded-xl hover:bg-white/10 flex items-center justify-end pr-8"
          style={{
            left: '33.75%',
            top: '86.7%',
            width: '34.25%',
            height: '8.4%',
          }}
          title="Bấm để xem danh sách toàn bộ các quân bài đã rút"
        >
          {/* Badge số thẻ đã rút */}
          <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 font-black text-xs shadow-md">
            {drawnCards.length} thẻ
          </span>
        </button>
      </div>

      {/* =========================================================================
          2. GIAO DIỆN MOBILE / TABLET (< 1024px)
          Tối ưu cảm ứng, giữ nguyên hình ảnh, phong cách và nhân vật của QUANTRO.png
          ========================================================================= */}
      <div className="lg:hidden flex flex-col items-center gap-6 p-3 sm:p-5">
        {/* HERO BANNER VỚI MÁI CHÒI & 2 NHÂN VẬT ANH HIỆU / CHỊ HIỆU */}
        <div className="w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#1b3f42] to-[#142e31] p-5 border-2 border-emerald-600/40 shadow-xl text-center relative overflow-hidden">
          {/* Huy hiệu Offline */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold mb-3">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>CHẾ ĐỘ BÀI CHÒI OFFLINE</span>
          </div>

          {/* Biển hiệu "NHẠC CỦA CHÒI" */}
          <div className="relative mx-auto max-w-[280px] sm:max-w-[340px] my-1">
            <img
              src="/assets/quantro/signboard.png"
              alt="Nhạc của Chòi"
              className="w-full object-contain filter drop-shadow-md"
            />
          </div>

          <p className="text-xs text-emerald-100/85 mt-2 max-w-md mx-auto leading-relaxed">
            Thích hợp làm Quản trò / Anh Hiệu ảo cho hội chơi thực tế ngoài đời, gia đình, lễ hội hoặc lớp học.
          </p>

          {/* Hai linh vật Anh Hiệu và Chị Hiệu đứng hai bên */}
          <div className="flex items-center justify-between px-2 mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-left">
              <img
                src="/assets/quantro/anh-hieu.png"
                alt="Anh Hiệu"
                className="w-14 h-20 sm:w-16 sm:h-24 object-contain filter drop-shadow"
              />
              <div>
                <p className="text-xs font-black text-amber-300">Anh Hiệu</p>
                <p className="text-[10px] text-emerald-200">Quản trò ảo</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-right flex-row-reverse">
              <img
                src="/assets/quantro/chi-hieu.png"
                alt="Chị Hiệu"
                className="w-14 h-20 sm:w-16 sm:h-24 object-contain filter drop-shadow"
              />
              <div>
                <p className="text-xs font-black text-pink-300">Chị Hiệu</p>
                <p className="text-[10px] text-emerald-200">Hát hò thai</p>
              </div>
            </div>
          </div>
        </div>

        {/* ỐNG RÚT BÀI TRUYỀN THỐNG TRÊN MOBILE */}
        <div className="w-full max-w-xl rounded-3xl bg-[#1b3d40] border-2 border-emerald-500/30 p-5 shadow-xl text-white">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-600/30">
            <div>
              <h3 className="text-base font-black text-amber-300 tracking-wide">ỐNG BÀI HIỆU TRUYỀN THỐNG</h3>
              <p className="text-xs text-emerald-200 font-mono mt-0.5">
                Đã rút: <span className="font-bold text-amber-400">{drawnCards.length}/30</span> quân bài
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetRound}
              className="px-3 py-1.5 rounded-xl border border-emerald-400/40 bg-emerald-950/60 hover:bg-emerald-800 text-xs font-bold text-emerald-200 transition cursor-pointer"
            >
              🔄 Ván mới
            </button>
          </div>

          {/* VÙNG THẺ BÀI RÚT */}
          <div className="my-5 min-h-[180px] flex items-center justify-center">
            {currentCard ? (
              <div className="w-full rounded-2xl bg-black/30 border border-emerald-500/30 p-3.5 flex items-center gap-4">
                <div className="w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-400 bg-white p-0.5 shrink-0 shadow-lg">
                  <img src={currentCard.image} alt={currentCard.name} className="w-full h-full object-cover rounded-lg" />
                </div>
                <div className="flex-1 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-sm">
                      {currentCard.name}
                    </span>
                    <span className="text-xs text-amber-300 font-mono">#{drawnCards.length}</span>
                  </div>
                  <p className="text-xs text-emerald-200/90 italic">
                    &quot;{currentLyrics[lyricIndex] || currentLyrics[0] || currentCard.name}&quot;
                  </p>
                  <div className="pt-1 flex gap-2">
                    {isCalling ? (
                      <button
                        type="button"
                        onClick={stopAudio}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold"
                      >
                        ⏹ Dừng hô
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => playCardChant(currentCard)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                      >
                        🔊 Nghe lại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={handleDrawRandom}
                className={`py-8 text-center cursor-pointer transition-transform ${isShaking ? 'scale-110 rotate-6' : ''}`}
              >
                <div className="mx-auto h-20 w-20 rounded-2xl bg-emerald-950/60 border-2 border-dashed border-emerald-400/40 flex items-center justify-center text-4xl shadow-inner">
                  🎋
                </div>
                <p className="mt-3 text-xs text-emerald-200 max-w-xs mx-auto">
                  Ống thẻ đang sẵn sàng. Hãy bấm nút dưới đây để lắc ống và rút thẻ!
                </p>
              </div>
            )}
          </div>

          {/* 3 NÚT TÁC VỤ */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleDrawRandom}
              disabled={isCalling}
              className={`py-3 rounded-xl font-black text-xs text-white shadow-md active:scale-95 transition ${
                isCalling
                  ? 'bg-slate-600 opacity-60 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#d9534f] to-[#e67e3a]'
              }`}
            >
              🎋 Lắc Ống
            </button>

            <button
              type="button"
              onClick={handlePlayMo}
              className="py-3 rounded-xl font-black text-xs text-amber-200 bg-[#142e31] border border-amber-300/30 shadow-md active:scale-95 transition"
            >
              🪵 Gõ Mõ
            </button>

            <button
              type="button"
              onClick={handleToiGoi}
              className="py-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#c0392b] to-[#962d22] border border-amber-400/40 shadow-md active:scale-95 transition"
            >
              🎉 Hô Tới!
            </button>
          </div>

          {/* NÚT MỞ LỊCH SỬ THẺ ĐÃ RÚT */}
          <button
            type="button"
            onClick={() => setHistoryDrawerOpen(true)}
            className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 border border-emerald-500/40 flex items-center justify-between px-4 font-bold text-xs cursor-pointer active:scale-98 transition shadow"
          >
            <span>Lịch sử thẻ đã rút 👆</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-black text-[11px]">
              {drawnCards.length} thẻ
            </span>
          </button>
        </div>

        {/* KHUNG CÁCH TỔ CHỨC CHƠI OFFLINE TRÊN MOBILE */}
        <div className="w-full max-w-xl rounded-3xl bg-[#1b3d40] border-2 border-emerald-500/30 p-5 shadow-xl text-white text-left">
          <h4 className="text-sm font-black text-amber-300 mb-3 flex items-center gap-2">
            <span>🎋</span>
            <span>CÁCH TỔ CHỨC CHƠI OFFLINE</span>
          </h4>
          <div className="space-y-2.5 text-xs text-emerald-100/90 leading-relaxed">
            <p>1. Chuẩn bị 30 thẻ bài giấy hoặc quân cờ chia cho các chòi/người chơi (mỗi chòi 3 quân).</p>
            <p>2. Đặt điện thoại hoặc loa Bluetooth ở giữa làm Anh Hiệu / Chị Hiệu ảo.</p>
            <p>3. Bấm &quot;Lắc Ống&quot; để nghe bài hát hò thai đầy đủ truyền thống.</p>
            <p>4. Chòi nào có thẻ trùng khớp hô &quot;Có Đây!&quot;. Đủ 3 quân thì gõ mõ hô &quot;TỚI RỒI!&quot; để nhận thưởng.</p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. SLIDE-UP DRAWER: LỊCH SỬ THẺ ĐÃ RÚT (Áp dụng cho cả Desktop & Mobile)
          ========================================================================= */}
      {historyDrawerOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-2xl max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-[#1b3d40] border-2 border-emerald-500/40 p-5 sm:p-6 shadow-2xl text-white flex flex-col text-left">
            {/* Header Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-white/15">
              <div>
                <h3 className="text-lg font-black text-amber-300 font-serif">
                  LỊCH SỬ THẺ ĐÃ RÚT ({drawnCards.length}/30)
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Danh sách các quân bài đã được Quản trò rút trong ván này
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryDrawerOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* List thẻ */}
            <div className="flex-1 overflow-y-auto py-4 pr-1">
              {drawnCards.length === 0 ? (
                <div className="py-12 text-center text-sm text-emerald-200/70 italic">
                  Chưa có quân bài nào được rút trong ván chơi này. Hãy bấm &quot;Lắc Ống&quot; để bắt đầu!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {drawnCards.map((card, idx) => (
                    <div
                      key={`${card.id}-${idx}`}
                      className="p-2.5 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-between gap-3 hover:border-amber-400/50 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-6 w-6 rounded-full bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center shrink-0">
                          #{drawnCards.length - idx}
                        </span>
                        <div className="h-11 w-8 rounded-lg overflow-hidden border border-white/20 bg-white shrink-0">
                          <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-sm text-white truncate">{card.name}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          playCardChant(card)
                          setHistoryDrawerOpen(false)
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>🔊</span>
                        <span>Nghe lại</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Drawer */}
            <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-emerald-200">
              <span>Đã rút {drawnCards.length} / 30 quân</span>
              <button
                type="button"
                onClick={() => setHistoryDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MODAL THÔNG BÁO CHIẾN THẮNG: HÔ TỚI RỒI!
          ========================================================================= */}
      {celebrateWon && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border-4 border-amber-400 bg-gradient-to-b from-[#1b3d40] to-[#0d2224] p-8 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="text-6xl animate-bounce">🏆</div>
            <h3 className="mt-4 text-3xl font-black text-amber-300 font-serif">
              TỚI RỒI! BÁO THẮNG!
            </h3>
            <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
              Chúc mừng chòi thắng cuộc! Tiếng trống hội vang lừng, vinh danh người giữ trọn nhịp phách Bài Chòi.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleResetRound}
                className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg transition"
              >
                Chơi Ván Mới
              </button>
              <button
                type="button"
                onClick={() => setCelebrateWon(false)}
                className="flex-1 rounded-2xl bg-amber-500 hover:bg-amber-400 py-3 text-sm font-bold text-slate-900 shadow-lg transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
