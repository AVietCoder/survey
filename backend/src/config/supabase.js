import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing',
  { auth: { persistSession: false } }
)
// Ném lỗi nếu Supabase trả về error, ngược lại trả data
export const ok = ({ data, error }) => { if (error) throw error; return data }
