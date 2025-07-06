import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY!

console.log('🔧 Creating Supabase client with:', { url: supabaseUrl, keyExists: !!supabaseAnonKey })

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'case-booking-app@1.2.1'
    }
  }
})

console.log('✅ Supabase client created successfully')

// Admin client with service role for lookup operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'case-booking-app-admin@1.2.1'
    }
  }
})

console.log('✅ Supabase admin client created for lookup operations')