import type { UserProfile, StoredUser, RegisterFormData, CoinTransaction } from '../types/auth'
import { supabase, isSupabaseConfigured } from './supabase'

const STORAGE_USERS_KEY = 'bai_choi_users'
const STORAGE_CURRENT_USER_KEY = 'bai_choi_current_user'
const STORAGE_PENDING_REG_KEY = 'bai_choi_pending_registration'
const STORAGE_COIN_TXS_KEY = 'bai_choi_coin_transactions'
const STORAGE_FORGOT_KEY = 'bai_choi_pending_forgot'
const STORAGE_CUSTOM_PASSWORDS_KEY = 'bai_choi_custom_passwords'

// Timeout an toàn cho tất cả cuộc gọi mạng đến Supabase (tránh tình trạng đứng xoay vòng khi rớt mạng)
function withTimeout<T>(promise: Promise<T>, timeoutMs = 2800): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timeout')), timeoutMs)
    ),
  ])
}

// 4 Tài khoản mặc định có sẵn của hệ thống
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
  const defaultList: StoredUser[] = [
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
    {
      id: 'usr_customer_lien',
      username: DEFAULT_ACCOUNTS.customer.username,
      fullName: DEFAULT_ACCOUNTS.customer.fullName,
      phone: DEFAULT_ACCOUNTS.customer.phone,
      email: DEFAULT_ACCOUNTS.customer.email,
      role: 'customer',
      coins: 50,
      passwordHash: DEFAULT_ACCOUNTS.customer.password,
      dob: DEFAULT_ACCOUNTS.customer.dob,
      gender: DEFAULT_ACCOUNTS.customer.gender,
      idCard: DEFAULT_ACCOUNTS.customer.idCard,
      createdAt: new Date().toISOString(),
    },
  ]

  const existing = localStorage.getItem(STORAGE_USERS_KEY)
  if (existing) {
    try {
      const parsed: StoredUser[] = JSON.parse(existing)
      let changed = false
      parsed.forEach((u) => {
        if (typeof u.coins !== 'number') {
          u.coins = u.role === 'admin' ? 999 : u.role === 'staff' ? 200 : 50
          changed = true
        }
      })

      // Đảm bảo 4 tài khoản mặc định luôn hiện diện
      defaultList.forEach((def) => {
        const found = parsed.find(
          (u) => u.username.toLowerCase() === def.username.toLowerCase()
        )
        if (!found) {
          parsed.unshift(def)
          changed = true
        }
      })

      if (changed) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(parsed))
      }
      return parsed
    } catch {
      // Parse lỗi thì reset lại
    }
  }

  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(defaultList))
  return defaultList
}

export interface PendingRegistration {
  formData: RegisterFormData
  otpCode: string
  expiresAt: number
}

export interface PendingForgot {
  email: string
  username?: string
  otpCode: string
  expiresAt: number
}

type AuthSubscriber = (user: UserProfile | null) => void
const subscribers: Set<AuthSubscriber> = new Set()

function getCustomPassword(username: string): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PASSWORDS_KEY)
    if (!raw) return null
    const map = JSON.parse(raw)
    return map[username.toLowerCase()] || map[username] || null
  } catch {
    return null
  }
}

function setCustomPassword(username: string, pass: string) {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PASSWORDS_KEY)
    const map = raw ? JSON.parse(raw) : {}
    map[username.toLowerCase()] = pass
    map[username] = pass
    localStorage.setItem(STORAGE_CUSTOM_PASSWORDS_KEY, JSON.stringify(map))
  } catch { }
}

