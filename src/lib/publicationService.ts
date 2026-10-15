import { supabase, isSupabaseConfigured } from './supabase'

export interface PublicationRecord {
  id: string
  name: string
  category: string
  price: number
  stock: number
  imageUrl: string
  description: string
  rating?: number
  reviewsCount?: number
  badge?: string
  hasSize?: boolean
  isDeleted?: boolean
  deletedAt?: string
}

const STORAGE_PUBLICATIONS_KEY = 'bai_choi_publications_shared'

export const DEFAULT_PUBLICATIONS: PublicationRecord[] = [
  {
    id: 'pub-combo-mascot',
    name: 'Combo 2 Mô Hình Mascot Bài Chòi (Anh Hiệu & Chị Hiệu)',
    category: 'Bộ Bài & Mascot',
    price: 1000000,
    stock: 50,
    imageUrl: '/assets/shop/mascot_box.png',
    description: 'Bộ đôi mô hình sưu tầm cao cấp Anh Hiệu & Chị Hiệu - Biểu tượng di sản văn hóa phi vật thể Bài Chòi miền Trung, thiết kế hộp trưng bày nghệ thuật phiên bản giới hạn.',
    rating: 5.0,
    reviewsCount: 185,
    badge: 'Phiên bản đặc biệt',
  },
  {
    id: 'pub-01',
    name: 'Bộ Bài Chòi Dân Gian 30 Thẻ Gỗ Tự Nhiên',
    category: 'Bộ Thẻ Bài',
    price: 290000,
    stock: 25,
    imageUrl: '/assets/thedungbai.jpg',
    description: 'Chế tác từ gỗ tự nhiên khắc laser 3 pho Văn, Vạn, Hạch. Gồm túi vải bảo quản và sách hướng dẫn luật chơi cổ truyền.',
    rating: 4.9,
    reviewsCount: 142,
    badge: 'Bán chạy nhất',
  },
  {
    id: 'pub-02',
    name: 'Hộp Đựng Bài Chòi Sơn Mài Cách Điệu',
    category: 'Hộp Đựng',
    price: 150000,
    stock: 40,
    imageUrl: '/assets/thedungbai1.jpg',
    description: 'Hộp đựng bài cao cấp với hệ hoa văn mây sóng, nắp trượt thông minh giữ thẻ luôn nguyên vẹn.',
    rating: 4.8,
    reviewsCount: 89,
    badge: 'Mỹ nghệ thủ công',
  },
  {
    id: 'pub-03',
    name: 'Áo Thun Di Sản Bài Chòi Cổ Truyền',
    category: 'Thời Trang',
    price: 180000,
    stock: 50,
    imageUrl: '/assets/quatangsukien(1).jpg',
    description: 'Cotton 100% 250gsm thoáng mát, in họa tiết biểu tượng anh Hiệu và câu ca Bài Chòi đặc sắc.',
    rating: 5.0,
    reviewsCount: 204,
    badge: 'Bộ sưu tập mới',
    hasSize: true,
  },
  {
    id: 'pub-04',
    name: 'Móc Khóa Thẻ Bài Chòi Gỗ Khắc Tay',
    category: 'Quà Lưu Niệm',
    price: 35000,
    stock: 120,
    imageUrl: '/assets/quatangsukien4.jpg',
    description: 'Móc khóa gỗ tự nhiên khắc hình các quân bài may mắn (Nhứt Nọc, Nhì Nghèo, Tam Quăng...).',
    rating: 4.7,
    reviewsCount: 76,
    badge: 'Quà lưu niệm',
  },
  {
    id: 'pub-05',
    name: 'Túi Tote Canvas Họa Tiết Mái Chòi',
    category: 'Bao Bì & Túi',
    price: 95000,
    stock: 35,
    imageUrl: '/assets/anpham1.png',
    description: 'Vải canvas dày dặn thân thiện môi trường, in logo mái chòi và hoa văn dân gian miền Trung.',
    rating: 4.9,
    reviewsCount: 115,
    badge: 'Eco-Friendly',
  },
  {
    id: 'pub-06',
    name: 'Combo Quà Tặng Gốm & Lịch Di Sản',
    category: 'Bộ Quà Tặng',
    price: 220000,
    stock: 18,
    imageUrl: '/assets/quatangsukien(2).jpg',
    description: 'Bộ quà tặng cao cấp gồm gốm sứ mộc tráng men và lịch để bàn minh họa 30 lá bài Chòi qua 12 tháng.',
    rating: 4.9,
    reviewsCount: 63,
    badge: 'Quà biếu tặng',
  },
]

