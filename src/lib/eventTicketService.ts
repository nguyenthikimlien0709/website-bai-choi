import { supabase, isSupabaseConfigured } from './supabase'

// Quản lý dữ liệu Sự kiện và Vé chia sẻ giữa Admin và Staff

export interface EventItem {
  id: string
  title: string
  location: string
  eventDate: string
  saleEndDate: string
  totalTickets: number
  soldTickets: number
  ticketPrice: number
  status: 'upcoming' | 'online_sale' | 'closed_online' | 'offline_sale' | 'ended'
  image?: string
  images?: string[] // Danh sách nhiều ảnh không giới hạn (Admin có thể thêm bao nhiêu tùy thích)
  description?: string
  isDeleted?: boolean // Đánh dấu sự kiện trong Thùng rác (Xóa mềm - không mất dữ liệu)
  deletedAt?: string  // Thời gian chuyển vào Thùng rác
}

export interface TicketRecord {
  ticketCode: string
  eventId: string
  customerName: string
  phone: string
  eventTitle: string
  channel: 'online_early' | 'offline_door'
  status: 'unused' | 'checked_in'
  checkedInAt?: string
  price: number
  createdAt: string
  shippingAddress?: string
  shippingStatus?: 'pending' | 'shipping' | 'delivered'
}

const STORAGE_EVENTS_KEY = 'bai_choi_events_shared'
const STORAGE_TICKETS_KEY = 'bai_choi_tickets_shared'

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: 'evt-01',
    title: 'Hội Đánh Bài Chòi Xuân 2026 - Quảng Trường Quy Nhơn',
    location: 'Quảng trường Chiến Thắng, TP. Quy Nhơn, Bình Định',
    eventDate: '2026-03-20 19:30',
    saleEndDate: '2026-03-05 23:59',
    totalTickets: 120,
    soldTickets: 84, // Còn lại: 36 vé
    ticketPrice: 50000,
    status: 'online_sale', // Đang bán online -> Staff chưa được bán tại quầy
    image: '/assets/mock up (1).png',
    images: [
      '/assets/mock up (1).png',
      '/assets/hopdungve-popup.png',
      '/assets/booth.jpg',
    ],
    description: 'Vé tham dự Hội Đánh Bài Chòi Quy Nhơn 2026 kèm Hộp quà pop-up di sản 3D đặc sắc giao tận nhà.',
  },
  {
    id: 'evt-02',
    title: 'Đêm Thơ Ca & Di Sản Bài Chòi Cổ Truyền Hội An',
    location: 'Sân đình Hội An, Phố cổ Hội An, Quảng Nam',
    eventDate: '2026-04-12 19:00',
    saleEndDate: '2026-03-28 23:59',
    totalTickets: 80,
    soldTickets: 52, // Còn lại: 28 vé
    ticketPrice: 60000,
    status: 'offline_sale', // Admin ĐÃ xác nhận đóng bán online -> Mở bán tại quầy cho Staff!
    image: '/assets/mock up (1).png',
    images: [
      '/assets/mock up (1).png',
      '/assets/hopdungve-popup.png',
      '/assets/vethamgia.jpg',
    ],
    description: 'Đêm Thơ Ca & Di Sản Phố Cổ Hội An cùng ấn phẩm hộp quà pop-up mở rộng 3D.',
  },
  {
    id: 'evt-03',
    title: 'Giao Lưu Hiệu Bài Chòi & Tinh Hoa Nghệ Nhân Miền Trung',
    location: 'Trung tâm Văn hóa Tỉnh Quảng Ngãi',
    eventDate: '2026-02-15 18:30',
    saleEndDate: '2026-02-01 23:59',
    totalTickets: 100,
    soldTickets: 100, // Còn lại: 0 vé
    ticketPrice: 45000,
    status: 'ended', // Đã kết thúc
    image: '/assets/mock up (1).png',
    images: [
      '/assets/mock up (1).png',
      '/assets/hopdungve-popup.png',
    ],
    description: 'Giao lưu nghệ nhân Bài Chòi miền Trung.',
  },
]

