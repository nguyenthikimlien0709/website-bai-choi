import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''

// Tự động nhận diện nếu URL bị trống, là placeholder hoặc domain cũ đã hết hạn
const isInvalidUrl =
  !supabaseUrl ||
  supabaseUrl.trim() === '' ||
  supabaseUrl.includes('your-project') ||
  supabaseUrl.includes('xftddnlvjihitigvdvvz')

export const isSupabaseConfigured = Boolean(
  !isInvalidUrl &&
  supabaseAnonKey &&
  supabaseAnonKey.trim() !== ''
)

// Supabase client instance
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

if (isSupabaseConfigured) {
  console.log('⚡ [Supabase] Đã kích hoạt cấu hình máy chủ Cloud:', supabaseUrl)
} else {
  console.log('ℹ️ [Hệ thống] Đang hoạt động ở chế độ Lưu trữ cục bộ & Offline an toàn 100% (Local Storage).')
}
