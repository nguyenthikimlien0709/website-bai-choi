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
  const [rotationAngle, setRotationAngle] = useState<90 | -90>(90)
  const [showRotateHint, setShowRotateHint] = useState(true)

  // Phát hiện kích thước và hướng màn hình hiện tại
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  })

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    window.addEventListener('orientationchange', updateDimensions)
    return () => {
      window.removeEventListener('resize', updateDimensions)
      window.removeEventListener('orientationchange', updateDimensions)
    }
  }, [])

  // Nhận diện điện thoại ở chế độ dọc (portrait)
  const isPortrait = dimensions.height > dimensions.width
  const isMobileDevice =
    Math.min(dimensions.width, dimensions.height) <= 850 ||
    (typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
  const isMobilePortrait = isPortrait && isMobileDevice

  // Tự động ẩn gợi ý xoay sau 4.5 giây
  useEffect(() => {
    if (!isMobilePortrait) return
    const timer = setTimeout(() => setShowRotateHint(false), 4500)
    return () => clearTimeout(timer)
  }, [isMobilePortrait])

  // Cố gắng khóa hướng ngang trên các thiết bị hỗ trợ Screen Orientation API
  useEffect(() => {
    try {
      if (screen.orientation && 'lock' in screen.orientation) {
        ;(screen.orientation.lock as (orientation: string) => Promise<void>)('landscape').catch(() => {})
      }
    } catch {}

    return () => {
      try {
        if (screen.orientation && 'unlock' in screen.orientation) {
          screen.orientation.unlock()
        }
      } catch {}
    }
  }, [])

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
        // Chạm vào màn hình để bật âm thanh nếu đang bị hạn chế autoplay
        if (isAutoplayBlocked && videoRef.current) {
          videoRef.current.muted = false
          setIsMuted(false)
          setIsAutoplayBlocked(false)
        }
      }}
    >
      {/* Khung chứa video & controls: Trên điện thoại dọc sẽ tự động xoay ngang 90 độ để người dùng xem trọn vẹn */}
      <div
        className="relative overflow-hidden flex items-center justify-center"
        style={
          isMobilePortrait
            ? {
                width: `${dimensions.height}px`,
                height: `${dimensions.width}px`,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${rotationAngle}deg)`,
                transformOrigin: 'center center',
              }
            : {
                width: '100vw',
                height: '100vh',
                position: 'relative',
              }
        }
      >
        {/* Video tràn đầy toàn bộ kích thước màn hình máy tính (object-cover) không còn khoảng đen 2 bên */}
        <video
          ref={videoRef}
          src="/oriental_full_film_with_sound.mp4"
          className="w-full h-full object-cover object-center pointer-events-none"
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

        {/* Thanh tiến trình thời gian mỏng màu hoàng kim viền trên */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30 pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-[#D8B069] via-[#F29963] to-[#D8B069] transition-all duration-150 ease-linear shadow-[0_0_8px_rgba(216,176,105,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Gợi ý xoay màn hình thông minh trên điện thoại (tự ẩn sau vài giây hoặc bấm để đảo chiều 180 độ) */}
        {isMobilePortrait && showRotateHint && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setRotationAngle((prev) => (prev === 90 ? -90 : 90))
              }}
              className="flex items-center gap-2 rounded-full border border-[#D8B069]/40 bg-black/75 px-3.5 py-1.5 text-[11px] font-medium text-[#D8B069] shadow-[0_4px_16px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              <span>Đang xoay ngang video (Bấm để đổi chiều)</span>
            </button>
          </div>
        )}

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
    </div>
  )
}
