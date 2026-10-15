// Quản lý dữ liệu Banner Hero Cửa Hàng (Shop Carousel) cho Admin
// Cho phép Admin tùy chọn sự kiện / ấn phẩm nào xuất hiện trên Hero banner

export interface HeroSlideItem {
  id: string
  tag: string
  title: string
  desc: string
  ctaText: string
  ctaType: 'ticket' | 'product'
  targetEventId?: string
  targetProductId?: string
  bgImage?: string
  isActive: boolean // Admin bật/tắt muốn cái nào xuất hiện
  order: number // Thứ tự hiển thị
  badge?: string
  rating?: string
  priceText?: string
}

export const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'slide-01',
    tag: '• SỰ KIỆN TRỌNG ĐIỂM TRÊN HERO',
    title: 'Đêm Hội Bài Chòi Cổ Truyền Quy Nhơn',
    desc: 'Hòa mình vào không khí hội làng miền Trung rực rỡ dưới ánh trăng rằm, cùng anh Hiệu tranh tài các ván bài dân gian đặc sắc.',
    ctaText: '🎟️ Đặt Vé Ngay (50.000 đ · 50 Xu)',
    ctaType: 'ticket',
    targetEventId: 'evt-01',
    bgImage: '/assets/shop/Shop.png',
    isActive: true,
    order: 1,
    badge: 'VÉ SỰ KIỆN CHÍNH THỨC',
    rating: '⭐ 9.8',
    priceText: '50.000 đ · 50 Xu',
  },
  {
    id: 'slide-02',
    tag: '• ẤN PHẨM ĐỘC BẢN GIỚI HẠN',
    title: 'Bộ Bài Chòi Gỗ 30 Thẻ Cổ Truyền',
    desc: 'Lưu giữ trọn vẹn hồn cốt di sản Bài Chòi trong không gian sống hiện đại. 30 thẻ gỗ tự nhiên 3 pho Văn, Vạn, Hạch chạm khắc tinh xảo.',
    ctaText: '🛍️ Đặt Mua Bộ Thẻ Gỗ (290.000 đ · 290 Xu)',
    ctaType: 'product',
    targetProductId: 'prod-01',
    bgImage: '/assets/shop/Shop.png',
    isActive: true,
    order: 2,
    badge: 'BÁN CHẠY NHẤT #1',
    rating: '⭐ 4.9',
    priceText: '290.000 đ · 290 Xu',
  },
  {
    id: 'slide-03',
    tag: '• SỰ KIỆN VĂN HÓA ĐẶC SẮC',
    title: 'Đêm Thơ Ca & Di Sản Hội An',
    desc: 'Trải nghiệm không gian lung linh của phố cổ Hội An bên bờ sông Hoài, hòa giọng cùng nghệ nhân trong những điệu hô bài chòi ngân vang.',
    ctaText: '🎟️ Xem Vé Hội An (60.000 đ · 60 Xu)',
    ctaType: 'ticket',
    targetEventId: 'evt-02',
    bgImage: '/assets/shop/Shop.png',
    isActive: true,
    order: 3,
    badge: 'VÉ HỘI AN VỀ ĐÊM',
    rating: '⭐ 9.9',
    priceText: '60.000 đ · 60 Xu',
  },
]

const STORAGE_KEY = 'choi_hero_banner_slides_v2'

