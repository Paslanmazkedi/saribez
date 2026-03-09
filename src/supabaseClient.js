import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dmlicgvflkzpplxtxzkg.supabase.co'
const supabaseKey = 'sb_publishable_vhJ8R32par--IggXHdBEeg_1eWRZ23C'

export const supabase = createClient(supabaseUrl, supabaseKey)