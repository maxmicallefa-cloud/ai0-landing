import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,  // ← this is the fix
    }
  }
)

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function logDeviceInfo(userId) {
  const info = {
    user_id:      userId,
    device_type:  /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    os:           navigator.platform || 'unknown',
    browser:      navigator.userAgent.split(' ').pop() || 'unknown',
    screen_width:  window.screen.width,
    screen_height: window.screen.height,
    timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
    language:     navigator.language,
    logged_at:    new Date().toISOString(),
  }
  await supabase.from('device_logs').insert(info).catch(() => {})
}

export async function logActivity(userId, action, app = 'landing') {
  await supabase.from('activity_logs').insert({
    user_id: userId, action, app,
    logged_at: new Date().toISOString(),
  }).catch(() => {})
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  if (error) throw error
}