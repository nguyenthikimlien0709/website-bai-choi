import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { UserProfile } from '../types/auth'
import { eventTicketService, type EventItem, type TicketRecord } from '../lib/eventTicketService'
import { orderService } from '../lib/orderService'
import { publicationService, type PublicationRecord } from '../lib/publicationService'
import { PUBLICATION_GROUPS } from '../publications'
import ChoiCoin from './ChoiCoin'
import { authService } from '../lib/authService'

const getVndToCoins = (vnd: number): number => Math.ceil(vnd / 1000)

interface ShopSectionProps {
  lang: 'VIE' | 'ENG'
  currentUser: UserProfile | null
  onOpenAuth?: (mode?: 'login' | 'register') => void
  onGoToShopPortal?: () => void
  onOpenCoins?: () => void
}

interface MerchProduct {
  id: string
  title: string
  titleEng: string
  category: string
  categoryEng: string
  price: number
  description: string
  descriptionEng: string
  imageSrc: string
  imageAlt: string
  publicationGroupIndex: number
  hasSize?: boolean
  badge?: string
  badgeEng?: string
}

const MERCH_PRODUCTS: MerchProduct[] = [
  {
    id: 'prod-01',
    title: 'Bộ Bài Chòi Gỗ Dân Gian 30 Thẻ',
    titleEng: 'Traditional Bài Chòi Wooden 30-Card Set',
    category: 'Bộ trò chơi dân gian',
    categoryEng: 'Folk Game Deck',
    price: 290000,
    description: 'Bộ thẻ bài chế tác từ gỗ tự nhiên khắc laser 3 pho (Văn, Vạn, Hạch). Bao gồm túi vải mộc bảo quản và cẩm nang hướng dẫn luật chơi truyền thống.',
    descriptionEng: 'Crafted from natural wood featuring 3 suits (Pho Van, Pho Van, Pho Hach). Includes protective canvas pouch and traditional rule handbook.',
    imageSrc: '/assets/thedungbai.jpg',
    imageAlt: 'Hộp đứng đựng bộ thẻ Bài Chòi',
    publicationGroupIndex: 0,
    badge: 'Bán chạy nhất',
    badgeEng: 'Best Seller',
  },
  {
    id: 'prod-02',
    title: 'Hộp Đựng Bài Chòi Sơn Mài Cách Điệu',
    titleEng: 'Refined Bài Chòi Keepsake Box',
    category: 'Vật phẩm lưu trữ',
    categoryEng: 'Keepsake Box',
    price: 150000,
    description: 'Hộp đựng bài cao cấp với hệ hoa văn mây sóng và mái chòi cổ truyền. Cấu trúc nắp trượt chắc chắn, bảo vệ quân bài bền đẹp cùng thời gian.',
    descriptionEng: 'Premium storage box adorned with wave and cloud motifs. Sliding lid engineered for durability and elegant display.',
    imageSrc: '/assets/thedungbai1.jpg',
    imageAlt: 'Hộp ngang đựng bộ thẻ Bài Chòi',
    publicationGroupIndex: 0,
    badge: 'Mỹ nghệ cao cấp',
    badgeEng: 'Premium Craft',
  },
  {
    id: 'prod-03',
    title: 'Áo Thun Di Sản Bài Chòi Cổ Truyền',
    titleEng: 'Bài Chòi Heritage Graphic T-Shirt',
    category: 'Thời trang di sản',
    categoryEng: 'Heritage Apparel',
    price: 180000,
    description: 'Chất liệu 100% cotton định lượng 250gsm thoáng mát, in họa tiết biểu tượng anh Hiệu và câu hát Bài Chòi miền Trung với công nghệ in lụa bền màu.',
    descriptionEng: '100% premium 250gsm breathable cotton, featuring iconic caller chants and folk motifs printed with high-durability inks.',
    imageSrc: '/assets/quatangsukien(1).jpg',
    imageAlt: 'Áo quà tặng mang nhận diện Bài Chòi',
    publicationGroupIndex: 1,
    hasSize: true,
    badge: 'Bộ sưu tập mới',
    badgeEng: 'New Arrival',
  },
  {
    id: 'prod-04',
    title: 'Bộ Móc Khóa Gỗ Thẻ Bài Chòi',
    titleEng: 'Bài Chòi Wooden Keychain Set',
    category: 'Quà lưu niệm',
    categoryEng: 'Souvenirs',
    price: 35000,
    description: 'Móc khóa thẻ bài gỗ khắc hình các quân bài mang ý nghĩa may mắn (Nhứt Nọc, Nhì Nghèo, Tam Quăng, Cửu Điều...), tinh tế và nhỏ gọn.',
    descriptionEng: 'Natural wooden keychains laser-engraved with lucky folk cards (Nhat Noc, Nhi Ngheo, Tam Quang...), compact and meaningful.',
    imageSrc: '/assets/quatangsukien4.jpg',
    imageAlt: 'Bộ móc khóa lưu niệm Bài Chòi',
    publicationGroupIndex: 1,
    badge: 'Phổ biến',
    badgeEng: 'Popular',
  },
  {
    id: 'prod-05',
    title: 'Túi Tote Canvas Họa Tiết Mái Chòi',
    titleEng: 'Bài Chòi Pavilion Canvas Tote Bag',
    category: 'Bao bì ứng dụng',
    categoryEng: 'Everyday Tote',
    price: 95000,
    description: 'Túi vải canvas dày dặn thân thiện môi trường, quai may gia cố chịu lực cao. Họa tiết mái chòi hội làng kết hợp hoa văn mây sóng mang đậm nét văn hóa Việt.',
    descriptionEng: 'Eco-friendly heavy canvas tote bag with reinforced straps. Screen-printed pavilion and folk wave pattern for daily versatility.',
    imageSrc: '/assets/anpham1.png',
    imageAlt: 'Túi giấy và túi tote Bài Chòi',
    publicationGroupIndex: 2,
    badge: 'Thân thiện',
    badgeEng: 'Eco-Friendly',
  },
  {
    id: 'prod-06',
    title: 'Combo Quà Tặng Gốm & Lịch Di Sản',
    titleEng: 'Ceramic Gift Set & Heritage Desk Calendar',
    category: 'Quà tặng sự kiện',
    categoryEng: 'Gift Collection',
    price: 220000,
    description: 'Bộ quà tặng cao cấp gồm gốm mộc tráng men thủ công kết hợp bộ lịch bàn minh họa 30 lá bài Chòi qua 12 tháng, đóng gói trong hộp quà trang trọng.',
    descriptionEng: 'Artisanal handcrafted glazed ceramics paired with a 12-month desk calendar illustrating 30 Bài Chòi cards in festive packaging.',
    imageSrc: '/assets/quatangsukien(2).jpg',
    imageAlt: 'Bộ quà tặng gốm Bài Chòi',
    publicationGroupIndex: 1,
    badge: 'Quà biếu tặng',
    badgeEng: 'Gift Box',
  },
]

