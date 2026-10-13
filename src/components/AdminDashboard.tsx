import { useState, useEffect, useRef, useMemo } from 'react'
import type { UserProfile } from '../types/auth'
import { eventTicketService, type EventItem } from '../lib/eventTicketService'
import { orderService, type OrderItem } from '../lib/orderService'
import { publicationService, type PublicationRecord } from '../lib/publicationService'
import { CARDS, type Card } from '../BaiChoiGame'
import { getChantLyrics } from '../chantLyrics'

interface AdminDashboardProps {
  currentUser: UserProfile
  onBackToSite: () => void
  onLogout: () => void
}

export default function AdminDashboard({
  currentUser,
  onBackToSite,
  onLogout,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<'overview' | 'events' | 'publications' | 'orders' | 'users' | 'chants'>('events')
  const [events, setEvents] = useState<EventItem[]>(() => eventTicketService.getAllEvents())
  const [deletedEvents, setDeletedEvents] = useState<EventItem[]>(() => eventTicketService.getDeletedEvents())
  const [publications, setPublications] = useState<PublicationRecord[]>(() => publicationService.getAllPublications())
  const [deletedPubs, setDeletedPubs] = useState<PublicationRecord[]>(() => publicationService.getDeletedPublications())
  const [orders, setOrders] = useState<OrderItem[]>(() => orderService.getOrders())

  // Bộ lọc danh mục theo trạng thái hoạt động (Tất cả / Đang hoạt động / Đã ngưng hoạt động)
  const [eventFilter, setEventFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [pubFilter, setPubFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Phân loại Sự kiện: Đang hoạt động vs Đã ngưng hoạt động
  const activeEvents = events.filter((e) => !e.isDeleted && (e.status === 'online_sale' || e.status === 'offline_sale'))
  const inactiveEvents = events.filter((e) => e.isDeleted || e.status === 'ended' || e.status === 'closed_online')

  // Phân loại Ấn phẩm: Đang kinh doanh vs Đã ngưng hoạt động
  const activePubs = publications.filter((p) => !p.isDeleted)
  const inactivePubs = publications.filter((p) => Boolean(p.isDeleted))

  // Trạng thái mở modal Thùng rác và Hộp thoại xác nhận xóa
  const [showEventTrashModal, setShowEventTrashModal] = useState(false)
  const [showPubTrashModal, setShowPubTrashModal] = useState(false)
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{
    type: 'event' | 'publication' | 'all_events_trash' | 'all_pubs_trash'
    id: string
    title: string
    image?: string
    subInfo?: string
    isPermanent?: boolean
  } | null>(null)
  const [toast, setToast] = useState<{ message: string; undoAction?: () => void } | null>(null)

  // Tự động tắt Toast thông báo sau 8 giây
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 8000)
    return () => clearTimeout(timer)
  }, [toast])

  // Đồng bộ sự kiện, đơn hàng và ấn phẩm từ Supabase / localStorage
  useEffect(() => {
    publicationService.syncFromSupabase()
    orderService.syncFromSupabase()
    eventTicketService.syncFromSupabase()

    const unsubEvents = eventTicketService.subscribe(() => {
      setEvents(eventTicketService.getAllEvents())
      setDeletedEvents(eventTicketService.getDeletedEvents())
    })
    const unsubOrders = orderService.subscribe(() => {
      setOrders(orderService.getOrders())
    })
    const unsubPubs = publicationService.subscribe(() => {
      setPublications(publicationService.getAllPublications())
      setDeletedPubs(publicationService.getDeletedPublications())
    })
    return () => {
      unsubEvents()
      unsubOrders()
      unsubPubs()
    }
  }, [])

  // Modal Thêm / Chỉnh Sửa Sự Kiện (Hỗ trợ đa ảnh không giới hạn cho Slider)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [eventTitle, setEventTitle] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventPrice, setEventPrice] = useState('50000')
  const [eventTotalTickets, setEventTotalTickets] = useState('100')
  const [eventStatus, setEventStatus] = useState<EventItem['status']>('online_sale')
  const [eventDescription, setEventDescription] = useState('')
  const [eventImages, setEventImages] = useState<string[]>([])
  const [eventNewImageUrl, setEventNewImageUrl] = useState('')
  const [eventUploadLoading, setEventUploadLoading] = useState(false)
  const eventFileInputRef = useRef<HTMLInputElement>(null)

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.totalAmount : 0), 0)
  const totalTicketsSold = events.reduce((sum, e) => sum + e.soldTickets, 0)

  // Mở modal thêm mới sự kiện
  const handleOpenAddEvent = () => {
    setEditingEvent(null)
    setEventTitle('')
    setEventLocation('')
    setEventDate('2026-05-15 19:30')
    setEventPrice('50000')
    setEventTotalTickets('100')
    setEventStatus('online_sale')
    setEventDescription('')
    setEventImages([
      '/assets/mock up (1).png',
      '/assets/hopdungve-popup.png',
    ])
    setEventNewImageUrl('')
    setShowEventModal(true)
  }

  // Mở modal chỉnh sửa sự kiện
  const handleOpenEditEvent = (item: EventItem) => {
    setEditingEvent(item)
    setEventTitle(item.title)
    setEventLocation(item.location)
    setEventDate(item.eventDate)
    setEventPrice(item.ticketPrice.toString())
    setEventTotalTickets(item.totalTickets.toString())
    setEventStatus(item.status)
    setEventDescription(item.description || '')
    const imgs = item.images && item.images.length > 0
      ? [...item.images]
      : [item.image || '/assets/mock up (1).png', '/assets/hopdungve-popup.png']
    setEventImages(imgs)
    setEventNewImageUrl('')
    setShowEventModal(true)
  }

  // Xử lý upload ảnh sự kiện trực tiếp từ máy tính (chọn 1 hoặc nhiều ảnh)
  const handleEventImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setEventUploadLoading(true)
    const fileList = Array.from(files)
    let processed = 0
    const newImgs: string[] = []

    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        processed++
        if (processed === fileList.length) setEventUploadLoading(false)
        return
      }

      const reader = new FileReader()
      reader.onload = (readerEvent) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 900
          const MAX_HEIGHT = 900
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width)
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height)
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85)
            newImgs.push(dataUrl)
          } else {
            newImgs.push(readerEvent.target?.result as string)
          }

          processed++
          if (processed === fileList.length) {
            setEventImages((prev) => [...prev, ...newImgs])
            setEventUploadLoading(false)
          }
        }
        img.src = readerEvent.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  // Thêm ảnh từ URL thủ công
  const handleAddImageUrl = () => {
    if (!eventNewImageUrl.trim()) return
    setEventImages((prev) => [...prev, eventNewImageUrl.trim()])
    setEventNewImageUrl('')
  }

  // Xóa ảnh khỏi danh sách
  const handleRemoveImage = (index: number) => {
    setEventImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Đặt làm ảnh bìa chính (đưa lên vị trí đầu tiên)
  const handleSetMainImage = (index: number) => {
    if (index === 0) return
    setEventImages((prev) => {
      const copy = [...prev]
      const [item] = copy.splice(index, 1)
      return [item, ...copy]
    })
  }

  // Lưu sự kiện (Tạo mới hoặc Cập nhật)
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventTitle.trim() || !eventLocation.trim()) return

    const finalImages = eventImages.length > 0
      ? eventImages
      : ['/assets/mock up (1).png', '/assets/hopdungve-popup.png']

    if (editingEvent) {
      eventTicketService.updateEvent(editingEvent.id, {
        title: eventTitle.trim(),
        location: eventLocation.trim(),
        eventDate: eventDate.trim() || '2026-05-15 19:30',
        totalTickets: Number(eventTotalTickets) || 100,
        ticketPrice: Number(eventPrice) || 50000,
        status: eventStatus,
        description: eventDescription.trim(),
        images: finalImages,
        image: finalImages[0],
      })
    } else {
      eventTicketService.addEvent({
        title: eventTitle.trim(),
        location: eventLocation.trim(),
        eventDate: eventDate.trim() || '2026-05-15 19:30',
        saleEndDate: '2026-04-30 23:59',
        totalTickets: Number(eventTotalTickets) || 100,
        ticketPrice: Number(eventPrice) || 50000,
        status: eventStatus,
        description: eventDescription.trim(),
        images: finalImages,
        image: finalImages[0],
      })
    }

    setShowEventModal(false)
  }

  // Mở hộp thoại xác nhận chuyển sự kiện vào thùng rác (xóa mềm)
  const handlePromptDeleteEvent = (item: EventItem) => {
    setConfirmDeleteTarget({
      type: 'event',
      id: item.id,
      title: item.title,
      image: item.images?.[0] || item.image,
      subInfo: `Diễn ra: ${item.eventDate} • ${item.location}`,
      isPermanent: false,
    })
  }

  // Mở hộp thoại xác nhận xóa vĩnh viễn sự kiện (trong thùng rác)
  const handlePromptPermanentDeleteEvent = (item: EventItem) => {
    setConfirmDeleteTarget({
      type: 'event',
      id: item.id,
      title: item.title,
      image: item.images?.[0] || item.image,
      subInfo: `Xóa vĩnh viễn khỏi máy chủ và cơ sở dữ liệu`,
      isPermanent: true,
    })
  }

  // Khôi phục sự kiện từ thùng rác
  const handleRestoreEvent = (id: string, title: string) => {
    eventTicketService.restoreEvent(id)
    setToast({ message: `✅ Đã khôi phục thành công sự kiện "${title}"!` })
  }

  // Khôi phục toàn bộ sự kiện
  const handleRestoreAllEvents = () => {
    eventTicketService.restoreAllEvents()
    setToast({ message: `✅ Đã khôi phục toàn bộ sự kiện từ Thùng rác!` })
  }

  // Dọn sạch thùng rác sự kiện (Mở modal xác nhận đẹp mắt)
  const handlePromptEmptyEventTrash = () => {
    setConfirmDeleteTarget({
      type: 'all_events_trash',
      id: 'all_events',
      title: 'Dọn sạch toàn bộ Thùng rác Sự kiện',
      subInfo: `Sẽ xóa vĩnh viễn toàn bộ ${deletedEvents.length} sự kiện trong thùng rác`,
      isPermanent: true,
    })
  }

  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderItem['status']) => {
    orderService.updateOrderStatus(orderId, nextStatus)
  }

  // Modal Thêm / Chỉnh Sửa Ấn Phẩm
  const [showPubModal, setShowPubModal] = useState(false)
  const [editingPub, setEditingPub] = useState<PublicationRecord | null>(null)
  const [pubName, setPubName] = useState('')
  const [pubCategory, setPubCategory] = useState('Bộ Thẻ Bài')
  const [pubPrice, setPubPrice] = useState('290000')
  const [pubStock, setPubStock] = useState('30')
  const [pubImageUrl, setPubImageUrl] = useState('/assets/thedungbai.jpg')
  const [pubDescription, setPubDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  // Xử lý upload ảnh trực tiếp từ máy tính người dùng
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file hình ảnh (JPG, PNG, WebP, GIF...)')
      return
    }

    setUploadLoading(true)
    const reader = new FileReader()
    reader.onload = (readerEvent) => {
      const img = new Image()
      img.onload = () => {
        // Tối ưu hóa kích thước ảnh (nén canvas max 900px)
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 900
        const MAX_HEIGHT = 900
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height)
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85)
          setPubImageUrl(dataUrl)
        } else {
          setPubImageUrl(readerEvent.target?.result as string)
        }
        setUploadLoading(false)
      }
      img.src = readerEvent.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleOpenAddPub = () => {
    setEditingPub(null)
    setPubName('')
    setPubCategory('Bộ Thẻ Bài')
    setPubPrice('200000')
    setPubStock('30')
    setPubImageUrl('/assets/thedungbai.jpg')
    setPubDescription('')
    setShowPubModal(true)
  }

  const handleOpenEditPub = (item: PublicationRecord) => {
    setEditingPub(item)
    setPubName(item.name)
    setPubCategory(item.category)
    setPubPrice(item.price.toString())
    setPubStock(item.stock.toString())
    setPubImageUrl(item.imageUrl)
    setPubDescription(item.description)
    setShowPubModal(true)
  }

  const handleSavePub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pubName.trim()) return

    if (editingPub) {
      await publicationService.updatePublication(editingPub.id, {
        name: pubName.trim(),
        category: pubCategory,
        price: Number(pubPrice) || 0,
        stock: Number(pubStock) || 0,
        imageUrl: pubImageUrl,
        description: pubDescription.trim(),
      })
    } else {
      await publicationService.addPublication({
        name: pubName.trim(),
        category: pubCategory,
        price: Number(pubPrice) || 0,
        stock: Number(pubStock) || 0,
        imageUrl: pubImageUrl,
        description: pubDescription.trim(),
      })
    }
    setShowPubModal(false)
  }

  // Mở hộp thoại xác nhận chuyển ấn phẩm vào thùng rác
  const handlePromptDeletePub = (item: PublicationRecord) => {
    setConfirmDeleteTarget({
      type: 'publication',
      id: item.id,
      title: item.name,
      image: item.imageUrl,
      subInfo: `${item.category} • ${Number(item.price).toLocaleString('vi-VN')} đ`,
      isPermanent: false,
    })
  }

  // Mở hộp thoại xác nhận xóa vĩnh viễn ấn phẩm (trong thùng rác)
  const handlePromptPermanentDeletePub = (item: PublicationRecord) => {
    setConfirmDeleteTarget({
      type: 'publication',
      id: item.id,
      title: item.name,
      image: item.imageUrl,
      subInfo: `Xóa vĩnh viễn khỏi máy chủ và cơ sở dữ liệu`,
      isPermanent: true,
    })
  }

  // Khôi phục ấn phẩm từ thùng rác
  const handleRestorePub = async (id: string, name: string) => {
    await publicationService.restorePublication(id)
    setToast({ message: `✅ Đã khôi phục thành công ấn phẩm "${name}"!` })
  }

  // Khôi phục toàn bộ ấn phẩm
  const handleRestoreAllPubs = async () => {
    const deleted = publicationService.getDeletedPublications()
    for (const p of deleted) {
      await publicationService.restorePublication(p.id)
    }
    setToast({ message: `✅ Đã khôi phục toàn bộ ấn phẩm từ Thùng rác!` })
  }

  // Dọn sạch thùng rác ấn phẩm (Mở modal xác nhận đẹp mắt)
  const handlePromptEmptyPubTrash = () => {
    setConfirmDeleteTarget({
      type: 'all_pubs_trash',
      id: 'all_pubs',
      title: 'Dọn sạch toàn bộ Thùng rác Ấn phẩm',
      subInfo: `Sẽ xóa vĩnh viễn toàn bộ ${deletedPubs.length} ấn phẩm trong thùng rác`,
      isPermanent: true,
    })
  }

  // THỰC THI XÓA SAU KHI XÁC NHẬN TRONG CUSTOM CONFIRM MODAL
  const handleExecuteDelete = async () => {
    if (!confirmDeleteTarget) return
    const { type, id, title, isPermanent } = confirmDeleteTarget
    setConfirmDeleteTarget(null)

    if (type === 'all_events_trash') {
      eventTicketService.emptyTrash()
      setToast({ message: '🧹 Đã dọn sạch toàn bộ Thùng rác sự kiện.' })
      return
    }

    if (type === 'all_pubs_trash') {
      await publicationService.emptyTrash()
      setToast({ message: '🧹 Đã dọn sạch toàn bộ Thùng rác ấn phẩm.' })
      return
    }

    if (type === 'event') {
      if (isPermanent) {
        eventTicketService.deleteEventPermanently(id)
        setToast({ message: `🗑️ Đã xóa vĩnh viễn sự kiện "${title}"` })
      } else {
        eventTicketService.softDeleteEvent(id)
        setToast({
          message: `⏸️ Đã chuyển sự kiện "${title}" xuống mục Đã ngưng hoạt động (Tạm ẩn khỏi Website)`,
          undoAction: () => {
            eventTicketService.restoreEvent(id)
            setToast({ message: `✅ Đã kích hoạt lại sự kiện "${title}"` })
          },
        })
      }
    } else {
      if (isPermanent) {
        await publicationService.deletePublicationPermanently(id)
        setToast({ message: `🗑️ Đã xóa vĩnh viễn ấn phẩm "${title}"` })
      } else {
        await publicationService.softDeletePublication(id)
        setToast({
          message: `⏸️ Đã chuyển ấn phẩm "${title}" xuống mục Đã ngưng kinh doanh (Tạm ẩn khỏi Cửa hàng)`,
          undoAction: async () => {
            await publicationService.restorePublication(id)
            setToast({ message: `✅ Đã mở lại kinh doanh cho ấn phẩm "${title}"` })
          },
        })
      }
    }
  }

  // ── 30 Điệu Hò Cổ Truyền (Admin Audio Library) ──
  const [chantActiveCard, setChantActiveCard] = useState<Card | null>(() => CARDS[0])
  const [chantPlaying, setChantPlaying] = useState<boolean>(false)
  const [chantAudioMode, setChantAudioMode] = useState<'offline' | 'online'>('offline')
  const [chantSearch, setChantSearch] = useState<string>('')
  const [chantSuitFilter, setChantSuitFilter] = useState<'all' | 'van' | 'van2' | 'hai'>('all')
  const [chantCurrentTime, setChantCurrentTime] = useState<number>(0)
  const [chantDuration, setChantDuration] = useState<number>(0)
  const [chantLyricsModalCard, setChantLyricsModalCard] = useState<Card | null>(null)
  const chantAudioRef = useRef<HTMLAudioElement | null>(null)

  const getCardSuit = (index: number) => {
    if (index < 10) return { name: 'Phô Văn', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    if (index < 20) return { name: 'Phô Vạn', color: 'bg-amber-50 text-amber-800 border-amber-200' }
    return { name: 'Phô Hài', color: 'bg-rose-50 text-rose-800 border-rose-200' }
  }

  const stopChantAudio = () => {
    if (chantAudioRef.current) {
      chantAudioRef.current.pause()
      chantAudioRef.current.currentTime = 0
    }
    setChantPlaying(false)
    setChantCurrentTime(0)
  }

  const playChantAudio = (card: Card, mode?: 'offline' | 'online') => {
    const selectedMode = mode || chantAudioMode
    if (mode && mode !== chantAudioMode) {
      setChantAudioMode(mode)
    }

    if (chantActiveCard?.id === card.id && chantPlaying && (!mode || mode === chantAudioMode)) {
      chantAudioRef.current?.pause()
      setChantPlaying(false)
      return
    }

    if (chantActiveCard?.id === card.id && !chantPlaying && (!mode || mode === chantAudioMode)) {
      chantAudioRef.current?.play().then(() => setChantPlaying(true)).catch(() => setChantPlaying(false))
      return
    }

    if (chantAudioRef.current) {
      chantAudioRef.current.pause()
    }
    setChantActiveCard(card)
    setChantCurrentTime(0)

    const soundSrc = selectedMode === 'offline' ? (card.soundOffline || card.sound) : card.sound
    const audio = chantAudioRef.current || new Audio()
    audio.src = soundSrc
    audio.currentTime = 0
    chantAudioRef.current = audio

    audio.ontimeupdate = () => {
      setChantCurrentTime(audio.currentTime || 0)
      setChantDuration(audio.duration || 0)
    }

    audio.onended = () => {
      setChantPlaying(false)
      setChantCurrentTime(0)
    }

    audio.onerror = () => {
      setChantPlaying(false)
    }

    void audio.play().then(() => {
      setChantPlaying(true)
    }).catch(() => {
      setChantPlaying(false)
    })
  }

  // Tắt audio khi đổi tab
  useEffect(() => {
    return () => {
      if (chantAudioRef.current) {
        chantAudioRef.current.pause()
      }
      setChantPlaying(false)
    }
  }, [tab])

  const formatAudioTime = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const filteredChants = useMemo(() => {
    return CARDS.map((card, index) => ({
      ...card,
      index,
      suit: getCardSuit(index),
      lyrics: getChantLyrics(card.id),
    })).filter((item) => {
      if (chantSuitFilter === 'van' && item.index >= 10) return false
      if (chantSuitFilter === 'van2' && (item.index < 10 || item.index >= 20)) return false
      if (chantSuitFilter === 'hai' && item.index < 20) return false

      if (chantSearch.trim()) {
        const query = chantSearch.toLowerCase().trim()
        const matchName = item.name.toLowerCase().includes(query)
        const matchSuit = item.suit.name.toLowerCase().includes(query)
        const matchLyrics = item.lyrics.some((line) => line.toLowerCase().includes(query))
        return matchName || matchSuit || matchLyrics
      }

      return true
    })
  }, [chantSuitFilter, chantSearch])

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* ── TOP HEADER (LIGHT THEME) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#c8382b] to-[#92261b] text-white text-xl font-bold shadow-md shadow-red-900/20">
              🎴
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-900 text-base sm:text-lg">
                  BÀI CHÒI <span className="text-[#c8382b]">DI SẢN</span>
                </span>
                <span className="rounded-md bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
                  Admin Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Hệ thống Quản trị & Điều phối Di sản</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-sm">👑</span>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-500">@{currentUser.username} (Quản trị viên)</div>
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
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col md:flex-row gap-6">
        {/* SIDEBAR TABS (LIGHT THEME) */}
        <aside className="w-full md:w-60 shrink-0">
          <nav className="flex md:flex-col gap-1.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <button
              onClick={() => setTab('events')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition text-left shrink-0 cursor-pointer ${
                tab === 'events'
                  ? 'bg-[#c8382b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>🎪</span>
              <span>Quản lý Sự kiện</span>
              <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] ${
                tab === 'events' ? 'bg-red-950/40 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {events.length}
              </span>
            </button>

            <button
              onClick={() => setTab('overview')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition text-left shrink-0 cursor-pointer ${
                tab === 'overview'
                  ? 'bg-[#c8382b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>📊</span>
              <span>Tổng quan</span>
            </button>

            <button
              onClick={() => setTab('publications')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition text-left shrink-0 cursor-pointer ${
                tab === 'publications'
                  ? 'bg-[#c8382b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>🛍️</span>
              <span>Ấn phẩm Di sản</span>
              <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] ${
                tab === 'publications' ? 'bg-red-950/40 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {publications.length}
              </span>
            </button>

            <button
              onClick={() => setTab('orders')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition text-left shrink-0 cursor-pointer ${
                tab === 'orders'
                  ? 'bg-[#c8382b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>📦</span>
              <span>Đơn hàng & Vé</span>
              <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] ${
                tab === 'orders' ? 'bg-red-950/40 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setTab('users')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition text-left shrink-0 cursor-pointer ${
                tab === 'users'
                  ? 'bg-[#c8382b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>👥</span>
              <span>Tài khoản & Role</span>
            </button>

            <button
              onClick={() => setTab('chants')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition text-left shrink-0 cursor-pointer ${
                tab === 'chants'
                  ? 'bg-[#c8382b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>📻</span>
              <span>30 Điệu Hò Bài</span>
              <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] ${
                tab === 'chants' ? 'bg-red-950/40 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                30
              </span>
            </button>
          </nav>

          {/* Quick Notice Card */}
          <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 hidden md:block">
            <span className="font-bold flex items-center gap-1.5 text-amber-800 mb-1">
              ⚡ Quy tắc Mở bán Quầy
            </span>
            Khi Admin xác nhận <strong>"Đóng bán Online"</strong>, hệ thống sẽ kích hoạt quầy vé để Staff bán trực tiếp số vé còn lại cho khách.
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 min-w-0">
          {/* 1. QUẢN LÝ SỰ KIỆN & ĐIỀU PHỐI BÁN VÉ QUẦY */}
          {tab === 'events' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Quản Lý Sự Kiện & Điều Phối Kênh Bán Vé</h3>
                  <p className="text-xs text-slate-500">
                    Điều phối kênh online / tại quầy và quản lý các sự kiện đang hoạt động hoặc đã ngưng hoạt động
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddEvent}
                    className="rounded-xl bg-[#c8382b] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#b02f23] transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                  >
                    <span>➕</span>
                    <span>Thêm sự kiện mới</span>
                  </button>
                </div>
              </div>

              {/* THANH BỘ LỌC TRẠNG THÁI (TẤT CẢ / ĐANG HOẠT ĐỘNG / ĐÃ NGƯNG HOẠT ĐỘNG) */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setEventFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    eventFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>📋 Tất cả</span>
                  <span className="rounded-full bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 font-extrabold">
                    {events.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEventFilter('active')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    eventFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>🟢 Đang hoạt động</span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 font-extrabold">
                    {activeEvents.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEventFilter('inactive')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    eventFilter === 'inactive'
                      ? 'bg-[#c8382b] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>⏸️ Đã ngưng hoạt động</span>
                  <span className="rounded-full bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 font-extrabold">
                    {inactiveEvents.length}
                  </span>
                </button>
              </div>

              {/* 1. KHU VỰC SỰ KIỆN ĐANG HOẠT ĐỘNG */}
              {(eventFilter === 'all' || eventFilter === 'active') && (
                <div className="space-y-3.5">
                  {eventFilter === 'all' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-900">
                          Sự Kiện Đang Hoạt Động ({activeEvents.length})
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500">Đang mở bán Online hoặc Quầy Staff</span>
                    </div>
                  )}

                  {activeEvents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-slate-500 text-xs">
                      Không có sự kiện nào đang hoạt động. Bạn có thể bấm <strong className="text-slate-700">"Thêm sự kiện mới"</strong> hoặc <strong className="text-emerald-700">mở lại sự kiện</strong> từ danh sách đã ngưng bên dưới.
                    </div>
                  ) : (
                    activeEvents.map((evt) => {
                      const remaining = evt.totalTickets - evt.soldTickets
                      const isOnlineSale = evt.status === 'online_sale'
                      const isOfflineSale = evt.status === 'offline_sale'
                      const evtImgs = evt.images && evt.images.length > 0
                        ? evt.images
                        : [evt.image || '/assets/mock up (1).png', '/assets/hopdungve-popup.png']

                      return (
                        <div
                          key={evt.id}
                          className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-xs hover:border-slate-300 hover:shadow-md transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">#{evt.id}</span>
                                <h4 className="text-sm sm:text-base font-bold text-slate-900">{evt.title}</h4>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">📍 {evt.location}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                                <span>🗓️ Diễn ra: <strong className="text-slate-800">{evt.eventDate}</strong></span>
                                <span>💵 Giá vé: <strong className="text-emerald-600 font-bold">{evt.ticketPrice.toLocaleString('vi-VN')} đ</strong></span>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {isOnlineSale && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Đang bán Online
                                </span>
                              )}
                              {isOfflineSale && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  Đã đóng online - Mở quầy Staff
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenEditEvent(evt)}
                                className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-2.5 py-1 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                title="Sửa thông tin và quản lý thư viện ảnh slider"
                              >
                                <span>✏️</span>
                                <span className="hidden sm:inline">Sửa & Ảnh</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePromptDeleteEvent(evt)}
                                className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-2.5 py-1 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                title="Chuyển sự kiện sang phần Đã ngưng hoạt động (Tạm ẩn khỏi Website khách hàng)"
                              >
                                <span>⏸️</span>
                                <span>Ngưng</span>
                              </button>
                            </div>
                          </div>

                          {/* Preview Thư viện ảnh slider */}
                          <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                <span>🖼️ Thư viện slider:</span>
                                <strong className="text-[#c8382b]">{evtImgs.length} ảnh</strong>
                              </span>
                              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-md">
                                {evtImgs.map((imgSrc, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    className="h-9 w-12 rounded-md bg-white border border-slate-200 overflow-hidden shrink-0 relative group shadow-2xs flex items-center justify-center p-0.5"
                                    title={`Ảnh ${imgIdx + 1}${imgIdx === 0 ? ' (Ảnh bìa chính)' : ''}`}
                                  >
                                    <img src={imgSrc} alt="" className="h-full w-full object-contain" />
                                    {imgIdx === 0 && (
                                      <span className="absolute top-0 left-0 bg-[#c8382b] text-[8px] text-white px-0.5 rounded-br font-bold">
                                        ★
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEditEvent(evt)}
                              className="text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>+ Thêm/bớt ảnh slider</span>
                              <span>→</span>
                            </button>
                          </div>

                          {/* Thanh thống kê số lượng vé còn lại */}
                          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">
                                Đã bán: <strong className="text-sky-600 font-bold">{evt.soldTickets} vé</strong> / Tổng {evt.totalTickets} vé
                              </span>
                              <span className="font-bold">
                                Số vé còn lại:{' '}
                                <strong className={`text-sm ${remaining > 0 ? 'text-emerald-600 font-extrabold' : 'text-red-600 font-extrabold'}`}>
                                  {remaining} vé
                                </strong>
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (evt.soldTickets / evt.totalTickets) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Nút hành động */}
                          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                            <div className="text-xs text-slate-500">
                              {isOnlineSale ? (
                                <span className="text-amber-800 font-medium">
                                  ⚠️ Quầy vé Staff hiện đang KHÓA cho sự kiện này (vì đang bán online).
                                </span>
                              ) : isOfflineSale ? (
                                <span className="text-emerald-800 font-medium">
                                  ✅ Quầy vé Staff ĐANG MỞ: Nhân viên được phép bán trực tiếp {remaining} vé còn lại.
                                </span>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {isOnlineSale && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    eventTicketService.updateEventStatus(evt.id, 'offline_sale')
                                  }}
                                  className="rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                  title="Xác nhận đóng bán online và mở quyền bán vé tại quầy cho Staff"
                                >
                                  <span>🔒</span>
                                  <span>Đóng Online ➔ Mở Bán Tại Quầy (Staff)</span>
                                </button>
                              )}

                              {isOfflineSale && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    eventTicketService.updateEventStatus(evt.id, 'online_sale')
                                  }}
                                  className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-95 text-slate-700 font-semibold text-xs px-3 py-1.5 transition cursor-pointer"
                                >
                                  <span>🌐</span>
                                  <span>Mở lại Online</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handlePromptDeleteEvent(evt)}
                                className="rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 active:scale-95 text-red-700 font-semibold text-xs px-3 py-1.5 transition cursor-pointer flex items-center gap-1"
                                title="Chuyển sự kiện sang mục Đã ngưng hoạt động"
                              >
                                <span>⏸️</span>
                                <span>Ngưng hoạt động</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* 2. KHU VỰC SỰ KIỆN ĐÃ NGƯNG HOẠT ĐỘNG (NẰM NGAY TRÊN TRANG ADMIN - KHÔNG BỊ MẤT) */}
              {(eventFilter === 'all' || eventFilter === 'inactive') && (
                <div className={`space-y-3.5 ${eventFilter === 'all' ? 'mt-8 pt-6 border-t-2 border-slate-200' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100/80 border border-slate-200 rounded-2xl p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-800 text-sm font-bold border border-rose-200">
                        ⏸️
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                            Sự Kiện Đã Ngưng Hoạt Động / Tạm Dừng
                          </h4>
                          <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold px-2 py-0.5">
                            {inactiveEvents.length} sự kiện
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Các sự kiện tạm ẩn khỏi Website khách hàng — Quản trị viên có thể mở lại bán bất cứ lúc nào
                        </p>
                      </div>
                    </div>

                    {inactiveEvents.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRestoreAllEvents}
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 transition flex items-center gap-1 cursor-pointer self-start sm:self-auto shadow-2xs active:scale-95"
                      >
                        <span>🔄</span>
                        <span>Khôi phục tất cả</span>
                      </button>
                    )}
                  </div>

                  {inactiveEvents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-slate-400 text-xs">
                      Không có sự kiện nào đang ngưng hoạt động. Khi bạn bấm "Ngưng", sự kiện sẽ chuyển vào đây an toàn thay vì bị mất.
                    </div>
                  ) : (
                    inactiveEvents.map((evt) => {
                      const remaining = evt.totalTickets - evt.soldTickets
                      const evtImgs = evt.images && evt.images.length > 0
                        ? evt.images
                        : [evt.image || '/assets/mock up (1).png', '/assets/hopdungve-popup.png']

                      return (
                        <div
                          key={evt.id}
                          className="rounded-2xl bg-slate-50/90 border border-slate-300 p-4 sm:p-5 space-y-3.5 shadow-xs hover:border-slate-400 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-mono font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                  #{evt.id}
                                </span>
                                <h4 className="text-sm sm:text-base font-bold text-slate-800 line-through decoration-rose-400/80">
                                  {evt.title}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">📍 {evt.location}</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                                <span>🗓️ Diễn ra: <strong className="text-slate-700">{evt.eventDate}</strong></span>
                                <span>💵 Giá vé: <strong className="text-emerald-700 font-bold">{evt.ticketPrice.toLocaleString('vi-VN')} đ</strong></span>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1">
                                <span>⏸️</span>
                                Đã ngưng hoạt động
                              </span>

                              <button
                                type="button"
                                onClick={() => handleOpenEditEvent(evt)}
                                className="rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                title="Sửa thông tin sự kiện"
                              >
                                <span>✏️</span>
                                <span className="hidden sm:inline">Sửa & Ảnh</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePromptPermanentDeleteEvent(evt)}
                                className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-2.5 py-1 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                                title="Xóa vĩnh viễn sự kiện này khỏi cơ sở dữ liệu"
                              >
                                <span>🗑️</span>
                                <span className="hidden sm:inline">Xóa hẳn</span>
                              </button>
                            </div>
                          </div>

                          {/* Preview Thư viện ảnh slider */}
                          <div className="rounded-xl bg-white border border-slate-200 p-2.5 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                <span>🖼️ Thư viện slider:</span>
                                <strong className="text-slate-800">{evtImgs.length} ảnh</strong>
                              </span>
                              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-md">
                                {evtImgs.map((imgSrc, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    className="h-9 w-12 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative opacity-75 flex items-center justify-center p-0.5"
                                  >
                                    <img src={imgSrc} alt="" className="h-full w-full object-contain" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Thanh thống kê vé */}
                          <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">
                                Đã bán: <strong className="text-sky-600 font-bold">{evt.soldTickets} vé</strong> / Tổng {evt.totalTickets} vé
                              </span>
                              <span className="font-bold">
                                Số vé còn lại: <strong className="text-sm text-slate-700 font-extrabold">{remaining} vé</strong>
                              </span>
                            </div>
                          </div>

                          {/* Nút khôi phục và mở lại bán */}
                          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
                            <div className="text-xs text-rose-800 font-medium flex items-center gap-1.5">
                              <span>⏸️</span>
                              <span>Sự kiện đang ngưng hoạt động (Tạm ẩn khỏi Website). Bạn có thể mở lại bất kỳ lúc nào:</span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  eventTicketService.updateEventStatus(evt.id, 'offline_sale')
                                  setToast({ message: `🏪 Đã mở lại Quầy Vé Staff cho sự kiện "${evt.title}"!` })
                                }}
                                className="rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                title="Mở lại quầy vé cho Staff tiếp tục bán"
                              >
                                <span>🏪</span>
                                <span>Mở lại Quầy Vé (Staff)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  eventTicketService.updateEventStatus(evt.id, 'online_sale')
                                  setToast({ message: `🌐 Đã mở lại Bán Online cho sự kiện "${evt.title}"!` })
                                }}
                                className="rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs px-3.5 py-2 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                                title="Mở lại kênh bán online cho khán giả trên website"
                              >
                                <span>🌐</span>
                                <span>Mở lại Bán Online</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePromptPermanentDeleteEvent(evt)}
                                className="rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs px-3 py-2 transition cursor-pointer flex items-center gap-1"
                                title="Xóa vĩnh viễn sự kiện này khỏi cơ sở dữ liệu"
                              >
                                <span>🗑️</span>
                                <span>Xóa hẳn</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. TỔNG QUAN (LIGHT THEME) */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Tổng doanh thu</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
                    {totalRevenue.toLocaleString('vi-VN')} đ
                  </div>
                  <span className="text-[10px] text-emerald-600 font-medium">↑ Đơn hàng & vé sự kiện</span>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Vé đã bán ra</span>
                  <div className="text-xl sm:text-2xl font-black text-sky-600 mt-1">
                    {totalTicketsSold} vé
                  </div>
                  <span className="text-[10px] text-slate-500">Trên {events.length} hội Bài Chòi</span>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Vé còn lại toàn hệ thống</span>
                  <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
                    {events.reduce((sum, e) => sum + (e.totalTickets - e.soldTickets), 0)} vé
                  </div>
                  <span className="text-[10px] text-amber-600 font-medium">Sẵn sàng bán online / tại quầy</span>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Ấn phẩm còn kho</span>
                  <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                    {publications.reduce((sum, p) => sum + p.stock, 0)} món
                  </div>
                  <span className="text-[10px] text-slate-500">Các dòng sản phẩm di sản</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. ẤN PHẨM & QUÀ TẶNG (CRUD TOÀN DIỆN VỚI SUPABASE & LOCALSTORAGE - LIGHT THEME) */}
          {tab === 'publications' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Quản Lý Ấn Phẩm & Đồ Lưu Niệm</h3>
                  <p className="text-xs text-slate-500">Thêm, sửa giá, cập nhật tồn kho và điều phối các sản phẩm đang kinh doanh hoặc đã ngưng</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenAddPub}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-4 py-2.5 transition shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <span>+</span>
                    <span>Thêm Ấn Phẩm Mới</span>
                  </button>
                </div>
              </div>

              {/* THANH BỘ LỌC TRẠNG THÁI ẤN PHẨM */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPubFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    pubFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>📋 Tất cả</span>
                  <span className="rounded-full bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 font-extrabold">
                    {publications.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPubFilter('active')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    pubFilter === 'active'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>🟢 Đang kinh doanh</span>
                  <span className="rounded-full bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.2 font-extrabold">
                    {activePubs.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPubFilter('inactive')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    pubFilter === 'inactive'
                      ? 'bg-[#c8382b] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span>⏸️ Đã ngưng kinh doanh</span>
                  <span className="rounded-full bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 font-extrabold">
                    {inactivePubs.length}
                  </span>
                </button>
              </div>

              {/* 1. KHU VỰC ẤN PHẨM ĐANG KINH DOANH */}
              {(pubFilter === 'all' || pubFilter === 'active') && (
                <div className="space-y-3.5">
                  {pubFilter === 'all' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-teal-500 animate-pulse" />
                        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-900">
                          Ấn Phẩm Đang Kinh Doanh ({activePubs.length})
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-500">Hiển thị trực tiếp trên Cửa hàng khách</span>
                    </div>
                  )}

                  {activePubs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-slate-500 text-xs">
                      Không có ấn phẩm nào đang kinh doanh. Hãy bấm <strong className="text-slate-700">"Thêm Ấn Phẩm Mới"</strong> hoặc mở lại sản phẩm ở mục đã ngưng bên dưới.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {activePubs.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-white border border-slate-200 p-4 flex gap-4 items-start justify-between shadow-xs hover:border-slate-300 hover:shadow-md transition"
                        >
                          <div className="flex gap-3 min-w-0">
                            <div className="h-20 w-20 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 p-1 flex items-center justify-center">
                              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 rounded px-2 py-0.5 inline-block">
                                {item.category}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{item.name}</h4>
                              <div className="text-base font-black text-emerald-600 mt-0.5">
                                {item.price.toLocaleString('vi-VN')} đ
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col justify-between items-end">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Tồn kho</span>
                              <div className="text-base font-bold text-slate-900">{item.stock} cái</div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                item.stock > 10 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {item.stock > 0 ? (item.stock < 10 ? 'Sắp hết' : 'Còn hàng') : 'Hết hàng'}
                              </span>
                            </div>

                            <div className="mt-3 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPub(item)}
                                className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 font-semibold transition cursor-pointer"
                                title="Chỉnh sửa thông tin"
                              >
                                ✏️ Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePromptDeletePub(item)}
                                className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs px-2.5 py-1 font-semibold transition cursor-pointer flex items-center gap-1"
                                title="Chuyển sang mục Đã ngưng kinh doanh (Tạm ẩn khỏi Cửa hàng)"
                              >
                                <span>⏸️</span>
                                <span>Ngưng</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. KHU VỰC ẤN PHẨM ĐÃ NGƯNG KINH DOANH (NẰM NGAY TRÊN TRANG ADMIN) */}
              {(pubFilter === 'all' || pubFilter === 'inactive') && (
                <div className={`space-y-3.5 ${pubFilter === 'all' ? 'mt-8 pt-6 border-t-2 border-slate-200' : ''}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-100/80 border border-slate-200 rounded-2xl p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-800 text-sm font-bold border border-rose-200">
                        ⏸️
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                            Ấn Phẩm Đã Ngưng Kinh Doanh / Tạm Dừng
                          </h4>
                          <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-extrabold px-2 py-0.5">
                            {inactivePubs.length} ấn phẩm
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Các ấn phẩm tạm ẩn khỏi Cửa hàng khách hàng — Quản trị viên có thể mở lại bất cứ lúc nào
                        </p>
                      </div>
                    </div>

                    {inactivePubs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleRestoreAllPubs}
                        className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3 py-1.5 transition flex items-center gap-1 cursor-pointer self-start sm:self-auto shadow-2xs active:scale-95"
                      >
                        <span>🔄</span>
                        <span>Khôi phục tất cả</span>
                      </button>
                    )}
                  </div>

                  {inactivePubs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-slate-400 text-xs">
                      Không có ấn phẩm nào đang ngưng kinh doanh. Khi bạn bấm "Ngưng", sản phẩm sẽ nằm tại đây an toàn để bạn kích hoạt lại khi cần.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {inactivePubs.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-slate-50/90 border border-slate-300 p-4 flex gap-4 items-start justify-between shadow-xs hover:border-slate-400 transition"
                        >
                          <div className="flex gap-3 min-w-0">
                            <div className="h-20 w-20 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 p-1 flex items-center justify-center opacity-75">
                              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-200 border border-slate-300 rounded px-2 py-0.5 inline-block">
                                {item.category}
                              </span>
                              <span className="ml-1.5 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded px-2 py-0.5 inline-block">
                                ⏸️ Đã ngưng kinh doanh
                              </span>
                              <h4 className="text-sm font-bold text-slate-800 mt-1 line-clamp-1 line-through decoration-rose-400/80">
                                {item.name}
                              </h4>
                              <div className="text-sm font-bold text-slate-600 mt-0.5">
                                {item.price.toLocaleString('vi-VN')} đ • Tồn kho: {item.stock} cái
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col justify-between items-end h-full">
                            <div className="flex flex-col items-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRestorePub(item.id, item.name)}
                                className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1.5 font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                                title="Mở lại kinh doanh ấn phẩm này trên Cửa hàng"
                              >
                                <span>🔄</span>
                                <span>Mở lại bán</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditPub(item)}
                                className="rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 font-semibold transition cursor-pointer"
                                title="Chỉnh sửa thông tin"
                              >
                                ✏️ Sửa
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePromptPermanentDeletePub(item)}
                                className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs px-2 py-1 font-semibold transition cursor-pointer flex items-center gap-1"
                                title="Xóa vĩnh viễn ấn phẩm này khỏi cơ sở dữ liệu"
                              >
                                <span>🗑️</span>
                                <span>Xóa hẳn</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. ĐƠN HÀNG (LIGHT THEME) */}
          {tab === 'orders' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Đơn Đặt Mua Vé & Ấn Phẩm</h3>
                <p className="text-xs text-slate-500">Quản lý trạng thái giao nhận và thanh toán</p>
              </div>

              <div className="space-y-3">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">{ord.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          ord.orderType === 'ticket' ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}>
                          {ord.orderType === 'ticket' ? 'Vé sự kiện' : 'Ấn phẩm'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{ord.customerName} - 📞 {ord.phone}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{ord.itemSummary}</p>
                      {ord.shippingAddress && (
                        <p className="text-xs text-amber-800 font-semibold mt-1 flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/80 w-fit">
                          <span>🏠 Địa chỉ nhận vé tại nhà:</span>
                          <span className="font-bold text-slate-900">{ord.shippingAddress}</span>
                        </p>
                      )}
                      <span className="text-[10px] text-slate-500 mt-1 block">Đặt lúc: {ord.createdAt}</span>
                    </div>

                    <div className="text-right sm:shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <div className="text-sm sm:text-base font-bold text-emerald-600">
                        {ord.totalAmount.toLocaleString('vi-VN')} đ
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                          className="text-[10px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2.5 py-1 transition cursor-pointer"
                        >
                          Đã giao
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(ord.id, 'shipping')}
                          className="text-[10px] font-bold rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 px-2.5 py-1 transition cursor-pointer"
                        >
                          Đang giao
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. TÀI KHOẢN & PHÂN QUYỀN (LIGHT THEME) */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Phân Quyền & Tài Khoản</h3>
                <p className="text-xs text-slate-500">Danh sách nhân viên soát vé tại quầy và khách hàng</p>
              </div>

              <div className="space-y-2.5">
                <div className="rounded-xl bg-white border border-slate-200 p-3.5 flex items-center justify-between shadow-xs">
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>👑</span>
                      <span>Quản trị viên Hệ thống</span>
                    </div>
                    <div className="text-xs text-slate-500">username: <strong>admin</strong> (admin@baichoi.vn)</div>
                  </div>
                  <span className="rounded-md bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-bold uppercase">
                    Admin
                  </span>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-3.5 flex items-center justify-between shadow-xs">
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🎫</span>
                      <span>Nhân viên Quầy vé 1</span>
                    </div>
                    <div className="text-xs text-slate-500">username: <strong>staff1</strong> (staff1@baichoi.vn)</div>
                  </div>
                  <span className="rounded-md bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-xs font-bold uppercase">
                    Staff
                  </span>
                </div>

                <div className="rounded-xl bg-white border border-slate-200 p-3.5 flex items-center justify-between shadow-xs">
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🎫</span>
                      <span>Nhân viên Quầy vé 2</span>
                    </div>
                    <div className="text-xs text-slate-500">username: <strong>staff2</strong> (staff2@baichoi.vn)</div>
                  </div>
                  <span className="rounded-md bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-xs font-bold uppercase">
                    Staff
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 6. KHO 30 ĐIỆU HÒ BÀI CHÒI CỔ TRUYỀN (ADMIN AUDIO & LYRICS LIBRARY) */}
          {tab === 'chants' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Tiêu đề & Thống kê */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-700 mb-2">
                    <span>📻</span>
                    <span>THƯ VIỆN ÂM THANH DI SẢN</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-serif">
                    Kho Tàng 30 Điệu Hò Bài Chòi Cổ Truyền
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Hệ thống lưu trữ, đối chiếu âm thanh hò thai nguyên bản (Sound-Offline & Sound-Online) và trọn bộ lời thơ diễn xướng 30 quân bài.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs">
                    🎴 30 Quân Bài
                  </span>
                  <span className="rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs">
                    🎵 60 Bản Thu Âm
                  </span>
                </div>
              </div>

              {/* ── TRÌNH PHÁT MASTER AUDIO PLAYER BAR ── */}
              {chantActiveCard && (
                <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#004d50] text-white p-4 sm:p-6 shadow-xl border border-slate-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    {/* Thông tin quân bài đang chọn */}
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-12 sm:h-20 sm:w-16 rounded-xl overflow-hidden border-2 border-amber-400 shadow-md shrink-0 bg-slate-800">
                        <img
                          src={chantActiveCard.image}
                          alt={chantActiveCard.name}
                          className="h-full w-full object-cover"
                        />
                        {chantPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 uppercase">
                            #{((CARDS.findIndex((c) => c.id === chantActiveCard.id)) + 1).toString().padStart(2, '0')}
                          </span>
                          <span className="text-xs font-semibold text-slate-300">
                            {getCardSuit(CARDS.findIndex((c) => c.id === chantActiveCard.id)).name}
                          </span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-black text-amber-300 mt-1">
                          {chantActiveCard.name}
                        </h4>
                        <p className="text-xs text-slate-300 italic line-clamp-1 mt-0.5">
                          "{getChantLyrics(chantActiveCard.id)[0] || 'Câu hò thai truyền thống...'}"
                        </p>
                      </div>
                    </div>

                    {/* Điều khiển phát & Chuyển chế độ âm thanh */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                      {/* Nút chuyển chế độ Sound Offline / Online */}
                      <div className="flex items-center rounded-xl bg-slate-950/60 p-1 border border-slate-700 w-full sm:w-auto justify-center">
                        <button
                          type="button"
                          onClick={() => playChantAudio(chantActiveCard, 'offline')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            chantAudioMode === 'offline'
                              ? 'bg-[#c8382b] text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          📻 Offline (Bản Dài)
                        </button>
                        <button
                          type="button"
                          onClick={() => playChantAudio(chantActiveCard, 'online')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            chantAudioMode === 'online'
                              ? 'bg-[#006368] text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          ⚡ Online (Bản Nhanh)
                        </button>
                      </div>

                      {/* Nút Play / Pause / Stop */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => playChantAudio(chantActiveCard)}
                          className="h-11 w-11 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center text-lg font-black shadow-lg transition active:scale-95 cursor-pointer"
                          title={chantPlaying ? 'Tạm dừng' : 'Phát âm thanh'}
                        >
                          {chantPlaying ? '⏸' : '▶'}
                        </button>
                        <button
                          type="button"
                          onClick={stopChantAudio}
                          className="h-10 w-10 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-xs font-bold transition active:scale-95 cursor-pointer"
                          title="Dừng hẳn"
                        >
                          ⏹
                        </button>
                        <button
                          type="button"
                          onClick={() => setChantLyricsModalCard(chantActiveCard)}
                          className="px-3 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-600 text-amber-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <span>📜</span>
                          <span>Xem Lời Thơ</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Thanh tiến trình Audio Timeline */}
                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                      {formatAudioTime(chantCurrentTime)}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max={chantDuration || 100}
                      value={chantCurrentTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (chantAudioRef.current) {
                          chantAudioRef.current.currentTime = val
                          setChantCurrentTime(val)
                        }
                      }}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <span className="text-[11px] font-mono text-slate-400 w-10">
                      {formatAudioTime(chantDuration)}
                    </span>
                  </div>
                </div>
              )}

              {/* ── BỘ LỌC & TÌM KIẾM ── */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                {/* Lọc theo Phô */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  {[
                    { id: 'all', name: 'Tất cả (30)' },
                    { id: 'van', name: 'Phô Văn (10)' },
                    { id: 'van2', name: 'Phô Vạn (10)' },
                    { id: 'hai', name: 'Phô Hài (10)' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setChantSuitFilter(filter.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        chantSuitFilter === filter.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {filter.name}
                    </button>
                  ))}
                </div>

                {/* Tìm kiếm */}
                <div className="relative sm:w-72">
                  <input
                    type="text"
                    value={chantSearch}
                    onChange={(e) => setChantSearch(e.target.value)}
                    placeholder="Tìm tên lá bài, lời thơ..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-[#c8382b] focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
                  {chantSearch && (
                    <button
                      type="button"
                      onClick={() => setChantSearch('')}
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* ── DANH SÁCH 30 QUÂN BÀI & CÂU HÒ THAI ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {filteredChants.map((item) => {
                  const isCurrent = chantActiveCard?.id === item.id
                  const isCurrentPlaying = isCurrent && chantPlaying

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-3 bg-white transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                        isCurrent
                          ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Ảnh quân bài & Badge số thứ tự */}
                        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 mb-2.5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white font-mono text-[10px] font-black">
                            #{(item.index + 1).toString().padStart(2, '0')}
                          </span>
                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-2xs ${item.suit.color}`}>
                            {item.suit.name}
                          </span>

                          {/* Quick Play Overlay */}
                          <button
                            type="button"
                            onClick={() => playChantAudio(item)}
                            className={`absolute inset-0 flex items-center justify-center transition cursor-pointer ${
                              isCurrentPlaying
                                ? 'bg-black/40'
                                : 'bg-black/0 hover:bg-black/30 opacity-0 hover:opacity-100'
                            }`}
                          >
                            <span className="h-10 w-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md">
                              {isCurrentPlaying ? '⏸' : '▶'}
                            </span>
                          </button>
                        </div>

                        {/* Tên lá bài */}
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-black text-slate-900 text-sm font-serif">
                            {item.name}
                          </h4>
                          {isCurrentPlaying && (
                            <span className="flex items-center gap-0.5 text-emerald-600 text-[10px] font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Đang phát
                            </span>
                          )}
                        </div>

                        {/* Trích đoạn lời thơ */}
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 text-[11px] text-slate-600 italic line-clamp-2 leading-relaxed mb-3">
                          "{item.lyrics[0] || 'Đang cập nhật lời hò thai...'}"
                        </div>
                      </div>

                      {/* Các nút thao tác nghe & xem lời */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => playChantAudio(item, 'offline')}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer text-center truncate ${
                              isCurrent && chantAudioMode === 'offline' && chantPlaying
                                ? 'bg-[#c8382b] text-white shadow-2xs'
                                : 'bg-red-50 hover:bg-red-100 text-red-800 border border-red-200'
                            }`}
                            title="Nghe bản dài hò thai cổ truyền"
                          >
                            📻 Bản Dài
                          </button>
                          <button
                            type="button"
                            onClick={() => playChantAudio(item, 'online')}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer text-center truncate ${
                              isCurrent && chantAudioMode === 'online' && chantPlaying
                                ? 'bg-[#006368] text-white shadow-2xs'
                                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                            }`}
                            title="Nghe bản ngắn thi đấu trực tuyến"
                          >
                            ⚡ Bản Nhanh
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setChantLyricsModalCard(item)}
                          className="w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer text-center flex items-center justify-center gap-1"
                        >
                          <span>📜</span>
                          <span>Chi tiết lời thơ</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {filteredChants.length === 0 && (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <span className="text-3xl">🔍</span>
                  <p className="font-bold text-slate-700 mt-2">Không tìm thấy quân bài nào phù hợp</p>
                  <p className="text-xs text-slate-500 mt-1">Hãy thử xóa từ khóa tìm kiếm hoặc đổi bộ lọc Phô</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL CHI TIẾT LỜI THƠ HÒ THAI (CHANT LYRICS MODAL) ── */}
      {chantLyricsModalCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📜</span>
                <div>
                  <h3 className="font-black text-slate-900 text-lg font-serif">
                    Lời Thơ Hò Thai: {chantLyricsModalCard.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Thuộc {getCardSuit(CARDS.findIndex((c) => c.id === chantLyricsModalCard.id)).name} · Quân #{((CARDS.findIndex((c) => c.id === chantLyricsModalCard.id)) + 1).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChantLyricsModalCard(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Chi tiết nội dung */}
            <div className="flex gap-4 items-start bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80">
              <div className="w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 border-amber-400 shrink-0 shadow-sm bg-white">
                <img
                  src={chantLyricsModalCard.image}
                  alt={chantLyricsModalCard.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  Toàn văn câu hò thai nguyên bản:
                </p>
                <div className="space-y-1.5 pl-2 border-l-2 border-amber-400">
                  {getChantLyrics(chantLyricsModalCard.id).map((line, idx) => (
                    <p key={idx} className="text-xs sm:text-sm font-medium text-slate-800 italic">
                      "{line}"
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio action inside modal */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  playChantAudio(chantLyricsModalCard, 'offline')
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#c8382b] hover:bg-[#a82e23] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>📻</span>
                <span>Phát Bản Dài (Sound-Offline)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playChantAudio(chantLyricsModalCard, 'online')
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#006368] hover:bg-[#004d50] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>⚡</span>
                <span>Phát Bản Nhanh (Sound-Online)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL THÊM / SỬA SỰ KIỆN & QUẢN LÝ ĐA ẢNH SLIDER (LIGHT THEME) ── */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingEvent ? '✏️ Chỉnh Sửa Sự Kiện & Thư Viện Ảnh' : '➕ Thêm Sự Kiện Bài Chòi Mới'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hỗ trợ thêm bao nhiêu ảnh tùy ý để tạo thanh slider lướt xem ảnh cho người mua
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên sự kiện Bài Chòi *</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Ví dụ: Hội Đánh Bài Chòi Xuân 2026..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#c8382b]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Địa điểm tổ chức *</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Quảng trường Quy Nhơn / Sân đình Hội An..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#c8382b]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Giá vé (VNĐ) *</label>
                  <input
                    type="number"
                    value={eventPrice}
                    onChange={(e) => setEventPrice(e.target.value)}
                    placeholder="50000"
                    min="0"
                    required
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#c8382b] font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tổng số vé phát hành *</label>
                  <input
                    type="number"
                    value={eventTotalTickets}
                    onChange={(e) => setEventTotalTickets(e.target.value)}
                    placeholder="100"
                    min="1"
                    required
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#c8382b] font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Thời gian diễn ra sự kiện</label>
                  <input
                    type="text"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="2026-05-15 19:30"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#c8382b]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Trạng thái bán vé sự kiện</label>
                  <select
                    value={eventStatus}
                    onChange={(e) => setEventStatus(e.target.value as EventItem['status'])}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#c8382b] font-medium"
                  >
                    <option value="online_sale">🟢 Đang mở bán vé Online</option>
                    <option value="offline_sale">🟡 Mở bán tại quầy soát vé (Staff)</option>
                    <option value="ended">🔴 Đã kết thúc / Tạm dừng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mô tả sự kiện & Ấn phẩm hộp quà kèm theo</label>
                <textarea
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Thông tin về đêm diễn, ấn phẩm hộp quà pop-up di sản 3D gửi kèm vé..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#c8382b]"
                />
              </div>

              {/* ── KHU VỰC QUẢN LÝ ĐA ẢNH SLIDER (KHÔNG GIỚI HẠN) ── */}
              <div className="rounded-2xl border-2 border-dashed border-red-200 bg-red-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">📸</span>
                    <label className="text-xs font-bold text-slate-900">
                      Hình ảnh Slider của sự kiện ({eventImages.length} ảnh)
                    </label>
                  </div>
                  <span className="text-[10px] text-red-700 font-bold bg-white px-2 py-0.5 rounded-full border border-red-200">
                    ✨ Thêm bao nhiêu ảnh tùy thích
                  </span>
                </div>

                {/* Input chọn file ẩn (hỗ trợ multiple) */}
                <input
                  ref={eventFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleEventImageUpload}
                  className="hidden"
                />

                {/* Nút upload file máy tính & Nhập URL */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => eventFileInputRef.current?.click()}
                    disabled={eventUploadLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#c8382b] text-slate-700 hover:text-[#c8382b] text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <span>{eventUploadLoading ? '⏳' : '📁'}</span>
                    <span>{eventUploadLoading ? 'Đang nén ảnh...' : 'Tải ảnh từ máy tính (chọn nhiều ảnh)'}</span>
                  </button>

                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={eventNewImageUrl}
                      onChange={(e) => setEventNewImageUrl(e.target.value)}
                      placeholder="Hoặc dán URL ảnh..."
                      className="flex-1 rounded-xl bg-white border border-slate-300 px-2.5 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#c8382b]"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                    >
                      + Thêm
                    </button>
                  </div>
                </div>

                {/* Chọn nhanh ảnh mẫu di sản */}
                <div>
                  <span className="text-[10px] text-slate-600 block mb-1 font-semibold">Chọn nhanh ảnh mẫu có sẵn:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '🎫 Vé chính thức', path: '/assets/mock up (1).png' },
                      { label: '🎁 Hộp pop-up 3D', path: '/assets/hopdungve-popup.png' },
                      { label: '🎨 Tranh Di Sản Biển', path: '/assets/trangchu(1).jpg' },
                      { label: '🎭 Sân khấu Hội', path: '/assets/trangchu2.jpg' },
                      { label: '📦 Hộp đựng vé', path: '/assets/hopdungve.png' },
                      { label: '🎪 Gian hàng Bài Chòi', path: '/assets/booth.jpg' },
                      { label: '📜 Vé cổ truyền', path: '/assets/vethamgia.jpg' },
                      { label: '🖼️ Poster Sự Kiện', path: '/assets/poster.jpg' },
                    ].map((preset) => {
                      const alreadyIn = eventImages.includes(preset.path)
                      return (
                        <button
                          type="button"
                          key={preset.path}
                          onClick={() => {
                            if (!alreadyIn) {
                              setEventImages((prev) => [...prev, preset.path])
                            }
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                            alreadyIn
                              ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold opacity-60'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-[#c8382b]'
                          }`}
                        >
                          <span>{preset.label}</span>
                          {alreadyIn && <span>✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Danh sách ảnh hiện tại dạng Grid với thứ tự ảnh */}
                {eventImages.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Danh sách ảnh hiển thị trên Slider (Ảnh đầu tiên sẽ làm ảnh bìa):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                      {eventImages.map((imgSrc, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-xl border p-1.5 bg-white flex flex-col justify-between shadow-2xs group ${
                            idx === 0 ? 'border-[#c8382b] ring-2 ring-red-100' : 'border-slate-200'
                          }`}
                        >
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                            <img src={imgSrc} alt="" className="h-full w-full object-contain" />
                            <span
                              className={`absolute top-1 left-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs ${
                                idx === 0
                                  ? 'bg-[#c8382b] text-white'
                                  : 'bg-black/70 text-white backdrop-blur-xs'
                              }`}
                            >
                              {idx === 0 ? '★ Ảnh #1 (Bìa)' : `Ảnh #${idx + 1}`}
                            </span>
                          </div>

                          <div className="mt-1.5 flex items-center justify-between gap-1">
                            {idx > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleSetMainImage(idx)}
                                className="text-[10px] text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer"
                                title="Đặt làm ảnh bìa chính"
                              >
                                Đặt bìa
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-bold">✓ Ảnh bìa</span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="text-[11px] text-red-600 hover:text-red-800 p-0.5 rounded hover:bg-red-50 cursor-pointer font-bold"
                              title="Xóa ảnh này khỏi slider"
                            >
                              ✕ Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                    Chưa có ảnh nào. Bấm <strong>Tải ảnh từ máy tính</strong> hoặc chọn ảnh mẫu phía trên.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#c8382b] to-[#92261b] hover:from-[#d94437] hover:to-[#a82d21] text-xs font-bold text-white cursor-pointer shadow-sm"
                >
                  {editingEvent ? 'Lưu Thay Đổi Sự Kiện' : 'Tạo Sự Kiện Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL THÊM / SỬA ẤN PHẨM (CRUD - LIGHT THEME) ── */}
      {showPubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h4 className="font-bold text-base text-slate-900">
                {editingPub ? '✏️ Chỉnh Sửa Ấn Phẩm' : '➕ Thêm Ấn Phẩm Mới'}
              </h4>
              <button
                type="button"
                onClick={() => setShowPubModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePub} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tên ấn phẩm *</label>
                <input
                  type="text"
                  value={pubName}
                  onChange={(e) => setPubName(e.target.value)}
                  placeholder="Ví dụ: Bộ Bài Chòi Gỗ 30 Thẻ"
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Danh mục</label>
                  <select
                    value={pubCategory}
                    onChange={(e) => setPubCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
                  >
                    <option value="Bộ Thẻ Bài">Bộ Thẻ Bài</option>
                    <option value="Hộp Đựng">Hộp Đựng</option>
                    <option value="Thời Trang">Thời Trang</option>
                    <option value="Quà Lưu Niệm">Quà Lưu Niệm</option>
                    <option value="Bao Bì & Túi">Bao Bì & Túi</option>
                    <option value="Bộ Quà Tặng">Bộ Quà Tặng</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    value={pubPrice}
                    onChange={(e) => setPubPrice(e.target.value)}
                    placeholder="290000"
                    min="0"
                    required
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Số lượng tồn kho *</label>
                <input
                  type="number"
                  value={pubStock}
                  onChange={(e) => setPubStock(e.target.value)}
                  placeholder="50"
                  min="0"
                  required
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Hình ảnh sản phẩm *</label>
                  <span className="text-[10px] text-teal-600 font-bold">📁 Hỗ trợ chọn file từ máy tính</span>
                </div>

                {/* Input chọn file ẩn */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pubImageUrl}
                    onChange={(e) => setPubImageUrl(e.target.value)}
                    placeholder="Link ảnh hoặc bấm [Tải từ máy]..."
                    required
                    className="flex-1 rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white text-xs font-bold transition shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <span>{uploadLoading ? '⏳' : '📁'}</span>
                    <span>{uploadLoading ? 'Đang đọc...' : 'Tải từ máy'}</span>
                  </button>
                </div>

                {/* Khu vực kéo thả / chọn file trực quan */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const file = e.dataTransfer.files?.[0]
                    if (file && file.type.startsWith('image/')) {
                      const pseudoEvent = {
                        target: { files: [file] },
                      } as unknown as React.ChangeEvent<HTMLInputElement>
                      handleImageFileUpload(pseudoEvent)
                    }
                  }}
                  className="mt-2 rounded-xl border border-dashed border-slate-300 hover:border-teal-600 bg-slate-50 hover:bg-teal-50/50 p-2.5 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs text-slate-600 group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">🖼️</span>
                  <span>Kéo thả ảnh hoặc <strong className="text-teal-700 underline underline-offset-2">bấm vào đây để chọn file từ máy</strong></span>
                </div>

                {/* Khung xem trước ảnh (Preview) */}
                {pubImageUrl && (
                  <div className="mt-2.5 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-xs">
                      <img src={pubImageUrl} alt="Xem trước" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-teal-700">✓ Đã liên kết ảnh sản phẩm</div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">
                        {pubImageUrl.startsWith('data:') ? 'Ảnh tải trực tiếp từ máy tính' : pubImageUrl}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPubImageUrl('')}
                      className="text-[11px] text-red-600 hover:text-red-700 px-2 py-1 rounded bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer font-medium"
                      title="Gỡ ảnh này"
                    >
                      ✕ Gỡ ảnh
                    </button>
                  </div>
                )}

                <div className="mt-2">
                  <span className="text-[10px] text-slate-500 block mb-1">Hoặc chọn nhanh ảnh mẫu có sẵn:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Hộp đứng', path: '/assets/thedungbai.jpg' },
                      { label: 'Hộp ngang', path: '/assets/thedungbai1.jpg' },
                      { label: 'Áo thun', path: '/assets/quatangsukien(1).jpg' },
                      { label: 'Móc khóa', path: '/assets/quatangsukien4.jpg' },
                      { label: 'Túi tote', path: '/assets/anpham1.png' },
                      { label: 'Bộ gốm', path: '/assets/quatangsukien(2).jpg' },
                      { label: 'Lịch bàn', path: '/assets/quatangsukien(3).jpg' },
                      { label: 'Poster', path: '/assets/poster.jpg' },
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset.path}
                        onClick={() => setPubImageUrl(preset.path)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition cursor-pointer ${
                          pubImageUrl === preset.path ? 'bg-teal-600 border-teal-600 text-white font-bold shadow-xs' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mô tả ấn phẩm</label>
                <textarea
                  rows={2}
                  value={pubDescription}
                  onChange={(e) => setPubDescription(e.target.value)}
                  placeholder="Mô tả chất liệu, quy cách đóng gói, ý nghĩa văn hóa di sản..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPubModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-xs font-bold text-white cursor-pointer shadow-sm"
                >
                  {editingPub ? 'Lưu Thay Đổi' : 'Thêm Ấn Phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN XÓA (CUSTOM CONFIRM DIALOG ĐẸP & CHUYÊN NGHIỆP) ── */}
      {confirmDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden transform transition-all scale-100">
            {/* Top decorative gradient bar */}
            <div
              className={`h-1.5 w-full ${
                confirmDeleteTarget.isPermanent
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700'
                  : 'bg-gradient-to-r from-[#c8382b] via-amber-500 to-[#c8382b]'
              }`}
            />

            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    confirmDeleteTarget.isPermanent
                      ? 'bg-red-50 text-red-600 border border-red-200 text-2xl'
                      : 'bg-rose-50 text-[#c8382b] border border-rose-200 text-2xl'
                  }`}
                >
                  {confirmDeleteTarget.isPermanent ? '⚠️' : '⏸️'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {confirmDeleteTarget.isPermanent
                      ? 'Xác Nhận Xóa Vĩnh Viễn?'
                      : confirmDeleteTarget.type === 'event'
                      ? 'Ngưng Hoạt Động Sự Kiện?'
                      : 'Ngưng Kinh Doanh Ấn Phẩm?'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {confirmDeleteTarget.isPermanent
                      ? 'Dữ liệu sẽ bị xóa hoàn toàn khỏi hệ thống và không thể khôi phục.'
                      : 'Sẽ chuyển xuống phần "Đã ngưng hoạt động" và tạm ẩn khỏi Website khách hàng.'}
                  </p>
                </div>
              </div>

              {/* Thông tin mục đang chọn */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-3">
                {confirmDeleteTarget.image ? (
                  <div className="h-14 w-14 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 p-0.5 shadow-2xs">
                    <img
                      src={confirmDeleteTarget.image}
                      alt={confirmDeleteTarget.title}
                      className="h-full w-full object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0">
                    🎴
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 line-clamp-2">
                    {confirmDeleteTarget.title}
                  </div>
                  {confirmDeleteTarget.subInfo && (
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                      {confirmDeleteTarget.subInfo}
                    </div>
                  )}
                </div>
              </div>

              {/* Lời nhắc an toàn */}
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                  confirmDeleteTarget.isPermanent
                    ? 'bg-red-50/80 border-red-200 text-red-800'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                }`}
              >
                <span className="text-sm shrink-0">
                  {confirmDeleteTarget.isPermanent ? '🚨' : '💡'}
                </span>
                <span className="leading-relaxed">
                  {confirmDeleteTarget.isPermanent
                    ? 'Lưu ý: Hành động này sẽ loại bỏ hoàn toàn dữ liệu và không thể hoàn tác sau khi xác nhận.'
                    : 'Yên tâm: Mục này không bị mất! Nó vẫn nằm ngay ở phần "Đã ngưng hoạt động" trên trang Admin để bạn mở lại bất cứ lúc nào.'}
                </span>
              </div>

              {/* Nút thao tác */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTarget(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDelete}
                  className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    confirmDeleteTarget.isPermanent
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                      : 'bg-[#c8382b] hover:bg-[#b02f23] shadow-rose-900/30'
                  }`}
                >
                  <span>{confirmDeleteTarget.isPermanent ? '⚠️' : '⏸️'}</span>
                  <span>
                    {confirmDeleteTarget.isPermanent
                      ? 'Xóa Vĩnh Viễn'
                      : confirmDeleteTarget.type === 'event'
                      ? 'Ngưng Hoạt Động'
                      : 'Ngưng Kinh Doanh'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL THÙNG RÁC SỰ KIỆN ── */}
      {showEventTrashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600 font-bold text-lg border border-red-200">
                  🗑️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Thùng Rác Sự Kiện</h3>
                    <span className="rounded-full bg-red-100 text-red-700 border border-red-200 text-[10px] font-extrabold px-2 py-0.5">
                      {deletedEvents.length} mục
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Các sự kiện đã tạm ẩn khỏi Website. Bạn có thể khôi phục lại bất kỳ lúc nào hoặc xóa hẳn.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEventTrashModal(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thanh công cụ khi có sự kiện */}
            {deletedEvents.length > 0 && (
              <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-amber-900 font-medium">
                  💡 Nhấn <strong>"Khôi phục"</strong> để sự kiện xuất hiện lại ngay trên Website & Quầy vé.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestoreAllEvents}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <span>🔄</span>
                    <span>Khôi phục tất cả</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePromptEmptyEventTrash}
                    className="rounded-lg bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 font-bold px-2.5 py-1 transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>🧹</span>
                    <span>Dọn sạch thùng rác</span>
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách các sự kiện trong thùng rác */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {deletedEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="text-4xl mb-2">✨</div>
                  <div className="text-sm font-bold text-slate-700">Thùng rác sự kiện hiện đang trống</div>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Khi bạn xóa sự kiện ở màn hình chính, sự kiện sẽ được lưu trữ an toàn tại đây để tránh mất dữ liệu do bấm nhầm.
                  </p>
                </div>
              ) : (
                deletedEvents.map((evt) => {
                  const evtImgs = evt.images && evt.images.length > 0
                    ? evt.images
                    : [evt.image || '/assets/mock up (1).png']

                  return (
                    <div
                      key={evt.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-16 w-20 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                          <img
                            src={evtImgs[0]}
                            alt={evt.title}
                            className="h-full w-full object-cover opacity-80"
                          />
                          {evtImgs.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] px-1 rounded-tl font-bold">
                              {evtImgs.length} ảnh
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              #{evt.id}
                            </span>
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                              Đã chuyển vào thùng rác
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">
                            {evt.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            📍 {evt.location} • 🗓️ {evt.eventDate}
                          </p>
                          {evt.deletedAt && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              🕒 Ngày xóa: {new Date(evt.deletedAt).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleRestoreEvent(evt.id, evt.title)}
                          className="rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold text-xs px-3 py-1.5 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                          title="Khôi phục lại sự kiện lên Website"
                        >
                          <span>🔄</span>
                          <span>Khôi phục</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePromptPermanentDeleteEvent(evt)}
                          className="rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs px-3 py-1.5 transition flex items-center gap-1 cursor-pointer active:scale-95"
                          title="Xóa vĩnh viễn khỏi cơ sở dữ liệu"
                        >
                          <span>❌</span>
                          <span>Xóa hẳn</span>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowEventTrashModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 border border-slate-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL THÙNG RÁC ÁN PHẨM ── */}
      {showPubTrashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700 font-bold text-lg border border-teal-200">
                  🗑️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Thùng Rác Ấn Phẩm & Quà Tặng</h3>
                    <span className="rounded-full bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-extrabold px-2 py-0.5">
                      {deletedPubs.length} mục
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Các ấn phẩm đã tạm ẩn khỏi Cửa hàng. Bạn có thể khôi phục lại bất kỳ lúc nào hoặc xóa hẳn.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPubTrashModal(false)}
                className="h-8 w-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thanh công cụ khi có ấn phẩm */}
            {deletedPubs.length > 0 && (
              <div className="px-5 py-2.5 bg-teal-50/70 border-b border-teal-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-teal-900 font-medium">
                  💡 Nhấn <strong>"Khôi phục"</strong> để đưa sản phẩm trở lại gian hàng online.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestoreAllPubs}
                    className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold px-2.5 py-1 transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <span>🔄</span>
                    <span>Khôi phục tất cả</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePromptEmptyPubTrash}
                    className="rounded-lg bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 font-bold px-2.5 py-1 transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>🧹</span>
                    <span>Dọn sạch thùng rác</span>
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách các ấn phẩm trong thùng rác */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {deletedPubs.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <div className="text-4xl mb-2">🎁</div>
                  <div className="text-sm font-bold text-slate-700">Thùng rác ấn phẩm hiện đang trống</div>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Khi bạn xóa ấn phẩm ở màn hình chính, sản phẩm sẽ được chuyển vào đây an toàn và không bị xóa vĩnh viễn ngay.
                  </p>
                </div>
              ) : (
                deletedPubs.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-16 w-16 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 p-1 flex items-center justify-center">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-contain opacity-80"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 rounded px-1.5 py-0.2">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                            Đã chuyển vào thùng rác
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">
                          {item.name}
                        </h4>
                        <div className="text-xs font-bold text-emerald-600 mt-0.5">
                          {item.price.toLocaleString('vi-VN')} đ • Tồn kho: {item.stock} cái
                        </div>
                        {item.deletedAt && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            🕒 Ngày xóa: {new Date(item.deletedAt).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleRestorePub(item.id, item.name)}
                        className="rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-700 font-bold text-xs px-3 py-1.5 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                        title="Khôi phục lại ấn phẩm lên Cửa hàng"
                      >
                        <span>🔄</span>
                        <span>Khôi phục</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromptPermanentDeletePub(item)}
                        className="rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs px-3 py-1.5 transition flex items-center gap-1 cursor-pointer active:scale-95"
                        title="Xóa vĩnh viễn khỏi cơ sở dữ liệu"
                      >
                        <span>❌</span>
                        <span>Xóa hẳn</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPubTrashModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 border border-slate-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST THÔNG BÁO NỔI GÓC DƯỚI (KÈM NÚT HOÀN TÁC HOÀN HẢO) ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full sm:w-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-base shrink-0">🔔</span>
            <span className="text-xs font-medium text-slate-100 leading-snug">
              {toast.message}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {toast.undoAction && (
              <button
                type="button"
                onClick={() => {
                  toast.undoAction?.()
                  setToast(null)
                }}
                className="rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold px-2.5 py-1 transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
              >
                <span>↩️</span>
                <span>Hoàn tác</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-1 rounded transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
