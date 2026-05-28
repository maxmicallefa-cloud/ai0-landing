import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase env vars. Check your .env file.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'ai0-session',
    autoRefreshToken: true,
  }
})

// ── Auth helpers ────────────────────────────────────────────

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: { prompt: 'select_account' }
    }
  })
  if (error) throw error
}

export async function signOut() {
  await logActivity('logout', 'landing')
  const { error } = await supabase.auth.signOut()
  if (error) throw error
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

// ── Device telemetry ────────────────────────────────────────

export async function logDeviceInfo(userId) {
  const nav = navigator
  let battery = null
  try { battery = await nav.getBattery?.() } catch (_) {}

  let storageQuota = null, storageUsed = null
  try {
    const est = await nav.storage?.estimate?.()
    storageQuota = est ? Math.round(est.quota / 1024 / 1024) : null
    storageUsed  = est ? Math.round(est.usage  / 1024 / 1024) : null
  } catch (_) {}

  const payload = {
    user_id: userId,
    device_type: /Mobi|Android/i.test(nav.userAgent) ? 'mobile' : 'desktop',
    os: getOS(nav.userAgent),
    browser: getBrowser(nav.userAgent),
    browser_version: getBrowserVersion(nav.userAgent),
    screen_width: screen.width,
    screen_height: screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: nav.language,
    platform: nav.platform,
    user_agent: nav.userAgent,
    network_type: nav.connection?.effectiveType ?? null,
    battery_level: battery ? Math.round(battery.level * 100) : null,
    battery_charging: battery ? battery.charging : null,
    storage_quota_mb: storageQuota,
    storage_used_mb: storageUsed,
    memory_gb: nav.deviceMemory ?? null,
    cpu_cores: nav.hardwareConcurrency ?? null,
    touch_support: 'ontouchstart' in window,
    color_depth: screen.colorDepth,
    pixel_ratio: window.devicePixelRatio
  }

  await supabase.from('device_logs').insert(payload)
}

function getOS(ua) {
  if (/Windows/.test(ua)) return 'Windows'
  if (/Android/.test(ua)) return 'Android'
  if (/iPhone|iPad/.test(ua)) return 'iOS'
  if (/Mac/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

function getBrowser(ua) {
  if (/Edg\//.test(ua)) return 'Edge'
  if (/Chrome\//.test(ua)) return 'Chrome'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari'
  return 'Unknown'
}

function getBrowserVersion(ua) {
  const match = ua.match(/(Chrome|Firefox|Edg|Safari)\/(\d+)/)
  return match ? match[2] : null
}

// ── Activity logging ────────────────────────────────────────

export async function logActivity(action, app = 'landing', page = null, metadata = {}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action,
    app,
    page,
    metadata
  })
}

// ── Score ───────────────────────────────────────────────────

export async function addScore(app, eventType, points, metadata = {}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('score_events').insert({
    user_id: user.id,
    app,
    event_type: eventType,
    points,
    metadata
  })
  // Update profile total
  await supabase.rpc('increment_score', { uid: user.id, pts: points })
}
