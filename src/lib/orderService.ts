import { supabase, isSupabaseConfigured } from './supabase'

// Quản lý Đơn hàng (Ấn phẩm & Vé) chia sẻ giữa Khách hàng và Admin, kết nối Supabase
export interface OrderItem {
  id: string
  customerName: string
  phone: string
  email?: string
  shippingAddress?: string
  orderType: 'ticket' | 'publication'
  itemSummary: string
  totalAmount: number
  status: 'pending' | 'shipping' | 'delivered' | 'cancelled'
  paymentMethod: 'cod' | 'bank_transfer' | 'coin'
  coinsPaid?: number
  notes?: string
  createdAt: string
  items?: Array<{
    id: string
    name: string
    quantity: number
    price: number
    size?: string
  }>
  carrier?: string
  trackingCode?: string
  estimatedDelivery?: string
  shipperName?: string
  shipperPhone?: string
}

export interface OrderTrackingLog {
  time: string
  date: string
  title: string
  detail: string
  location: string
  icon: string
  isDone: boolean
  isCurrent?: boolean
}

export interface OrderTrackingDetail {
  orderId: string
  carrierName: string
  trackingCode: string
  status: OrderItem['status']
  statusLabel: string
  statusBadgeClass: string
  estimatedDeliveryDate: string
  customerName: string
  customerPhone: string
  shippingAddress: string
  paymentMethodText: string
  shipperName: string
  shipperPhone: string
  shipperVehicle: string
  currentStepIndex: number
  steps: Array<{
    title: string
    subtitle: string
    icon: string
    isCompleted: boolean
    isCurrent: boolean
  }>
  timelineLogs: OrderTrackingLog[]
}

const STORAGE_ORDERS_KEY = 'bai_choi_orders_shared'

export const DEFAULT_ORDERS: OrderItem[] = [
  {
    id: 'ORD-B817',
    customerName: 'Nguyễn Thị Kim Liên',
    phone: '0907 775 897',
    email: 'lienntk.ce190812@gmail.com',
    shippingAddress: '234 Nguyễn Huệ, TP. Quy Nhơn, Bình Định',
    orderType: 'publication',
    itemSummary: '2x Thẻ Nhất Trò',
    totalAmount: 400000,
    status: 'shipping',
    paymentMethod: 'cod',
    createdAt: '11/10/2026 14:15',
    carrier: 'Viettel Post Express',
    trackingCode: 'VTP-B81789VN',
    estimatedDelivery: 'Hôm nay (11/10/2026)',
    shipperName: 'Nguyễn Văn Tuấn',
    shipperPhone: '0914 882 115',
    items: [{ id: 'pub-01', name: '2x Thẻ Nhất Trò', quantity: 2, price: 200000 }],
  },
  {
    id: 'ORD-CBC2',
    customerName: 'Nguyễn Thị Kim Liên',
    phone: '0907 775 897',
    email: 'lienntk.ce190812@gmail.com',
    shippingAddress: '234 Nguyễn Huệ, TP. Quy Nhơn, Bình Định',
    orderType: 'publication',
    itemSummary: '1 Áo Thun Di Sản Bài Chòi (Size L)',
    totalAmount: 180000,
    status: 'delivered',
    paymentMethod: 'cod',
    createdAt: '10/10/2026 18:10',
    carrier: 'Viettel Post Express',
    trackingCode: 'VTP-CBC214VN',
    estimatedDelivery: 'Đã nhận hàng thành công',
    shipperName: 'Lê Hoàng Minh',
    shipperPhone: '0905 123 789',
    items: [{ id: 'pub-03', name: '1 Áo Thun Di Sản Bài Chòi (Size L)', quantity: 1, price: 180000, size: 'L' }],
  },
  {
    id: 'ORD-8921',
    customerName: 'Trần Minh Quân',
    phone: '0918 234 567',
    email: 'quan.tran@gmail.com',
    shippingAddress: '120 Lê Lợi, TP. Quy Nhơn, Bình Định',
    orderType: 'ticket',
    itemSummary: '2 Vé Sự Kiện Quy Nhơn',
    totalAmount: 100000,
    status: 'delivered',
    paymentMethod: 'cod',
    createdAt: '10/10/2026 14:20',
    items: [{ id: 'evt-01', name: '2 Vé Sự Kiện Quy Nhơn', quantity: 2, price: 50000 }],
  },
  {
    id: 'ORD-8922',
    customerName: 'Lê Thu Trang',
    phone: '0905 678 910',
    email: 'trang.le@gmail.com',
    shippingAddress: '45 Trần Phú, Phường Cẩm Châu, TP. Hội An',
    orderType: 'publication',
    itemSummary: '1 Bộ Bài Chòi Gỗ + 2 Móc khóa',
    totalAmount: 360000,
    status: 'pending',
    paymentMethod: 'cod',
    createdAt: '10/10/2026 16:45',
    items: [
      { id: 'pub-01', name: 'Bộ Bài Chòi Gỗ', quantity: 1, price: 290000 },
      { id: 'pub-04', name: 'Móc Khóa', quantity: 2, price: 35000 },
    ],
  },
]