const DEFAULT_TICKETS: TicketRecord[] = [
  {
    ticketCode: 'VE-2026-001',
    eventId: 'evt-01',
    customerName: 'Nguyễn Văn Hùng',
    phone: '0901 888 777',
    eventTitle: 'Hội Đánh Bài Chòi Xuân 2026 - Quảng Trường Quy Nhơn',
    channel: 'online_early',
    status: 'unused',
    price: 50000,
    createdAt: '10/10/2026 10:00',
  },
  {
    ticketCode: 'VE-2026-002',
    eventId: 'evt-01',
    customerName: 'Trần Thị Mai',
    phone: '0935 444 333',
    eventTitle: 'Hội Đánh Bài Chòi Xuân 2026 - Quảng Trường Quy Nhơn',
    channel: 'online_early',
    status: 'checked_in',
    checkedInAt: '10/10/2026 18:15',
    price: 50000,
    createdAt: '10/10/2026 11:30',
  },
  {
    ticketCode: 'VE-2026-003',
    eventId: 'evt-02',
    customerName: 'Lê Hoàng Nam',
    phone: '0912 333 999',
    eventTitle: 'Đêm Thơ Ca & Di Sản Bài Chòi Cổ Truyền Hội An',
    channel: 'online_early',
    status: 'unused',
    price: 60000,
    createdAt: '10/10/2026 14:00',
  },
]

type Listener = () => void
const eventListeners: Set<Listener> = new Set()
const ticketListeners: Set<Listener> = new Set()