type Listener = () => void
const listeners: Set<Listener> = new Set()

export const publicationService = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  notify() {
    listeners.forEach((fn) => fn())
  },

  getPublications(includeDeleted: boolean = false): PublicationRecord[] {
    const raw = localStorage.getItem(STORAGE_PUBLICATIONS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_PUBLICATIONS_KEY, JSON.stringify(DEFAULT_PUBLICATIONS))
      // Khởi động đồng bộ Supabase ngầm
      this.syncFromSupabase()
      return DEFAULT_PUBLICATIONS
    }
    try {
      const parsed = JSON.parse(raw) as PublicationRecord[]
      if (!includeDeleted) {
        return parsed.filter((p) => !p.isDeleted)
      }
      return parsed
    } catch {
      return DEFAULT_PUBLICATIONS
    }
  },

  getAllPublications(): PublicationRecord[] {
    return this.getPublications(true)
  },

  getDeletedPublications(): PublicationRecord[] {
    return this.getPublications(true).filter((p) => Boolean(p.isDeleted))
  },

  savePublicationsLocally(items: PublicationRecord[]) {
    localStorage.setItem(STORAGE_PUBLICATIONS_KEY, JSON.stringify(items))
    this.notify()
  },

  // Đồng bộ từ Supabase nếu có bảng publications
  async syncFromSupabase(): Promise<PublicationRecord[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getPublications()
    }

    try {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('ℹ️ [Supabase] Chưa đọc được publications (có thể bảng chưa có data):', error.message)
        return this.getPublications()
      }

      if (data && data.length > 0) {
        const currentLocal = this.getAllPublications()
        const localMap = new Map<string, PublicationRecord>()
        currentLocal.forEach((item) => {
          localMap.set(item.id, item)
          if (item.name) localMap.set(item.name, item)
        })

        const mapped: PublicationRecord[] = data.map((d: any) => {
          const localItem = localMap.get(d.id) || localMap.get(d.name)
          const remoteIsDeleted = typeof d.description === 'string' && d.description.startsWith('[TRASH]')
          const isDeleted = localItem?.isDeleted !== undefined ? localItem.isDeleted : remoteIsDeleted
          const deletedAt = localItem?.deletedAt || (remoteIsDeleted ? new Date().toLocaleString('vi-VN') : undefined)
          const cleanDesc = (d.description || localItem?.description || '').replace(/^\[TRASH\]\s*/, '')

          return {
            id: d.id,
            name: d.name,
            category: d.category || 'Ấn Phẩm',
            price: Number(d.price) || 0,
            stock: Number(d.stock) || 0,
            imageUrl: d.image_url || '/assets/thedungbai.jpg',
            description: cleanDesc,
            rating: 4.9,
            reviewsCount: 50,
            badge: d.stock < 10 ? 'Sắp hết' : undefined,
            hasSize: d.category?.toLowerCase().includes('thời trang') || d.category?.toLowerCase().includes('áo'),
            isDeleted,
            deletedAt,
          }
        })

        // Giữ lại ấn phẩm mới tạo cục bộ chưa lên Supabase
        const remoteIds = new Set(data.map((d: any) => d.id))
        const localOnly = currentLocal.filter((l) => !remoteIds.has(l.id) && !data.some((d: any) => d.name === l.name))
        const fullList = [...mapped, ...localOnly]

        this.savePublicationsLocally(fullList)
        return this.getPublications()
      } else {
        // Nếu trên Supabase bảng publications còn trống, tự động đưa các ấn phẩm mặc định lên
        this.seedInitialToSupabase()
      }
    } catch (err) {
      console.warn('Lỗi khi fetch publications từ Supabase:', err)
    }

    return this.getPublications()
  },

  // Seed ấn phẩm ban đầu lên Supabase
  async seedInitialToSupabase() {
    if (!isSupabaseConfigured || !supabase) return

    try {
      const toInsert = DEFAULT_PUBLICATIONS.map((p) => ({
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        image_url: p.imageUrl,
        category: p.category,
      }))

      await supabase.from('publications').insert(toInsert)
      console.log('✅ [Supabase] Đã đồng bộ seed ấn phẩm mẫu lên cơ sở dữ liệu!')
    } catch (e) {
      console.warn('Lỗi seed publications:', e)
    }
  },

  // 1. CREATE: Thêm mới ấn phẩm
  async addPublication(item: Omit<PublicationRecord, 'id'>): Promise<PublicationRecord> {
    const list = this.getAllPublications()
    const newId = `pub-${Date.now().toString().slice(-6)}`
    const newRecord: PublicationRecord = {
      ...item,
      id: newId,
      rating: 5.0,
      reviewsCount: 1,
      isDeleted: false,
    }

    const updated = [newRecord, ...list]
    this.savePublicationsLocally(updated)

    // Đẩy lên Supabase nếu có kết nối
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('publications').insert({
          name: newRecord.name,
          description: newRecord.description,
          price: newRecord.price,
          stock: newRecord.stock,
          image_url: newRecord.imageUrl,
          category: newRecord.category,
        })
      } catch (err) {
        console.warn('Lỗi ghi Supabase publications:', err)
      }
    }

    return newRecord
  },

  // 2. UPDATE: Chỉnh sửa ấn phẩm
  async updatePublication(id: string, updates: Partial<PublicationRecord>): Promise<PublicationRecord | null> {
    const list = this.getAllPublications()
    let updatedItem: PublicationRecord | null = null

    const updatedList = list.map((p) => {
      if (p.id === id) {
        updatedItem = { ...p, ...updates }
        return updatedItem
      }
      return p
    })

    if (!updatedItem) return null

    this.savePublicationsLocally(updatedList)

    // Cập nhật lên Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('publications')
          .update({
            name: updates.name,
            description: updates.description,
            price: updates.price,
            stock: updates.stock,
            image_url: updates.imageUrl,
            category: updates.category,
          })
          .eq('name', (updatedItem as PublicationRecord).name)
      } catch (err) {
        console.warn('Lỗi cập nhật Supabase publications:', err)
      }
    }

    return updatedItem
  },

  // 3. SOFT DELETE: Xóa mềm ấn phẩm (chuyển vào thùng rác)
  async softDeletePublication(id: string): Promise<boolean> {
    const list = this.getAllPublications()
    const target = list.find((p) => p.id === id)
    if (!target) return false

    const updatedList = list.map((p) =>
      p.id === id ? { ...p, isDeleted: true, deletedAt: new Date().toLocaleString('vi-VN') } : p
    )
    this.savePublicationsLocally(updatedList)

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('publications')
          .update({ description: `[TRASH] ${target.description || ''}` })
          .eq('name', target.name)
      } catch (e) {
        console.warn('Lỗi soft delete Supabase publication:', e)
      }
    }

    return true
  },

  // 4. RESTORE: Khôi phục ấn phẩm từ thùng rác
  async restorePublication(id: string): Promise<boolean> {
    const list = this.getAllPublications()
    const target = list.find((p) => p.id === id)
    if (!target) return false

    const cleanDesc = (target.description || '').replace(/^\[TRASH\]\s*/, '')
    const updatedList = list.map((p) =>
      p.id === id ? { ...p, isDeleted: false, deletedAt: undefined, description: cleanDesc } : p
    )
    this.savePublicationsLocally(updatedList)

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('publications')
          .update({ description: cleanDesc })
          .eq('name', target.name)
      } catch (e) {
        console.warn('Lỗi restore Supabase publication:', e)
      }
    }

    return true
  },

  // 5. DELETE PERMANENTLY: Xóa vĩnh viễn ấn phẩm
  async deletePublicationPermanently(id: string): Promise<boolean> {
    const list = this.getAllPublications()
    const toDelete = list.find((p) => p.id === id)
    const filtered = list.filter((p) => p.id !== id)

    this.savePublicationsLocally(filtered)

    if (isSupabaseConfigured && supabase && toDelete) {
      try {
        await supabase.from('publications').delete().eq('name', toDelete.name)
      } catch (err) {
        console.warn('Lỗi xóa vĩnh viễn Supabase publications:', err)
      }
    }

    return true
  },

  // 6. Dọn sạch thùng rác ấn phẩm
  async emptyTrash(): Promise<void> {
    const list = this.getAllPublications()
    const toDelete = list.filter((p) => p.isDeleted)
    const remaining = list.filter((p) => !p.isDeleted)

    this.savePublicationsLocally(remaining)

    if (isSupabaseConfigured && supabase) {
      for (const item of toDelete) {
        try {
          await supabase.from('publications').delete().eq('name', item.name)
        } catch {}
      }
    }
  },

  // Giữ alias deletePublication mặc định là xóa mềm
  async deletePublication(id: string): Promise<boolean> {
    return this.softDeletePublication(id)
  },
}