export default function ShopSection({ lang, currentUser, onGoToShopPortal, onOpenAuth, onOpenCoins }: ShopSectionProps) {
  const isVie = lang === 'VIE'

  // Tab filter: 'all' | 'tickets' | 'merch'
  const [activeTab, setActiveTab] = useState<'all' | 'tickets' | 'merch'>('all')

  // Events list from eventTicketService
  const [events, setEvents] = useState<EventItem[]>(() => eventTicketService.getEvents())
  const [publications, setPublications] = useState<PublicationRecord[]>(() => publicationService.getPublications())

  useEffect(() => {
    publicationService.syncFromSupabase()
    eventTicketService.syncFromSupabase()
    const unsubEvents = eventTicketService.subscribe(() => {
      setEvents(eventTicketService.getEvents())
    })
    const unsubPubs = publicationService.subscribe(() => {
      setPublications(publicationService.getPublications())
    })
    return () => {
      unsubEvents()
      unsubPubs()
    }
  }, [])

  const merchProducts: MerchProduct[] = useMemo(() => {
    return publications.map((p, idx) => ({
      id: p.id,
      title: p.name,
      titleEng: p.name,
      category: p.category,
      categoryEng: p.category,
      price: p.price,
      description: p.description,
      descriptionEng: p.description,
      imageSrc: p.imageUrl,
      imageAlt: p.name,
      publicationGroupIndex: idx % 3,
      hasSize: p.hasSize || p.category.toLowerCase().includes('thời trang') || p.category.toLowerCase().includes('áo'),
      badge: p.badge || (p.stock < 10 ? (p.stock <= 0 ? 'Hết hàng' : 'Sắp hết') : undefined),
      badgeEng: p.badge || (p.stock < 10 ? (p.stock <= 0 ? 'Out of stock' : 'Low stock') : undefined),
    }))
  }, [publications])

  // Modals state
  const [selectedEventForBooking, setSelectedEventForBooking] = useState<EventItem | null>(null)
  const [selectedProductForBuy, setSelectedProductForBuy] = useState<MerchProduct | null>(null)

  // Lightbox view state
  const [lightboxState, setLightboxState] = useState<{ groupIndex: number; imageIndex: number } | null>(null)
  const [ticketLightboxImg, setTicketLightboxImg] = useState<string | null>(null)

  // Booking Modal Form State
  const [ticketBuyMethod, setTicketBuyMethod] = useState<'money' | 'coin'>('money')
  const [ticketQty, setTicketQty] = useState(1)
  const [ticketBuyerName, setTicketBuyerName] = useState(currentUser?.fullName || '')
  const [ticketBuyerPhone, setTicketBuyerPhone] = useState(currentUser?.phone || '')
  const [ticketBuyerEmail, setTicketBuyerEmail] = useState(currentUser?.email || '')
  const [ticketShippingAddress, setTicketShippingAddress] = useState(currentUser?.address || '')
  const [ticketShippingNote, setTicketShippingNote] = useState('')
  const [ticketPaymentMethod, setTicketPaymentMethod] = useState<'bank_transfer' | 'cod'>('cod')
  const [eventSlideIndexes, setEventSlideIndexes] = useState<Record<string, number>>({})
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccessResult, setBookingSuccessResult] = useState<{
    tickets: TicketRecord[]
    eventTitle: string
    totalAmount: number
    paymentMethod: string
    shippingAddress: string
    coinsPaid?: number
    payMethod: 'money' | 'coin'
  } | null>(null)
  const [bookingError, setBookingError] = useState('')

  // Product Purchase Modal Form State
  const [prodBuyMethod, setProdBuyMethod] = useState<'money' | 'coin'>('money')
  const [prodQty, setProdQty] = useState(1)
  const [prodSize, setProdSize] = useState('L')
  const [prodBuyerName, setProdBuyerName] = useState(currentUser?.fullName || '')
  const [prodBuyerPhone, setProdBuyerPhone] = useState(currentUser?.phone || '')
  const [prodAddress, setProdAddress] = useState('')
  const [prodNote, setProdNote] = useState('')
  const [prodPaymentMethod, setProdPaymentMethod] = useState<'cod' | 'bank_transfer'>('cod')
  const [prodLoading, setProdLoading] = useState(false)
  const [prodSuccessResult, setProdSuccessResult] = useState<{
    orderId: string
    productTitle: string
    totalAmount: number
    address: string
    paymentMethod: string
    coinsPaid?: number
    payMethod: 'money' | 'coin'
  } | null>(null)
  const [prodError, setProdError] = useState('')

  // Reset pre-filled user info when currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (!ticketBuyerName) setTicketBuyerName(currentUser.fullName)
      if (!ticketBuyerPhone && currentUser.phone) setTicketBuyerPhone(currentUser.phone)
      if (!ticketBuyerEmail && currentUser.email) setTicketBuyerEmail(currentUser.email)
      if (!ticketShippingAddress && currentUser.address) setTicketShippingAddress(currentUser.address)
      if (!prodBuyerName) setProdBuyerName(currentUser.fullName)
      if (!prodBuyerPhone && currentUser.phone) setProdBuyerPhone(currentUser.phone)
      if (!prodAddress && currentUser.address) setProdAddress(currentUser.address)
    }
  }, [currentUser])

  // Handle Event Ticket Checkout
  const handleOpenTicketModal = (evt: EventItem) => {
    setSelectedEventForBooking(evt)
    setTicketQty(1)
    setBookingError('')
    setBookingSuccessResult(null)
    setTicketShippingAddress(currentUser?.address || '')
    setTicketShippingNote('')
    if (currentUser) {
      setTicketBuyerName(currentUser.fullName)
      setTicketBuyerPhone(currentUser.phone || '')
      setTicketBuyerEmail(currentUser.email || '')
    }
  }

  const handleConfirmTicketBooking = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventForBooking) return

    if (!ticketBuyerName.trim()) {
      setBookingError(isVie ? 'Vui lòng nhập họ và tên của bạn' : 'Please enter your name')
      return
    }
    if (!ticketBuyerPhone.trim() || ticketBuyerPhone.trim().length < 8) {
      setBookingError(isVie ? 'Vui lòng nhập số điện thoại hợp lệ để nhận vé' : 'Please enter a valid phone number')
      return
    }
    if (!ticketShippingAddress.trim() || ticketShippingAddress.trim().length < 5) {
      setBookingError(isVie ? 'Vui lòng nhập địa chỉ nhận vé & hộp quà tận nhà cụ thể (Số nhà, đường, phường/xã, tỉnh/TP)' : 'Please enter your specific shipping address for home delivery')
      return
    }

    const total = selectedEventForBooking.ticketPrice * ticketQty
    const totalCoins = getVndToCoins(total)

    if (ticketBuyMethod === 'coin') {
      if (!currentUser) {
        onOpenAuth?.('login')
        setBookingError(isVie ? 'Vui lòng đăng nhập hoặc đăng ký tài khoản để thanh toán bằng Xu Chòi.' : 'Please login or register to pay with coins')
        return
      }
      if ((currentUser.coins || 0) < totalCoins) {
        setBookingError(
          isVie
            ? `Số dư Xu không đủ! Hiện có ${currentUser.coins || 0} Xu, cần ${totalCoins} Xu. Vui lòng nạp thêm Xu hoặc chọn mua bằng Tiền.`
            : `Insufficient coin balance! You have ${currentUser.coins || 0} coins, need ${totalCoins} coins.`
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
          `Đặt vé sự kiện: ${selectedEventForBooking.title} (${ticketQty} vé)`
        )
        if (!spendRes.success) {
          setBookingLoading(false)
          setBookingError(spendRes.message || 'Không thể trừ Xu. Vui lòng thử lại.')
          return
        }
      }

      const res = eventTicketService.buyOnlineTickets(
        selectedEventForBooking.id,
        ticketBuyerName.trim(),
        ticketBuyerPhone.trim(),
        ticketQty,
        ticketBuyerEmail.trim() || undefined,
        ticketShippingAddress.trim()
      )

      setBookingLoading(false)

      if (res.success && res.tickets && res.tickets.length > 0) {
        // Ghi nhận đơn hàng vào orderService để Admin đồng bộ quản lý
        await orderService.createOrder({
          customerName: ticketBuyerName.trim(),
          phone: ticketBuyerPhone.trim(),
          email: ticketBuyerEmail.trim() || undefined,
          orderType: 'ticket',
          itemSummary: `${ticketQty}x Vé Hội & Hộp Quà Pop-up Di Sản: ${selectedEventForBooking.title}`,
          totalAmount: total,
          shippingAddress: ticketShippingAddress.trim(),
          notes: ticketShippingNote.trim() ? `Ghi chú: ${ticketShippingNote.trim()}` : 'Giao vé tận nhà',
          paymentMethod: ticketBuyMethod === 'coin' ? 'coin' : 'cod',
          coinsPaid: ticketBuyMethod === 'coin' ? totalCoins : undefined,
          items: [
            {
              id: selectedEventForBooking.id,
              name: selectedEventForBooking.title,
              quantity: ticketQty,
              price: selectedEventForBooking.ticketPrice,
            },
          ],
        })

        setBookingSuccessResult({
          tickets: res.tickets,
          eventTitle: selectedEventForBooking.title,
          totalAmount: total,
          paymentMethod: ticketBuyMethod === 'coin' ? `Thanh toán bằng ChoiCoin (${totalCoins} Xu)` : (isVie ? 'Thanh toán khi nhận vé (COD tận nhà)' : 'Cash on delivery'),
          shippingAddress: ticketShippingAddress.trim(),
          coinsPaid: ticketBuyMethod === 'coin' ? totalCoins : undefined,
          payMethod: ticketBuyMethod,
        })
      } else {
        setBookingError(res.message || (isVie ? 'Không thể đặt vé, vui lòng thử lại sau.' : 'Failed to book tickets.'))
      }
    }, 500)
  }

  // Handle Product Purchase
  const handleOpenProductModal = (prod: MerchProduct) => {
    setSelectedProductForBuy(prod)
    setProdQty(1)
    setProdSize('L')
    setProdBuyMethod('money')
    setProdError('')
    setProdSuccessResult(null)
    if (currentUser) {
      setProdBuyerName(currentUser.fullName)
      setProdBuyerPhone(currentUser.phone || '')
      if (currentUser.address) setProdAddress(currentUser.address)
    }
  }

  const handleConfirmProductOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductForBuy) return

    if (!prodBuyerName.trim()) {
      setProdError(isVie ? 'Vui lòng nhập họ tên người nhận hàng' : 'Please enter recipient name')
      return
    }
    if (!prodBuyerPhone.trim() || prodBuyerPhone.trim().length < 8) {
      setProdError(isVie ? 'Vui lòng nhập số điện thoại giao hàng' : 'Please enter valid phone number')
      return
    }
    if (!prodAddress.trim()) {
      setProdError(isVie ? 'Vui lòng nhập địa chỉ nhận hàng chi tiết' : 'Please enter shipping address')
      return
    }

    const total = selectedProductForBuy.price * prodQty
    const totalCoins = getVndToCoins(total)

    if (prodBuyMethod === 'coin') {
      if (!currentUser) {
        onOpenAuth?.('login')
        setProdError(isVie ? 'Vui lòng đăng nhập hoặc đăng ký tài khoản để thanh toán bằng Xu Chòi.' : 'Please login or register to pay with coins')
        return
      }
      if ((currentUser.coins || 0) < totalCoins) {
        setProdError(
          isVie
            ? `Số dư Xu không đủ! Hiện có ${currentUser.coins || 0} Xu, cần ${totalCoins} Xu. Vui lòng nạp thêm Xu hoặc chọn mua bằng Tiền.`
            : `Insufficient coin balance! You have ${currentUser.coins || 0} coins, need ${totalCoins} coins.`
        )
        return
      }
    }

    setProdLoading(true)
    setProdError('')

    setTimeout(async () => {
      if (prodBuyMethod === 'coin') {
        const spendRes = authService.spendCoins(
          totalCoins,
          `Mua ấn phẩm: ${selectedProductForBuy.title} (${prodQty} cái)`
        )
        if (!spendRes.success) {
          setProdLoading(false)
          setProdError(spendRes.message || 'Không thể trừ Xu. Vui lòng thử lại.')
          return
        }
      }

      setProdLoading(false)
      const summaryText = `${prodQty}x ${selectedProductForBuy.title}${selectedProductForBuy.hasSize ? ` (Size ${prodSize})` : ''}`

      const newOrder = await orderService.createOrder({
        customerName: prodBuyerName.trim(),
        phone: prodBuyerPhone.trim(),
        email: currentUser?.email,
        shippingAddress: prodAddress.trim(),
        orderType: 'publication',
        itemSummary: summaryText,
        totalAmount: total,
        paymentMethod: prodBuyMethod === 'coin' ? 'coin' : 'cod',
        coinsPaid: prodBuyMethod === 'coin' ? totalCoins : undefined,
        items: [
          {
            id: selectedProductForBuy.id,
            name: selectedProductForBuy.title,
            quantity: prodQty,
            price: selectedProductForBuy.price,
            size: selectedProductForBuy.hasSize ? prodSize : undefined,
          },
        ],
      })

      setProdSuccessResult({
        orderId: newOrder.id,
        productTitle: summaryText,
        totalAmount: total,
        address: prodAddress.trim(),
        paymentMethod: prodBuyMethod === 'coin' ? `Thanh toán bằng ChoiCoin (${totalCoins} Xu)` : (isVie ? 'Thanh toán khi nhận hàng (COD)' : 'Cash on Delivery (COD)'),
        coinsPaid: prodBuyMethod === 'coin' ? totalCoins : undefined,
        payMethod: prodBuyMethod,
      })
    }, 500)
  }

  // Filtered Events: only show online_sale or relevant
  const onlineEvents = events.filter((e) => e.status === 'online_sale')

  return (
    <section id="shop" className="scroll-mt-20 py-20 lg:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div data-reveal="up" className="mx-auto mb-10 max-w-3xl text-center">
          <div data-reveal="up" data-reveal-delay="1" className="mb-3 inline-flex items-center gap-2">
            <span className="text-xl">🎴</span>
            <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#006368' }}>
              {isVie ? 'Không Gian Mua Sắm & Đặt Vé Di Sản' : 'Heritage Shop & Event Ticket Box'}
            </span>
            <span className="text-xl">🎟️</span>
          </div>
          <h2
            data-reveal="up"
            data-reveal-delay="2"
            className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--font-section)', color: '#006368' }}
          >
            {isVie ? 'Cửa Hàng Di Sản & Vé Bài Chòi' : 'Bài Chòi Heritage Shop & Tickets'}
          </h2>
          <div data-reveal="scale" data-reveal-delay="2" className="mx-auto h-0.5 w-28 bg-gradient-to-r from-transparent via-[#E2BC5B] to-transparent mb-5" />
          <p data-reveal="up" data-reveal-delay="3" className="text-sm sm:text-base leading-relaxed" style={{ color: 'rgba(0,75,80,0.85)' }}>
            {isVie
              ? 'Khám phá các ấn phẩm mỹ thuật độc bản, bộ thẻ gỗ truyền thống cùng hệ thống đặt vé tham gia trực tiếp các đêm hội Bài Chòi dân gian tại Quy Nhơn, Hội An và miền Trung.'
              : 'Explore bespoke cultural publications, traditional wooden card decks, and secure your admission tickets to folk Bài Chòi festivals in Central Vietnam.'}
          </p>

          {onGoToShopPortal && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={onGoToShopPortal}
                className="rounded-full bg-gradient-to-r from-[#006368] to-[#0a4d50] hover:from-[#0d7f85] hover:to-[#006368] text-white font-bold text-xs sm:text-sm px-6 py-2.5 transition shadow-lg hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>🛍️</span>
                <span>{isVie ? 'Mở Trang Cửa Hàng & Vé Đầy Đủ (Giao diện Store) →' : 'Open Full Heritage Store & Tickets Portal →'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-[#006368] text-white shadow-md scale-105'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            <span>✨</span>
            <span>{isVie ? 'Tất Cả Sản Phẩm & Vé' : 'All Items & Tickets'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
              activeTab === 'tickets'
                ? 'bg-[#c8382b] text-white shadow-md scale-105'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            <span>🎟️</span>
            <span>{isVie ? 'Vé Sự Kiện Bài Chòi' : 'Event Tickets'}</span>
            <span className="rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold px-1.5 py-0.2">
              {onlineEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('merch')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 ${
              activeTab === 'merch'
                ? 'bg-[#006368] text-white shadow-md scale-105'
                : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
            }`}
          >
            <span>🛍️</span>
            <span>{isVie ? 'Ấn Phẩm & Quà Tặng' : 'Publications & Merch'}</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2">
              {MERCH_PRODUCTS.length}
            </span>
          </button>
        </div>

        {/* ── 1. PHẦN VÉ SỰ KIỆN BÀI CHÒI ── */}
        {(activeTab === 'all' || activeTab === 'tickets') && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600 text-base font-bold shadow-xs">
                  🎟️
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-title)' }}>
                    {isVie ? 'Vé Tham Gia Hội Bài Chòi' : 'Admission Tickets to Bài Chòi Festivals'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isVie
                      ? 'Đặt vé online nhận mã điện tử tức thì — Quét mã QR vào cổng không cần xếp hàng'
                      : 'Instant electronic ticket pass with QR code for seamless festival check-in'}
                  </p>
                </div>
              </div>
            </div>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => {
                const remaining = Math.max(0, evt.totalTickets - evt.soldTickets)
                const isOnlineOpen = evt.status === 'online_sale'
                const isEnded = evt.status === 'ended'
                const isDoorSale = evt.status === 'offline_sale'

                return (
                  <div
                    key={evt.id}
                    className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white/95 border border-amber-200/80 shadow-lg shadow-teal-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Top ticket strip decorative header */}
                    <div
                      className="px-5 py-2.5 flex items-center justify-between text-white"
                      style={{
                        background: isOnlineOpen
                          ? 'linear-gradient(135deg, #006368 0%, #0d7f85 100%)'
                          : isDoorSale
                          ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                          : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                      }}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
                        <span>🎴</span>
                        <span>{isVie ? 'Hội Di Sản' : 'Heritage Festival'}</span>
                      </div>
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          isOnlineOpen
                            ? 'bg-emerald-400 text-slate-950 animate-pulse'
                            : isDoorSale
                            ? 'bg-amber-300 text-slate-950'
                            : 'bg-slate-300 text-slate-800'
                        }`}
                      >
                        {isOnlineOpen
                          ? isVie ? '● Đang mở bán online' : '● Online Sale'
                          : isDoorSale
                          ? isVie ? 'Bán tại quầy soát vé' : 'Door Sale Only'
                          : isVie ? 'Đã kết thúc' : 'Ended'}
                      </span>
                    </div>

                    {/* Multi-image Slider Banner */}
                    {(() => {
                      const eventImages = (evt.images && evt.images.length > 0)
                        ? evt.images
                        : [evt.image || '/assets/mock up (1).png', '/assets/hopdungve-popup.png']
                      const slideIdx = (eventSlideIndexes[evt.id] ?? 0) % eventImages.length
                      const currentImg = eventImages[slideIdx]

                      return (
                        <div className={`relative aspect-[16/10] w-full p-3 flex items-center justify-center overflow-hidden bg-white border-b border-slate-100 select-none ${eventImages.length > 1 ? 'pb-14' : ''}`}>
                          <img
                            src={currentImg}
                            alt={`${evt.title} - ảnh ${slideIdx + 1}`}
                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-102"
                          />

                          {/* Top Badge thông minh */}
                          {(() => {
                            const isPopUpBox = currentImg?.includes('popup') || currentImg?.includes('hopdungve-popup')
                            const isStandardBox = currentImg?.includes('hopdungve') && !isPopUpBox
                            const isTicketMockup = currentImg?.includes('mock up') || (!isPopUpBox && !isStandardBox && slideIdx === 0)
                            const badgeText = isPopUpBox
                              ? '🎁 Hộp Quà Pop-up Di Sản 3D'
                              : isStandardBox
                              ? '📦 Hộp Đựng Vé Sang Trọng'
                              : isTicketMockup
                              ? '🎫 Mẫu Vé Chính Thức'
                              : `📸 Chi Tiết #${slideIdx + 1}`
                            return (
                              <span className="absolute top-2.5 left-2.5 rounded-md bg-gradient-to-r from-[#006368] to-[#004e52] text-white font-extrabold text-[10px] px-2.5 py-0.5 shadow-xs flex items-center gap-1 z-10">
                                {badgeText}
                              </span>
                            )
                          })()}

                          {/* Zoom Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTicketLightboxImg(currentImg)
                            }}
                            className="absolute top-2.5 right-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 transition text-xs cursor-pointer shadow-xs z-10"
                            title={isVie ? 'Phóng to ảnh' : 'Enlarge'}
                          >
                            🔍
                          </button>

                          {/* Thanh điều hướng Slider chuẩn Thiết kế Ảnh 1: [ (<)  • • ▬  (>) ] */}
                          {eventImages.length > 1 && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 sm:gap-4 z-20 select-none">
                              {/* Nút tròn trắng bên trái: < */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEventSlideIndexes((prev) => ({
                                    ...prev,
                                    [evt.id]: (slideIdx - 1 + eventImages.length) % eventImages.length,
                                  }))
                                }}
                                aria-label="Ảnh trước"
                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white text-slate-800 shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                              >
                                <span className="text-[#0a3641] font-black text-sm leading-none -ml-0.5 select-none">‹</span>
                              </button>

                              {/* Dải Dots chỉ số ảnh: Inactive là chấm tròn xám xanh, Active là thanh dẹt bo góc màu đỏ */}
                              <div className="flex items-center gap-2 sm:gap-2.5 px-0.5">
                                {eventImages.map((_, idx) => {
                                  const isActive = idx === slideIdx
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEventSlideIndexes((prev) => ({
                                    ...prev,
                                    [evt.id]: (slideIdx + 1) % eventImages.length,
                                  }))
                                }}
                                aria-label="Ảnh sau"
                                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white text-slate-800 shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                              >
                                <span className="text-[#0a3641] font-black text-sm leading-none -mr-0.5 select-none">›</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Ticket Body Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 line-clamp-2 leading-snug">
                          {evt.title}
                        </h4>

                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">📅</span>
                            <span className="font-semibold text-slate-800">
                              {evt.eventDate}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-sm">📍</span>
                            <span className="line-clamp-2">{evt.location}</span>
                          </div>
                        </div>

                        {/* Quota Progress */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-500 font-medium">{isVie ? 'Số lượng vé online:' : 'Ticket quota:'}</span>
                            <span className="font-bold text-slate-800">
                              {remaining > 0 ? `${remaining} / ${evt.totalTickets} vé còn lại` : 'Đã bán hết vé'}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                              style={{ width: `${Math.min(100, ((evt.totalTickets - remaining) / evt.totalTickets) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ticket Price & Action */}
                      <div className="mt-5 pt-4 border-t border-dashed border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">{isVie ? 'Giá vé (Tiền / Xu)' : 'Official Price'}</span>
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-xl font-black text-[#c8382b]">
                              {evt.ticketPrice.toLocaleString('vi-VN')} đ
                            </span>
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1 shadow-2xs">
                              <span>hoặc {getVndToCoins(evt.ticketPrice)}</span>
                              <ChoiCoin size="xs" />
                            </span>
                          </div>
                        </div>

                        {isOnlineOpen && remaining > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleOpenTicketModal(evt)}
                            className="rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95 hover:scale-105 cursor-pointer flex items-center gap-1.5"
                            style={{ background: 'linear-gradient(135deg, #c8382b 0%, #92261b 100%)' }}
                          >
                            <span>🎟️</span>
                            <span>{isVie ? 'Đặt Vé Ngay' : 'Book Tickets'}</span>
                          </button>
                        ) : isDoorSale ? (
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 block">
                              {isVie ? 'Mua tại cổng sự kiện' : 'Buy at counter'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                            {isEnded ? (isVie ? 'Đã kết thúc' : 'Ended') : (isVie ? 'Hết vé' : 'Sold out')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── 2. PHẦN ẤN PHẨM & ĐỒ LƯU NIỆM DI SẢN ── */}
        {(activeTab === 'all' || activeTab === 'merch') && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-800 text-base font-bold shadow-xs">
                  🛍️
                </span>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-title)' }}>
                    {isVie ? 'Ấn Phẩm Mỹ Thuật & Quà Lưu Niệm' : 'Cultural Publications & Heritage Merch'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isVie
                      ? 'Bộ bài Chòi gỗ truyền thống, áo thun di sản, túi canvas và các tặng phẩm thủ công'
                      : 'Wooden card decks, graphic apparel, eco totes, and handcrafted souvenirs'}
                  </p>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {merchProducts.map((prod) => {
                return (
                  <div
                    key={prod.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-[26px] bg-white border border-slate-200/80 shadow-md shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
                  >
                    {/* Image Area with Zoom Button */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 p-2">
                      <img
                        src={prod.imageSrc}
                        alt={prod.imageAlt}
                        className="h-full w-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Badge */}
                      {prod.badge && (
                        <span className="absolute top-4 left-4 rounded-full bg-amber-400 text-slate-950 px-3 py-1 text-[11px] font-extrabold shadow-sm tracking-wide">
                          {isVie ? prod.badge : prod.badgeEng}
                        </span>
                      )}

                      {/* Quick Image Preview Button */}
                      <button
                        type="button"
                        onClick={() => setLightboxState({ groupIndex: prod.publicationGroupIndex, imageIndex: 0 })}
                        title={isVie ? 'Phóng to ảnh ấn phẩm' : 'Zoom image'}
                        className="absolute bottom-4 right-4 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white p-2 backdrop-blur-xs transition shadow-md active:scale-90 cursor-pointer flex items-center gap-1 text-xs"
                      >
                        <span>🔍</span>
                        <span className="text-[11px] font-medium pr-1">{isVie ? 'Xem ảnh' : 'Preview'}</span>
                      </button>
                    </div>

                    {/* Product Details */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md inline-block mb-2">
                          {isVie ? prod.category : prod.categoryEng}
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-[#006368] transition-colors">
                          {isVie ? prod.title : prod.titleEng}
                        </h4>
                        <p className="mt-2 text-xs sm:text-[13px] text-slate-600 leading-relaxed line-clamp-3">
                          {isVie ? prod.description : prod.descriptionEng}
                        </p>
                      </div>

                      {/* Price & Purchase Button */}
                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">{isVie ? 'Giá niêm yết (Tiền / Xu)' : 'Price'}</span>
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-xl font-black text-[#006368]">
                              {prod.price.toLocaleString('vi-VN')} đ
                            </span>
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1 shadow-2xs">
                              <span>hoặc {getVndToCoins(prod.price)}</span>
                              <ChoiCoin size="xs" />
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenProductModal(prod)}
                          className="rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md active:scale-95 hover:scale-105 cursor-pointer flex items-center gap-1.5"
                          style={{ background: 'linear-gradient(135deg, #006368 0%, #084c4f 100%)' }}
                        >
                          <span>🛍️</span>
                          <span>{isVie ? 'Đặt Mua' : 'Order Now'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: ĐẶT VÉ TRỰC TUYẾN (TICKET BOOKING MODAL)
      ────────────────────────────────────────────────────────────── */}
      {selectedEventForBooking && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#c8382b] to-[#92261b] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎟️</span>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    {isVie ? 'Đặt Vé Tham Gia Bài Chòi Online' : 'Book Bài Chòi Event Ticket'}
                  </h3>
                  <p className="text-[11px] text-red-100">
                    {isVie ? 'Mã vé sẽ được tạo ngay sau khi hoàn tất đặt vé' : 'Instant digital ticket will be generated'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventForBooking(null)}
                className="text-white/80 hover:text-white rounded-full p-1.5 hover:bg-white/10 transition cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[85vh] overflow-y-auto">
              {!bookingSuccessResult ? (
                <form onSubmit={handleConfirmTicketBooking} className="space-y-4">
                  {/* Event summary banner with official ticket mockup */}
                  <div className="rounded-2xl bg-amber-50/90 border border-amber-300 overflow-hidden shadow-sm">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900/10 flex items-center justify-center p-2">
                      <img
                        src={selectedEventForBooking.image || '/assets/mock up (1).png'}
                        alt={selectedEventForBooking.title}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 text-white pointer-events-none">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 w-fit mb-1 shadow-xs">
                          {isVie ? 'Vé Tham Gia Chính Thức' : 'Official Ticket Pass'}
                        </span>
                        <h4 className="font-bold text-sm leading-tight line-clamp-1 drop-shadow-sm">
                          {selectedEventForBooking.title}
                        </h4>
                      </div>
                    </div>
                    <div className="p-3 text-xs space-y-1 bg-white/70">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                        <span>📅 {selectedEventForBooking.eventDate}</span>
                        <span>📍 {selectedEventForBooking.location}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-amber-200/80">
                        <span className="text-slate-600">{isVie ? 'Đơn giá vé:' : 'Ticket Price:'}</span>
                        <span className="font-bold text-[#c8382b] text-sm">
                          {selectedEventForBooking.ticketPrice.toLocaleString('vi-VN')} đ / vé
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Số lượng vé</span>
                      <span className="text-[11px] text-slate-500">
                        (Còn lại {Math.max(0, selectedEventForBooking.totalTickets - selectedEventForBooking.soldTickets)} vé)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTicketQty((prev) => Math.max(1, prev - 1))}
                        disabled={ticketQty <= 1}
                        className="h-8 w-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-black text-base w-6 text-center">{ticketQty}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const maxLeft = selectedEventForBooking.totalTickets - selectedEventForBooking.soldTickets
                          setTicketQty((prev) => Math.min(maxLeft, prev + 1))
                        }}
                        disabled={ticketQty >= (selectedEventForBooking.totalTickets - selectedEventForBooking.soldTickets)}
                        className="h-8 w-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total calculation */}
                  <div className="flex items-center justify-between text-xs font-bold px-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                    <div>
                      <span className="text-slate-800 block text-xs">Tổng thanh toán:</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {ticketBuyMethod === 'coin'
                          ? `Tương đương ${(selectedEventForBooking.ticketPrice * ticketQty).toLocaleString('vi-VN')} đ`
                          : `Quy đổi: ${getVndToCoins(selectedEventForBooking.ticketPrice * ticketQty)} Xu`}
                      </span>
                    </div>
                    {ticketBuyMethod === 'coin' ? (
                      <div className="flex items-center gap-1.5 text-lg text-amber-700 font-black">
                        <span>{getVndToCoins(selectedEventForBooking.ticketPrice * ticketQty)}</span>
                        <ChoiCoin size="md" />
                      </div>
                    ) : (
                      <span className="text-lg text-[#c8382b] font-black">
                        {(selectedEventForBooking.ticketPrice * ticketQty).toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>

                  {/* Customer Information Inputs */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Họ và tên người nhận vé <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ticketBuyerName}
                        onChange={(e) => setTicketBuyerName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn An"
                        required
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Số điện thoại nhận vé <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={ticketBuyerPhone}
                        onChange={(e) => setTicketBuyerPhone(e.target.value)}
                        placeholder="Ví dụ: 0912 345 678"
                        required
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Email nhận vé điện tử (không bắt buộc)
                      </label>
                      <input
                        type="email"
                        value={ticketBuyerEmail}
                        onChange={(e) => setTicketBuyerEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Địa chỉ nhận vé & hộp quà tận nhà <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={ticketShippingAddress}
                        onChange={(e) => setTicketShippingAddress(e.target.value)}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                        required
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Ghi chú giao vé (không bắt buộc)
                      </label>
                      <input
                        type="text"
                        value={ticketShippingNote}
                        onChange={(e) => setTicketShippingNote(e.target.value)}
                        placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Delivery Mode Banner - Exclusively Home Delivery */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Hình thức nhận vé & quà
                    </label>
                    <div className="flex items-center gap-3 p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50/80 text-emerald-950">
                      <span className="text-2xl">🏠</span>
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>Giao Vé & Hộp Quà Tận Nhà (Toàn Quốc)</span>
                          <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.2 rounded-full uppercase">
                            Duy Nhất
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          Trọn bộ vé in ấn chính thức kèm Hộp quà pop-up di sản 3D sẽ được bưu tá chuyển phát tới tận cửa nhà bạn.
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
                            name="sectionTicketBuyMethod"
                            checked={ticketBuyMethod === 'money'}
                            onChange={() => setTicketBuyMethod('money')}
                            className="accent-[#c8382b] h-4 w-4"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          Thanh toán tiền mặt (COD) khi bưu tá giao vé & hộp quà tận nơi.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#c8382b]">
                          <span>{(selectedEventForBooking.ticketPrice * ticketQty).toLocaleString('vi-VN')} đ</span>
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
                            name="sectionTicketBuyMethod"
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
                            <span>{getVndToCoins(selectedEventForBooking.ticketPrice * ticketQty)}</span>
                            <ChoiCoin size="xs" />
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Trừ ví Xu</span>
                        </div>
                      </div>
                    </div>

                    {/* Hộp thông tin trạng thái Xu */}
                    {ticketBuyMethod === 'coin' && (
                      <div className="mt-1">
                        {!currentUser ? (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                            <span>⚠️ Vui lòng đăng nhập để thanh toán bằng Xu.</span>
                            {onOpenAuth && (
                              <button
                                type="button"
                                onClick={() => onOpenAuth('login')}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 cursor-pointer"
                              >
                                Đăng nhập
                              </button>
                            )}
                          </div>
                        ) : (currentUser.coins || 0) < getVndToCoins(selectedEventForBooking.ticketPrice * ticketQty) ? (
                          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold block">⚠️ Số dư ví Xu không đủ:</span>
                              <span className="text-[11px]">
                                Bạn có {currentUser.coins || 0} Xu (cần {getVndToCoins(selectedEventForBooking.ticketPrice * ticketQty)} Xu).
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
                            <span>✓ Số dư ví: <strong>{currentUser.coins} Xu</strong></span>
                            <span className="text-[11px] text-emerald-700 font-medium">
                              Còn lại sau mua: {(currentUser.coins || 0) - getVndToCoins(selectedEventForBooking.ticketPrice * ticketQty)} Xu
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {bookingError && (
                    <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700 font-medium border border-red-200">
                      ⚠️ {bookingError}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedEventForBooking(null)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type={ticketBuyMethod === 'coin' && !currentUser ? 'button' : 'submit'}
                      onClick={() => {
                        if (ticketBuyMethod === 'coin' && !currentUser) {
                          onOpenAuth?.('login')
                        }
                      }}
                      disabled={bookingLoading}
                      className="rounded-xl bg-gradient-to-r from-[#c8382b] to-[#92261b] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:scale-102 active:scale-98 transition disabled:opacity-60 cursor-pointer"
                    >
                      {bookingLoading
                        ? 'Đang xuất vé...'
                        : ticketBuyMethod === 'coin'
                        ? `Xác Nhận Đổi ${getVndToCoins(selectedEventForBooking.ticketPrice * ticketQty)} Xu Lấy Vé`
                        : `Xác Nhận Đặt Vé & Thanh Toán COD (${(selectedEventForBooking.ticketPrice * ticketQty).toLocaleString('vi-VN')} đ)`}
                    </button>
                  </div>
                </form>
              ) : (
                /* SUCCESS TICKET PASS SCREEN */
                <div className="space-y-5 text-center py-2 animate-fade-in">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Đặt Vé & Hộp Quà Thành Công!</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vé và quà tặng pop-up 3D đã được ghi nhận và chuẩn bị chuyển phát tận nhà quý khách.
                    </p>
                  </div>

                  {/* Visual Preview: Ticket + Pop-up Gift Box */}
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950 p-2">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center p-1">
                      <img
                        src="/assets/mock up (1).png"
                        alt="Vé Bài Chòi"
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/70 text-amber-300 px-2 py-0.5 rounded backdrop-blur-xs">
                        🎫 Phôi Vé Di Sản
                      </span>
                    </div>
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center p-1">
                      <img
                        src="/assets/hopdungve-popup.png"
                        alt="Hộp đựng vé pop-up"
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/70 text-amber-300 px-2 py-0.5 rounded backdrop-blur-xs">
                        🎁 Hộp Pop-up 3D
                      </span>
                    </div>
                  </div>

                  {/* Digital Ticket Pass Card */}
                  <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 overflow-hidden text-left shadow-md">
                    <div className="p-4">
                      <div className="flex items-center justify-between border-b border-amber-200/80 pb-2 mb-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                            {isVie ? 'Trọn Bộ Vé & Hộp Quà Di Sản' : 'Festival Pass & Heritage Box'}
                          </span>
                          <h5 className="font-bold text-sm text-slate-900">{bookingSuccessResult.eventTitle}</h5>
                        </div>
                        <span className="text-2xl">🎴</span>
                      </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Người đặt:</span>
                        <span className="font-bold text-slate-800">{ticketBuyerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Số điện thoại:</span>
                        <span className="font-bold text-slate-800">{ticketBuyerPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Địa chỉ giao tận nhà:</span>
                        <span className="font-bold text-slate-800 text-right max-w-[65%]">{bookingSuccessResult.shippingAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Hình thức nhận:</span>
                        <span className="font-bold text-emerald-800">🏠 Nhận tại nhà (Toàn quốc)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Phương thức:</span>
                        {bookingSuccessResult.payMethod === 'coin' ? (
                          <span className="font-black text-amber-800 flex items-center gap-1">
                            <span>🪙 Đã trừ {bookingSuccessResult.coinsPaid}</span>
                            <ChoiCoin size="xs" />
                          </span>
                        ) : (
                          <span className="font-bold text-[#c8382b]">💵 Thanh toán COD khi nhận vé</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tổng thanh toán:</span>
                        {bookingSuccessResult.payMethod === 'coin' ? (
                          <span className="font-black text-amber-700 flex items-center gap-1">
                            <span>{bookingSuccessResult.coinsPaid}</span>
                            <ChoiCoin size="xs" />
                          </span>
                        ) : (
                          <span className="font-black text-[#c8382b]">{bookingSuccessResult.totalAmount.toLocaleString('vi-VN')} đ</span>
                        )}
                      </div>
                    </div>

                    {/* Generated Ticket Codes List */}
                    <div className="mt-4 pt-3 border-t border-amber-200/80">
                      <span className="text-xs font-bold text-slate-900 block mb-2">
                        Mã vé định danh ({bookingSuccessResult.tickets.length} vé):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {bookingSuccessResult.tickets.map((t) => (
                          <div
                            key={t.ticketCode}
                            className="flex items-center justify-between rounded-xl bg-white border border-amber-300/80 px-3 py-2 shadow-xs"
                          >
                            <div>
                              <span className="text-[10px] text-slate-400 block">MÃ SOÁT VÉ</span>
                              <span className="font-mono text-sm font-black text-red-700 tracking-wider">
                                {t.ticketCode}
                              </span>
                            </div>
                            <span className="text-lg" title="Mã hợp lệ để soát vé">🎫</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Instruction Note */}
                    <div className="mt-4 flex items-center gap-3 bg-white/80 rounded-xl p-3 border border-amber-200">
                      <div className="h-10 w-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center shrink-0 text-xl font-bold">
                        🚚
                      </div>
                      <div className="text-[11px] text-slate-600 leading-tight">
                        <p className="font-bold text-slate-900">Quy trình giao nhận tận nhà:</p>
                        <p>Đơn hàng vé & hộp quà của bạn đang được đóng gói cẩn thận. Bưu tá sẽ liên hệ số điện thoại của bạn để giao tận nhà trong 2 - 3 ngày tới.</p>
                      </div>
                    </div>
                  </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedEventForBooking(null)}
                    className="w-full rounded-xl bg-[#006368] py-3 text-xs font-bold text-white hover:bg-[#004b4f] transition shadow-md cursor-pointer"
                  >
                    Hoàn Tất & Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: ĐẶT MUA ẤN PHẨM & QUÀ TẶNG (PRODUCT PURCHASE MODAL)
      ────────────────────────────────────────────────────────────── */}
      {selectedProductForBuy && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#006368] to-[#0d7f85] px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛍️</span>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">
                    {isVie ? 'Đặt Mua Ấn Phẩm Di Sản' : 'Order Heritage Merchandise'}
                  </h3>
                  <p className="text-[11px] text-teal-100">
                    {isVie ? 'Giao hàng tận nơi toàn quốc · Đồng kiểm khi nhận hàng' : 'Nationwide delivery with cash-on-delivery inspection'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForBuy(null)}
                className="text-white/80 hover:text-white rounded-full p-1.5 hover:bg-white/10 transition cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[85vh] overflow-y-auto">
              {!prodSuccessResult ? (
                <form onSubmit={handleConfirmProductOrder} className="space-y-4">
                  {/* Product Summary */}
                  <div className="flex gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200">
                    <img
                      src={selectedProductForBuy.imageSrc}
                      alt={selectedProductForBuy.imageAlt}
                      className="h-16 w-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-teal-700 uppercase">
                        {isVie ? selectedProductForBuy.category : selectedProductForBuy.categoryEng}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {isVie ? selectedProductForBuy.title : selectedProductForBuy.titleEng}
                      </h4>
                      <span className="font-black text-sm text-[#006368] mt-1 block">
                        {selectedProductForBuy.price.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>

                  {/* Size selection if clothing */}
                  {selectedProductForBuy.hasSize && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Kích thước (Size áo)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {['S', 'M', 'L', 'XL'].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => setProdSize(s)}
                            className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                              prodSize === s
                                ? 'border-[#006368] bg-[#006368] text-white shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            Size {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity selector */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <span className="text-xs font-bold text-slate-800">Số lượng đặt mua</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setProdQty((prev) => Math.max(1, prev - 1))}
                        disabled={prodQty <= 1}
                        className="h-8 w-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-black text-base w-6 text-center">{prodQty}</span>
                      <button
                        type="button"
                        onClick={() => setProdQty((prev) => prev + 1)}
                        className="h-8 w-8 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total calculation */}
                  <div className="flex items-center justify-between text-xs font-bold px-1 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                    <div>
                      <span className="text-slate-800 block text-xs">Tổng thanh toán:</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {prodBuyMethod === 'coin'
                          ? `Tương đương ${(selectedProductForBuy.price * prodQty).toLocaleString('vi-VN')} đ`
                          : `Quy đổi: ${getVndToCoins(selectedProductForBuy.price * prodQty)} Xu`}
                      </span>
                    </div>
                    {prodBuyMethod === 'coin' ? (
                      <div className="flex items-center gap-1.5 text-lg text-amber-700 font-black">
                        <span>{getVndToCoins(selectedProductForBuy.price * prodQty)}</span>
                        <ChoiCoin size="md" />
                      </div>
                    ) : (
                      <span className="text-lg text-[#006368] font-black">
                        {(selectedProductForBuy.price * prodQty).toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>

                  {/* Shipping Inputs */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Họ và tên người nhận <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={prodBuyerName}
                        onChange={(e) => setProdBuyerName(e.target.value)}
                        placeholder="Ví dụ: Lê Thị Hoa"
                        required
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Số điện thoại nhận hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={prodBuyerPhone}
                        onChange={(e) => setProdBuyerPhone(e.target.value)}
                        placeholder="Ví dụ: 0905 123 456"
                        required
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Địa chỉ nhận hàng chi tiết <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={prodAddress}
                        onChange={(e) => setProdAddress(e.target.value)}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                        required
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Ghi chú cho đơn hàng (không bắt buộc)
                      </label>
                      <input
                        type="text"
                        value={prodNote}
                        onChange={(e) => setProdNote(e.target.value)}
                        placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi đến"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-teal-600 focus:outline-none"
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
                            ? 'border-[#006368] bg-teal-50/50 shadow-xs'
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
                            name="sectionProdBuyMethod"
                            checked={prodBuyMethod === 'money'}
                            onChange={() => setProdBuyMethod('money')}
                            className="accent-[#006368] h-4 w-4"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          Thanh toán khi nhận hàng (COD). Đồng kiểm trước khi trả tiền.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#006368]">
                          <span>{(selectedProductForBuy.price * prodQty).toLocaleString('vi-VN')} đ</span>
                          <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">COD tận nơi</span>
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
                            name="sectionProdBuyMethod"
                            checked={prodBuyMethod === 'coin'}
                            onChange={() => setProdBuyMethod('coin')}
                            className="accent-amber-500 h-4 w-4"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          Trừ trực tiếp số dư ví ChoiCoin. Bưu tá giao tận nơi miễn phí thu hộ.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                          <span className="flex items-center gap-1">
                            <span>{getVndToCoins(selectedProductForBuy.price * prodQty)}</span>
                            <ChoiCoin size="xs" />
                          </span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Trừ ví Xu</span>
                        </div>
                      </div>
                    </div>

                    {/* Hộp thông tin trạng thái Xu */}
                    {prodBuyMethod === 'coin' && (
                      <div className="mt-1">
                        {!currentUser ? (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                            <span>⚠️ Vui lòng đăng nhập để thanh toán bằng Xu.</span>
                            {onOpenAuth && (
                              <button
                                type="button"
                                onClick={() => onOpenAuth('login')}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 cursor-pointer"
                              >
                                Đăng nhập
                              </button>
                            )}
                          </div>
                        ) : (currentUser.coins || 0) < getVndToCoins(selectedProductForBuy.price * prodQty) ? (
                          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold block">⚠️ Số dư ví Xu không đủ:</span>
                              <span className="text-[11px]">
                                Bạn có {currentUser.coins || 0} Xu (cần {getVndToCoins(selectedProductForBuy.price * prodQty)} Xu).
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
                            <span>✓ Số dư ví: <strong>{currentUser.coins} Xu</strong></span>
                            <span className="text-[11px] text-emerald-700 font-medium">
                              Còn lại sau mua: {(currentUser.coins || 0) - getVndToCoins(selectedProductForBuy.price * prodQty)} Xu
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {prodError && (
                    <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700 font-medium border border-red-200">
                      ⚠️ {prodError}
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedProductForBuy(null)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type={prodBuyMethod === 'coin' && !currentUser ? 'button' : 'submit'}
                      onClick={() => {
                        if (prodBuyMethod === 'coin' && !currentUser) {
                          onOpenAuth?.('login')
                        }
                      }}
                      disabled={prodLoading}
                      className="rounded-xl bg-gradient-to-r from-[#006368] to-[#084c4f] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:scale-102 active:scale-98 transition disabled:opacity-60 cursor-pointer"
                    >
                      {prodLoading
                        ? 'Đang tạo đơn...'
                        : prodBuyMethod === 'coin'
                        ? `Xác Nhận Đổi ${getVndToCoins(selectedProductForBuy.price * prodQty)} Xu Lấy Ấn Phẩm`
                        : `Xác Nhận Đặt Mua (COD ${(selectedProductForBuy.price * prodQty).toLocaleString('vi-VN')} đ)`}
                    </button>
                  </div>
                </form>
              ) : (
                /* SUCCESS PRODUCT ORDER SCREEN */
                <div className="space-y-5 text-center py-2 animate-fade-in">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900">Đặt Hàng Thành Công!</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Đơn hàng đã được chuyển đến bộ phận đóng gói và vận chuyển.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between border-b pb-2 mb-2">
                      <span className="text-slate-500">Mã đơn hàng:</span>
                      <span className="font-mono font-bold text-amber-600 text-sm">{prodSuccessResult.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sản phẩm:</span>
                      <span className="font-bold text-slate-800 text-right">{prodSuccessResult.productTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Người nhận:</span>
                      <span className="font-bold text-slate-800">{prodBuyerName} (📞 {prodBuyerPhone})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Địa chỉ giao:</span>
                      <span className="font-medium text-slate-700 text-right max-w-[240px] truncate">{prodSuccessResult.address}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Phương thức:</span>
                      {prodSuccessResult.payMethod === 'coin' ? (
                        <span className="font-black text-amber-800 flex items-center gap-1">
                          <span>🪙 Đã trừ {prodSuccessResult.coinsPaid}</span>
                          <ChoiCoin size="xs" />
                        </span>
                      ) : (
                        <span className="font-bold text-[#006368]">💵 COD khi nhận hàng</span>
                      )}
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-slate-600 font-bold">Tổng thanh toán:</span>
                      {prodSuccessResult.payMethod === 'coin' ? (
                        <span className="text-base font-black text-amber-700 flex items-center gap-1">
                          <span>{prodSuccessResult.coinsPaid}</span>
                          <ChoiCoin size="xs" />
                        </span>
                      ) : (
                        <span className="text-base font-black text-[#006368]">
                          {prodSuccessResult.totalAmount.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-[11px] text-amber-900 leading-relaxed text-left">
                    💡 Chúng tôi sẽ liên hệ qua số điện thoại <strong>{prodBuyerPhone}</strong> để xác nhận thời gian giao hàng. Dự kiến nhận hàng từ 2–3 ngày làm việc.
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProductForBuy(null)}
                    className="w-full rounded-xl bg-[#006368] py-3 text-xs font-bold text-white hover:bg-[#004b4f] transition shadow-md cursor-pointer"
                  >
                    Hoàn Tất & Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          LIGHTBOX IMAGE PREVIEW (PRESERVED FOR FULL-RES ARTWORK MOCKUPS)
      ────────────────────────────────────────────────────────────── */}
      {lightboxState !== null && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[92vh] max-w-4xl flex flex-col items-center">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setLightboxState(null)}
              className="absolute -top-12 right-0 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition text-sm cursor-pointer"
            >
              ✕ Đóng
            </button>

            {/* Current Image */}
            <div className="relative overflow-hidden rounded-2xl bg-white/95 p-2 shadow-2xl">
              <img
                src={PUBLICATION_GROUPS[lightboxState.groupIndex].images[lightboxState.imageIndex]?.src}
                alt={PUBLICATION_GROUPS[lightboxState.groupIndex].images[lightboxState.imageIndex]?.alt}
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>

            {/* Caption */}
            <div className="mt-3 text-center text-white text-xs sm:text-sm">
              <p className="font-semibold">
                {PUBLICATION_GROUPS[lightboxState.groupIndex].images[lightboxState.imageIndex]?.alt}
              </p>
              <p className="text-white/60 text-[11px] mt-0.5">
                Ảnh {lightboxState.imageIndex + 1} / {PUBLICATION_GROUPS[lightboxState.groupIndex].images.length}
              </p>
            </div>

            {/* Thumbnails strip if multiple images */}
            {PUBLICATION_GROUPS[lightboxState.groupIndex].images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto p-1">
                {PUBLICATION_GROUPS[lightboxState.groupIndex].images.map((img, idx) => (
                  <button
                    type="button"
                    key={img.src}
                    onClick={() => setLightboxState({ groupIndex: lightboxState.groupIndex, imageIndex: idx })}
                    className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                      idx === lightboxState.imageIndex ? 'border-amber-400 scale-105' : 'border-white/40 opacity-70'
                    }`}
                  >
                    <img src={img.src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* TICKET LIGHTBOX PREVIEW */}
      {ticketLightboxImg && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md cursor-zoom-out"
          onClick={() => setTicketLightboxImg(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl text-center cursor-default" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setTicketLightboxImg(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-300 text-sm cursor-pointer font-bold flex items-center gap-1"
            >
              ✕ {isVie ? 'Đóng' : 'Close'}
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-300/40 bg-white">
              <img
                src={ticketLightboxImg}
                alt="Vé sự kiện Bài Chòi chính thức"
                className="max-h-[78vh] w-auto mx-auto object-contain"
              />
            </div>
            <p className="text-white text-xs mt-3 font-semibold flex items-center justify-center gap-2">
              <span>🎟️</span> {isVie ? 'Mẫu vé tham gia chính thức — Hội Bài Chòi Di Sản Dân Gian' : 'Official Festival Ticket Pass — Bài Chòi Heritage'}
            </p>
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
