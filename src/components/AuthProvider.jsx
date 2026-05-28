import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getProfile, logDeviceInfo, logActivity } from '../lib/supabase'

const ALLOWED_EMAILS = ['maxmicallefa@gmail.com', 'leontrebor112@gmail.com']
const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-auth-event`

const AuthContext = createContext(null)

// ── Collect device info from browser ──────────────────────────────────────
function getDeviceInfo() {
  const ua = navigator.userAgent
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)

  let os = 'unknown'
  if (/Windows/i.test(ua))     os = 'Windows'
  else if (/Mac OS X/i.test(ua)) os = 'macOS'
  else if (/Android/i.test(ua))  os = 'Android'
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS'
  else if (/Linux/i.test(ua))    os = 'Linux'

  let browser = 'unknown'
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua))  browser = 'Chrome'
  else if (/Firefox/i.test(ua))   browser = 'Firefox'
  else if (/Safari/i.test(ua))    browser = 'Safari'
  else if (/Edg/i.test(ua))       browser = 'Edge'
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera'

  return {
    user_agent:    ua,
    device_type:   isMobile ? 'mobile' : 'desktop',
    os,
    browser,
    screen_width:  window.screen.width,
    screen_height: window.screen.height,
    timezone:      Intl.DateTimeFormat().resolvedOptions().timeZone,
    language:      navigator.language,
    referrer:      document.referrer || null,
  }
}

// ── Log failed login attempt via Edge Function (captures real IP) ─────────
async function logFailedLogin(email, reason) {
  try {
    await fetch(EDGE_FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email,
        reason,
        ...getDeviceInfo(),
      }),
    })
  } catch (e) {
    console.warn('Failed to log auth event:', e.message)
  }
}

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await handleSession(session)
      }
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSession(session) {
    const email = session.user.email

    // Check whitelist
    if (!ALLOWED_EMAILS.includes(email)) {
      await logFailedLogin(email, 'not_whitelisted')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    setSession(session)

    try {
      const prof = await getProfile(session.user.id)
      setProfile(prof)
    } catch (e) {
      console.error('Profile fetch error', e)
    }

    // Log device info + activity
    logDeviceInfo(session.user.id)
    logActivity(session.user.id, 'login')

    // Store session in localStorage for logs page
    localStorage.setItem('ai0-session', JSON.stringify({
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
      expires_at:    session.expires_at,
      user:          session.user,
    }))

    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
