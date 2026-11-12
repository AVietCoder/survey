import { createClient } from '@supabase/supabase-js'

export let supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing',
  { auth: { persistSession: false } }
)
/** Chỉ dùng trong test/harness: thay client bằng DB giả (các module khác thấy ngay nhờ live binding). */
export function useSupabaseForTests(client) { supabase = client }
// Ném lỗi nếu Supabase trả về error, ngược lại trả data
export const ok = ({ data, error }) => { if (error) throw error; return data }