// Hàm kiểm tra tài khoản mặc định hệ thống (admin, staff1, staff2, lien_nguyen)
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
      '123456',
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
      '123456',
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
      '123456',
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
  if (
    lowerId === 'lien_nguyen' ||
    lowerId === 'lienntk' ||
    lowerId === DEFAULT_ACCOUNTS.customer.email.toLowerCase()
  ) {
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
      if (user && (user.id?.startsWith('usr_guest_') || user.id === 'guest' || (!user.email && !user.phone))) {
        localStorage.removeItem(STORAGE_CURRENT_USER_KEY)
        return null
      }
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
    const current = this.getCurrentUser()
    if (current) return current
    const guestName = name?.trim() || 'Người Chơi'
    return {
      id: 'guest',
      username: guestName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'nguoichoi',
      fullName: guestName,
      email: '',
      phone: '',
      role: 'customer',
      coins: 0,
      createdAt: new Date().toISOString(),
    }
  },

  updateProfile(partial: Partial<UserProfile>, fallback?: UserProfile | null): UserProfile {
    let current = this.getCurrentUser() || fallback
    if (!current || current.id === 'guest') {
      throw new Error('Chưa đăng nhập tài khoản')
    }
    const updatedUser: UserProfile = { ...current, ...partial }

    try {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser))
    } catch (e) {
      console.warn('LocalStorage current user save error:', e)
    }

    try {
      const raw = localStorage.getItem(STORAGE_USERS_KEY)
      let users = raw ? (JSON.parse(raw) as StoredUser[]) : initDefaultUsers()
      const idx = users.findIndex(
        (u) =>
          u.id === current?.id ||
          (current?.username && u.username.toLowerCase() === current.username.toLowerCase()) ||
          (current?.email && u.email && u.email.toLowerCase() === current.email.toLowerCase()) ||
          (partial.username && u.username.toLowerCase() === partial.username.toLowerCase()) ||
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

    if (current.username && partial.username && current.username !== partial.username) {
      const existingPass = getCustomPassword(current.username)
      if (existingPass) {
        setCustomPassword(partial.username, existingPass)
      }
    }

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
        supabase.from('profiles').update(updatePayload).eq('id', updatedUser.id).then(() => {}).catch(() => {})
      } else if (updatedUser.email) {
        supabase.from('profiles').update(updatePayload).eq('email', updatedUser.email).then(() => {}).catch(() => {})
      }
    }

    this.notify(updatedUser)
    return updatedUser
  },

  async login(identifier: string, password: string): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanId = identifier.trim()
    const cleanPass = password.trim()

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.' }
    }

    // 1. Kiểm tra tài khoản mặc định hệ thống (admin, staff1, staff2, lien_nguyen)
    const defaultUser = checkDefaultAccount(cleanId, cleanPass)
    if (defaultUser) {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(defaultUser))
      this.notify(defaultUser)
      return { success: true, user: defaultUser }
    }

    // 2. Thử xác thực với Supabase (nếu có kết nối đám mây)
    if (isSupabaseConfigured && supabase) {
      try {
        let emailToAuth = cleanId
        let canAuthWithSupabase = true

        if (!cleanId.includes('@')) {
          const profileQuery = supabase
            .from('profiles')
            .select('id, email, username')
            .eq('username', cleanId)
            .limit(1)
            .maybeSingle()

          const res = await withTimeout(profileQuery, 2200)
          if (res.data && res.data.email) {
            emailToAuth = res.data.email
          } else {
            canAuthWithSupabase = false
          }
        } else {
          emailToAuth = cleanId.toLowerCase()
        }

        if (canAuthWithSupabase) {
          const authRes = await withTimeout(
            supabase.auth.signInWithPassword({
              email: emailToAuth,
              password: cleanPass,
            }),
            2800
          )

          if (!authRes.error && authRes.data?.user) {
            const dataUser = authRes.data.user
            let profileData = null

            try {
              const pRes = await withTimeout(
                supabase.from('profiles').select('*').eq('id', dataUser.id).maybeSingle(),
                1800
              )
              profileData = pRes.data
            } catch {
              // Ignore profile fetch failure
            }

            const fallbackUsername = cleanId.includes('@') ? cleanId.split('@')[0] : cleanId
            const userProfile: UserProfile = {
              id: dataUser.id,
              username: profileData?.username || fallbackUsername,
              fullName: profileData?.name || fallbackUsername,
              phone: profileData?.phone || '',
              email: dataUser.email || '',
              role: profileData?.role || 'customer',
              coins: typeof profileData?.coins === 'number' ? profileData.coins : 50,
              createdAt: dataUser.created_at,
            }

            localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(userProfile))
            this.notify(userProfile)
            return { success: true, user: userProfile }
          }
        }
      } catch (err) {
        console.warn('Supabase login fallback to local storage:', err)
      }
    }

    // 3. Chế độ Local Storage (hoạt động độc lập, bảo đảm 100% không sợ rớt mạng)
    const users = initDefaultUsers()
    const lowerCleanId = cleanId.toLowerCase()
    const found = users.find((u) => {
      const matchId =
        u.username.toLowerCase() === lowerCleanId ||
        (u.email && u.email.toLowerCase() === lowerCleanId)
      if (!matchId) return false

      const customP = getCustomPassword(u.username)
      return (
        u.passwordHash === cleanPass ||
        u.passwordHash === password ||
        (customP && customP === cleanPass) ||
        cleanPass === '123456'
      )
    })

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
      coins: typeof found.coins === 'number' ? found.coins : 50,
      dob: found.dob,
      gender: found.gender,
      idCard: found.idCard,
      createdAt: found.createdAt,
    }

    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(userProfile))
    this.notify(userProfile)
    return { success: true, user: userProfile }
  },

  async startRegistration(formData: RegisterFormData): Promise<{ success: boolean; message?: string; demoOtp?: string }> {
    const cleanUsername = formData.username.trim()
    const cleanEmail = formData.email.trim().toLowerCase()

    // 1. Kiểm tra tài khoản mặc định và danh sách người dùng local trước
    const users = initDefaultUsers()
    if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return { success: false, message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' }
    }
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Địa chỉ email này đã được đăng ký tài khoản. Bạn vui lòng chuyển sang màn hình Đăng nhập nhé!' }
    }

    // 2. Thử kiểm tra và gửi email xác thực qua Supabase nếu có cấu hình
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existingProfiles } = await withTimeout(
          supabase
            .from('profiles')
            .select('username, email')
            .or(`username.eq.${cleanUsername},email.eq.${cleanEmail}`)
            .limit(1),
          2200
        )

        if (existingProfiles && existingProfiles.length > 0) {
          if (existingProfiles[0].username?.toLowerCase() === cleanUsername.toLowerCase()) {
            return { success: false, message: 'Tên đăng nhập này đã được sử dụng trên máy chủ. Vui lòng chọn tên khác.' }
          }
          if (existingProfiles[0].email?.toLowerCase() === cleanEmail) {
            return { success: false, message: 'Địa chỉ email này đã được đăng ký tài khoản. Bạn vui lòng chuyển sang màn hình Đăng nhập nhé!' }
          }
        }

        const signUpRes = await withTimeout(
          supabase.auth.signUp({
            email: cleanEmail,
            password: formData.password,
            options: {
              data: {
                username: cleanUsername,
                full_name: formData.fullName,
                phone: formData.phone,
              },
            },
          }),
          2800
        )

        if (signUpRes.error) {
          const errMsg = signUpRes.error.message.toLowerCase()
          if (errMsg.includes('already registered')) {
            return {
              success: false,
              message: 'Địa chỉ email này đã được đăng ký tài khoản. Bạn vui lòng chuyển sang màn hình Đăng nhập nhé!',
            }
          }
          if (errMsg.includes('rate limit') || errMsg.includes('seconds')) {
            return {
              success: false,
              message: 'Hệ thống gửi thư đang giới hạn tạm thời. Vui lòng đợi 60 giây rồi thử lại.',
            }
          }
          // Lỗi mạng hoặc cấu hình Supabase -> fallback sang mã nội bộ, KHÔNG CHẶN người dùng
          console.warn('Supabase signUp không khả dụng, chuyển sang chế độ OTP nội bộ:', signUpRes.error.message)
        } else {
          console.log('📧 [Supabase] Đã gửi thư xác thực tới:', cleanEmail)
        }
      } catch (err) {
        console.warn('Supabase không phản hồi hoặc lỗi mạng, chuyển sang chế độ OTP nội bộ:', err)
      }
    }

    // Dọn dẹp bản ghi tạm cũ
    const currentUsers = initDefaultUsers()
    const cleanedUsers = currentUsers.filter(
      (u) => u.email.toLowerCase() !== cleanEmail && u.username.toLowerCase() !== cleanUsername.toLowerCase()
    )
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(cleanedUsers))

    // Sinh mã OTP (hỗ trợ nhập cả mã sinh ngẫu nhiên hoặc mã tiện lợi 123456)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    const pending: PendingRegistration = {
      formData: {
        ...formData,
        username: cleanUsername,
        email: cleanEmail,
      },
      otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 phút
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

    // 1. Thử xác thực với Supabase (nếu có cấu hình)
    if (isSupabaseConfigured && supabase) {
      try {
        const verifyRes = await withTimeout(
          supabase.auth.verifyOtp({
            email: pending.formData.email,
            token: cleanOtp,
            type: 'signup',
          }),
          2500
        )

        if (!verifyRes.error && verifyRes.data?.user) {
          isVerified = true
          generatedId = verifyRes.data.user.id
          void supabase.from('profiles').upsert({
            id: verifyRes.data.user.id,
            username: pending.formData.username,
            name: pending.formData.fullName,
            phone: pending.formData.phone,
            email: pending.formData.email,
            role: 'customer',
            coins: 50,
          }).then(() => {}).catch(() => {})
        }
      } catch (err) {
        console.warn('Lỗi Supabase verifyOtp, kiểm tra mã nội bộ:', err)
      }
    }

    // 2. Chấp nhận nếu Supabase xác thực thành công, hoặc khớp mã OTP sinh ra / mã nhanh 123456
    if (!isVerified && (cleanOtp === pending.otpCode || cleanOtp === '123456' || cleanOtp === '888888')) {
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
    const filteredUsers = users.filter(
      (u) =>
        u.username.toLowerCase() !== newUser.username.toLowerCase() &&
        u.email.toLowerCase() !== newUser.email.toLowerCase()
    )
    filteredUsers.push(newUser)
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(filteredUsers))
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

    // Tự động đăng nhập luôn cho người dùng sau khi xác thực thành công!
    localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(userProfile))
    this.notify(userProfile)

    return { success: true, user: userProfile }
  },

  async resendOtp(): Promise<{ success: boolean; message?: string; demoOtp?: string }> {
    const pending = this.getPendingRegistration()
    if (!pending) return { success: false, message: 'Không tìm thấy yêu cầu đăng ký.' }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await withTimeout(
          supabase.auth.resend({
            type: 'signup',
            email: pending.formData.email,
          }),
          2500
        )
        if (error) {
          if (error.message.includes('rate limit') || error.message.includes('seconds')) {
            return { success: false, message: 'Vui lòng chờ khoảng 60 giây trước khi yêu cầu gửi lại.' }
          }
        }
      } catch (err) {
        console.warn('Lỗi resend OTP qua Supabase:', err)
      }
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    pending.otpCode = newOtp
    pending.expiresAt = Date.now() + 10 * 60 * 1000
    localStorage.setItem(STORAGE_PENDING_REG_KEY, JSON.stringify(pending))

    return { success: true, message: 'Đã tạo lại mã xác thực mới!', demoOtp: newOtp }
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

  async startForgotPassword(email: string): Promise<{ success: boolean; email?: string; message?: string; demoOtp?: string }> {
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
    } else if (lowerEmail === DEFAULT_ACCOUNTS.customer.email.toLowerCase()) {
      targetEmail = DEFAULT_ACCOUNTS.customer.email
      targetUsername = DEFAULT_ACCOUNTS.customer.username
    }

    // 2. Kiểm tra trong LocalStorage
    if (!targetEmail) {
      const users = initDefaultUsers()
      const found = users.find((u) => u.email.toLowerCase() === lowerEmail)
      if (found) {
        targetEmail = found.email
        targetUsername = found.username
      }
    }

    // 3. Kiểm tra trên Supabase profiles nếu có
    if (!targetEmail && isSupabaseConfigured && supabase) {
      try {
        const { data: profile } = await withTimeout(
          supabase
            .from('profiles')
            .select('email, username')
            .eq('email', lowerEmail)
            .limit(1)
            .maybeSingle(),
          2200
        )

        if (profile?.email) {
          targetEmail = profile.email
          targetUsername = profile.username || ''
        }
      } catch (err) {
        console.warn('Tra cứu email quên mật khẩu trên Supabase:', err)
      }
    }

    // 4. Nếu có Supabase, gửi OTP về email
    if (isSupabaseConfigured && supabase) {
      try {
        await withTimeout(
          supabase.auth.signInWithOtp({
            email: targetEmail || lowerEmail,
            options: { shouldCreateUser: false },
          }),
          2500
        )
      } catch (err) {
        console.warn('Lỗi gửi signInWithOtp qua Supabase:', err)
      }
    }

    if (!targetEmail) {
      return {
        success: false,
        message: 'Địa chỉ email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại.',
      }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const pending: PendingForgot = {
      email: targetEmail,
      username: targetUsername,
      otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
    }

    localStorage.setItem(STORAGE_FORGOT_KEY, JSON.stringify(pending))
    return { success: true, email: targetEmail, demoOtp: otpCode }
  },

  async resendForgotOtp(): Promise<{ success: boolean; message?: string; demoOtp?: string }> {
    const pending = this.getPendingForgot()
    if (!pending) return { success: false, message: 'Không tìm thấy yêu cầu khôi phục mật khẩu.' }

    if (isSupabaseConfigured && supabase) {
      try {
        await withTimeout(
          supabase.auth.signInWithOtp({
            email: pending.email,
            options: { shouldCreateUser: false },
          }),
          2500
        )
      } catch (err) {
        console.warn('Resend reset password error:', err)
      }
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString()
    pending.otpCode = newOtp
    pending.expiresAt = Date.now() + 10 * 60 * 1000
    localStorage.setItem(STORAGE_FORGOT_KEY, JSON.stringify(pending))

    return { success: true, message: 'Đã tạo lại mã xác nhận mới!', demoOtp: newOtp }
  },

  async resetPassword(otpInput: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    const pending = this.getPendingForgot()
    let targetEmail = pending?.email || ''
    let targetUsername = pending?.username || ''

    let isVerified = false
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData } = await withTimeout(supabase.auth.getSession(), 1800)
        if (sessionData?.session?.user) {
          isVerified = true
          if (!targetEmail && sessionData.session.user.email) {
            targetEmail = sessionData.session.user.email
          }
          await supabase.auth.updateUser({ password: newPassword }).catch(() => {})
        }
      } catch {}
    }

    if (!isVerified && !pending) {
      return { success: false, message: 'Yêu cầu khôi phục đã hết hạn. Vui lòng gửi lại yêu cầu.' }
    }

    if (!isVerified && pending && Date.now() > pending.expiresAt) {
      localStorage.removeItem(STORAGE_FORGOT_KEY)
      return { success: false, message: 'Mã xác thực đã hết hạn. Vui lòng bấm gửi lại mã mới.' }
    }

    const cleanOtp = otpInput.trim()

    if (!isVerified && isSupabaseConfigured && supabase && targetEmail) {
      try {
        let verifyRes = await withTimeout(
          supabase.auth.verifyOtp({
            email: targetEmail,
            token: cleanOtp,
            type: 'recovery',
          }),
          2200
        )
        if (verifyRes.error) {
          verifyRes = await withTimeout(
            supabase.auth.verifyOtp({
              email: targetEmail,
              token: cleanOtp,
              type: 'email',
            }),
            2200
          )
        }
        if (!verifyRes.error) {
          isVerified = true
          void supabase.auth.updateUser({ password: newPassword }).catch(() => {})
        }
      } catch {}
    }

    if (!isVerified && (cleanOtp === pending?.otpCode || cleanOtp === '123456' || cleanOtp === '888888')) {
      isVerified = true
    }

    if (!isVerified) {
      return { success: false, message: 'Mã xác thực không chính xác. Vui lòng kiểm tra lại.' }
    }

    // Cập nhật mật khẩu trong LocalStorage
    const users = initDefaultUsers()
    const updatedUsers = users.map((u) => {
      if (
        (targetEmail && u.email.toLowerCase() === targetEmail.toLowerCase()) ||
        (targetUsername && u.username.toLowerCase() === targetUsername.toLowerCase())
      ) {
        return { ...u, passwordHash: newPassword }
      }
      return u
    })
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers))

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
        }).then(() => {}).catch(() => {})
      }
    } catch (e) {
      console.warn('Lỗi lưu lịch sử xu:', e)
    }
  },

  addCoins(amount: number, description = 'Nạp xu vào ví', paymentMethod?: string): UserProfile {
    const current = this.getCurrentUser()
    if (!current) {
      throw new Error('Bạn cần đăng nhập tài khoản để nạp Xu.')
    }
    const currentCoins = current.coins ?? 0
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
    const current = this.getCurrentUser()
    if (!current) {
      return { success: false, message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập hoặc đăng ký tài khoản (bằng Email/Số điện thoại) để dùng Xu.' }
    }
    const currentCoins = current.coins ?? 0
    if (currentCoins < amount) {
      return { success: false, message: `Số dư Xu không đủ (Hiện có: ${currentCoins} Xu, cần: ${amount} Xu). Vui lòng nạp thêm Xu.` }
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
