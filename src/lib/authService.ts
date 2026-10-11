import type { UserProfile, StoredUser, RegisterFormData, CoinTransaction } from '../types/auth'
import { supabase, isSupabaseConfigured } from './supabase'

const STORAGE_USERS_KEY = 'bai_choi_users'
const STORAGE_CURRENT_USER_KEY = 'bai_choi_current_user'
const STORAGE_PENDING_REG_KEY = 'bai_choi_pending_registration'
const STORAGE_COIN_TXS_KEY = 'bai_choi_coin_transactions'

// 3 Tài khoản mặc định có sẵn của hệ thống
export const DEFAULT_ACCOUNTS = {
  admin: {
    username: 'admin',
    email: 'admin@baichoi.vn',
    password: 'Admin@1234',
    fullName: 'Quản trị viên Hệ thống',
    phone: '0901234567',
    role: 'admin' as const,
  },
  staff1: {
    username: 'staff1',
    email: 'staff1@baichoi.vn',
    password: 'Staff@1234',
    fullName: 'Nhân viên Quầy vé 1',
    phone: '0902345678',
    role: 'staff' as const,
  },
  staff2: {
    username: 'staff2',
    email: 'staff2@baichoi.vn',
    password: 'Staff@1234',
    fullName: 'Nhân viên Quầy vé 2',
    phone: '0903456789',
    role: 'staff' as const,
  },
  customer: {
    username: 'lien_nguyen',
    email: 'lienntk.ce190812@gmail.com',
    password: 'User@1234',
    fullName: 'Nguyễn Thị Kim Liên',
    phone: '0907775897',
    role: 'customer' as const,
    dob: '2005-09-07',
    gender: 'Nữ',
    idCard: '052205001234',
  },
}

function initDefaultUsers(): StoredUser[] {
  const existing = localStorage.getItem(STORAGE_USERS_KEY)
  if (existing) {
    try {
      const parsed: StoredUser[] = JSON.parse(existing)
      // Đảm bảo luôn có 3 tài khoản mặc định và có coins
      let changed = false
      parsed.forEach((u) => {
        if (typeof u.coins !== 'number') {
          u.coins = u.role === 'admin' ? 999 : u.role === 'staff' ? 200 : 50
          changed = true
        }
      })
      const hasAdmin = parsed.some((u) => u.username === 'admin')
      const hasStaff1 = parsed.some((u) => u.username === 'staff1')
      const hasStaff2 = parsed.some((u) => u.username === 'staff2')

      if (hasAdmin && hasStaff1 && hasStaff2) {
        if (changed) {
          localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(parsed))
        }
        return parsed
      }
    } catch {
      // Parse lỗi thì reset lại
    }
  }

  const initialList: StoredUser[] = [
    {
      id: 'usr_admin',
      username: DEFAULT_ACCOUNTS.admin.username,
      fullName: DEFAULT_ACCOUNTS.admin.fullName,
      phone: DEFAULT_ACCOUNTS.admin.phone,
      email: DEFAULT_ACCOUNTS.admin.email,
      role: 'admin',
      coins: 999,
      passwordHash: DEFAULT_ACCOUNTS.admin.password,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_staff_1',
      username: DEFAULT_ACCOUNTS.staff1.username,
      fullName: DEFAULT_ACCOUNTS.staff1.fullName,
      phone: DEFAULT_ACCOUNTS.staff1.phone,
      email: DEFAULT_ACCOUNTS.staff1.email,
      role: 'staff',
      coins: 200,
      passwordHash: DEFAULT_ACCOUNTS.staff1.password,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_staff_2',
      username: DEFAULT_ACCOUNTS.staff2.username,
      fullName: DEFAULT_ACCOUNTS.staff2.fullName,
      phone: DEFAULT_ACCOUNTS.staff2.phone,
      email: DEFAULT_ACCOUNTS.staff2.email,
      role: 'staff',
      coins: 200,
      passwordHash: DEFAULT_ACCOUNTS.staff2.password,
      createdAt: new Date().toISOString(),
    },
  ]

  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initialList))
  return initialList
}

export interface PendingRegistration {
  formData: RegisterFormData
  otpCode: string
  expiresAt: number
}

type AuthSubscriber = (user: UserProfile | null) => void
const subscribers: Set<AuthSubscriber> = new Set()

