import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { authConfig } from './config'

export function authServer() {
  const { url, key } = authConfig()
  const store = cookies()
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
    cookies: {
      getAll: () => store.getAll(),
      setAll: values => {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)) }
        catch { /* Server components are read-only; middleware refreshes cookies. */ }
      },
    },
  })
}

export function authAdmin() {
  const { url } = authConfig()
  const key = process.env.SUPABASE_SECRET_KEY
  if (!key) throw new Error('AUTH_ADMIN_NOT_CONFIGURED')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
