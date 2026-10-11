import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { UserProfile } from '../types/auth'
import { eventTicketService, type EventItem, type TicketRecord } from '../lib/eventTicketService'
import { orderService, type OrderItem } from '../lib/orderService'
import { publicationService, type PublicationRecord } from '../lib/publicationService'
import { PUBLICATION_GROUPS } from '../publications'
import { authService } from '../lib/authService'
import AccountCenterModal, { type AccountTabKey } from './AccountCenterModal'
import ChoiCoin from './ChoiCoin'

function normalizeVietnamese(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export function getVndToCoins(vnd: number): number {
  return Math.ceil(vnd / 1000)
}

function getDisplayUsername(user: UserProfile | null | undefined): string {
  if (!user) return ''
  if (user.username && user.username.trim()) {
    const u = user.username.trim()
    return u.includes('@') ? u.split('@')[0] : u
  }
  if (user.fullName && user.fullName.trim()) return user.fullName.trim()
  if (user.email && user.email.trim()) return user.email.trim().split('@')[0]
  return 'Tài khoản'
}

interface ShopPortalProps {
  lang: 'VIE' | 'ENG'
  setLang?: (l: 'VIE' | 'ENG') => void
  currentUser: UserProfile | null
  onBackToSite: () => void
  onOpenAuth: (mode?: 'login' | 'register') => void
  onLogout: () => void
  onGoToPortal: (portal: 'site' | 'admin' | 'staff' | 'shop' | 'game') => void
  onOpenPolicy?: (id?: string) => void
  onOpenCoins?: () => void
}

interface ProductItem {
  id: string
  title: string
  titleEng: string
  category: 'cards' | 'apparel' | 'gift' | 'stationery'
  categoryLabel: string
  price: number
  originalPrice?: number
  rating: number
  reviewsCount: number
  description: string
  imageSrc: string
  imageAlt: string
  badge?: string
  hasSize?: boolean
  publicationGroupIndex: number
}

const mapPubToProduct = (p: PublicationRecord): ProductItem => {
  const catLower = p.category.toLowerCase()
  let catKey: 'cards' | 'apparel' | 'gift' | 'stationery' = 'gift'
  if (catLower.includes('bài') || catLower.includes('hộp') || catLower.includes('thẻ')) {
    catKey = 'cards'
  } else if (catLower.includes('áo') || catLower.includes('thời trang') || catLower.includes('túi')) {
    catKey = 'apparel'
  }

  return {
    id: p.id,
    title: p.name,
    titleEng: p.name,
    category: catKey,
    categoryLabel: p.category,
    price: p.price,
    originalPrice: Math.round(p.price * 1.15),
    rating: p.rating || 4.9,
    reviewsCount: p.reviewsCount || 85,
    description: p.description,
    imageSrc: p.imageUrl,
    imageAlt: p.name,
    badge: p.badge || (p.stock < 10 ? 'Sắp hết' : undefined),
    hasSize: p.hasSize || catLower.includes('áo'),
    publicationGroupIndex: 0,
  }
}

export default function ShopPortal({
  lang = 'VIE',
  currentUser,
  onBackToSite,
  onOpenAuth,
  onLogout,
  onGoToPortal,
  onOpenPolicy,
  onOpenCoins,
}: ShopPortalProps) {
  const isVie = lang === 'VIE'

  // Events, Orders & Publications state (Synced with Supabase & localStorage)
  const [events, setEvents] = useState<EventItem[]>(() => eventTicketService.getEvents())
  const [myTickets, setMyTickets] = useState<TicketRecord[]>(() => eventTicketService.getTickets())
  const [myOrders, setMyOrders] = useState<OrderItem[]>(() => orderService.getOrders())
  const [publications, setPublications] = useState<PublicationRecord[]>(() => publicationService.getPublications())

  useEffect(() => {
    publicationService.syncFromSupabase()
    eventTicketService.syncFromSupabase()
    orderService.syncFromSupabase()
    const unsubEvents = eventTicketService.subscribe(() => {
      setEvents(eventTicketService.getEvents())
      setMyTickets(eventTicketService.getTickets())
    })
    const unsubOrders = orderService.subscribe(() => {
      setMyOrders(orderService.getOrders())
    })
    const unsubPubs = publicationService.subscribe(() => {
      setPublications(publicationService.getPublications())
    })
    return () => {
      unsubEvents()
      unsubOrders()
      unsubPubs()
    }
  }, [])

  const products: ProductItem[] = useMemo(() => {
    return publications.map(mapPubToProduct)
  }, [publications])

  // User auth state synced in real-time
  const [activeUser, setActiveUser] = useState<UserProfile | null>(currentUser)

  useEffect(() => {
    setActiveUser(currentUser)
  }, [currentUser])

  useEffect(() => {
    return authService.subscribe((u) => {
      setActiveUser(u)
    })
  }, [])

  const effectiveUser = activeUser || currentUser

  // User menu dropdown
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [accountCenterOpen, setAccountCenterOpen] = useState(false)
  const [accountCenterInitialTab, setAccountCenterInitialTab] = useState<AccountTabKey>('profile')

  // Search input & dropdown state
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSearchOpen(false)
    setMobileSearchOpen(false)
    const el = document.getElementById('shop-items')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Active category filter: 'all' | 'tickets' | 'cards' | 'apparel' | 'gift'
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'tickets' | 'cards' | 'apparel' | 'gift'>('all')

  // Hero carousel slides
  const heroSlides = useMemo(() => [
    {
      id: 'slide-01',
      tag: '• SỰ KIỆN TRỌNG ĐIỂM TRÊN HERO',
      title: 'Đêm Hội Bài Chòi Cổ Truyền Quy Nhơn: Vang Vọng Tiếng Hát Anh Hiệu',
      desc: 'Hòa mình vào không khí hội làng miền Trung rực rỡ dưới ánh trăng rằm, lắng nghe những câu thai hóm hỉnh của anh Hiệu và tranh tài các ván bài dân gian đầy kịch tính với phần thưởng giá trị.',
      ctaText: '🎟️ Đặt Vé Ngay (50.000 đ · 50 Xu)',
      ctaType: 'ticket' as const,
      targetEventId: 'evt-01',
      bgImage: '/assets/booth.jpg',
      floatingCard: {
        badge: 'VÉ SỰ KIỆN CHÍNH THỨC',
        rating: '⭐ 9.8',
        title: 'Hội Đánh Bài Chòi Quy Nhơn 2026',
        genre: 'Lễ hội dân gian · UNESCO · Hát hô · 19:30 Thứ Bảy',
        status: '🟢 Đang mở bán online',
        posterImage: '/assets/mock up (1).png',
      },
    },
    {
      id: 'slide-02',
      tag: '• ẤN PHẨM ĐỘC BẢN GIỚI HẠN',
      title: 'Bộ Bài Chòi Gỗ Tự Nhiên 30 Thẻ - Nghệ Thuật Điêu Khắc Dân Gian',
      desc: 'Lưu giữ trọn vẹn hồn cốt di sản Bài Chòi trong không gian sống hiện đại. 30 thẻ gỗ tự nhiên khắc laser 3 pho Văn, Vạn, Hạch cùng hộp đựng thủ công tinh xảo, thích hợp chơi cùng gia đình và sưu tầm.',
      ctaText: '🛍️ Đặt Mua Bộ Thẻ Gỗ (290.000 đ · 290 Xu)',
      ctaType: 'product' as const,
      targetProductId: 'prod-01',
      bgImage: '/assets/thedungbai.jpg',
      floatingCard: {
        badge: 'BÁN CHẠY NHẤT #1',
        rating: '⭐ 4.9',
        title: 'Bộ Bài Chòi Gỗ 30 Thẻ Cổ Truyền',
        genre: 'Mỹ nghệ thủ công · Gỗ tự nhiên · 3 Pho · Kèm cẩm nang',
        status: '📦 Sẵn hàng giao ngay',
        posterImage: '/assets/thedungbai.jpg',
      },
    },
    {
      id: 'slide-03',
      tag: '• SỰ KIỆN VĂN HÓA ĐẶC SẮC',
      title: 'Đêm Thơ Ca & Di Sản Bài Chòi Phố Cổ Hội An',
      desc: 'Trải nghiệm không gian lung linh của phố cổ Hội An bên bờ sông Hoài, hòa giọng cùng nghệ nhân trong những điệu hô bài chòi ngân vang giữa lòng di sản thế giới.',
      ctaText: '🎟️ Xem Vé Hội An (60.000 đ · 60 Xu)',
      ctaType: 'ticket' as const,
      targetEventId: 'evt-02',
      bgImage: '/assets/vethamgia.jpg',
      floatingCard: {
        badge: 'VÉ HỘI AN VỀ ĐÊM',
        rating: '⭐ 9.9',
        title: 'Đêm Thơ Ca & Di Sản Hội An',
        genre: 'Phố cổ Hội An · Sân đình · Thơ ca · 19:00',
        status: '🏛️ Bán tại quầy & online',
        posterImage: '/assets/mock up (1).png',
      },
    },
  ], [])

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  // Auto rotate hero slide every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [heroSlides.length])

  // Modals state
  const [bookingEvent, setBookingEvent] = useState<EventItem | null>(null)
  const [buyingProduct, setBuyingProduct] = useState<ProductItem | null>(null)
  const [viewingDrawer, setViewingDrawer] = useState<'none' | 'tickets' | 'orders'>('none')

  // Lightbox view state
  const [lightboxGroupIndex, setLightboxGroupIndex] = useState<number | null>(null)
  const [lightboxTicketImage, setLightboxTicketImage] = useState<string | null>(null)

  // Booking Form State (Giao vé & Hộp quà tận nhà duy nhất)
  const [ticketBuyMethod, setTicketBuyMethod] = useState<'money' | 'coin'>('money')
  const [ticketQty, setTicketQty] = useState(1)
  const [buyerName, setBuyerName] = useState(currentUser?.fullName || '')
  const [buyerPhone, setBuyerPhone] = useState(currentUser?.phone || '')
  const [buyerEmail, setBuyerEmail] = useState(currentUser?.email || '')
  const [ticketShippingAddress, setTicketShippingAddress] = useState(currentUser?.address || '')
  const [ticketShippingNote, setTicketShippingNote] = useState('')
  const [bookingPayment, setBookingPayment] = useState<'cod' | 'bank_transfer'>('cod')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingResult, setBookingResult] = useState<{
    tickets: TicketRecord[]
    eventTitle: string
    totalAmount: number
    shippingAddress: string
    coinsPaid?: number
    payMethod: 'money' | 'coin'
  } | null>(null)
  const [bookingError, setBookingError] = useState('')

  // State index slider cho từng card sự kiện
  const [eventSlideIndexes, setEventSlideIndexes] = useState<Record<string, number>>({})

  // Product Order Form State
  const [prodBuyMethod, setProdBuyMethod] = useState<'money' | 'coin'>('money')
  const [prodQty, setProdQty] = useState(1)
  const [prodSize, setProdSize] = useState('L')
  const [shippingName, setShippingName] = useState(currentUser?.fullName || '')
  const [shippingPhone, setShippingPhone] = useState(currentUser?.phone || '')
  const [shippingAddress, setShippingAddress] = useState('')
  const [shippingNote, setShippingNote] = useState('')
  const [prodPayment, setProdPayment] = useState<'cod' | 'bank_transfer'>('cod')
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderResult, setOrderResult] = useState<{
    orderId: string
    summary: string
    totalAmount: number
    coinsPaid?: number
    payMethod: 'money' | 'coin'
  } | null>(null)
  const [orderError, setOrderError] = useState('')

  // Filtered lists (Vietnamese-normalized & ticket/product intent matching)
  const filteredEvents = useMemo(() => {
    const rawQuery = searchQuery.trim()
    if (!rawQuery) return events

    const qNorm = normalizeVietnamese(rawQuery)
    const generalTicketTokens = ['ve', 'ticket', 'tickets', 'su kien', 'hoi bai choi', 'le hoi', 'dem tho', 'hoi']
    const isDirectTicketIntent = generalTicketTokens.some((tok) => qNorm === tok || qNorm.startsWith(tok + ' ') || qNorm.endsWith(' ' + tok))

    return events.filter((e) => {
      if (isDirectTicketIntent && (qNorm === 've' || qNorm === 'ticket' || qNorm === 'tickets' || qNorm === 'su kien')) {
        return true
      }

      const titleNorm = normalizeVietnamese(e.title)
      const locNorm = normalizeVietnamese(e.location)
      const dateNorm = normalizeVietnamese(e.eventDate)
      const priceStr = String(e.ticketPrice)

      const tokens = qNorm.split(/\s+/).filter(Boolean)
      const allTokensMatch = tokens.every((tok) => {
        if (tok === 've' || tok === 'ticket' || tok === 'su' || tok === 'kien') {
          return true
        }
        return titleNorm.includes(tok) || locNorm.includes(tok) || dateNorm.includes(tok) || priceStr.includes(tok)
      })

      return allTokensMatch
    })
  }, [events, searchQuery])

  const filteredProducts = useMemo(() => {
    const rawQuery = searchQuery.trim()
    const qNorm = normalizeVietnamese(rawQuery)
    const generalProductTokens = ['an pham', 'san pham', 'do luu niem', 'qua tang', 'hang hoa', 'shop', 'store']
    const isDirectProductIntent = generalProductTokens.some((tok) => qNorm === tok || qNorm.startsWith(tok + ' ') || qNorm.endsWith(' ' + tok))

    return products.filter((p) => {
      const matchCat = categoryFilter === 'all' || categoryFilter === p.category
      if (!rawQuery) return matchCat

      if (isDirectProductIntent && (qNorm === 'an pham' || qNorm === 'san pham' || qNorm === 'do luu niem' || qNorm === 'qua tang')) {
        return matchCat
      }

      const titleNorm = normalizeVietnamese(p.title)
      const descNorm = normalizeVietnamese(p.description)
      const catLabelNorm = normalizeVietnamese(p.categoryLabel)
      const catNorm = normalizeVietnamese(p.category)
      const priceStr = String(p.price)

      const tokens = qNorm.split(/\s+/).filter(Boolean)
      const allTokensMatch = tokens.every((tok) => {
        if (tok === 'an' || tok === 'pham' || tok === 'san' || tok === 'pham') {
          return true
        }
        return titleNorm.includes(tok) || descNorm.includes(tok) || catLabelNorm.includes(tok) || catNorm.includes(tok) || priceStr.includes(tok)
      })

      return matchCat && allTokensMatch
    })
  }, [products, categoryFilter, searchQuery])

  // Mở modal đặt vé và điền sẵn thông tin người dùng
  const handleOpenBooking = (evt: EventItem) => {
    setBookingEvent(evt)
    setTicketQty(1)
    setTicketBuyMethod('money')
    setBookingPayment('cod')
    setBookingResult(null)
    setBookingError('')
    if (effectiveUser) {
      if (effectiveUser.fullName) setBuyerName(effectiveUser.fullName)
      if (effectiveUser.phone) setBuyerPhone(effectiveUser.phone)
      if (effectiveUser.email) setBuyerEmail(effectiveUser.email)
      if (effectiveUser.address) setTicketShippingAddress(effectiveUser.address)
    }
  }

  // Handle CTA from Hero Slide
  const handleHeroCTA = (slide: typeof heroSlides[0]) => {
    if (slide.ctaType === 'ticket' && slide.targetEventId) {
      const target = events.find((e) => e.id === slide.targetEventId) || events[0]
      if (target) {
        handleOpenBooking(target)
      }
    } else if (slide.ctaType === 'product' && slide.targetProductId) {
      const target = products.find((p) => p.id === slide.targetProductId) || products[0]
      if (target) {
        setBuyingProduct(target)
        setProdQty(1)
        setProdBuyMethod('money')
        setProdPayment('cod')
        setOrderResult(null)
      }
    }
  }

  // Handle Event Ticket Purchase (Nhận vé & hộp quà tại nhà duy nhất)
  const handleConfirmTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingEvent) return

    if (!buyerName.trim()) {
      setBookingError(isVie ? 'Vui lòng nhập họ và tên người nhận vé' : 'Please enter recipient name')
      return
    }
    if (!buyerPhone.trim() || buyerPhone.trim().length < 8) {
      setBookingError(isVie ? 'Vui lòng nhập số điện thoại hợp lệ' : 'Please enter valid phone number')
      return
    }
    if (!ticketShippingAddress.trim()) {
      setBookingError(isVie ? 'Vui lòng nhập địa chỉ nhận vé & hộp quà tại nhà' : 'Please enter delivery address')
      return
    }

    const total = bookingEvent.ticketPrice * ticketQty
    const totalCoins = getVndToCoins(total)

    if (ticketBuyMethod === 'coin') {
      if (!effectiveUser) {
        setBookingError(isVie ? 'Vui lòng đăng nhập tài khoản để thanh toán bằng Xu Chòi.' : 'Please login to pay with ChoiCoin')
        return
      }
      if ((effectiveUser.coins || 0) < totalCoins) {
        setBookingError(
          isVie
            ? `Số dư Xu không đủ! Hiện có ${effectiveUser.coins || 0} Xu, cần ${totalCoins} Xu. Vui lòng nạp thêm Xu hoặc chọn mua bằng Tiền.`
            : `Insufficient coin balance! You have ${effectiveUser.coins || 0} coins, need ${totalCoins} coins.`
        )
        return
      }
    }

    setBookingLoading(true)
    setBookingError('')

    setTimeout(async () => {
      if (ticketBuyMethod === 'coin') {
        const spendRes = authService.spendCoins(
          totalCoins,
          `Đặt vé sự kiện: ${bookingEvent.title} (${ticketQty} vé)`
        )
        if (!spendRes.success) {
          setBookingLoading(false)
          setBookingError(spendRes.message || 'Không thể trừ Xu. Vui lòng thử lại.')
          return
        }
      }

      const res = eventTicketService.buyOnlineTickets(
        bookingEvent.id,
        buyerName.trim(),
        buyerPhone.trim(),
        ticketQty,
        ticketShippingAddress.trim(),
        buyerEmail.trim() || undefined
      )

      setBookingLoading(false)

      if (res.success && res.tickets) {
        const itemText = `${ticketQty}x Vé Tham Gia + Hộp Quà Pop-up Di Sản [${bookingEvent.title}]${ticketShippingNote ? ` (Ghi chú: ${ticketShippingNote})` : ''}`

        await orderService.createOrder({
          customerName: buyerName.trim(),
          phone: buyerPhone.trim(),
          email: buyerEmail.trim() || undefined,
          shippingAddress: ticketShippingAddress.trim(),
          orderType: 'ticket',
          itemSummary: itemText,
          totalAmount: total,
          paymentMethod: ticketBuyMethod === 'coin' ? 'coin' : bookingPayment,
          coinsPaid: ticketBuyMethod === 'coin' ? totalCoins : undefined,
        })

        setBookingResult({
          tickets: res.tickets,
          eventTitle: bookingEvent.title,
          totalAmount: total,
          shippingAddress: ticketShippingAddress.trim(),
          coinsPaid: ticketBuyMethod === 'coin' ? totalCoins : undefined,
          payMethod: ticketBuyMethod,
        })
      } else {
        setBookingError(res.message || 'Không thể đặt vé, vui lòng thử lại sau.')
      }
    }, 500)
  }

  // Handle Product Order
  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyingProduct) return

    if (!shippingName.trim()) {
      setOrderError(isVie ? 'Vui lòng nhập họ tên người nhận' : 'Please enter recipient name')
      return
    }
    if (!shippingPhone.trim() || shippingPhone.trim().length < 8) {
      setOrderError(isVie ? 'Vui lòng nhập số điện thoại' : 'Please enter phone number')
      return
    }
    if (!shippingAddress.trim()) {
      setOrderError(isVie ? 'Vui lòng nhập địa chỉ nhận hàng' : 'Please enter shipping address')
      return
    }

    const total = buyingProduct.price * prodQty
    const totalCoins = getVndToCoins(total)

    if (prodBuyMethod === 'coin') {
      if (!effectiveUser) {
        setOrderError(isVie ? 'Vui lòng đăng nhập tài khoản để thanh toán bằng Xu Chòi.' : 'Please login to pay with ChoiCoin')
        return
      }
      if ((effectiveUser.coins || 0) < totalCoins) {
        setOrderError(
          isVie
            ? `Số dư Xu không đủ! Hiện có ${effectiveUser.coins || 0} Xu, cần ${totalCoins} Xu. Vui lòng nạp thêm Xu hoặc chọn mua bằng Tiền.`
            : `Insufficient coin balance! You have ${effectiveUser.coins || 0} coins, need ${totalCoins} coins.`
        )
        return
      }
    }

    setOrderLoading(true)
    setOrderError('')

    setTimeout(async () => {
      if (prodBuyMethod === 'coin') {
        const spendRes = authService.spendCoins(
          totalCoins,
          `Mua ấn phẩm: ${buyingProduct.title} (${prodQty} cái)`
        )
        if (!spendRes.success) {
          setOrderLoading(false)
          setOrderError(spendRes.message || 'Không thể trừ Xu. Vui lòng thử lại.')
          return
        }
      }

      setOrderLoading(false)
      const summary = `${prodQty}x ${buyingProduct.title}${buyingProduct.hasSize ? ` (Size ${prodSize})` : ''}${shippingNote ? ` (${shippingNote})` : ''}`

      const newOrder = await orderService.createOrder({
        customerName: shippingName.trim(),
        phone: shippingPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        orderType: 'publication',
        itemSummary: summary,
        totalAmount: total,
        paymentMethod: prodBuyMethod === 'coin' ? 'coin' : prodPayment,
        coinsPaid: prodBuyMethod === 'coin' ? totalCoins : undefined,
      })

      setOrderResult({
        orderId: newOrder.id,
        summary,
        totalAmount: total,
        coinsPaid: prodBuyMethod === 'coin' ? totalCoins : undefined,
        payMethod: prodBuyMethod,
      })
    }, 500)
  }

  const currentSlide = heroSlides[currentSlideIndex]

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-[#c8382b] selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVBAR (PHONG CÁCH SÁNG SỦA, TINH TẾ)
      ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToSite}
              className="flex items-center gap-2 group cursor-pointer"
              title="Về Website chính Bài Chòi"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#c8382b] to-[#92261b] text-white text-xl font-black shadow-md shadow-red-900/20 group-hover:scale-105 transition">
                🎴
              </span>
              <div className="text-left">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-[#c8382b] transition">
                    CHÒI
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#c8382b] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-sm">
                    STORE
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 tracking-wider">Heritage & Ticket Box</span>
              </div>
            </button>
          </div>

          {/* Nav Menu Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('tickets')
                const el = document.getElementById('shop-items')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="hover:text-slate-950 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Vé Sự Kiện</span>
              <span className="text-xs text-slate-400">▾</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all')
                const el = document.getElementById('shop-items')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="hover:text-slate-950 transition flex items-center gap-1 cursor-pointer"
            >
              <span>Ấn Phẩm Di Sản</span>
              <span className="text-xs text-slate-400">▾</span>
            </button>
          </nav>

          {/* Right Controls: Search, User capsule, Back button */}
          <div className="flex items-center gap-3">
            {/* Search Input with Instant Dropdown */}
            <div ref={searchContainerRef} className="relative hidden sm:block">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsSearchOpen(true)
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Tìm vé, ấn phẩm..."
                  className="w-40 lg:w-56 rounded-full bg-slate-100 border border-slate-200 pl-3.5 pr-14 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:w-64 focus:bg-white focus:border-[#c8382b] focus:outline-none transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                    }}
                    className="absolute right-7 top-1.5 h-5 w-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 text-xs transition cursor-pointer"
                    title="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1.5 h-5 w-5 flex items-center justify-center text-xs text-slate-500 hover:text-[#c8382b] transition cursor-pointer"
                  title="Tìm kiếm & Xem kết quả"
                >
                  🔍
                </button>
              </form>

              {/* Instant Search Dropdown */}
              {isSearchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 text-slate-800 animate-fade-in divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                  {/* Summary Header */}
                  <div className="pb-2.5 px-1 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      Kết quả cho "<strong className="text-slate-900">{searchQuery}</strong>"
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {filteredEvents.length + filteredProducts.length} mục
                    </span>
                  </div>

                  {/* Section 1: Events (if any) */}
                  {filteredEvents.length > 0 && (
                    <div className="py-2.5 space-y-1.5">
                      <div className="px-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>🎟️ Vé Sự Kiện ({filteredEvents.length})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryFilter('tickets')
                            setIsSearchOpen(false)
                            document.getElementById('shop-items')?.scrollIntoView({ behavior: 'smooth' })
                          }}
                          className="text-[#c8382b] hover:underline normal-case font-medium cursor-pointer"
                        >
                          Xem tất cả
                        </button>
                      </div>

                      {filteredEvents.slice(0, 3).map((evt) => (
                        <div
                          key={evt.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 cursor-pointer group"
                          onClick={() => {
                            setIsSearchOpen(false)
                            if (evt.status === 'online_sale') {
                              setBookingEvent(evt)
                              setTicketQty(1)
                              setBookingResult(null)
                            } else {
                              document.getElementById('shop-items')?.scrollIntoView({ behavior: 'smooth' })
                            }
                          }}
                        >
                          <img
                            src={evt.image || '/assets/mock up (1).png'}
                            alt={evt.title}
                            className="h-11 w-11 rounded-lg object-contain bg-slate-100 p-0.5 border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#c8382b] transition">
                              {evt.title}
                            </h5>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              📅 {evt.eventDate} · 📍 {evt.location}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-extrabold text-[#c8382b]">
                                {evt.ticketPrice.toLocaleString('vi-VN')} đ
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {evt.status === 'online_sale' ? 'Mở bán online' : evt.status === 'offline_sale' ? 'Bán tại quầy' : 'Đã kết thúc'}
                              </span>
                            </div>
                          </div>
                          {evt.status === 'online_sale' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsSearchOpen(false)
                                setBookingEvent(evt)
                                setTicketQty(1)
                                setBookingResult(null)
                              }}
                              className="shrink-0 rounded-lg bg-[#c8382b] hover:bg-[#a82d21] text-white text-[11px] font-bold px-2.5 py-1.5 transition shadow-2xs cursor-pointer"
                            >
                              Đặt vé
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section 2: Products (if any) */}
                  {filteredProducts.length > 0 && (
                    <div className="py-2.5 space-y-1.5">
                      <div className="px-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>🛍️ Ấn Phẩm Di Sản ({filteredProducts.length})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryFilter('all')
                            setIsSearchOpen(false)
                            document.getElementById('shop-items')?.scrollIntoView({ behavior: 'smooth' })
                          }}
                          className="text-teal-700 hover:underline normal-case font-medium cursor-pointer"
                        >
                          Xem tất cả
                        </button>
                      </div>

                      {filteredProducts.slice(0, 3).map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 cursor-pointer group"
                          onClick={() => {
                            setIsSearchOpen(false)
                            setBuyingProduct(prod)
                            setProdQty(1)
                            setOrderResult(null)
                          }}
                        >
                          <img
                            src={prod.imageSrc}
                            alt={prod.title}
                            className="h-11 w-11 rounded-lg object-contain bg-slate-100 p-0.5 border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <h5 className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700 transition">
                              {prod.title}
                            </h5>
                            <p className="text-[10px] text-teal-700 font-medium truncate mt-0.5">
                              {prod.categoryLabel}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-extrabold text-[#006368]">
                                {prod.price.toLocaleString('vi-VN')} đ
                              </span>
                              {prod.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  {prod.badge}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsSearchOpen(false)
                              setBuyingProduct(prod)
                              setProdQty(1)
                              setOrderResult(null)
                            }}
                            className="shrink-0 rounded-lg bg-[#006368] hover:bg-[#004e52] text-white text-[11px] font-bold px-2.5 py-1.5 transition shadow-2xs cursor-pointer"
                          >
                            Mua ngay
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section 3: If no items */}
                  {filteredEvents.length === 0 && filteredProducts.length === 0 && (
                    <div className="py-6 px-3 text-center">
                      <span className="text-2xl block mb-1">🔍</span>
                      <p className="text-xs font-bold text-slate-800">
                        Không tìm thấy kết quả nào cho "{searchQuery}"
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Gợi ý từ khóa phổ biến:
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                        {['Vé sự kiện', 'Quy Nhơn', 'Hội An', 'Bài chòi gỗ', 'Áo thun'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSearchQuery(tag)}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium transition cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer CTA */}
                  {(filteredEvents.length > 0 || filteredProducts.length > 0) && (
                    <div className="pt-2 px-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false)
                          document.getElementById('shop-items')?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="w-full text-center py-2 rounded-xl bg-slate-900 hover:bg-[#c8382b] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Xem tất cả {filteredEvents.length + filteredProducts.length} kết quả trong cửa hàng</span>
                        <span>↓</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="sm:hidden flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition cursor-pointer"
              title="Tìm kiếm"
            >
              🔍
            </button>

            {/* Coin Wallet Button in ShopPortal */}
            {effectiveUser ? (
              <button
                type="button"
                onClick={onOpenCoins}
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold transition shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                title="Ví Xu Chòi - Bấm để nạp xu hoặc xem lịch sử"
              >
                <ChoiCoin size={18} animate glow />
                <span className="font-mono text-xs sm:text-sm font-black text-amber-900">
                  {(effectiveUser.coins ?? 50).toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-amber-800 hidden min-[480px]:inline">
                  Xu
                </span>
                <span className="h-4 w-4 rounded-full bg-[#c8382b] text-white flex items-center justify-center text-[10px] font-black ml-0.5 shadow-2xs">
                  +
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                title="Đăng ký nhận ngay 50 Xu tân thủ"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/90 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold transition hover:scale-105 cursor-pointer shadow-2xs"
              >
                <ChoiCoin size={16} glow />
                <span>Tặng 50 Xu</span>
                <span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded-full">
                  MỚI
                </span>
              </button>
            )}

            {/* User Capsule */}
            {effectiveUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-full bg-white text-slate-800 border border-slate-300 px-3 py-1.5 text-xs font-semibold shadow-xs hover:border-slate-400 hover:shadow-sm transition cursor-pointer"
                >
                  {effectiveUser.avatar ? (
                    <img
                      src={effectiveUser.avatar}
                      alt={getDisplayUsername(effectiveUser)}
                      className="h-5 w-5 rounded-full object-cover shrink-0 border border-slate-300"
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white text-[10px] shrink-0">
                      👤
                    </span>
                  )}
                  <span className="max-w-[170px] truncate text-slate-800 font-medium">
                    {getDisplayUsername(effectiveUser)}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-0.5">{userDropdownOpen ? '⌃' : '⌄'}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 text-xs animate-fade-in text-slate-700 divide-y divide-slate-100">
                    <div className="px-3 py-2.5 border-b border-slate-100 mb-1 flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-500 shadow-2xs">
                        {effectiveUser.avatar ? (
                          <img src={effectiveUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-base">👤</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {getDisplayUsername(effectiveUser)}
                        </p>
                        {effectiveUser.email && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {effectiveUser.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Coin Row in ShopPortal Dropdown */}
                    <div className="p-2 mb-1 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ChoiCoin size={20} glow />
                        <div>
                          <span className="text-[10px] text-amber-800 font-semibold block leading-tight">Ví Xu Chòi:</span>
                          <span className="text-xs font-black text-amber-950 font-mono">
                            {(effectiveUser.coins ?? 50).toLocaleString()} Xu
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onOpenCoins?.()
                        }}
                        className="text-[10px] bg-[#c8382b] hover:bg-[#a82d21] text-white font-bold px-2 py-1 rounded-lg transition shadow-2xs cursor-pointer shrink-0"
                      >
                        + Nạp Xu
                      </button>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          setAccountCenterInitialTab('profile')
                          setAccountCenterOpen(true)
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-3 cursor-pointer font-medium text-slate-800"
                      >
                        <span className="text-slate-400 text-sm">⚙️</span>
                        <span>Cài đặt tài khoản</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          setAccountCenterInitialTab('tickets')
                          setAccountCenterOpen(true)
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-3 cursor-pointer font-medium text-slate-800"
                      >
                        <span className="text-slate-400 text-sm">🎟️</span>
                        <span>Vé của tôi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          setAccountCenterInitialTab('tracking')
                          setAccountCenterOpen(true)
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-3 cursor-pointer font-medium text-slate-800"
                      >
                        <span className="text-slate-400 text-sm">🚚</span>
                        <span>Theo dõi đơn hàng</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          setAccountCenterInitialTab('history')
                          setAccountCenterOpen(true)
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-3 cursor-pointer font-medium text-slate-800"
                      >
                        <span className="text-slate-400 text-sm">✉️</span>
                        <span>Lịch sử giao dịch</span>
                      </button>
                    </div>

                    {(effectiveUser.role === 'admin' || effectiveUser.role === 'staff') && (
                      <div className="py-1">
                        {effectiveUser.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserDropdownOpen(false)
                              onGoToPortal('admin')
                            }}
                            className="w-full text-left px-3.5 py-2 rounded-xl text-red-700 hover:bg-red-50 transition flex items-center gap-2.5 cursor-pointer font-semibold"
                          >
                            <span>👑</span>
                            <span>Vào Trang Quản Trị</span>
                          </button>
                        )}
                        {effectiveUser.role === 'staff' && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserDropdownOpen(false)
                              onGoToPortal('staff')
                            }}
                            className="w-full text-left px-3.5 py-2 rounded-xl text-sky-700 hover:bg-sky-50 transition flex items-center gap-2.5 cursor-pointer font-semibold"
                          >
                            <span>🎫</span>
                            <span>Vào Quầy Soát Vé</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          onLogout()
                        }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition flex items-center gap-3 cursor-pointer font-semibold"
                      >
                        <span className="text-red-500 text-sm">↪</span>
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-2 rounded-full bg-white text-slate-800 border border-slate-300 px-4 py-1.5 text-xs font-bold shadow-xs hover:border-slate-400 hover:shadow-sm transition cursor-pointer"
              >
                <span>👤</span>
                <span>Đăng nhập</span>
              </button>
            )}

            {/* Back to main website button */}
            <button
              type="button"
              onClick={onBackToSite}
              className="flex items-center gap-1.5 rounded-full bg-[#006368] hover:bg-[#004e52] text-white px-3.5 py-1.5 text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
              title="Quay lại trang chủ Bài Chòi"
            >
              <span>←</span>
              <span className="hidden sm:inline">Về Trang Chủ</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Expandable */}
        {mobileSearchOpen && (
          <div className="sm:hidden max-w-7xl mx-auto border-t border-slate-100 mt-2.5 pt-2.5 animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm vé, ấn phẩm..."
                autoFocus
                className="w-full rounded-full bg-slate-100 border border-slate-300 pl-3.5 pr-14 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#c8382b] focus:bg-white shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-8 top-2 h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2.5 top-2 text-xs text-slate-600 hover:text-[#c8382b] cursor-pointer"
              >
                🔍
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO BANNER SECTION (NỀN SÁNG TƯƠI TẮN, THANH LỊCH)
      ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-100 min-h-[480px] lg:min-h-[520px] flex items-center border-b border-slate-200">
        {/* Background image hiển thị sáng rõ phía sau */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 scale-105"
          style={{
            backgroundImage: `url("${currentSlide.bgImage}")`,
            filter: 'brightness(0.98) saturate(1.15)',
            opacity: 0.95,
          }}
        />

        {/* Lớp phủ chuyển sắc nhẹ nhàng từ trái sang phải, không tạo đường viền khung */}
        <div className="absolute inset-0 z-1 bg-gradient-to-r from-white/80 via-white/50 to-transparent" />
        <div className="absolute inset-0 z-1 bg-gradient-to-t from-white/40 via-transparent to-transparent" />

        {/* Main Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Cột trái: Chữ và nút hiển thị trực tiếp lên nền, KHÔNG CÒN KHUNG VIỀN */}
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md border border-amber-300/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-950 shadow-xs">
              {currentSlide.tag}
            </span>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 leading-tight drop-shadow-xs">
              {currentSlide.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed max-w-2xl font-medium drop-shadow-2xs">
              {currentSlide.desc}
            </p>

            {/* Nút hành động chính */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleHeroCTA(currentSlide)}
                className="rounded-full bg-gradient-to-r from-[#c8382b] to-[#92261b] hover:from-[#d94437] hover:to-[#a82d21] text-white font-bold text-xs sm:text-sm px-6 py-3 transition shadow-md shadow-red-900/30 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>{currentSlide.ctaText}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('shop-items')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="rounded-full bg-white/90 hover:bg-white text-slate-900 font-semibold text-xs sm:text-sm px-5 py-3 transition border border-slate-200/90 shadow-xs cursor-pointer"
              >
                Khám phá tất cả ▾
              </button>
            </div>

            {/* Slider Navigation: < • • • > */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition border border-slate-200/90 shadow-xs cursor-pointer"
                aria-label="Previous slide"
              >
                ‹
              </button>

              <div className="flex items-center gap-1.5">
                {heroSlides.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setCurrentSlideIndex(i)}
                    className={`h-2 transition-all rounded-full cursor-pointer ${
                      i === currentSlideIndex ? 'w-6 bg-[#c8382b]' : 'w-2 bg-slate-400 hover:bg-slate-600'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length)}
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center transition border border-slate-200/90 shadow-xs cursor-pointer"
                aria-label="Next slide"
              >
                ›
              </button>
            </div>
          </div>

          {/* Cột phải: Floating Featured Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-3xl bg-white/85 backdrop-blur-md border border-white/80 p-3.5 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition duration-300">
              {/* Poster image */}
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50/70 via-white to-slate-100/90 p-2.5 flex items-center justify-center border border-amber-100/60 shadow-inner group/poster">
                <img
                  src={currentSlide.floatingCard.posterImage}
                  alt={currentSlide.floatingCard.title}
                  className="h-full w-full object-contain drop-shadow-md transition-transform duration-300 group-hover/poster:scale-105"
                />
                <span className="absolute top-2.5 left-2.5 rounded-full bg-[#c8382b] text-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase shadow-sm z-10">
                  {currentSlide.floatingCard.badge}
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxTicketImage(currentSlide.floatingCard.posterImage)}
                  title="Xem phóng to ảnh"
                  className="absolute top-2.5 right-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white p-1.5 transition text-xs cursor-pointer shadow-xs z-10"
                >
                  🔍
                </button>
                <span className="absolute bottom-2.5 right-2.5 rounded-full bg-white/95 backdrop-blur-xs text-amber-700 px-2.5 py-0.5 text-xs font-black shadow-xs border border-amber-200/80 z-10 flex items-center gap-1">
                  {currentSlide.floatingCard.rating}
                </span>
              </div>

              {/* Card info */}
              <div className="p-3 text-left">
                <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                  {currentSlide.floatingCard.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                  {currentSlide.floatingCard.genre}
                </p>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-600">
                    {currentSlide.floatingCard.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleHeroCTA(currentSlide)}
                    className="rounded-xl bg-[#c8382b] hover:bg-[#a82d21] text-white font-bold text-xs px-3.5 py-1.5 transition cursor-pointer shadow-xs"
                  >
                    Xem & Đặt Ngay →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. CATEGORY BAR & SEARCH
      ────────────────────────────────────────────────────────────── */}
      <section id="shop-items" className="max-w-7xl mx-auto px-4 sm:px-8 py-8 w-full">
        {/* Active Search Query Feedback Banner */}
        {searchQuery.trim().length > 0 && (
          <div className="mb-6 rounded-2xl bg-amber-50/90 border border-amber-200/90 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-amber-300 text-amber-800 text-lg shadow-2xs">
                🔍
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                    Kết quả tìm kiếm:
                  </span>
                  <span className="font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-amber-200 text-sm shadow-2xs">
                    "{searchQuery}"
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Tìm thấy <strong className="text-slate-900">{filteredEvents.length}</strong> vé sự kiện và <strong className="text-slate-900">{filteredProducts.length}</strong> ấn phẩm di sản phù hợp.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <span>✕</span>
              <span>Xóa bộ lọc tìm kiếm</span>
            </button>
          </div>
        )}

        {/* Empty State when no results found */}
        {searchQuery.trim().length > 0 && filteredEvents.length === 0 && filteredProducts.length === 0 && (
          <div className="py-16 text-center rounded-3xl bg-white border border-slate-200 shadow-sm my-6 p-8 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl">
              🔍
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Không tìm thấy vé hoặc ấn phẩm nào khớp với "{searchQuery}"
            </h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Hãy thử tìm kiếm với các từ khóa phổ biến: <strong>Vé</strong>, <strong>Quy Nhơn</strong>, <strong>Hội An</strong>, <strong>Bộ bài chòi gỗ</strong>, <strong>Áo thun</strong> hoặc bấm bên dưới để xem toàn bộ cửa hàng.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {['Vé sự kiện', 'Quy Nhơn', 'Hội An', 'Bộ bài chòi gỗ', 'Áo thun di sản'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 text-xs font-semibold transition cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-6 rounded-full bg-slate-900 hover:bg-[#c8382b] text-white font-bold text-xs px-6 py-2.5 transition shadow-xs cursor-pointer"
            >
              Xem toàn bộ vé & ấn phẩm
            </button>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
              }`}
            >
              ✨ Tất Cả
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('tickets')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'tickets'
                  ? 'bg-[#c8382b] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
              }`}
            >
              <span>🎟️</span>
              <span>Vé Sự Kiện ({events.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('cards')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                categoryFilter === 'cards'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
              }`}
            >
              🎴 Thẻ Bài & Hộp
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('apparel')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                categoryFilter === 'apparel'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
              }`}
            >
              👕 Áo Thun & Túi
            </button>

            <button
              type="button"
              onClick={() => setCategoryFilter('gift')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                categoryFilter === 'gift'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
              }`}
            >
              🎁 Quà Lưu Niệm & Gốm
            </button>
          </div>

          <span className="text-xs text-slate-500">
            Hiển thị <strong>{filteredEvents.length + filteredProducts.length}</strong> mục
          </span>
        </div>

        {/* ── 4. PHẦN VÉ SỰ KIỆN BÀI CHÒI ── */}
        {(categoryFilter === 'tickets' || (categoryFilter === 'all' && filteredEvents.length > 0)) && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[#c8382b] text-sm font-bold border border-red-200">
                  🎟️
                </span>
                <h3 className="text-lg font-bold text-slate-900">Vé Tham Gia Các Hội Bài Chòi</h3>
              </div>
              <span className="text-xs text-slate-500">Đặt vé quét mã QR vào cổng</span>
            </div>

            {filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEvents.map((evt) => {
                  const remaining = Math.max(0, evt.totalTickets - evt.soldTickets)
                  const isOnline = evt.status === 'online_sale'
                  const isDoor = evt.status === 'offline_sale'

                  return (
                    <div
                      key={evt.id}
                      className="rounded-2xl bg-white border border-slate-200 overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-lg transition-all duration-300 shadow-xs group"
                    >
                      <div>
                        {/* Slider Lướt Xem Ảnh Vé & Hộp Quà Pop-up Di Sản (Hỗ trợ đa ảnh không giới hạn theo cấu hình Admin) */}
                        {(() => {
                          const eventImages = evt.images && evt.images.length > 0
                            ? evt.images
                            : [evt.image || '/assets/mock up (1).png', '/assets/hopdungve-popup.png']
                          const activeIdx = (eventSlideIndexes[evt.id] || 0) % eventImages.length
                          const currentImg = eventImages[activeIdx] || eventImages[0]

                          // Nhãn badge thông minh theo từng loại ảnh
                          const isPopUpBox = currentImg.includes('popup') || currentImg.includes('hopdungve-popup')
                          const isStandardBox = currentImg.includes('hopdungve') && !isPopUpBox
                          const isTicketMockup = currentImg.includes('mock up') || (!isPopUpBox && !isStandardBox && activeIdx === 0)

                          const badgeLabel = isPopUpBox
                            ? '🎁 Hộp Quà Pop-up Di Sản 3D'
                            : isStandardBox
                            ? '📦 Hộp Đựng Vé Sang Trọng'
                            : isTicketMockup
                            ? '🎫 Vé Tham Gia Chính Thức'
                            : `📸 Ảnh Chi Tiết #${activeIdx + 1}`

                          const handlePrev = (e: React.MouseEvent) => {
                            e.stopPropagation()
                            setEventSlideIndexes((prev) => ({
                              ...prev,
                              [evt.id]: (activeIdx - 1 + eventImages.length) % eventImages.length,
                            }))
                          }

                          const handleNext = (e: React.MouseEvent) => {
                            e.stopPropagation()
                            setEventSlideIndexes((prev) => ({
                              ...prev,
                              [evt.id]: (activeIdx + 1) % eventImages.length,
                            }))
                          }

                          return (
                            <div className="relative w-full border-b border-slate-100 bg-white">
                              {/* Khung ảnh chính */}
                              <div className={`relative aspect-[16/10] w-full p-3 flex items-center justify-center overflow-hidden ${eventImages.length > 1 ? 'pb-14' : ''}`}>
                                <img
                                  key={currentImg}
                                  src={currentImg}
                                  alt={`${evt.title} - Ảnh ${activeIdx + 1}`}
                                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-102"
                                />

                                {/* Badge Tên Ấn phẩm / Góc chụp */}
                                <span className="absolute top-2.5 left-2.5 rounded-md bg-gradient-to-r from-[#006368] to-[#004e52] text-white font-extrabold text-[10px] px-2.5 py-0.5 shadow-xs flex items-center gap-1 z-10">
                                  <span>{badgeLabel}</span>
                                </span>

                                {/* Nút phóng to Lightbox */}
                                <button
                                  type="button"
                                  onClick={() => setLightboxTicketImage(currentImg)}
                                  title="Phóng to ảnh này"
                                  className="absolute top-2.5 right-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 transition text-xs cursor-pointer shadow-xs z-10"
                                >
                                  🔍
                                </button>

                                {/* Thanh điều hướng Slider chuẩn Thiết kế Ảnh 1: [ (<)  • • ▬  (>) ] */}
                                {eventImages.length > 1 && (
                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 sm:gap-4 z-20 select-none">
                                    {/* Nút tròn trắng bên trái: < */}
                                    <button
                                      type="button"
                                      onClick={handlePrev}
                                      aria-label="Xem ảnh trước"
                                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white text-slate-800 shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                                    >
                                      <span className="text-[#0a3641] font-black text-sm leading-none -ml-0.5 select-none">‹</span>
                                    </button>

                                    {/* Dải Dots chỉ số ảnh: Inactive là chấm tròn xám xanh, Active là thanh dẹt bo góc màu đỏ */}
                                    <div className="flex items-center gap-2 sm:gap-2.5 px-0.5">
                                      {eventImages.map((_, idx) => {
                                        const isActive = idx === activeIdx
                                        return (
                                          <button
                                            key={idx}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setEventSlideIndexes((prev) => ({
                                                ...prev,
                                                [evt.id]: idx,
                                              }))
                                            }}
                                            aria-label={`Xem ảnh ${idx + 1}`}
                                            className={`transition-all duration-300 cursor-pointer ${
                                              isActive
                                                ? 'h-2.5 sm:h-3 w-7 sm:w-8 rounded-full bg-[#c8382b] shadow-2xs'
                                                : 'h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#8799a9] hover:bg-slate-500'
                                            }`}
                                          />
                                        )
                                      })}
                                    </div>

                                    {/* Nút tròn trắng bên phải: > */}
                                    <button
                                      type="button"
                                      onClick={handleNext}
                                      aria-label="Xem ảnh sau"
                                      className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white text-slate-800 shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                                    >
                                      <span className="text-[#0a3641] font-black text-sm leading-none -mr-0.5 select-none">›</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })()}

                        <div className="p-4 sm:p-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              HỘI BÀI CHÒI
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isOnline
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isDoor
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {isOnline ? '● Đang mở bán online' : isDoor ? 'Bán tại quầy soát vé' : 'Đã kết thúc'}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-[#c8382b] transition">
                            {evt.title}
                          </h4>

                          <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                            <p>📅 <strong className="text-slate-800">{evt.eventDate}</strong></p>
                            <p className="line-clamp-1">📍 {evt.location}</p>
                          </div>

                          {/* Quota */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100">
                            <div className="flex justify-between text-[11px] mb-1 text-slate-500">
                              <span>Số lượng vé:</span>
                              <span className="font-bold text-slate-800">
                                {remaining > 0 ? `Còn ${remaining} vé` : 'Hết vé online'}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                style={{ width: `${Math.min(100, ((evt.totalTickets - remaining) / evt.totalTickets) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Giá vé (Tiền / Xu)</span>
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-lg font-black text-[#c8382b]">
                                {evt.ticketPrice.toLocaleString('vi-VN')} đ
                              </span>
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1 shadow-2xs">
                                <span>hoặc {getVndToCoins(evt.ticketPrice)}</span>
                                <ChoiCoin size="xs" />
                              </span>
                            </div>
                          </div>

                          {isOnline && remaining > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleOpenBooking(evt)}
                              className="rounded-xl bg-gradient-to-r from-[#c8382b] to-[#92261b] hover:from-[#d94437] hover:to-[#a82d21] text-white font-bold text-xs px-4 py-2 transition shadow-xs hover:shadow-md cursor-pointer"
                            >
                              🎟️ Đặt Vé
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium">
                              {isDoor ? 'Mua tại cổng sự kiện' : 'Hết vé'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center rounded-2xl bg-white border border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-700">
                  Không tìm thấy vé sự kiện nào phù hợp với từ khóa "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3 text-xs text-[#c8382b] font-bold hover:underline cursor-pointer"
                >
                  Xóa từ khóa tìm kiếm để xem tất cả vé
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 5. PHẦN ẤN PHẨM & QUÀ TẶNG ── */}
        {(categoryFilter !== 'tickets' && (filteredProducts.length > 0 || categoryFilter !== 'all')) && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 text-sm font-bold border border-teal-200">
                  🛍️
                </span>
                <h3 className="text-lg font-bold text-slate-900">Ấn Phẩm Mỹ Thuật & Đồ Lưu Niệm</h3>
              </div>
              <span className="text-xs text-slate-500">Giao hàng toàn quốc · Kiểm tra khi nhận</span>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((prod) => {
                return (
                  <div
                    key={prod.id}
                    className="group rounded-2xl bg-white text-slate-900 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between border border-slate-200 hover:border-slate-300"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-square w-full bg-slate-50 overflow-hidden p-3 flex items-center justify-center">
                      <img
                        src={prod.imageSrc}
                        alt={prod.imageAlt}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                      {prod.badge && (
                        <span className="absolute top-2.5 left-2.5 rounded-md bg-amber-400 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 shadow-2xs">
                          {prod.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setLightboxGroupIndex(prod.publicationGroupIndex)}
                        title="Phóng to ảnh"
                        className="absolute bottom-2.5 right-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 transition text-xs cursor-pointer shadow-xs"
                      >
                        🔍
                      </button>
                    </div>

                    {/* Details */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-teal-700 block">
                          {prod.categoryLabel}
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2 mt-0.5 group-hover:text-[#c8382b] transition">
                          {prod.title}
                        </h4>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-500 font-semibold">
                          <span>⭐ {prod.rating}</span>
                          <span className="text-slate-400 font-normal">({prod.reviewsCount})</span>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-sm sm:text-base font-black text-[#c8382b]">
                              {prod.price.toLocaleString('vi-VN')} đ
                            </span>
                            {prod.originalPrice && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {prod.originalPrice.toLocaleString('vi-VN')} đ
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-0.5 mt-0.5 shadow-2xs">
                            <span>hoặc {getVndToCoins(prod.price)}</span>
                            <ChoiCoin size="xs" />
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setBuyingProduct(prod)
                            setProdQty(1)
                            setProdBuyMethod('money')
                            setProdPayment('cod')
                            setOrderResult(null)
                            setOrderError('')
                            if (effectiveUser) {
                              if (effectiveUser.fullName) setShippingName(effectiveUser.fullName)
                              if (effectiveUser.phone) setShippingPhone(effectiveUser.phone)
                              if (effectiveUser.address) setShippingAddress(effectiveUser.address)
                            }
                          }}
                          className="rounded-xl bg-[#006368] hover:bg-[#004e52] text-white font-bold text-xs px-3.5 py-1.5 transition shadow-xs cursor-pointer"
                        >
                          Đặt Mua
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl bg-white border border-slate-200 p-6">
              <p className="text-sm font-semibold text-slate-700">
                Không tìm thấy ấn phẩm nào phù hợp với từ khóa "{searchQuery}".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-teal-700 font-bold hover:underline cursor-pointer"
              >
                Xóa từ khóa tìm kiếm để xem tất cả ấn phẩm
              </button>
            </div>
          )}
        </div>
      )}

        {/* ── FOOTER CỦA TRANG MUA SẮM ── */}
        <footer className="mt-16 border-t border-slate-200 pt-8 pb-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🎴</span>
            <span className="font-bold text-slate-800">Chòi Heritage Store</span>
            <span className="text-slate-300">|</span>
            <span>Cửa hàng ấn phẩm di sản & hệ thống vé sự kiện chính thức</span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-slate-600 flex-wrap justify-center">
            <button type="button" onClick={onBackToSite} className="hover:text-[#c8382b] transition cursor-pointer">
              ← Về Trang Chủ Bài Chòi
            </button>
            <span>·</span>
            {onOpenPolicy && (
              <>
                <button type="button" onClick={() => onOpenPolicy('dieu-khoan')} className="hover:text-[#c8382b] transition cursor-pointer">
                  Điều khoản
                </button>
                <span>·</span>
                <button type="button" onClick={() => onOpenPolicy('bao-mat')} className="hover:text-[#c8382b] transition cursor-pointer">
                  Chính sách bảo mật
                </button>
                <span>·</span>
                <button type="button" onClick={() => onOpenPolicy('giao-hang')} className="hover:text-[#c8382b] transition cursor-pointer">
                  Giao hàng & COD
                </button>
                <span>·</span>
              </>
            )}
            <span>Hotline CSKH: 0848 180 081</span>
          </div>
        </footer>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ĐẶT VÉ SỰ KIỆN & HỘP QUÀ POP-UP (GIAO TẬN NHÀ DUY NHẤT)
      ────────────────────────────────────────────────────────────── */}
      {bookingEvent && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in text-slate-900">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#c8382b] to-[#92261b] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base">Đặt Vé & Hộp Quà Pop-up Di Sản</h4>
                <p className="text-[11px] text-red-100">Giao phôi vé vật lý & hộp quà tận nhà toàn quốc</p>
              </div>
              <button
                type="button"
                onClick={() => setBookingEvent(null)}
                className="text-white/80 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[85vh] overflow-y-auto">
              {!bookingResult ? (
                <form onSubmit={handleConfirmTicket} className="space-y-4">
                  {/* Card tóm tắt sự kiện & ấn phẩm */}
                  <div className="rounded-2xl bg-amber-50/90 border border-amber-300 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-2 gap-1 p-1 bg-amber-100/50">
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-white border border-amber-200/60 p-1 flex items-center justify-center">
                        <img
                          src={bookingEvent.image || '/assets/mock up (1).png'}
                          alt="Phôi vé chính thức"
                          className="h-full w-full object-contain"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                          🎫 Phôi vé
                        </span>
                      </div>
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-white border border-amber-200/60 p-1 flex items-center justify-center">
                        <img
                          src="/assets/hopdungve-popup.png"
                          alt="Hộp quà pop-up 3D"
                          className="h-full w-full object-contain"
                        />
                        <span className="absolute bottom-1 left-1 bg-[#c8382b] text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                          🎁 Hộp pop-up 3D
                        </span>
                      </div>
                    </div>
                    <div className="p-3.5 text-xs space-y-1 bg-white/70">
                      <p className="font-bold text-slate-900 text-sm leading-snug">{bookingEvent.title}</p>
                      <p className="text-slate-600 flex items-center gap-1.5"><span>📅</span> {bookingEvent.eventDate}</p>
                      <p className="text-slate-600 flex items-center gap-1.5"><span>📍</span> {bookingEvent.location}</p>
                      <div className="mt-2 pt-2 border-t border-amber-200/80 flex justify-between items-center font-bold">
                        <span className="text-slate-700">Đơn giá vé:</span>
                        <span className="text-[#c8382b] text-sm">{bookingEvent.ticketPrice.toLocaleString('vi-VN')} đ / vé</span>
                      </div>
                    </div>
                  </div>

                  {/* Bộ chọn số lượng vé */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-xs font-bold">Số lượng vé & hộp quà:</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTicketQty((prev) => Math.max(1, prev - 1))}
                        className="h-7 w-7 rounded bg-white border border-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm">{ticketQty}</span>
                      <button
                        type="button"
                        onClick={() => setTicketQty((prev) => prev + 1)}
                        className="h-7 w-7 rounded bg-white border border-slate-300 font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Tổng tiền */}
                  <div className="flex items-center justify-between text-xs font-bold px-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                    <div>
                      <span className="text-slate-800 block text-xs">Tổng thanh toán:</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {ticketBuyMethod === 'coin'
                          ? `Tương đương ${(bookingEvent.ticketPrice * ticketQty).toLocaleString('vi-VN')} đ`
                          : `Quy đổi: ${getVndToCoins(bookingEvent.ticketPrice * ticketQty)} Xu`}
                      </span>
                    </div>
                    {ticketBuyMethod === 'coin' ? (
                      <div className="flex items-center gap-1.5 text-lg text-amber-700 font-black">
                        <span>{getVndToCoins(bookingEvent.ticketPrice * ticketQty)}</span>
                        <ChoiCoin size="md" />
                      </div>
                    ) : (
                      <span className="text-lg text-[#c8382b] font-black">
                        {(bookingEvent.ticketPrice * ticketQty).toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>

                  {/* Thông tin người nhận và địa chỉ giao tại nhà */}
                  <div className="space-y-3 pt-1 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold block mb-1">Họ tên người nhận vé *</label>
                        <input
                          type="text"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn A"
                          required
                          className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-[#c8382b] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-bold block mb-1">Số điện thoại nhận vé *</label>
                        <input
                          type="tel"
                          value={buyerPhone}
                          onChange={(e) => setBuyerPhone(e.target.value)}
                          placeholder="0912 345 678"
                          required
                          className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-[#c8382b] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-900 flex items-center gap-1">
                          <span>🏠 Địa chỉ nhận vé tại nhà *</span>
                        </label>
                        <span className="text-[10px] text-[#c8382b] font-bold">Bắt buộc</span>
                      </div>
                      <input
                        type="text"
                        value={ticketShippingAddress}
                        onChange={(e) => setTicketShippingAddress(e.target.value)}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                        required
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#c8382b] focus:outline-none bg-slate-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold block mb-1 text-slate-700">Ghi chú giao vé (tùy chọn)</label>
                      <input
                        type="text"
                        value={ticketShippingNote}
                        onChange={(e) => setTicketShippingNote(e.target.value)}
                        placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi giao..."
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-[#c8382b] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Hình thức nhận vé: DUY NHẤT GIAO TẬN NHÀ */}
                  <div>
                    <label className="font-bold text-xs block mb-1 text-slate-800">Hình thức nhận vé & ấn phẩm</label>
                    <div className="p-3 rounded-2xl border border-emerald-500/50 bg-emerald-50/80 text-emerald-950 flex items-start gap-2.5 text-xs shadow-2xs">
                      <span className="text-xl shrink-0">🏠</span>
                      <div className="min-w-0">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                          <span>Giao Vé & Hộp Quà Tận Nhà (Toàn Quốc)</span>
                          <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                            Duy Nhất
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                          Phôi vé tham gia chính thức cùng bộ <strong>Hộp Quà Pop-up Di Sản 3D</strong> niêm phong sẽ được bưu tá chuyển phát nhanh đến tận địa chỉ nhà bạn.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2 LỰA CHỌN MUA: TIỀN HOẶC XU */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-slate-800">
                        Hình thức mua vé *
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {ticketBuyMethod === 'coin' ? 'Thanh toán ví ChoiCoin' : 'Thanh toán tiền mặt COD'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Lựa chọn 1: Mua bằng Tiền mặt COD */}
                      <div
                        onClick={() => setTicketBuyMethod('money')}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          ticketBuyMethod === 'money'
                            ? 'border-[#c8382b] bg-red-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">💵</span>
                            <span className="font-bold text-xs text-slate-900">Mua bằng Tiền</span>
                          </div>
                          <input
                            type="radio"
                            name="ticketBuyMethod"
                            checked={ticketBuyMethod === 'money'}
                            onChange={() => setTicketBuyMethod('money')}
                            className="accent-[#c8382b] h-4 w-4"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          Thanh toán tiền mặt (COD) khi bưu tá giao vé & hộp quà tận nơi.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#c8382b]">
                          <span>{(bookingEvent.ticketPrice * ticketQty).toLocaleString('vi-VN')} đ</span>
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">COD tận nơi</span>
                        </div>
                      </div>

                      {/* Lựa chọn 2: Mua bằng Xu ChoiCoin */}
                      <div
                        onClick={() => setTicketBuyMethod('coin')}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          ticketBuyMethod === 'coin'
                            ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🪙</span>
                            <span className="font-bold text-xs text-slate-900">Mua bằng Xu</span>
                          </div>
                          <input
                            type="radio"
                            name="ticketBuyMethod"
                            checked={ticketBuyMethod === 'coin'}
                            onChange={() => setTicketBuyMethod('coin')}
                            className="accent-amber-500 h-4 w-4"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          Trừ trực tiếp ví ChoiCoin. Bưu tá giao tận nơi miễn thu phí.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                          <span className="flex items-center gap-1">
                            <span>{getVndToCoins(bookingEvent.ticketPrice * ticketQty)}</span>
                            <ChoiCoin size="xs" />
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Trừ ví Xu</span>
                        </div>
                      </div>
                    </div>

                    {/* Hộp thông tin trạng thái Xu */}
                    {ticketBuyMethod === 'coin' && (
                      <div className="mt-1">
                        {!effectiveUser ? (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                            <span>⚠️ Vui lòng đăng nhập để thanh toán bằng Xu.</span>
                            <button
                              type="button"
                              onClick={() => onOpenAuth('login')}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 cursor-pointer"
                            >
                              Đăng nhập
                            </button>
                          </div>
                        ) : (effectiveUser.coins || 0) < getVndToCoins(bookingEvent.ticketPrice * ticketQty) ? (
                          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold block">⚠️ Số dư ví Xu không đủ:</span>
                              <span className="text-[11px]">
                                Bạn có {effectiveUser.coins || 0} Xu (cần {getVndToCoins(bookingEvent.ticketPrice * ticketQty)} Xu).
                              </span>
                            </div>
                            {onOpenCoins && (
                              <button
                                type="button"
                                onClick={onOpenCoins}
                                className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] cursor-pointer shadow-xs"
                              >
                                + Nạp Xu
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                            <span>✓ Số dư ví: <strong>{effectiveUser.coins} Xu</strong></span>
                            <span className="text-[11px] text-emerald-700 font-medium">
                              Còn lại sau mua: {(effectiveUser.coins || 0) - getVndToCoins(bookingEvent.ticketPrice * ticketQty)} Xu
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {bookingError && (
                    <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700 font-bold border border-red-200">
                      ⚠️ {bookingError}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setBookingEvent(null)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#c8382b] to-[#92261b] hover:from-[#d94437] hover:to-[#a82d21] rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition"
                    >
                      {bookingLoading
                        ? 'Đang tạo đơn & xuất vé...'
                        : ticketBuyMethod === 'coin'
                        ? `Xác Nhận Đổi ${getVndToCoins(bookingEvent.ticketPrice * ticketQty)} Xu Lấy Vé`
                        : `Xác Nhận Đặt Vé & Thanh Toán COD (${(bookingEvent.ticketPrice * ticketQty).toLocaleString('vi-VN')} đ)`}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-center py-2 animate-fade-in text-xs">
                  <div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 text-3xl flex items-center justify-center font-bold shadow-sm">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Đặt Vé & Hộp Quà Thành Công!</h4>
                    <p className="text-slate-500 mt-0.5">
                      Đơn hàng đã được lưu vào hệ thống để chuẩn bị đóng gói & giao tận nhà.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 overflow-hidden text-left shadow-sm">
                    {/* Hình ảnh vé & Hộp quà */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-amber-100/50">
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-white border border-amber-200/60 p-1 flex items-center justify-center">
                        <img
                          src={bookingEvent?.image || '/assets/mock up (1).png'}
                          alt="Phôi vé chính thức"
                          className="h-full w-full object-contain"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-1 py-0.5 rounded font-bold">
                          🎫 Phôi vé
                        </span>
                      </div>
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-white border border-amber-200/60 p-1 flex items-center justify-center">
                        <img
                          src="/assets/hopdungve-popup.png"
                          alt="Hộp quà pop-up 3D"
                          className="h-full w-full object-contain"
                        />
                        <span className="absolute bottom-1 left-1 bg-[#c8382b] text-white text-[8px] px-1 py-0.5 rounded font-bold">
                          🎁 Hộp pop-up 3D
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2 text-xs">
                      <p className="font-bold text-slate-900 text-sm">{bookingResult.eventTitle}</p>
                      <p className="text-slate-700">Người nhận: <strong>{buyerName}</strong> - 📞 {buyerPhone}</p>
                      
                      {/* Hiển thị hình thức thanh toán */}
                      {bookingResult.payMethod === 'coin' ? (
                        <div className="p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 font-medium flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            <span>🪙</span>
                            <span>Đã thanh toán bằng Xu:</span>
                          </span>
                          <span className="font-black text-amber-800 flex items-center gap-1">
                            <span>{bookingResult.coinsPaid}</span>
                            <ChoiCoin size="xs" />
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-bold ml-1">Đã trừ ví</span>
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-950 font-medium flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1.5">
                            <span>💵</span>
                            <span>Thanh toán khi nhận vé (COD):</span>
                          </span>
                          <span className="font-black text-[#c8382b]">
                            {bookingResult.totalAmount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      )}

                      {/* Hiển thị địa chỉ giao tận nhà nổi bật */}
                      <div className="p-2.5 rounded-xl bg-amber-100/80 border border-amber-300/80 text-amber-950 font-medium">
                        <span className="font-bold block text-amber-900 mb-0.5">🏠 Địa chỉ nhận vé tại nhà:</span>
                        <span>{bookingResult.shippingAddress}</span>
                      </div>

                      <div className="pt-2 border-t border-amber-200">
                        <span className="font-bold block mb-1 text-slate-900">Mã vé định danh (in trên phôi vé):</span>
                        <div className="space-y-1.5">
                          {bookingResult.tickets.map((t) => (
                            <div key={t.ticketCode} className="p-2.5 bg-white rounded-xl border border-amber-300 font-mono font-bold text-red-700 flex justify-between items-center shadow-xs">
                              <span className="text-sm tracking-wider">{t.ticketCode}</span>
                              <span className="text-xs text-slate-500 font-sans">🎟️ Đã đăng ký</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 pt-1">
                        🚚 Nhân viên sẽ đóng gói phôi vé kèm Hộp quà pop-up di sản 3D và giao đến tận nhà cho bạn trong 2-3 ngày làm việc.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingEvent(null)
                        setViewingDrawer('orders')
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer transition"
                    >
                      Xem Đơn Hàng
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingEvent(null)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#c8382b] to-[#92261b] text-white font-bold cursor-pointer transition shadow-sm"
                    >
                      Hoàn Tất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ĐẶT MUA ẤN PHẨM
      ────────────────────────────────────────────────────────────── */}
      {buyingProduct && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in text-slate-900">
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base">Đặt Mua Ấn Phẩm Di Sản</h4>
                <p className="text-[11px] text-slate-300">Giao hàng tận nơi toàn quốc</p>
              </div>
              <button
                type="button"
                onClick={() => setBuyingProduct(null)}
                className="text-white/80 hover:text-white text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[85vh] overflow-y-auto">
              {!orderResult ? (
                <form onSubmit={handleConfirmOrder} className="space-y-4">
                  <div className="flex gap-3 rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs">
                    <img src={buyingProduct.imageSrc} alt="" className="h-14 w-14 object-contain rounded-lg shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{buyingProduct.title}</p>
                      <p className="text-[#c8382b] font-black text-sm mt-1">{buyingProduct.price.toLocaleString('vi-VN')} đ</p>
                    </div>
                  </div>

                  {buyingProduct.hasSize && (
                    <div>
                      <label className="text-xs font-bold block mb-1">Chọn Size áo</label>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        {['S', 'M', 'L', 'XL'].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setProdSize(s)}
                            className={`py-1.5 rounded-lg border font-bold ${prodSize === s ? 'bg-slate-900 text-white' : 'border-slate-300'}`}
                          >
                            Size {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-xs font-bold">Số lượng:</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setProdQty((prev) => Math.max(1, prev - 1))}
                        className="h-7 w-7 rounded bg-white border border-slate-300 font-bold"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm">{prodQty}</span>
                      <button
                        type="button"
                        onClick={() => setProdQty((prev) => prev + 1)}
                        className="h-7 w-7 rounded bg-white border border-slate-300 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold px-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                    <div>
                      <span className="text-slate-800 block text-xs">Tổng thanh toán:</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {prodBuyMethod === 'coin'
                          ? `Tương đương ${(buyingProduct.price * prodQty).toLocaleString('vi-VN')} đ`
                          : `Quy đổi: ${getVndToCoins(buyingProduct.price * prodQty)} Xu`}
                      </span>
                    </div>
                    {prodBuyMethod === 'coin' ? (
                      <div className="flex items-center gap-1.5 text-lg text-amber-700 font-black">
                        <span>{getVndToCoins(buyingProduct.price * prodQty)}</span>
                        <ChoiCoin size="md" />
                      </div>
                    ) : (
                      <span className="text-lg text-[#c8382b] font-black">
                        {(buyingProduct.price * prodQty).toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-1 text-xs">
                    <div>
                      <label className="font-bold block mb-1">Họ tên người nhận *</label>
                      <input
                        type="text"
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        placeholder="Lê Thị B"
                        required
                        className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Số điện thoại *</label>
                      <input
                        type="tel"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        placeholder="0905 123 456"
                        required
                        className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Địa chỉ giao hàng *</label>
                      <input
                        type="text"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Số nhà, đường, phường, quận/huyện, tỉnh"
                        required
                        className="w-full rounded-xl border border-slate-300 p-2.5 focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Ghi chú giao hàng (tùy chọn)</label>
                      <input
                        type="text"
                        value={shippingNote}
                        onChange={(e) => setShippingNote(e.target.value)}
                        placeholder="Ví dụ: Giao vào giờ hành chính..."
                        className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 2 LỰA CHỌN MUA: TIỀN HOẶC XU */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-xs text-slate-800">
                        Hình thức thanh toán *
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {prodBuyMethod === 'coin' ? 'Thanh toán ví ChoiCoin' : 'Thanh toán tiền mặt COD'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Lựa chọn 1: Mua bằng Tiền mặt COD */}
                      <div
                        onClick={() => setProdBuyMethod('money')}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          prodBuyMethod === 'money'
                            ? 'border-slate-900 bg-slate-50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">💵</span>
                            <span className="font-bold text-xs text-slate-900">Mua bằng Tiền</span>
                          </div>
                          <input
                            type="radio"
                            name="prodBuyMethod"
                            checked={prodBuyMethod === 'money'}
                            onChange={() => setProdBuyMethod('money')}
                            className="accent-slate-900 h-4 w-4"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          Thanh toán khi nhận hàng (COD). Kiểm tra hàng trước khi trả tiền.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-900">
                          <span>{(buyingProduct.price * prodQty).toLocaleString('vi-VN')} đ</span>
                          <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">COD</span>
                        </div>
                      </div>

                      {/* Lựa chọn 2: Mua bằng Xu ChoiCoin */}
                      <div
                        onClick={() => setProdBuyMethod('coin')}
                        className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          prodBuyMethod === 'coin'
                            ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🪙</span>
                            <span className="font-bold text-xs text-slate-900">Mua bằng Xu</span>
                          </div>
                          <input
                            type="radio"
                            name="prodBuyMethod"
                            checked={prodBuyMethod === 'coin'}
                            onChange={() => setProdBuyMethod('coin')}
                            className="accent-amber-500 h-4 w-4"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          Trừ trực tiếp số dư ví ChoiCoin. Miễn phí thu hộ tận nhà.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-amber-700">
                          <span className="flex items-center gap-1">
                            <span>{getVndToCoins(buyingProduct.price * prodQty)}</span>
                            <ChoiCoin size="xs" />
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Trừ ví Xu</span>
                        </div>
                      </div>
                    </div>

                    {/* Hộp thông tin trạng thái Xu */}
                    {prodBuyMethod === 'coin' && (
                      <div className="mt-1">
                        {!effectiveUser ? (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                            <span>⚠️ Vui lòng đăng nhập để thanh toán bằng Xu.</span>
                            <button
                              type="button"
                              onClick={() => onOpenAuth('login')}
                              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 cursor-pointer"
                            >
                              Đăng nhập
                            </button>
                          </div>
                        ) : (effectiveUser.coins || 0) < getVndToCoins(buyingProduct.price * prodQty) ? (
                          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold block">⚠️ Số dư ví Xu không đủ:</span>
                              <span className="text-[11px]">
                                Bạn có {effectiveUser.coins || 0} Xu (cần {getVndToCoins(buyingProduct.price * prodQty)} Xu).
                              </span>
                            </div>
                            {onOpenCoins && (
                              <button
                                type="button"
                                onClick={onOpenCoins}
                                className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] cursor-pointer shadow-xs"
                              >
                                + Nạp Xu
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                            <span>✓ Số dư ví: <strong>{effectiveUser.coins} Xu</strong></span>
                            <span className="text-[11px] text-emerald-700 font-medium">
                              Còn lại sau mua: {(effectiveUser.coins || 0) - getVndToCoins(buyingProduct.price * prodQty)} Xu
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {orderError && <div className="rounded-xl bg-red-50 p-2 text-xs text-red-700">⚠️ {orderError}</div>}

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setBuyingProduct(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={orderLoading}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition"
                    >
                      {orderLoading
                        ? 'Đang tạo đơn...'
                        : prodBuyMethod === 'coin'
                        ? `Xác Nhận Đổi ${getVndToCoins(buyingProduct.price * prodQty)} Xu Lấy Ấn Phẩm`
                        : `Xác Nhận Đặt Mua (COD ${(buyingProduct.price * prodQty).toLocaleString('vi-VN')} đ)`}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-center py-2 animate-fade-in text-xs">
                  <div className="h-12 w-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 text-2xl flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">Đặt Hàng Thành Công!</h4>
                    <p className="text-slate-500">Mã đơn: <strong className="font-mono text-amber-600">{orderResult.orderId}</strong></p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-left space-y-1.5 border border-slate-200">
                    <p>Sản phẩm: <strong>{orderResult.summary}</strong></p>
                    <p>Người nhận: <strong>{shippingName}</strong> ({shippingPhone})</p>
                    <p>Địa chỉ: {shippingAddress}</p>
                    {orderResult.payMethod === 'coin' ? (
                      <div className="p-2 rounded-lg bg-amber-100 border border-amber-300 text-amber-950 flex items-center justify-between text-xs">
                        <span className="font-bold flex items-center gap-1">🪙 Thanh toán bằng Xu:</span>
                        <span className="font-black text-amber-800 flex items-center gap-1">
                          <span>{orderResult.coinsPaid}</span>
                          <ChoiCoin size="xs" />
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold ml-1">Đã trừ ví</span>
                        </span>
                      </div>
                    ) : (
                      <p>Tổng tiền: <strong className="text-[#c8382b]">{orderResult.totalAmount.toLocaleString('vi-VN')} đ</strong> (COD khi nhận)</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBuyingProduct(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
                  >
                    Hoàn Tất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VÉ CỦA TÔI / ĐƠN HÀNG CỦA TÔI
      ────────────────────────────────────────────────────────────── */}
      {viewingDrawer !== 'none' && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white text-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto border-l border-slate-200 shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{viewingDrawer === 'tickets' ? '🎟️' : '📦'}</span>
                  <h3 className="font-bold text-base text-slate-900">
                    {viewingDrawer === 'tickets' ? 'Vé Sự Kiện Của Tôi' : 'Đơn Hàng Của Tôi'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingDrawer('none')}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer transition"
                >
                  ✕
                </button>
              </div>

              {viewingDrawer === 'tickets' ? (
                <div className="mt-4 space-y-3">
                  {myTickets.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Bạn chưa có vé nào. Hãy đặt vé sự kiện ngay hôm nay!
                    </div>
                  ) : (
                    myTickets.map((t) => (
                      <div key={t.ticketCode} className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-[#c8382b] text-sm">{t.ticketCode}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.status === 'checked_in' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'}`}>
                            {t.status === 'checked_in' ? 'Đã qua cổng' : 'Chưa sử dụng'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{t.eventTitle}</p>
                        <p className="text-slate-500">Khách: {t.customerName} - 📞 {t.phone}</p>
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Kênh: {t.channel === 'online_early' ? 'Đặt Online' : 'Quầy vé'}</span>
                          <span className="text-emerald-700 font-bold">{t.price.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {myOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Chưa có đơn hàng nào.
                    </div>
                  ) : (
                    myOrders.map((o) => (
                      <div key={o.id} className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-[#c8382b]">{o.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                            {o.status === 'delivered' ? 'Đã giao' : o.status === 'shipping' ? 'Đang giao' : 'Chờ xử lý'}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900">{o.itemSummary}</p>
                        <p className="text-slate-500">Người nhận: {o.customerName} - {o.phone}</p>
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between font-bold">
                          <span className="text-slate-500 text-[11px]">
                            {o.paymentMethod === 'coin' ? '🪙 Đã trừ ví Xu:' : '💵 Tổng tiền (COD):'}
                          </span>
                          {o.paymentMethod === 'coin' ? (
                            <span className="text-amber-700 flex items-center gap-1 font-black text-xs">
                              <span>{o.coinsPaid || getVndToCoins(o.totalAmount)}</span>
                              <ChoiCoin size="xs" />
                            </span>
                          ) : (
                            <span className="text-[#c8382b] font-black text-xs">{o.totalAmount.toLocaleString('vi-VN')} đ</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewingDrawer('none')}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer transition"
            >
              Đóng
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          LIGHTBOX PREVIEW
      ────────────────────────────────────────────────────────────── */}
      {lightboxGroupIndex !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative max-h-[90vh] max-w-4xl text-center">
            <button
              type="button"
              onClick={() => setLightboxGroupIndex(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 text-sm cursor-pointer"
            >
              ✕ Đóng
            </button>
            <img
              src={PUBLICATION_GROUPS[lightboxGroupIndex].images[0].src}
              alt={PUBLICATION_GROUPS[lightboxGroupIndex].images[0].alt}
              className="max-h-[75vh] w-auto rounded-2xl mx-auto object-contain bg-white p-2"
            />
            <p className="text-white text-xs mt-3">{PUBLICATION_GROUPS[lightboxGroupIndex].images[0].alt}</p>
          </div>
        </div>,
        document.body
      )}

      {/* LIGHTBOX PHÓNG TO VÉ SỰ KIỆN */}
      {lightboxTicketImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setLightboxTicketImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl text-center cursor-default" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxTicketImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-300 text-sm cursor-pointer font-bold flex items-center gap-1"
            >
              ✕ Đóng
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-300/40 bg-white">
              <img
                src={lightboxTicketImage}
                alt="Vé sự kiện Bài Chòi chính thức"
                className="max-h-[78vh] w-auto mx-auto object-contain"
              />
            </div>
            <p className="text-white text-xs mt-3 font-semibold flex items-center justify-center gap-2">
              <span>🎟️</span> Mẫu vé tham gia chính thức — Hội Bài Chòi Di Sản Dân Gian
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CÀI ĐẶT TÀI KHOẢN & VÉ CỦA TÔI (ACCOUNT CENTER MODAL)
      ────────────────────────────────────────────────────────────── */}
      {accountCenterOpen && effectiveUser && (
        <AccountCenterModal
          currentUser={effectiveUser}
          initialTab={accountCenterInitialTab}
          onClose={() => setAccountCenterOpen(false)}
          onLogout={() => {
            setAccountCenterOpen(false)
            onLogout()
          }}
          onViewTicketPass={() => {
            setLightboxTicketImage('/assets/mock up (1).png')
          }}
        />
      )}
    </div>
  )
}