type Listener = () => void
const listeners: Set<Listener> = new Set()

export const orderService = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  notify() {
    listeners.forEach((fn) => fn())
  },

  getOrders(): OrderItem[] {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(DEFAULT_ORDERS))
      this.syncFromSupabase()
      return DEFAULT_ORDERS
    }
    try {
      return JSON.parse(raw) as OrderItem[]
    } catch {
      return DEFAULT_ORDERS
    }
  },

  saveOrders(orders: OrderItem[]) {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders))
    this.notify()
  },

  // Đồng bộ đơn hàng từ Supabase
  async syncFromSupabase(): Promise<OrderItem[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getOrders()
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('ℹ️ [Supabase] Chưa đọc được orders:', error.message)
        return this.getOrders()
      }

      if (data && data.length > 0) {
        const mapped: OrderItem[] = data.map((d: any) => {
          let parsedItems = []
          try {
            parsedItems = typeof d.items === 'string' ? JSON.parse(d.items) : (d.items || [])
          } catch {
            parsedItems = []
          }

          const summary = parsedItems.length > 0
            ? parsedItems.map((i: any) => `${i.quantity || 1} ${i.name || 'Sản phẩm'}`).join(', ')
            : (d.order_type === 'ticket' ? 'Vé Sự Kiện Bài Chòi' : 'Đơn hàng ấn phẩm')

          return {
            id: d.id ? `ORD-${d.id.toString().slice(-4).toUpperCase()}` : `ORD-${Date.now().toString().slice(-4)}`,
            customerName: d.customer_name || 'Khách hàng',
            phone: d.customer_phone || '',
            shippingAddress: d.shipping_address || '',
            orderType: (d.order_type as OrderItem['orderType']) || 'publication',
            itemSummary: summary,
            totalAmount: Number(d.total_amount) || 0,
            status: (d.status as OrderItem['status']) || 'pending',
            paymentMethod: (d.payment_method as OrderItem['paymentMethod']) || 'cod',
            coinsPaid: d.coins_paid ? Number(d.coins_paid) : undefined,
            createdAt: d.created_at ? new Date(d.created_at).toLocaleString('vi-VN') : 'Vừa xong',
            items: parsedItems,
          }
        })

        this.saveOrders(mapped)
        return mapped
      } else {
        // Nếu bảng orders trên Supabase trống -> tự động seed các đơn hàng mẫu
        this.seedInitialToSupabase()
      }
    } catch (err) {
      console.warn('Lỗi khi fetch orders từ Supabase:', err)
    }

    return this.getOrders()
  },

  // Seed đơn hàng ban đầu lên Supabase
  async seedInitialToSupabase() {
    if (!isSupabaseConfigured || !supabase) return

    try {
      const toInsert = DEFAULT_ORDERS.map((o) => ({
        customer_name: o.customerName,
        customer_phone: o.phone,
        shipping_address: o.shippingAddress || '',
        total_amount: o.totalAmount,
        order_type: o.orderType,
        status: o.status,
        items: o.items || [{ name: o.itemSummary, quantity: 1, price: o.totalAmount }],
      }))

      const { error } = await supabase.from('orders').insert(toInsert)
      if (!error) {
        console.log('✅ [Supabase] Đã đồng bộ seed đơn hàng mẫu lên cơ sở dữ liệu!')
      }
    } catch (e) {
      console.warn('Lỗi seed orders Supabase:', e)
    }
  },

  // Cập nhật trạng thái đơn hàng (đã giao, đang giao,...)
  async updateOrderStatus(orderId: string, newStatus: OrderItem['status']) {
    const list = this.getOrders()
    const target = list.find((o) => o.id === orderId)
    const updated = list.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    this.saveOrders(updated)

    if (isSupabaseConfigured && supabase && target) {
      try {
        await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('customer_phone', target.phone)
      } catch (err) {
        console.warn('Lỗi update order status Supabase:', err)
      }
    }
  },

  // Tạo mới đơn hàng và đồng bộ lên Supabase
  async createOrder(order: Omit<OrderItem, 'id' | 'createdAt' | 'status'>): Promise<OrderItem> {
    const list = this.getOrders()
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const todayStr = new Date().toLocaleDateString('vi-VN')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)

    const newOrder: OrderItem = {
      ...order,
      id: `ORD-${randomSuffix}`,
      status: 'pending',
      createdAt: `${todayStr} ${nowStr}`,
    }

    this.saveOrders([newOrder, ...list])

    // Đẩy lên Supabase orders
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('orders').insert({
          customer_name: newOrder.customerName,
          customer_phone: newOrder.phone,
          shipping_address: newOrder.shippingAddress || '',
          total_amount: newOrder.totalAmount,
          order_type: newOrder.orderType,
          status: newOrder.status,
          payment_method: newOrder.paymentMethod || 'cod',
          coins_paid: newOrder.coinsPaid || 0,
          items: newOrder.items && newOrder.items.length > 0
            ? newOrder.items
            : [{ name: newOrder.itemSummary, quantity: 1, price: newOrder.totalAmount }],
        })
        console.log('✅ [Supabase] Đã lưu đơn hàng mới vào database:', newOrder.id)
      } catch (err) {
        console.warn('Lỗi lưu order Supabase:', err)
      }
    }

    return newOrder
  },

  getOrderTrackingDetail(order: OrderItem): OrderTrackingDetail {
    const rawId = order.id.replace('ORD-', '')
    const carrier = order.carrier || 'Viettel Post Express'
    const trackingCode = order.trackingCode || `VTP-${rawId}89VN`
    const isTicket = order.orderType === 'ticket'

    let currentStepIndex = 1
    let statusLabel = 'Đang đóng gói & Chuẩn bị gửi'
    let statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200'

    if (order.status === 'delivered') {
      currentStepIndex = 3
      statusLabel = isTicket ? 'Vé điện tử đã phát hành' : 'Giao hàng thành công'
      statusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200'
    } else if (order.status === 'shipping') {
      currentStepIndex = 2
      statusLabel = 'Đang vận chuyển & Giao hàng'
      statusBadgeClass = 'bg-blue-50 text-blue-800 border-blue-200'
    } else if (order.status === 'cancelled') {
      currentStepIndex = 0
      statusLabel = 'Đơn hàng đã hủy'
      statusBadgeClass = 'bg-rose-50 text-rose-800 border-rose-200'
    }

    const steps = [
      {
        title: 'Đã đặt hàng',
        subtitle: order.createdAt || '10/10/2026',
        icon: '📝',
        isCompleted: true,
        isCurrent: currentStepIndex === 0,
      },
      {
        title: 'Đã đóng gói',
        subtitle: 'Kho Di sản niêm phong',
        icon: '📦',
        isCompleted: currentStepIndex >= 1,
        isCurrent: currentStepIndex === 1,
      },
      {
        title: 'Đang giao hàng',
        subtitle: 'Bưu tá đang phát hàng',
        icon: '🚚',
        isCompleted: currentStepIndex >= 2,
        isCurrent: currentStepIndex === 2,
      },
      {
        title: 'Giao thành công',
        subtitle: order.status === 'delivered' ? (order.estimatedDelivery || 'Đã nhận') : 'Dự kiến hôm nay',
        icon: '✅',
        isCompleted: currentStepIndex >= 3,
        isCurrent: currentStepIndex === 3,
      },
    ]

    const timelineLogs: OrderTrackingLog[] = []

    if (order.status === 'delivered') {
      timelineLogs.push({
        time: '11:30',
        date: '11/10/2026',
        title: 'Giao hàng thành công',
        detail: `Khách hàng ${order.customerName} đã nhận hàng và hoàn tất thanh toán COD (${order.totalAmount.toLocaleString('vi-VN')} đ).`,
        location: order.shippingAddress || 'TP. Quy Nhơn, Bình Định',
        icon: '✅',
        isDone: true,
        isCurrent: true,
      })
      timelineLogs.push({
        time: '09:15',
        date: '11/10/2026',
        title: 'Bưu tá đang phát hàng',
        detail: `Shipper Nguyễn Văn Tuấn (0914.882.115) đang liên hệ và di chuyển đến địa chỉ nhận.`,
        location: 'Tuyến phát Quy Nhơn 1',
        icon: '🛵',
        isDone: true,
      })
    } else if (order.status === 'shipping') {
      timelineLogs.push({
        time: '09:40',
        date: 'Hôm nay',
        title: 'Bưu tá đang trên đường giao hàng',
        detail: `Shipper Nguyễn Văn Tuấn (0914.882.115) đang mang kiện hàng đi phát tới ${order.shippingAddress || 'địa chỉ của bạn'}. Vui lòng chú ý điện thoại.`,
        location: 'Tuyến phát Bưu cục Quy Nhơn 1',
        icon: '🛵',
        isDone: true,
        isCurrent: true,
      })
      timelineLogs.push({
        time: '07:30',
        date: 'Hôm nay',
        title: 'Đến bưu cục phát địa phương',
        detail: 'Kiện hàng đã cập bến Bưu cục Quy Nhơn 1, sẵn sàng phân tuyến phát trong ngày.',
        location: 'Bưu cục Quy Nhơn 1 (120 Lê Lợi)',
        icon: '🏢',
        isDone: true,
      })
      timelineLogs.push({
        time: '21:15',
        date: 'Hôm qua',
        title: 'Rời kho trung chuyển liên tỉnh',
        detail: 'Kiện hàng rời Trung tâm khai thác Miền Trung (Đà Nẵng), xe thư báo đang di chuyển vào Bình Định.',
        location: 'Kho trung chuyển Miền Trung',
        icon: '🚛',
        isDone: true,
      })
    }

    timelineLogs.push({
      time: '16:45',
      date: order.createdAt?.split(' ')[0] || '10/10/2026',
      title: 'Đơn vị vận chuyển đã nhận hàng',
      detail: `Viettel Post đã tiếp nhận kiện hàng từ Bộ phận Đóng gói Không gian Di sản Bài Chòi. Mã vận đơn: ${trackingCode}.`,
      location: 'Kho Di sản Bài Chòi (Chi nhánh Hội An & Quy Nhơn)',
      icon: '📦',
      isDone: true,
      isCurrent: order.status === 'pending',
    })

    timelineLogs.push({
      time: '14:20',
      date: order.createdAt?.split(' ')[0] || '10/10/2026',
      title: 'Đơn hàng đã được khởi tạo',
      detail: `Đơn hàng #${order.id} ghi nhận thành công trên hệ thống Chòi Heritage. Phương thức: ${order.paymentMethod === 'coin' ? `Thanh toán bằng ChoiCoin (${order.coinsPaid || Math.ceil(order.totalAmount / 1000)} Xu)` : order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản'}.`,
      location: 'Hệ thống Website Bài Chòi',
      icon: '📝',
      isDone: true,
    })

    return {
      orderId: order.id,
      carrierName: carrier,
      trackingCode,
      status: order.status,
      statusLabel,
      statusBadgeClass,
      estimatedDeliveryDate: order.estimatedDelivery || (order.status === 'delivered' ? 'Đã giao thành công' : 'Dự kiến hôm nay (Trong ngày)'),
      customerName: order.customerName,
      customerPhone: order.phone,
      shippingAddress: order.shippingAddress || '234 Nguyễn Huệ, TP. Quy Nhơn, Bình Định',
      paymentMethodText: order.paymentMethod === 'coin' ? `Thanh toán bằng ChoiCoin (${order.coinsPaid || Math.ceil(order.totalAmount / 1000)} Xu)` : order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng',
      shipperName: order.shipperName || 'Nguyễn Văn Tuấn',
      shipperPhone: order.shipperPhone || '0914 882 115',
      shipperVehicle: 'Xe máy 77L1-829.14 (Viettel Post)',
      currentStepIndex,
      steps,
      timelineLogs,
    }
  },
}
