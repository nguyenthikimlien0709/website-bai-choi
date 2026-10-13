import { useState, useRef, useEffect, useMemo } from 'react'
import { CARDS, Card } from './BaiChoiGame'
import { getChantLyrics } from './chantLyrics'

interface OfflinePlayProps {
  c?: any
  lang: 'VIE' | 'ENG'
  initialTab?: 'caller' | 'browse'
  onOpenGameOffline: () => void
}

export default function OfflinePlay({ lang, initialTab = 'caller', onOpenGameOffline }: OfflinePlayProps) {
  const isVie = lang === 'VIE'

  // Trạng thái rút thẻ offline
  const [drawnCards, setDrawnCards] = useState<Card[]>([])
  const [currentCard, setCurrentCard] = useState<Card | null>(null)
  const [isCalling, setIsCalling] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [lyricIndex, setLyricIndex] = useState(0)


  const [celebrateWon, setCelebrateWon] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
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

    // Âm thanh offline truyền thống đầy đủ
    const soundSrc = card.soundOffline || card.sound
    const audio = audioRef.current || new Audio()
    audio.src = soundSrc
    audio.volume = 1
    audio.currentTime = 0
    audioRef.current = audio

    // Chuyển lời câu hò mỗi ~7 giây
    lyricTimerRef.current = window.setInterval(() => {
      setLyricIndex((prev) => (prev < 3 ? prev + 1 : prev))
    }, 7000)

    audio.onended = () => {
      setIsCalling(false)
      if (lyricTimerRef.current) {
        window.clearInterval(lyricTimerRef.current)
        lyricTimerRef.current = null
      }
    }

    audio.onerror = () => {
      console.warn('Lỗi tải âm thanh offline:', soundSrc)
      setIsCalling(false)
    }

    void audio.play().catch(() => {
      setIsCalling(false)
    })
  }

  // Lắc ống và rút thẻ ngẫu nhiên
  const handleDrawRandom = () => {
    if (remainingCards.length === 0) {
      alert(isVie ? 'Đã rút hết 30 thẻ bài trong ván! Hãy bấm "Ván Mới" để bắt đầu lại.' : 'All 30 cards have been drawn! Click "New Round" to reset.')
      return
    }

    setIsShaking(true)
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

  // Phát tiếng Gõ Mõ
  const handlePlayMo = () => {
    try {
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
    } catch {
      // Fallback
    }
  }

  // Hô Tới (Chúc mừng thắng cuộc)
  const handleToiGoi = () => {
    stopAudio()
    setCelebrateWon(true)
    const audio = audioRef.current || new Audio()
    audio.src = '/sound-offline/Toi-Goi.mp3'
    audio.volume = 1
    audioRef.current = audio
    void audio.play().catch(() => undefined)
    setTimeout(() => setCelebrateWon(false), 5000)
  }

  useEffect(() => {
    return () => {
      stopAudio()
    }
  }, [])

  return (
    <section id="offline" className="relative scroll-mt-20 px-4 py-12 sm:px-8 lg:px-12">
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* TIÊU ĐỀ SECTION */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#006368]/30 bg-white/70 px-4 py-1.5 backdrop-blur-md shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#c44837] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#006368]">
              {isVie ? 'Công Cụ Quản Trò Truyền Thống' : 'Virtual Caller Tube Tool'}
            </span>
          </div>

          <h2
            className="mt-4 text-3xl font-black sm:text-4xl lg:text-5xl"
            style={{ color: '#006368', fontFamily: 'var(--font-display)' }}
          >
            {isVie ? 'ỐNG RÚT BÀI QUẢN TRÒ & ANH HIỆU ẢO' : 'VIRTUAL CALLER TUBE & FOLK CHANTS'}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: '#006368' }}>
            {isVie
              ? 'Mô phỏng ống tre 30 thẻ bài, hỗ trợ Quản trò / Anh Hiệu ảo lắc ống rút thẻ ngẫu nhiên và phát câu hò thai nguyên bản cho hội chơi thực tế, lớp học hoặc gia đình.'
              : 'Virtual bamboo drawer with all 30 cards. Shake, draw cards, and play authentic chants for real-life gatherings, classrooms, or festivals.'}
          </p>
        </div>

        {/* NỘI DUNG ỐNG RÚT THẺ & ANH HIỆU ẢO */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            {/* CỘT TRÁI: KHUNG RÚT THẺ & PHÁT HÔ CÂU THAI */}
            <div className="lg:col-span-7 rounded-3xl border border-[#006368]/20 bg-white/85 p-6 shadow-xl backdrop-blur-md sm:p-8">
              <div className="flex items-center justify-between border-b border-[#006368]/15 pb-4">
                <div>
                  <h3 className="text-lg font-black text-[#006368]" style={{ fontFamily: 'var(--font-display)' }}>
                    {isVie ? 'ỐNG BÀI HIỆU TRUYỀN THỐNG' : 'TRADITIONAL CALLER TUBE'}
                  </h3>
                  <p className="text-xs text-[#006368]/70">
                    {isVie ? `Đã rút: ${drawnCards.length}/30 quân bài` : `Drawn: ${drawnCards.length}/30 cards`}
                  </p>
                </div>
                <button
                  onClick={handleResetRound}
                  className="rounded-xl border border-[#006368]/30 px-3 py-1.5 text-xs font-semibold text-[#006368] hover:bg-[#006368] hover:text-white transition"
                >
                  🔄 {isVie ? 'Ván Mới' : 'New Round'}
                </button>
              </div>

              {/* KHU VỰC THẺ BÀI ĐANG HÔ */}
              <div className="mt-6 flex flex-col items-center justify-center text-center">
                {currentCard ? (
                  <div className="relative w-full max-w-sm">
                    {/* Thẻ bài hiển thị */}
                    <div className="relative mx-auto w-44 overflow-hidden rounded-2xl border-4 border-[#f29963] bg-white p-1.5 shadow-2xl sm:w-52 transition-transform duration-500">
                      <img
                        src={currentCard.image}
                        alt={currentCard.name}
                        className="aspect-[3/4] w-full rounded-xl object-cover"
                      />
                      <div className="mt-2 text-center">
                        <span
                          className="inline-block rounded-full bg-[#006368] px-4 py-1 text-sm font-bold text-white shadow"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {currentCard.name}
                        </span>
                      </div>
                    </div>

                    {/* Câu hò đồng bộ */}
                    <div className="mt-5 min-h-[70px] rounded-2xl border border-[#f29963]/30 bg-[#fff9df] p-4 text-[#006368] shadow-sm">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c44837]">
                        <span>🎙️ {isCalling ? (isVie ? 'Chị Hiệu đang hô' : 'Caller chanting...') : (isVie ? 'Đã công bố' : 'Revealed')}</span>
                        {isCalling && <span className="h-2 w-2 rounded-full bg-[#c44837] animate-ping" />}
                      </div>
                      <p className="mt-1.5 text-sm font-semibold italic sm:text-base">
                        "{currentLyrics[lyricIndex] || currentLyrics[0] || currentCard.name}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div
                      className={`mx-auto flex h-28 w-28 items-center justify-center rounded-3xl border-2 border-dashed border-[#006368]/30 bg-[#e7f1f1]/60 text-5xl transition-transform ${
                        isShaking ? 'rotate-12 scale-110' : ''
                      }`}
                    >
                      🎋
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#006368]">
                      {isVie ? 'Ống thẻ đang sẵn sàng. Hãy bấm nút dưới đây để lắc ống và rút thẻ!' : 'Caller tube ready. Click below to shake and draw!'}
                    </p>
                  </div>
                )}

                {/* THANH CÔNG CỤ TÁC VỤ */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleDrawRandom}
                    disabled={isCalling}
                    className={`rounded-2xl px-6 py-3.5 text-base font-black text-white shadow-xl transition-all active:scale-95 ${
                      isCalling
                        ? 'bg-gray-400 cursor-not-allowed opacity-75'
                        : 'bg-gradient-to-r from-[#c44837] via-[#bd6648] to-[#006368] hover:scale-105'
                    }`}
                  >
                    🎋 {isVie ? 'Lắc Ống & Rút Thẻ' : 'Shake & Draw Card'}
                  </button>

                  <button
                    onClick={handlePlayMo}
                    className="rounded-2xl border border-[#006368]/30 bg-white/90 px-4 py-3 text-sm font-bold text-[#006368] shadow hover:bg-white active:scale-95 transition"
                  >
                    🪵 {isVie ? 'Gõ Mõ' : 'Clapper'}
                  </button>

                  <button
                    onClick={handleToiGoi}
                    className="rounded-2xl border border-[#c44837]/30 bg-[#fff0ed] px-5 py-3 text-sm font-bold text-[#c44837] shadow hover:bg-[#ffe3dd] active:scale-95 transition"
                  >
                    🎉 {isVie ? 'Hô TỚI RỒI!' : 'Claim BINGO!'}
                  </button>

                  {isCalling && (
                    <button
                      onClick={stopAudio}
                      className="rounded-2xl border border-red-300 bg-red-100 px-4 py-3 text-xs font-semibold text-red-700 hover:bg-red-200 transition"
                    >
                      ⏹️ {isVie ? 'Dừng Hô' : 'Stop Audio'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: LỊCH SỬ THẺ ĐÃ RÚT & HƯỚNG DẪN HỘI CHƠI THỰC TẾ */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* LỊCH SỬ THẺ ĐÃ RÚT */}
              <div className="rounded-3xl border border-[#006368]/20 bg-white/85 p-6 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-[#006368]/15 pb-3">
                  <h4 className="text-sm font-black text-[#006368]" style={{ fontFamily: 'var(--font-display)' }}>
                    📋 {isVie ? 'LỊCH SỬ THẺ ĐÃ RÚT' : 'DRAWN CARDS HISTORY'}
                  </h4>
                  <span className="rounded-full bg-[#006368]/10 px-2.5 py-0.5 text-xs font-bold text-[#006368]">
                    {drawnCards.length}
                  </span>
                </div>

                {drawnCards.length === 0 ? (
                  <p className="py-8 text-center text-xs italic text-[#006368]/60">
                    {isVie ? 'Chưa có thẻ nào được rút trong ván này.' : 'No cards drawn yet.'}
                  </p>
                ) : (
                  <div className="mt-4 flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
                    {drawnCards.map((card, idx) => (
                      <button
                        key={`${card.id}-${idx}`}
                        onClick={() => playCardChant(card)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#006368]/20 bg-[#e7f1f1] px-2.5 py-1 text-xs font-semibold text-[#006368] hover:bg-[#006368] hover:text-white transition"
                      >
                        <span className="font-bold">#{drawnCards.length - idx}</span>
                        <span>{card.name}</span>
                        <span>🔊</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* HƯỚNG DẪN TỔ CHỨC CHƠI THỰC TẾ NGOÀI ĐỜI */}
              <div className="rounded-3xl border border-[#f29963]/40 bg-[#fff9df]/95 p-6 shadow-xl">
                <h4 className="flex items-center gap-2 text-sm font-black text-[#7c2421]" style={{ fontFamily: 'var(--font-display)' }}>
                  <span>🏮</span>
                  <span>{isVie ? 'CÁCH TỔ CHỨC CHƠI OFFLINE NGOÀI ĐỜI' : 'REAL-LIFE PARTY GUIDE'}</span>
                </h4>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#006368]">
                  <li className="flex gap-2">
                    <span className="font-bold text-[#c44837]">1.</span>
                    <span>{isVie ? 'Chuẩn bị 30 thẻ bài giấy hoặc quân cờ chia cho các chòi/người chơi (mỗi chòi 3 quân).' : 'Distribute 3 cards to each player or hut.'}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-[#c44837]">2.</span>
                    <span>{isVie ? 'Đặt điện thoại hoặc loa Bluetooth ở giữa làm Anh Hiệu ảo.' : 'Place phone or Bluetooth speaker in the middle as the Virtual Caller.'}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-[#c44837]">3.</span>
                    <span>{isVie ? 'Bấm "Lắc Ống & Rút Thẻ" để nghe bài hát hò thai đầy đủ truyền thống.' : 'Click "Shake & Draw" to hear the folk chant.'}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-[#c44837]">4.</span>
                    <span>{isVie ? 'Chòi nào có thẻ trùng khớp hô "Có Đây!". Đủ 3 quân thì gõ mõ hô "TỚI RỒI!" để nhận thưởng.' : 'First player to match all 3 cards calls "BINGO!"'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        {/* THÔNG BÁO CHIẾN THẮNG HỘI CHÒI */}
        {celebrateWon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border-4 border-[#f29963] bg-gradient-to-b from-[#075f68] to-[#043f49] p-8 text-center text-white shadow-2xl">
              <span className="text-6xl">🏆</span>
              <h3 className="mt-4 text-3xl font-black text-[#ffda86]" style={{ fontFamily: 'var(--font-display)' }}>
                TỚI RỒI! BÁO THẮNG!
              </h3>
              <p className="mt-2 text-sm text-white/80">
                Chúc mừng chòi thắng cuộc! Tiếng trống hội vang lừng, vinh danh người giữ trọn nhịp phách Bài Chòi.
              </p>
              <button
                onClick={() => setCelebrateWon(false)}
                className="mt-6 rounded-2xl bg-[#c44837] px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[#a83425] transition"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
