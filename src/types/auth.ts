export type UserRole = 'guest' | 'customer' | 'staff' | 'admin'

export interface UserProfile {
  id: string
  username: string
  fullName: string
  phone: string
  email: string
  role: UserRole
  avatar?: string
  createdAt: string
  idCard?: string
  dob?: string
  gender?: string
  address?: string
  coins?: number
}

export interface CoinTransaction {
  id: string
  userId: string
  type: 'bonus' | 'topup' | 'spend' | 'reward'
  amount: number
  balanceAfter: number
  description: string
  createdAt: string
  paymentMethod?: string
  status?: 'success' | 'pending' | 'failed'
}

export interface StoredUser extends UserProfile {
  passwordHash: string // For local demo simulation
}

export interface RegisterFormData {
  username: string
  fullName: string
  phone: string
  email: string
  password: string
  confirmPassword: string
}