export const eventTicketService = {
  subscribe(fn: Listener): () => void {
    eventListeners.add(fn)
    ticketListeners.add(fn)
    return () => {
      eventListeners.delete(fn)
      ticketListeners.delete(fn)
    }
  },

  notify() {
    eventListeners.forEach((fn) => fn())
    ticketListeners.forEach((fn) => fn())
  },

  getEvents(includeDeleted: boolean = false): EventItem[] {
    const raw = localStorage.getItem(STORAGE_EVENTS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(DEFAULT_EVENTS))
      return DEFAULT_EVENTS
    }
    try {
      const parsed = JSON.parse(raw) as EventItem[]
      const mapped = parsed.map((e) => {
        const fallbackImages = e.images && e.images.length > 0
          ? e.images
          : [e.image || '/assets/mock up (1).png', '/assets/hopdungve-popup.png']
        return {
          ...e,
          images: fallbackImages,
          image: fallbackImages[0] || e.image || '/assets/mock up (1).png',
        }
      })
      if (!includeDeleted) {
        return mapped.filter((e) => !e.isDeleted)
      }
      return mapped
    } catch {
      return DEFAULT_EVENTS
    }
  },

  getAllEvents(): EventItem[] {
    return this.getEvents(true)
  },

  getDeletedEvents(): EventItem[] {
    return this.getEvents(true).filter((e) => Boolean(e.isDeleted))
  },

  saveEvents(events: EventItem[]) {
    localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events))
    this.notify()
  },

  async syncFromSupabase(): Promise<EventItem[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getEvents()
    }
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })

      if (error) {
        console.warn('ℹ️ [Supabase] Chưa đọc được events:', error.message)
        return this.getEvents()
      }

      if (data && data.length > 0) {
        const currentLocal = this.getAllEvents()
        const localMap = new Map<string, EventItem>()
        currentLocal.forEach((item) => {
          localMap.set(item.id, item)
          if (item.title) localMap.set(item.title, item)
        })

        const mapped: EventItem[] = data.map((d: any) => {
          const localItem = localMap.get(d.id) || localMap.get(d.title)

          // Nhận diện trạng thái đã xóa mềm: từ Supabase ([TRASH] trong mô tả) hoặc từ localItem
          const remoteIsDeleted = typeof d.description === 'string' && d.description.startsWith('[TRASH]')
          const isDeleted = localItem?.isDeleted !== undefined ? localItem.isDeleted : remoteIsDeleted
          const deletedAt = localItem?.deletedAt || (remoteIsDeleted ? new Date().toLocaleString('vi-VN') : undefined)
          const cleanDescription = (d.description || localItem?.description || '').replace(/^\[TRASH\]\s*/, '')

          // 1. Phân tích ảnh từ Supabase (hỗ trợ lưu JSON chuỗi trong banner_url hoặc cột images nếu có)
          let imgs: string[] = []
          if (d.images) {
            try {
              imgs = typeof d.images === 'string' ? JSON.parse(d.images) : (Array.isArray(d.images) ? d.images : [])
            } catch {}
          }

          if (imgs.length === 0 && d.banner_url) {
            try {
              const parsed = JSON.parse(d.banner_url)
              if (Array.isArray(parsed) && parsed.length > 0) {
                imgs = parsed
              } else if (typeof parsed === 'string' && parsed) {
                imgs = [parsed]
              }
            } catch {
              if (typeof d.banner_url === 'string' && d.banner_url.trim()) {
                imgs = [d.banner_url.trim()]
              }
            }
          }

          // 2. Bảo toàn ảnh Admin: Nếu Supabase chưa có mảng ảnh tùy biến nhưng local đã có danh sách ảnh của Admin -> GIỮ NGUYÊN ảnh Admin
          if (imgs.length === 0 || (imgs.length === 1 && imgs[0] === '/assets/mock up (1).png')) {
            if (localItem && localItem.images && localItem.images.length > 0) {
              imgs = localItem.images
            }
          }

          // 3. Fallback mặc định nếu vẫn trống
          if (imgs.length === 0) {
            imgs = [d.banner_url || d.image || '/assets/mock up (1).png', '/assets/hopdungve-popup.png']
          }

          return {
            id: d.id,
            title: d.title || (localItem?.title || 'Sự kiện Bài Chòi'),
            location: d.location || (localItem?.location || 'Việt Nam'),
            eventDate: d.event_date ? new Date(d.event_date).toLocaleString('vi-VN') : (localItem?.eventDate || 'Sắp diễn ra'),
            saleEndDate: d.sale_end_date ? new Date(d.sale_end_date).toLocaleString('vi-VN') : (localItem?.saleEndDate || ''),
            totalTickets: Number(d.total_tickets) || localItem?.totalTickets || 100,
            soldTickets: localItem?.soldTickets || 0,
            ticketPrice: Number(d.ticket_price) || localItem?.ticketPrice || 50000,
            status: (d.status as EventItem['status']) || localItem?.status || 'online_sale',
            description: cleanDescription,
            image: imgs[0],
            images: imgs,
            isDeleted,
            deletedAt,
          }
        })

        // Giữ lại các sự kiện mới chỉ tạo ở local chưa có trên Supabase
        const remoteIds = new Set(data.map((d: any) => d.id))
        const localOnly = currentLocal.filter((l) => !remoteIds.has(l.id) && !data.some((d: any) => d.title === l.title))
        const fullList = [...mapped, ...localOnly]

        this.saveEvents(fullList)
        return this.getEvents()
      } else {
        this.seedInitialEventsToSupabase()
      }
    } catch (err) {
      console.warn('Lỗi khi fetch events từ Supabase:', err)
    }
    return this.getEvents()
  },

  async seedInitialEventsToSupabase() {
    if (!isSupabaseConfigured || !supabase) return
    try {
      const toInsert = DEFAULT_EVENTS.map((e) => ({
        title: e.title,
        location: e.location,
        event_date: '2026-03-20T19:30:00+07:00',
        sale_start_date: '2026-03-01T00:00:00+07:00',
        sale_end_date: '2026-03-05T23:59:00+07:00',
        total_tickets: e.totalTickets,
        ticket_price: e.ticketPrice,
        status: e.status,
        description: e.description || '',
        banner_url: e.images && e.images.length > 0 ? JSON.stringify(e.images) : (e.image || '/assets/mock up (1).png'),
      }))
      const { error } = await supabase.from('events').insert(toInsert)
      if (!error) {
        console.log('✅ [Supabase] Đã đồng bộ seed sự kiện mẫu lên cơ sở dữ liệu!')
      }
    } catch (e) {
      console.warn('Lỗi seed events Supabase:', e)
    }
  },

  updateEventStatus(eventId: string, newStatus: EventItem['status']) {
    const list = this.getAllEvents()
    const target = list.find((e) => e.id === eventId)
    const isActivating = newStatus === 'online_sale' || newStatus === 'offline_sale'
    const isDeactivating = newStatus === 'ended' || newStatus === 'closed_online'

    const updated = list.map((e) => {
      if (e.id !== eventId) return e
      return {
        ...e,
        status: newStatus,
        isDeleted: isActivating ? false : (isDeactivating ? true : e.isDeleted),
        deletedAt: isActivating ? undefined : (isDeactivating ? (e.deletedAt || new Date().toLocaleString('vi-VN')) : e.deletedAt),
      }
    })
    this.saveEvents(updated)

    if (isSupabaseConfigured && supabase && target) {
      const sb = supabase
      const cleanDesc = (target.description || '').replace(/^\[TRASH\]\s*/, '')
      const payload: any = {
        status: newStatus,
        description: isDeactivating ? `[TRASH] ${cleanDesc}` : cleanDesc,
      }
      sb
        .from('events')
        .update(payload)
        .eq('id', eventId)
        .then(({ error }) => {
          if (error) {
            sb
              .from('events')
              .update(payload)
              .eq('title', target.title)
              .then(() => {}, (err: any) => console.warn('Lỗi update status Supabase:', err))
          }
        })
    }
  },

  updateEvent(eventId: string, partial: Partial<EventItem>): EventItem | null {
    const list = this.getAllEvents()
    const idx = list.findIndex((e) => e.id === eventId)
    if (idx === -1) return null

    const current = list[idx]
    const updatedImages = partial.images && partial.images.length > 0
      ? partial.images
      : current.images || [current.image || '/assets/mock up (1).png']

    const updatedItem: EventItem = {
      ...current,
      ...partial,
      images: updatedImages,
      image: updatedImages[0] || partial.image || current.image,
    }

    list[idx] = updatedItem
    this.saveEvents([...list])

    // Đồng bộ lập tức lên Supabase
    if (isSupabaseConfigured && supabase) {
      const sb = supabase
      const bannerPayload = updatedImages.length > 0 ? JSON.stringify(updatedImages) : updatedItem.image
      const payload: any = {
        title: updatedItem.title,
        location: updatedItem.location,
        total_tickets: updatedItem.totalTickets,
        ticket_price: updatedItem.ticketPrice,
        status: updatedItem.status,
        description: updatedItem.description || '',
        banner_url: bannerPayload,
      }

      sb
        .from('events')
        .update(payload)
        .eq('id', eventId)
        .then(({ error }) => {
          if (error) {
            console.warn('⚠️ Lỗi update Supabase theo ID, thử lại theo title:', error.message)
            sb
              .from('events')
              .update(payload)
              .eq('title', current.title)
              .then(() => {}, (e: any) => console.warn('Lỗi update Supabase theo title:', e))
          } else {
            console.log('✅ Đã đồng bộ sự kiện & ảnh lên Supabase thành công:', updatedItem.title)
          }
        })
    }

    return updatedItem
  },

  // 1. XÓA MỀM / NGƯNG HOẠT ĐỘNG (Chuyển vào mục Đã ngưng hoạt động - Dữ liệu KHÔNG mất, có thể mở lại bất kỳ lúc nào)
  softDeleteEvent(eventId: string): EventItem | null {
    const list = this.getAllEvents()
    const idx = list.findIndex((e) => e.id === eventId)
    if (idx === -1) return null

    const target = list[idx]
    const deletedTime = new Date().toLocaleString('vi-VN')
    const updated: EventItem = {
      ...target,
      status: 'ended', // chuyển trạng thái kết thúc/ngưng hoạt động
      isDeleted: true,
      deletedAt: deletedTime,
    }

    list[idx] = updated
    this.saveEvents([...list])

    // Đánh dấu vào Supabase: Cập nhật status 'ended' và thêm [TRASH] vào description
    if (isSupabaseConfigured && supabase) {
      const sb = supabase
      const cleanDesc = (target.description || '').replace(/^\[TRASH\]\s*/, '')
      const trashDesc = `[TRASH] ${cleanDesc}`
      const payload = { status: 'ended', description: trashDesc }
      sb
        .from('events')
        .update(payload)
        .eq('id', eventId)
        .then(({ error }) => {
          if (error) {
            sb
              .from('events')
              .update(payload)
              .eq('title', target.title)
              .then(() => {}, () => {})
          }
        })
    }

    return updated
  },

  // 2. KHÔI PHỤC SỰ KIỆN TỪ MỤC ĐÃ NGƯNG HOẠT ĐỘNG
  restoreEvent(eventId: string, newStatus: EventItem['status'] = 'online_sale'): EventItem | null {
    const list = this.getAllEvents()
    const idx = list.findIndex((e) => e.id === eventId)
    if (idx === -1) return null

    const target = list[idx]
    const restored: EventItem = {
      ...target,
      status: newStatus,
      isDeleted: false,
      deletedAt: undefined,
    }

    list[idx] = restored
    this.saveEvents([...list])

    // Gỡ bỏ [TRASH] và cập nhật status trên Supabase
    if (isSupabaseConfigured && supabase) {
      const sb = supabase
      const cleanDesc = (target.description || '').replace(/^\[TRASH\]\s*/, '')
      const payload = { status: newStatus, description: cleanDesc }
      sb
        .from('events')
        .update(payload)
        .eq('id', eventId)
        .then(({ error }) => {
          if (error) {
            sb
              .from('events')
              .update(payload)
              .eq('title', target.title)
              .then(() => {}, () => {})
          }
        })
    }

    return restored
  },

  // 3. KHÔI PHỤC TOÀN BỘ SỰ KIỆN TRONG THÙNG RÁC
  restoreAllEvents() {
    const list = this.getAllEvents().map((e) => ({
      ...e,
      isDeleted: false,
      deletedAt: undefined,
    }))
    this.saveEvents(list)

    if (isSupabaseConfigured && supabase) {
      const sb = supabase
      list.forEach((e) => {
        const cleanDesc = (e.description || '').replace(/^\[TRASH\]\s*/, '')
        sb.from('events').update({ description: cleanDesc }).eq('id', e.id).then(() => {}, () => {})
      })
    }
  },

  // 4. XÓA VĨNH VIỄN SỰ KIỆN KHỎI HỆ THỐNG
  deleteEventPermanently(eventId: string) {
    const list = this.getAllEvents()
    const target = list.find((e) => e.id === eventId)
    const filtered = list.filter((e) => e.id !== eventId)
    this.saveEvents(filtered)

    if (isSupabaseConfigured && supabase) {
      const sb = supabase
      sb
        .from('events')
        .delete()
        .eq('id', eventId)
        .then(({ error }) => {
          if (error && target) {
            sb.from('events').delete().eq('title', target.title).then(() => {}, () => {})
          }
        })
    }
  },

  // 5. DỌN SẠCH THÙNG RÁC (Xóa vĩnh viễn toàn bộ mục trong thùng rác)
  emptyTrash() {
    const list = this.getAllEvents()
    const toDelete = list.filter((e) => e.isDeleted)
    const remaining = list.filter((e) => !e.isDeleted)
    this.saveEvents(remaining)

    if (isSupabaseConfigured && supabase) {
      const sb = supabase
      toDelete.forEach((item) => {
        sb.from('events').delete().eq('id', item.id).then(() => {}, () => {})
      })
    }
  },

  // Giữ alias deleteEvent mặc định là xóa mềm (Soft Delete)
  deleteEvent(eventId: string) {
    return this.softDeleteEvent(eventId)
  },

  addEvent(event: Omit<EventItem, 'id' | 'soldTickets'>): EventItem {
    const list = this.getAllEvents()
    const imgs = event.images && event.images.length > 0
      ? event.images
      : [event.image || '/assets/mock up (1).png']
    const newId = `evt-${Date.now()}`
    const newEvt: EventItem = {
      ...event,
      id: newId,
      images: imgs,
      image: imgs[0],
      isDeleted: false,
      soldTickets: 0,
    }
    this.saveEvents([newEvt, ...list])

    if (isSupabaseConfigured && supabase) {
      const sb = supabase
      const bannerPayload = imgs.length > 0 ? JSON.stringify(imgs) : newEvt.image
      sb
        .from('events')
        .insert({
          title: newEvt.title,
          location: newEvt.location,
          event_date: new Date().toISOString(),
          sale_start_date: new Date().toISOString(),
          sale_end_date: new Date(Date.now() + 15 * 86400000).toISOString(),
          total_tickets: newEvt.totalTickets,
          ticket_price: newEvt.ticketPrice,
          status: newEvt.status,
          description: newEvt.description || '',
          banner_url: bannerPayload,
        })
        .select()
        .then(
          ({ data }) => {
            if (data && data[0] && data[0].id) {
              const currentList = this.getEvents()
              const mapped = currentList.map((e) => (e.id === newId ? { ...e, id: data[0].id } : e))
              this.saveEvents(mapped)
            }
          },
          (err: any) => console.warn('Lỗi insert event Supabase:', err)
        )
    }

    return newEvt
  },

  getTickets(): TicketRecord[] {
    const raw = localStorage.getItem(STORAGE_TICKETS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(DEFAULT_TICKETS))
      return DEFAULT_TICKETS
    }
    try {
      return JSON.parse(raw) as TicketRecord[]
    } catch {
      return DEFAULT_TICKETS
    }
  },

  saveTickets(tickets: TicketRecord[]) {
    localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(tickets))
    this.notify()
  },

  // Bán vé tại quầy (Door sale)
  sellDoorTickets(
    eventId: string,
    customerName: string,
    phone: string,
    quantity: number
  ): { success: boolean; tickets?: TicketRecord[]; message?: string } {
    const events = this.getEvents()
    const event = events.find((e) => e.id === eventId)

    if (!event) {
      return { success: false, message: 'Không tìm thấy sự kiện này trong hệ thống.' }
    }

    // Kiểm tra quy định: Chỉ được bán tại quầy sau khi Admin xác nhận đóng bán online
    if (event.status !== 'offline_sale') {
      if (event.status === 'online_sale') {
        return {
          success: false,
          message: 'Sự kiện này hiện vẫn đang trong giai đoạn bán vé Online. Quầy vé trực tiếp chỉ được mở sau khi Quản trị viên (Admin) xác nhận Đóng bán online!',
        }
      }
      return {
        success: false,
        message: 'Sự kiện này hiện không mở bán tại quầy (trạng thái: ' + event.status + ').',
      }
    }

    // Kiểm tra số lượng vé còn lại
    const remaining = event.totalTickets - event.soldTickets
    if (remaining <= 0) {
      return { success: false, message: 'Sự kiện này đã HẾT VÉ tại quầy (Số lượng còn lại: 0 vé).' }
    }

    if (quantity > remaining) {
      return {
        success: false,
        message: `Số lượng vé muốn mua (${quantity} vé) vượt quá số lượng vé còn lại (${remaining} vé).`,
      }
    }

    // Trừ số lượng vé còn lại (tăng soldTickets)
    const updatedEvents = events.map((e) =>
      e.id === eventId ? { ...e, soldTickets: e.soldTickets + quantity } : e
    )
    this.saveEvents(updatedEvents)

    // Tạo các mã vé mới
    const currentTickets = this.getTickets()
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const todayStr = new Date().toLocaleDateString('vi-VN')
    const newCreated: TicketRecord[] = []

    for (let i = 0; i < quantity; i++) {
      const code = `VE-DOOR-${Math.floor(1000 + Math.random() * 9000)}`
      newCreated.push({
        ticketCode: code,
        eventId: event.id,
        customerName,
        phone,
        eventTitle: event.title,
        channel: 'offline_door',
        status: 'unused',
        price: event.ticketPrice,
        createdAt: `${todayStr} ${nowStr}`,
      })
    }

    this.saveTickets([...newCreated, ...currentTickets])

    return {
      success: true,
      tickets: newCreated,
      message: `Đã xuất thành công ${quantity} vé tại quầy cho khách ${customerName}!`,
    }
  },

  // Soát vé / Check-in
  checkinTicket(ticketCode: string): { success: boolean; ticket?: TicketRecord; message?: string } {
    const tickets = this.getTickets()
    const clean = ticketCode.trim().toUpperCase()
    const found = tickets.find((t) => t.ticketCode.toUpperCase() === clean)

    if (!found) {
      return { success: false, message: 'Mã vé không tồn tại trong hệ thống.' }
    }

    if (found.status === 'checked_in') {
      return {
        success: false,
        ticket: found,
        message: `Vé này đã qua cổng trước đó vào lúc: ${found.checkedInAt || 'hôm nay'}! Không được cho qua.`,
      }
    }

    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const todayStr = new Date().toLocaleDateString('vi-VN')
    const updatedTicket: TicketRecord = {
      ...found,
      status: 'checked_in',
      checkedInAt: `${todayStr} ${nowStr}`,
    }

    const updatedList = tickets.map((t) =>
      t.ticketCode.toUpperCase() === clean ? updatedTicket : t
    )
    this.saveTickets(updatedList)

    return {
      success: true,
      ticket: updatedTicket,
      message: 'Soát vé thành công! Cho phép khách vào cổng.',
    }
  },

  // Mua vé online (Customer Online Booking - Nhận vé & hộp quà tận nhà)
  buyOnlineTickets(
    eventId: string,
    customerName: string,
    phone: string,
    quantity: number,
    shippingAddress?: string,
    _email?: string
  ): { success: boolean; tickets?: TicketRecord[]; message?: string } {
    const events = this.getEvents()
    const event = events.find((e) => e.id === eventId)

    if (!event) {
      return { success: false, message: 'Không tìm thấy sự kiện này trong hệ thống.' }
    }

    if (event.status !== 'online_sale') {
      if (event.status === 'offline_sale') {
        return {
          success: false,
          message: 'Sự kiện này đã đóng bán vé online (chỉ còn mở bán trực tiếp tại quầy soát vé).',
        }
      }
      return {
        success: false,
        message: 'Sự kiện này hiện chưa hoặc không mở bán vé online.',
      }
    }

    const remaining = event.totalTickets - event.soldTickets
    if (remaining <= 0) {
      return { success: false, message: 'Rất tiếc, sự kiện này đã HẾT VÉ online.' }
    }

    if (quantity > remaining) {
      return {
        success: false,
        message: `Số lượng vé muốn mua (${quantity} vé) vượt quá số lượng vé còn lại (${remaining} vé).`,
      }
    }

    // Cập nhật số vé đã bán
    const updatedEvents = events.map((e) =>
      e.id === eventId ? { ...e, soldTickets: e.soldTickets + quantity } : e
    )
    this.saveEvents(updatedEvents)

    // Tạo mã vé online giao tận nhà
    const currentTickets = this.getTickets()
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const todayStr = new Date().toLocaleDateString('vi-VN')
    const newCreated: TicketRecord[] = []

    for (let i = 0; i < quantity; i++) {
      const code = `BC-ONL-${Math.floor(1000 + Math.random() * 9000)}`
      newCreated.push({
        ticketCode: code,
        eventId: event.id,
        customerName,
        phone,
        eventTitle: event.title,
        channel: 'online_early',
        status: 'unused',
        price: event.ticketPrice,
        createdAt: `${todayStr} ${nowStr}`,
        shippingAddress: shippingAddress || '',
        shippingStatus: 'pending',
      })
    }

    this.saveTickets([...newCreated, ...currentTickets])

    return {
      success: true,
      tickets: newCreated,
      message: `Đặt thành công ${quantity} vé tham gia sự kiện! Đơn hàng sẽ được chuẩn bị và giao tận nhà.`,
    }
  },
}