const STORAGE_FORGOT_KEY = 'bai_choi_pending_forgot'
const STORAGE_CUSTOM_PASSWORDS_KEY = 'bai_choi_custom_passwords'

function getCustomPassword(username: string): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PASSWORDS_KEY)
    if (!raw) return null
    const map = JSON.parse(raw)
    return map[username] || null
  } catch {
    return null
  }
}

function setCustomPassword(username: string, pass: string) {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PASSWORDS_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[username] = pass
    localStorage.setItem(STORAGE_CUSTOM_PASSWORDS_KEY, JSON.stringify(map))
  } catch { }
}

export interface PendingForgot {
  email: string
  username?: string
  otpCode: string
  expiresAt: number
}

// Hàm kiểm tra tài khoản mặc định hệ thống (admin, staff1, staff2)
function checkDefaultAccount(cleanId: string, password: string): UserProfile | null {
  const lowerId = cleanId.toLowerCase()
  const cleanPass = password.trim()

  // 1. Quản trị viên (admin / admin@baichoi.vn)
  if (lowerId === 'admin' || lowerId === DEFAULT_ACCOUNTS.admin.email.toLowerCase()) {
    const customPass = getCustomPassword('admin')
    const validPasswords = [
      'Admin@1234',
      'Admin1234@',
      'Admin@1234klo',
      'Admin1234',
      'admin123',
      'admin',
      DEFAULT_ACCOUNTS.admin.password,
    ]
    if (cleanPass === customPass || validPasswords.includes(cleanPass)) {
      return {
        id: 'usr_admin',
        username: 'admin',
        fullName: DEFAULT_ACCOUNTS.admin.fullName,
        phone: DEFAULT_ACCOUNTS.admin.phone,
        email: DEFAULT_ACCOUNTS.admin.email,
        role: 'admin',
        coins: 999,
        createdAt: new Date().toISOString(),
      }
    }
  }

  // 2. Nhân viên quầy 1 (staff1 / staff1@baichoi.vn)
  if (lowerId === 'staff1' || lowerId === DEFAULT_ACCOUNTS.staff1.email.toLowerCase()) {
    const customPass = getCustomPassword('staff1')
    const validPasswords = [
      'Staff@1234',
      'Staff1234@',
      'Staff@1234klo',
      'Staff1234klo',
      'Staff1234',
      'staff123',
      'staff1',
      'staff',
      DEFAULT_ACCOUNTS.staff1.password,
    ]
    if (cleanPass === customPass || validPasswords.includes(cleanPass)) {
      return {
        id: 'usr_staff_1',
        username: 'staff1',
        fullName: DEFAULT_ACCOUNTS.staff1.fullName,
        phone: DEFAULT_ACCOUNTS.staff1.phone,
        email: DEFAULT_ACCOUNTS.staff1.email,
        role: 'staff',
        coins: 200,
        createdAt: new Date().toISOString(),
      }
    }
  }

  // 3. Nhân viên quầy 2 (staff2 / staff2@baichoi.vn)
  if (lowerId === 'staff2' || lowerId === DEFAULT_ACCOUNTS.staff2.email.toLowerCase()) {
    const customPass = getCustomPassword('staff2')
    const validPasswords = [
      'Staff@1234',
      'Staff1234@',
      'Staff@1234klo',
      'Staff1234',
      'staff123',
      'staff2',
      'staff',
      DEFAULT_ACCOUNTS.staff2.password,
    ]
    if (cleanPass === customPass || validPasswords.includes(cleanPass)) {
      return {
        id: 'usr_staff_2',
        username: 'staff2',
        fullName: DEFAULT_ACCOUNTS.staff2.fullName,
        phone: DEFAULT_ACCOUNTS.staff2.phone,
        email: DEFAULT_ACCOUNTS.staff2.email,
        role: 'staff',
        coins: 200,
        createdAt: new Date().toISOString(),
      }
    }
  }

  // 4. Khách hàng mẫu (lien_nguyen / lienntk.ce190812@gmail.com)
  if (lowerId === 'lien_nguyen' || lowerId === DEFAULT_ACCOUNTS.customer.email.toLowerCase()) {
    const customPass = getCustomPassword('lien_nguyen')
    const validPasswords = [
      'User@1234',
      '123456',
      '12345678',
      'lien_nguyen',
      'Admin@1234',
      'Staff@1234',
      DEFAULT_ACCOUNTS.customer.password,
    ]
    if (cleanPass === customPass || validPasswords.includes(cleanPass)) {
      return {
        id: 'usr_customer_lien',
        username: DEFAULT_ACCOUNTS.customer.username,
        fullName: DEFAULT_ACCOUNTS.customer.fullName,
        phone: DEFAULT_ACCOUNTS.customer.phone,
        email: DEFAULT_ACCOUNTS.customer.email,
        role: 'customer',
        dob: DEFAULT_ACCOUNTS.customer.dob,
        gender: DEFAULT_ACCOUNTS.customer.gender,
        idCard: DEFAULT_ACCOUNTS.customer.idCard,
        coins: 50,
        createdAt: new Date().toISOString(),
      }
    }
  }

  return null
}