class HeroBannerService {
  private slides: HeroSlideItem[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.slides = parsed
          return
        }
      }
    } catch {
      // Fallback to default
    }
    this.slides = [...DEFAULT_HERO_SLIDES]
    this.saveToStorage()
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.slides))
    } catch {
      // Ignore storage errors
    }
  }

  private notify() {
    this.saveToStorage()
    this.listeners.forEach((cb) => {
      try {
        cb()
      } catch (err) {
        console.error('Error in HeroBannerService subscriber:', err)
      }
    })
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  public getAllSlides(): HeroSlideItem[] {
    return [...this.slides].sort((a, b) => a.order - b.order)
  }

  public getActiveSlides(): HeroSlideItem[] {
    const active = this.slides.filter((s) => s.isActive).sort((a, b) => a.order - b.order)
    return active.length > 0 ? active : [this.slides[0] || DEFAULT_HERO_SLIDES[0]]
  }

  public toggleSlideActive(id: string, forceState?: boolean): boolean {
    const slide = this.slides.find((s) => s.id === id)
    if (!slide) return false

    slide.isActive = forceState !== undefined ? forceState : !slide.isActive
    this.notify()
    return slide.isActive
  }

  public saveSlide(slideData: Partial<HeroSlideItem> & { id?: string }): HeroSlideItem {
    if (slideData.id) {
      const idx = this.slides.findIndex((s) => s.id === slideData.id)
      if (idx !== -1) {
        this.slides[idx] = {
          ...this.slides[idx],
          ...slideData,
        }
        this.notify()
        return this.slides[idx]
      }
    }

    const newSlide: HeroSlideItem = {
      id: slideData.id || `slide-${Date.now()}`,
      tag: slideData.tag || '• NỔI BẬT TRÊN HERO',
      title: slideData.title || 'Sự Kiện / Ấn Phẩm Mới',
      desc: slideData.desc || 'Trải nghiệm không gian văn hóa di sản Bài Chòi đặc sắc.',
      ctaText: slideData.ctaText || 'Khám phá ngay',
      ctaType: slideData.ctaType || 'ticket',
      targetEventId: slideData.targetEventId,
      targetProductId: slideData.targetProductId,
      bgImage: slideData.bgImage || '/assets/shop/Shop.png',
      isActive: slideData.isActive !== undefined ? slideData.isActive : true,
      order: slideData.order || this.slides.length + 1,
      badge: slideData.badge,
      rating: slideData.rating || '⭐ 5.0',
      priceText: slideData.priceText,
    }

    this.slides.push(newSlide)
    this.notify()
    return newSlide
  }

  public deleteSlide(id: string): boolean {
    const initialLen = this.slides.length
    this.slides = this.slides.filter((s) => s.id !== id)
    if (this.slides.length !== initialLen) {
      // Re-index order
      this.slides.forEach((s, i) => {
        s.order = i + 1
      })
      this.notify()
      return true
    }
    return false
  }

  public moveSlide(id: string, direction: 'up' | 'down'): void {
    const sorted = [...this.slides].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((s) => s.id === id)
    if (idx === -1) return

    if (direction === 'up' && idx > 0) {
      const tempOrder = sorted[idx].order
      sorted[idx].order = sorted[idx - 1].order
      sorted[idx - 1].order = tempOrder
      this.slides = sorted
      this.notify()
    } else if (direction === 'down' && idx < sorted.length - 1) {
      const tempOrder = sorted[idx].order
      sorted[idx].order = sorted[idx + 1].order
      sorted[idx + 1].order = tempOrder
      this.slides = sorted
      this.notify()
    }
  }

  public addSlideFromEvent(event: {
    id: string
    title: string
    ticketPrice: number
    description?: string
    location?: string
    eventDate?: string
  }): HeroSlideItem {
    // Check if already exists
    const existing = this.slides.find((s) => s.targetEventId === event.id)
    if (existing) {
      existing.isActive = true
      this.notify()
      return existing
    }

    const coins = Math.round(event.ticketPrice / 1000)
    const newSlide: HeroSlideItem = {
      id: `hero-evt-${event.id}`,
      tag: '• SỰ KIỆN TRỌNG ĐIỂM TRÊN HERO',
      title: event.title,
      desc: event.description || `Diễn ra tại ${event.location || 'sân đình miền Trung'}. Đặt vé trực tuyến nhận phôi vé di sản & hộp quà tận nhà.`,
      ctaText: `🎟️ Đặt Vé Ngay (${event.ticketPrice.toLocaleString('vi-VN')} đ · ${coins} Xu)`,
      ctaType: 'ticket',
      targetEventId: event.id,
      bgImage: '/assets/shop/Shop.png',
      isActive: true,
      order: this.slides.length + 1,
      badge: 'VÉ SỰ KIỆN MỚI',
      rating: '⭐ 5.0',
      priceText: `${event.ticketPrice.toLocaleString('vi-VN')} đ · ${coins} Xu`,
    }

    this.slides.push(newSlide)
    this.notify()
    return newSlide
  }

  public addSlideFromProduct(product: {
    id: string
    name?: string
    title?: string
    price: number
    description?: string
    category?: string
  }): HeroSlideItem {
    const title = product.title || product.name || 'Ấn Phẩm Di Sản'
    const existing = this.slides.find((s) => s.targetProductId === product.id)
    if (existing) {
      existing.isActive = true
      this.notify()
      return existing
    }

    const coins = Math.round(product.price / 1000)
    const newSlide: HeroSlideItem = {
      id: `hero-prod-${product.id}`,
      tag: '• ẤN PHẨM ĐỘC BẢN GIỚI HẠN',
      title: title,
      desc: product.description || 'Chế tác thủ công tinh xảo, lưu giữ hồn cốt di sản Bài Chòi trong không gian hiện đại.',
      ctaText: `🛍️ Đặt Mua Ngay (${product.price.toLocaleString('vi-VN')} đ · ${coins} Xu)`,
      ctaType: 'product',
      targetProductId: product.id,
      bgImage: '/assets/shop/Shop.png',
      isActive: true,
      order: this.slides.length + 1,
      badge: 'ẤN PHẨM MỚI',
      rating: '⭐ 4.9',
      priceText: `${product.price.toLocaleString('vi-VN')} đ · ${coins} Xu`,
    }

    this.slides.push(newSlide)
    this.notify()
    return newSlide
  }

  public resetToDefault() {
    this.slides = [...DEFAULT_HERO_SLIDES]
    this.notify()
  }
}

export const heroBannerService = new HeroBannerService()
