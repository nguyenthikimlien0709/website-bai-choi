import { useEffect, useRef, useState, useCallback } from 'react'

interface IntroAnimationProps {
  onDone: () => void
}

export default function IntroAnimation({ onDone }: IntroAnimationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFinish = useCallback(() => {
    if (isFadingOut) return
    setIsFadingOut(true)
    setTimeout(() => {
      onDone()
    }, 600)
  }, [isFadingOut, onDone])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Cố gắng phát video có âm thanh ban đầu
    video.muted = false
    const playPromise = video.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsMuted(false)
          setIsAutoplayBlocked(false)
        })
        .catch((error) => {
          console.warn('Trình duyệt hạn chế tự động phát có âm thanh, chuyển sang phát tắt tiếng:', error)
          // Nếu bị chặn, tự động phát ở chế độ tắt tiếng và hiện nút mời bật tiếng
          video.muted = true
          setIsMuted(true)
          setIsAutoplayBlocked(true)
          video.play().catch((err) => {
            console.error('Không thể phát video intro:', err)
          })
        })
    }
  }, [])

  const handleToggleSound = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const video = videoRef.current
    if (!video) return

    if (video.muted) {
      video.muted = false
      setIsMuted(false)
      setIsAutoplayBlocked(false)
    } else {
      video.muted = true
      setIsMuted(true)
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    setProgress((video.currentTime / video.duration) * 100)
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black select-none overflow-hidden transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      onClick={() => {
        // Nếu âm thanh đang bị chặn do chính sách autoplay của trình duyệt, chạm bất kỳ đâu để bật
        if (isAutoplayBlocked && videoRef.current) {
          videoRef.current.muted = false
          setIsMuted(false)
          setIsAutoplayBlocked(false)
        }
      }}
    >
      {/* Video Intro 1080p 60fps kèm âm thanh nhạc Chòi */}
      <video
        ref={videoRef}
        src="/oriental_full_film_with_sound.mp4"
        className="w-full h-full object-contain pointer-events-none"
        playsInline
        autoPlay
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleFinish}
        onError={(e) => {
          console.error('Lỗi phát video intro:', e)
          handleFinish()
        }}
      />

      {/* Thanh tiến trình mỏng màu hoàng kim ở viền trên */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30">
        <div
          className="h-full bg-gradient-to-r from-[#D8B069] via-[#F29963] to-[#D8B069] transition-all duration-150 ease-linear shadow-[0_0_8px_rgba(216,176,105,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Nút bật/tắt âm thanh ở góc dưới bên trái */}
      <div className="absolute bottom-5 left-5 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleSound}
          className="flex items-center gap-2 rounded-full border border-[#D8B069]/40 bg-black/60 px-4 py-2 text-xs font-medium tracking-wide text-[#D8B069] shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:bg-[#D8B069]/20 hover:border-[#D8B069]"
        >
          {isMuted ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
              <span>{isAutoplayBlocked ? 'Chạm để bật âm thanh' : 'Bật âm thanh'}</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              <span>Âm thanh đang bật</span>
            </>
          )}
        </button>
      </div>

      {/* Nút Bỏ qua ở góc dưới bên phải */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleFinish()
        }}
        className="absolute bottom-5 right-5 z-40 flex items-center gap-1.5 rounded-full border border-[#D8B069]/40 bg-black/60 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#D8B069] shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:bg-[#D8B069]/20 hover:border-[#D8B069]"
      >
        <span>Bỏ qua</span>
        <span>→</span>
      </button>
    </div>
  )
}