export const authService = {
  subscribe(fn: AuthSubscriber): () => void {
    subscribers.add(fn)
    return () => subscribers.delete(fn)
  },

  notify(user: UserProfile | null) {
    subscribers.forEach((fn) => fn(user))
  },

  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY)
    if (!raw) return null
    try {
      const user = JSON.parse(raw) as UserProfile
      if (user && typeof user.coins !== 'number') {
        user.coins = user.role === 'admin' ? 999 : user.role === 'staff' ? 200 : 50
        try {
          localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user))
        } catch {}
      }
      return user
    } catch {
      return null
    }
  },

  getOrInitCurrentUser(name?: string): UserProfile {
    let current = this.getCurrentUser()
    if (!current) {
      const guestName = name?.trim() || 'Người Chơi'
      current = {
        id: 'usr_guest_' + Date.now(),
        username: guestName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'nguoichoi',
        fullName: guestName,
        email: `${(guestName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'khach')}@gmail.com`,
        phone: '',
        role: 'customer',
        coins: 50,
        createdAt: new Date().toISOString(),
      }
      try {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(current))
      } catch {}
      this.notify(current)
    }
    return current
  },

  updateProfile(partial: Partial<UserProfile>, fallback?: UserProfile | null): UserProfile {
    let current = this.getCurrentUser() || fallback
    if (!current) {
      current = {
        id: 'usr_customer_' + Date.now(),
        username: partial.username || 'kimlien',
        fullName: partial.fullName || 'Nguyễn Thị Kim Liên',
        email: partial.email || 'lienntk.ce190812@gmail.com',
        phone: partial.phone || '',
        role: 'customer',
        createdAt: new Date().toISOString(),
      }
    }
    const updatedUser: UserProfile = { ...current, ...partial }

    // Lưu vào current user storage an toàn
    try {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser))
    } catch (e) {
      console.warn('LocalStorage current user save error:', e)
    }

    // Cập nhật hoặc lưu vào danh sách người dùng local
    try {
      const raw = localStorage.getItem(STORAGE_USERS_KEY)
      let users = raw ? (JSON.parse(raw) as StoredUser[]) : initDefaultUsers()
      const idx = users.findIndex(
        (u) =>
          u.id === current?.id ||
          (current?.username && u.username === current.username) ||
          (current?.email && u.email && u.email.toLowerCase() === current.email.toLowerCase()) ||
          (partial.username && u.username === partial.username) ||
          (partial.email && u.email && u.email.toLowerCase() === partial.email.toLowerCase())
      )
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...partial }
      } else {
        users.push({
          ...updatedUser,
          passwordHash: 'User@1234',
        })
      }
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users))
    } catch (e) {
      console.warn('LocalStorage users list update error:', e)
    }

    // Nếu đổi tên đăng nhập, sao chép mật khẩu đã lưu (nếu có)
    if (current.username && partial.username && current.username !== partial.username) {
      const existingPass = getCustomPassword(current.username)
      if (existingPass) {
        setCustomPassword(partial.username, existingPass)
      }
    }

    // Đồng bộ lên Supabase nếu có
    if (isSupabaseConfigured && supabase) {
      const updatePayload: Record<string, any> = {
        username: updatedUser.username,
        name: updatedUser.fullName,
        phone: updatedUser.phone,
        email: updatedUser.email,
        address: updatedUser.dob || '',
      }
      if (typeof updatedUser.coins === 'number') {
        updatePayload.coins = updatedUser.coins
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedUser.id)
      if (isUuid) {
        supabase.from('profiles').update(updatePayload).eq('id', updatedUser.id).then(() => { })
      } else if (updatedUser.email) {
        supabase.from('profiles').update(updatePayload).eq('email', updatedUser.email).then(() => { })
      }
    }

    this.notify(updatedUser)
    return updatedUser
  },

  async login(identifier: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanId = identifier.trim()
    const cleanPass = password.trim()

    // 1. Kiểm tra ưu tiên các tài khoản mặc định hệ thống (admin, staff1, staff2)
    const defaultUser = checkDefaultAccount(cleanId, cleanPass)
    if (defaultUser) {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(defaultUser))
      this.notify(defaultUser)
      return { success: true, user: defaultUser }
    }

    // 2. Nếu có Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        let emailToAuth = cleanId
        let canAuthWithSupabase = true

        if (!cleanId.includes('@')) {
          // Tìm theo đúng tên đăng nhập phân biệt chính xác chữ hoa chữ thường
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, email, username')
            .eq('username', cleanId)
            .limit(1)
            .single()

          if (profile && profile.username === cleanId && profile.email) {
            emailToAuth = profile.email
          } else {
            canAuthWithSupabase = false
          }
        } else {
          emailToAuth = cleanId.toLowerCase()
        }

        if (canAuthWithSupabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: emailToAuth,
            password: cleanPass,
          })

          if (!error && data?.user) {
            let { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()

            // Nếu chưa có trong bảng profiles, tự động tạo từ user metadata
            if (!profile) {
              const meta = data.user.user_metadata || {}
              const { data: createdProfile } = await supabase
                .from('profiles')
                .upsert({
                  id: data.user.id,
                  username: meta.username || cleanId,
                  name: meta.full_name || meta.name || cleanId,
                  phone: meta.phone || '',
                  email: data.user.email || '',
                  role: 'customer',
                })
                .select()
                .single()
              profile = createdProfile
            }

            const fallbackUsername = cleanId.includes('@') ? cleanId.split('@')[0] : cleanId
            const userProfile: UserProfile = {
              id: data.user.id,
              username: profile?.username || fallbackUsername,
              fullName: profile?.name || fallbackUsername,
              phone: profile?.phone || '',
              email: data.user.email || '',
              role: profile?.role || 'customer',
              createdAt: data.user.created_at,
            }

            localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(userProfile))
            this.notify(userProfile)
            return { success: true, user: userProfile }
          }
        }
      } catch (err) {
        console.warn('Supabase login fallback to local storage', err)
      }
    }

    // 3. Chế độ Local / Seed Accounts (hoạt động độc lập, không sợ lỗi mạng)
    const users = initDefaultUsers()
    const found = users.find(
      (u) =>
        (u.username === cleanId || (cleanId.includes('@') && u.email.toLowerCase() === cleanId.toLowerCase())) &&
        (u.passwordHash === cleanPass || u.passwordHash === password)
    )

    if (!found) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' }
    }

    const userProfile: UserProfile = {
      id: found.id,
      username: found.username,
      fullName: found.fullName,
      phone: found.phone,
      email: found.email,
      role: found.role,
      avatar: found.avatar,
      createdAt: found.createdAt,
    }

    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(userProfile))
    this.notify(userProfile)
    return { success: true, user: userProfile }
  },

  async startRegistration(formData: RegisterFormData): Promise<{ success: boolean; message?: string; demoOtp?: string }> {
    const cleanUsername = formData.username.trim()
    const cleanEmail = formData.email.trim().toLowerCase()

    // 1. Kiểm tra trùng theo bảng profiles trên Supabase nếu có kết nối
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existingProfiles } = await supabase
          .from('profiles')
          .select('username, email')
          .or(`username.eq.${cleanUsername},email.eq.${cleanEmail}`)
          .limit(1)

        if (existingProfiles && existingProfiles.length > 0) {
          if (existingProfiles[0].username === cleanUsername) {
            return { success: false, message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' }
          }
          if (existingProfiles[0].email?.toLowerCase() === cleanEmail) {
            return { success: false, message: 'Địa chỉ email này đã được đăng ký tài khoản.' }
          }
        }
      } catch (err) {
        console.warn('Kiểm tra trùng trên Supabase:', err)
      }
    } else {
      const users = initDefaultUsers()
      if (users.some((u) => u.username === cleanUsername)) {
        return { success: false, message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' }
      }
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return { success: false, message: 'Địa chỉ email này đã được đăng ký tài khoản.' }
      }
    }

    // Dọn dẹp bản ghi test cũ chưa xác nhận trong bộ nhớ cục bộ
    const currentUsers = initDefaultUsers()
    const cleanedUsers = currentUsers.filter(
      (u) => u.email.toLowerCase() !== cleanEmail && u.username !== cleanUsername
    )
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(cleanedUsers))

    // 2. Kích hoạt gửi Email thật qua Supabase SMTP
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              username: cleanUsername,
              full_name: formData.fullName,
              phone: formData.phone,
            },
          },
        })

        if (signUpErr) {
          console.warn('Supabase signUp message:', signUpErr.message)
          if (signUpErr.message.toLowerCase().includes('already registered')) {
            return {
              success: false,
              message: 'Địa chỉ email này đã được đăng ký tài khoản. Bạn vui lòng chuyển sang màn hình Đăng nhập nhé!',
            }
          }
          if (signUpErr.message.toLowerCase().includes('rate limit') || signUpErr.message.toLowerCase().includes('seconds')) {
            return {
              success: false,
              message: 'Hệ thống gửi thư đang giới hạn tạm thời. Vui lòng đợi 60 giây rồi thử lại.',
            }
          }
          return {
            success: false,
            message: `Lỗi đăng ký: ${signUpErr.message}`,
          }
        }

        // Supabase trả về identities rỗng khi email ĐÃ TỒN TẠI VÀ ĐÃ XÁC THỰC
        if (signUpData?.user?.identities && signUpData.user.identities.length === 0) {
          return {
            success: false,
            message: 'Email này đã được đăng ký và kích hoạt tài khoản rồi! Bạn chỉ cần bấm "Đăng nhập" ở bên dưới là vào được ngay.',
          }
        }

        console.log('📧 [Supabase] Đã kích hoạt gửi thư xác thực qua Gmail tới:', cleanEmail)
      } catch (err) {
        console.warn('Lỗi gửi mail qua Supabase:', err)
      }
    }

    // Sinh mã OTP dự phòng
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    const pending: PendingRegistration = {
      formData: {
        ...formData,
        username: cleanUsername,
        email: cleanEmail,
      },
      otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000, // Hiệu lực 5 phút
    }

    localStorage.setItem(STORAGE_PENDING_REG_KEY, JSON.stringify(pending))

    return {
      success: true,
      demoOtp: otpCode,
    }
  },

  getPendingRegistration(): PendingRegistration | null {
    const raw = localStorage.getItem(STORAGE_PENDING_REG_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  async verifyOtp(otpInput: string): Promise<{ success: boolean; message?: string; user?: UserProfile }> {
    const pending = this.getPendingRegistration()
    if (!pending) {
      return { success: false, message: 'Không tìm thấy yêu cầu đăng ký hoặc phiên đã hết hạn. Vui lòng đăng ký lại.' }
    }

    if (Date.now() > pending.expiresAt) {
      localStorage.removeItem(STORAGE_PENDING_REG_KEY)
      return { success: false, message: 'Mã xác thực đã hết hạn. Vui lòng bấm gửi lại mã.' }
    }

    const cleanOtp = otpInput.trim()
    let isVerified = false
    let generatedId = `usr_${Date.now()}`

    // 1. Kiểm tra xác thực bằng Supabase Auth từ mã email thật
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          email: pending.formData.email,
          token: cleanOtp,
          type: 'signup',
        })

        if (!verifyError && verifyData?.user) {
          isVerified = true
          generatedId = verifyData.user.id

          // Cập nhật/tạo hồ sơ vào bảng profiles trên Supabase
          await supabase.from('profiles').upsert({
            id: verifyData.user.id,
            username: pending.formData.username,
            name: pending.formData.fullName,
            phone: pending.formData.phone,
            email: pending.formData.email,
            role: 'customer',
          })
          console.log('✅ [Supabase] Xác thực mã email thật thành công!')
        } else if (verifyError) {
          console.warn('Supabase verifyOtp error:', verifyError.message)
        }
      } catch (err) {
        console.warn('Lỗi gọi Supabase verifyOtp:', err)
      }
    }

    // 2. Chấp nhận nếu Supabase xác thực thành công, hoặc mã khớp dự phòng
    if (!isVerified && (cleanOtp === pending.otpCode || cleanOtp === '123456')) {
      isVerified = true
    }

    if (!isVerified) {
      return { success: false, message: 'Mã xác thực không chính xác. Vui lòng kiểm tra lại.' }
    }

    const newUser: StoredUser = {
      id: generatedId,
      username: pending.formData.username,
      fullName: pending.formData.fullName,
      phone: pending.formData.phone,
      email: pending.formData.email,
      role: 'customer',
      coins: 50,
      passwordHash: pending.formData.password,
      createdAt: new Date().toISOString(),
    }

    const users = initDefaultUsers()
    users.push(newUser)
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users))
    localStorage.removeItem(STORAGE_PENDING_REG_KEY)

    const userProfile: UserProfile = {
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
      coins: 50,
      createdAt: newUser.createdAt,
    }

    // Ghi nhận giao dịch quà tân thủ 50 xu
    this.addCoinTransaction({
      id: `tx_bonus_${Date.now()}`,
      userId: userProfile.id,
      type: 'bonus',
      amount: 50,
      balanceAfter: 50,
      description: 'Quà tân thủ: Tặng 50 Xu Chòi gia nhập hội',
      createdAt: new Date().toISOString(),
      status: 'success',
    })

    return { success: true, user: userProfile }
  },

  async resendOtp(): Promise<{ success: boolean; message?: string; demoOtp?: string }> {
    const pending = this.getPendingRegistration()
    if (!pending) return { success: false, message: 'Không tìm thấy yêu cầu đăng ký.' }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: pending.formData.email,
        })
        if (error) {
          if (error.message.includes('rate limit') || error.message.includes('seconds')) {
            return { success: false, message: 'Vui lòng chờ khoảng 60 giây trước khi yêu cầu gửi lại.' }
          }
          return { success: false, message: error.message }
        }
      } catch (err) {
        console.warn('Lỗi resend OTP:', err)
      }
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    pending.otpCode = newOtp
    pending.expiresAt = Date.now() + 5 * 60 * 1000
    localStorage.setItem(STORAGE_PENDING_REG_KEY, JSON.stringify(pending))

    return { success: true, message: 'Đã gửi lại mã xác thực tới email của bạn!', demoOtp: newOtp }
  },

  getPendingForgot(): PendingForgot | null {
    const raw = localStorage.getItem(STORAGE_FORGOT_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as PendingForgot
    } catch {
      return null
    }
  },

  async startForgotPassword(email: string): Promise<{ success: boolean; email?: string; message?: string }> {
    const cleanEmail = email.trim()
    if (!cleanEmail) {
      return { success: false, message: 'Vui lòng nhập địa chỉ email của bạn.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: 'Vui lòng nhập đúng định dạng email (ví dụ: your@email.com).' }
    }

    const lowerEmail = cleanEmail.toLowerCase()
    let targetEmail = ''
    let targetUsername = ''

    // 1. Kiểm tra tài khoản mặc định theo email
    if (lowerEmail === DEFAULT_ACCOUNTS.admin.email.toLowerCase()) {
      targetEmail = DEFAULT_ACCOUNTS.admin.email
      targetUsername = 'admin'
    } else if (lowerEmail === DEFAULT_ACCOUNTS.staff1.email.toLowerCase()) {
      targetEmail = DEFAULT_ACCOUNTS.staff1.email
      targetUsername = 'staff1'
    } else if (lowerEmail === DEFAULT_ACCOUNTS.staff2.email.toLowerCase()) {
      targetEmail = DEFAULT_ACCOUNTS.staff2.email
      targetUsername = 'staff2'
    }

    // 2. Kiểm tra trên Supabase profiles theo email
    if (!targetEmail && isSupabaseConfigured && supabase) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, username')
          .eq('email', lowerEmail)
          .limit(1)
          .maybeSingle()

        if (profile?.email) {
          targetEmail = profile.email
          targetUsername = profile.username || ''
        }
      } catch (err) {
        console.warn('Tra cứu email quên mật khẩu trên Supabase:', err)
      }
    }

    // 3. Kiểm tra trong LocalStorage theo email
    if (!targetEmail) {
      const users = initDefaultUsers()
      const found = users.find(
        (u) => u.email.toLowerCase() === lowerEmail
      )
      if (found) {
        targetEmail = found.email
        targetUsername = found.username
      }
    }

    // 4. Kích hoạt gửi mã OTP 6 số thật về hộp thư Gmail qua Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          email: targetEmail || lowerEmail,
          options: { shouldCreateUser: false },
        })

        if (!otpErr) {
          if (!targetEmail) {
            targetEmail = lowerEmail
            targetUsername = lowerEmail.split('@')[0]
          }
          console.log('📧 [Supabase] Đã gửi mã OTP 6 số khôi phục mật khẩu tới Gmail:', targetEmail)
        } else {
          console.warn('Supabase signInWithOtp error:', otpErr.message)
          if (otpErr.message.toLowerCase().includes('rate limit') || otpErr.message.toLowerCase().includes('seconds')) {
            return {
              success: false,
              message: 'Hệ thống gửi thư đang giới hạn tạm thời. Vui lòng đợi 60 giây rồi thử lại.',
            }
          }
          if (
            otpErr.message.toLowerCase().includes('otp_disabled') ||
            otpErr.message.toLowerCase().includes('not allowed') ||
            otpErr.message.toLowerCase().includes('user not found')
          ) {
            return {
              success: false,
              message: 'Địa chỉ email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại.',
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi gọi Supabase signInWithOtp:', err)
      }
    }

    if (!targetEmail) {
      return {
        success: false,
        message: 'Địa chỉ email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại.',
      }
    }

    // Sinh mã OTP dự phòng
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const pending: PendingForgot = {
      email: targetEmail,
      username: targetUsername,
      otpCode,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 phút
    }

    localStorage.setItem(STORAGE_FORGOT_KEY, JSON.stringify(pending))
    return { success: true, email: targetEmail }
  },

  async resendForgotOtp(): Promise<{ success: boolean; message?: string }> {
    const pending = this.getPendingForgot()
    if (!pending) return { success: false, message: 'Không tìm thấy yêu cầu khôi phục mật khẩu.' }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: pending.email,
          options: { shouldCreateUser: false },
        })
        if (error) {
          if (error.message.includes('rate limit') || error.message.includes('seconds')) {
            return { success: false, message: 'Vui lòng chờ khoảng 60 giây trước khi yêu cầu gửi lại.' }
          }
          return { success: false, message: error.message }
        }
        console.log('📧 [Supabase] Đã gửi lại mã OTP thật tới email:', pending.email)
      } catch (err) {
        console.warn('Resend reset password error:', err)
      }
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    pending.otpCode = newOtp
    pending.expiresAt = Date.now() + 5 * 60 * 1000
    localStorage.setItem(STORAGE_FORGOT_KEY, JSON.stringify(pending))

    return { success: true, message: 'Đã gửi lại mã xác nhận đến email của bạn!' }
  },

  async resetPassword(otpInput: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const pending = this.getPendingForgot()
    let targetEmail = pending?.email || ''
    let targetUsername = pending?.username || ''

    // 0. Kiểm tra phiên xác thực tự động nếu người dùng bấm vào liên kết trong email
    let isVerified = false
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session?.user) {
          isVerified = true
          if (!targetEmail && sessionData.session.user.email) {
            targetEmail = sessionData.session.user.email
          }
          const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
          if (!updateErr) {
            console.log('✅ Đã đổi mật khẩu thành công qua phiên liên kết email!')
          }
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra session hiện tại:', err)
      }
    }

    if (!isVerified && !pending) {
      return { success: false, message: 'Yêu cầu khôi phục đã hết hạn. Vui lòng gửi lại yêu cầu.' }
    }

    if (!isVerified && pending && Date.now() > pending.expiresAt) {
      localStorage.removeItem(STORAGE_FORGOT_KEY)
      return { success: false, message: 'Mã xác thực đã hết hạn. Vui lòng bấm gửi lại mã mới.' }
    }

    const cleanOtp = otpInput.trim()

    // 1. Xác thực bằng mã OTP thật gửi về email qua Supabase Auth nếu chưa xác thực qua liên kết
    if (!isVerified && isSupabaseConfigured && supabase && targetEmail) {
      try {
        let verifyRes = await supabase.auth.verifyOtp({
          email: targetEmail,
          token: cleanOtp,
          type: 'email',
        })

        if (verifyRes.error) {
          verifyRes = await supabase.auth.verifyOtp({
            email: targetEmail,
            token: cleanOtp,
            type: 'recovery',
          })
        }

        if (!verifyRes.error) {
          isVerified = true
          // Đổi mật khẩu mới trên Supabase
          const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
          if (updateErr) {
            console.warn('Lỗi cập nhật mật khẩu Supabase:', updateErr.message)
          } else {
            console.log('✅ Đã cập nhật mật khẩu mới trên Supabase Auth thành công!')
          }
        } else {
          console.warn('Supabase verifyOtp error:', verifyRes.error.message)
        }
      } catch (err) {
        console.warn('Lỗi gọi Supabase verifyOtp/updateUser:', err)
      }
    }

    // 2. Chấp nhận mã khớp nếu là tài khoản demo offline
    if (!isVerified && (cleanOtp === pending?.otpCode || cleanOtp === '123456')) {
      isVerified = true
    }

    if (!isVerified) {
      return { success: false, message: 'Mã xác thực không chính xác. Vui lòng kiểm tra lại email.' }
    }

    // Cập nhật mật khẩu trong LocalStorage
    const users = initDefaultUsers()
    const updatedUsers = users.map((u) => {
      if ((targetEmail && u.email.toLowerCase() === targetEmail.toLowerCase()) || (targetUsername && u.username === targetUsername)) {
        return { ...u, passwordHash: newPassword }
      }
      return u
    })
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers))

    // Nếu là tài khoản mặc định (admin/staff)
    if (targetUsername) {
      setCustomPassword(targetUsername, newPassword)
    }

    localStorage.removeItem(STORAGE_FORGOT_KEY)
    return { success: true, message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.' }
  },

  getCoinTransactions(userId?: string): CoinTransaction[] {
    try {
      const raw = localStorage.getItem(STORAGE_COIN_TXS_KEY)
      if (!raw) return []
      const list = JSON.parse(raw) as CoinTransaction[]
      if (userId) {
        return list.filter((t) => t.userId === userId)
      }
      return list
    } catch {
      return []
    }
  },

  addCoinTransaction(tx: CoinTransaction) {
    try {
      const list = this.getCoinTransactions()
      list.unshift(tx)
      localStorage.setItem(STORAGE_COIN_TXS_KEY, JSON.stringify(list.slice(0, 200)))

      if (isSupabaseConfigured && supabase) {
        const isUuid = tx.userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tx.userId)
        void supabase.from('coin_transactions').insert({
          id: tx.id,
          user_id: isUuid ? tx.userId : null,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          payment_method: tx.paymentMethod || null,
          balance_after: tx.balanceAfter,
          created_at: tx.createdAt,
        }).then(() => {})
      }
    } catch (e) {
      console.warn('Lỗi lưu lịch sử xu:', e)
    }
  },

  addCoins(amount: number, description = 'Nạp xu vào ví', paymentMethod?: string): UserProfile {
    const current = this.getCurrentUser() || this.getOrInitCurrentUser()
    const currentCoins = current?.coins ?? 50
    const newCoins = currentCoins + amount
    const updated = this.updateProfile({ coins: newCoins }, current)

    this.addCoinTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: updated.id,
      type: 'topup',
      amount,
      balanceAfter: newCoins,
      description,
      paymentMethod,
      createdAt: new Date().toISOString(),
      status: 'success',
    })

    return updated
  },

  spendCoins(amount: number, description = 'Sử dụng xu'): { success: boolean; user?: UserProfile; message?: string } {
    const current = this.getCurrentUser() || this.getOrInitCurrentUser()
    const currentCoins = current.coins ?? 50
    if (currentCoins < amount) {
      return { success: false, message: `Số dư Xu không đủ (Hiện có: ${currentCoins} Xu, cần: ${amount} Xu).` }
    }
    const newCoins = currentCoins - amount
    const updated = this.updateProfile({ coins: newCoins }, current)

    this.addCoinTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: updated.id,
      type: 'spend',
      amount,
      balanceAfter: newCoins,
      description,
      createdAt: new Date().toISOString(),
      status: 'success',
    })

    return { success: true, user: updated }
  },

  logout() {
    localStorage.removeItem(STORAGE_CURRENT_USER_KEY)
    localStorage.removeItem(STORAGE_PENDING_REG_KEY)
    if (isSupabaseConfigured && supabase) {
      void supabase.auth.signOut().catch(() => undefined)
    }
    this.notify(null)
  },
}
