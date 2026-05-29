import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ALLOWED = ['maxmicallefa@gmail.com', 'leontrebor112@gmail.com']
const Ctx = createContext(null)
let lastHandledToken = null

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [denied,  setDenied]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { handle(session) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => { handle(session) })
    const t = setTimeout(() => setLoading(false), 5000)
    return () => { subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  async function handle(session) {
    if (!session?.user) { setUser(null); setLoading(false); return }
    const email = session.user.email
    const ua = navigator.userAgent
    const devicePayload = {
      user_agent: ua,
      device_type: /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop',
      os: /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : 'Linux',
      browser: /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : 'Safari',
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      referrer: document.referrer || null,
    }
    if (!ALLOWED.includes(email)) {
      try {
        await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/log-auth-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ email, reason: 'not_whitelisted', ...devicePayload }),
        })
      } catch(e) {}
      await supabase.auth.signOut()
      setUser(null); setDenied(true); setLoading(false); return
    }
    if (lastHandledToken === session.access_token) {
      setUser(session.user); setLoading(false); return
    }
    lastHandledToken = session.access_token
    localStorage.setItem('ai0-session', JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token, expires_at: session.expires_at, user: session.user }))
    setUser(session.user); setDenied(false); setLoading(false)
    try {
      await fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/log-auth-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, reason: 'success', user_id: session.user.id, ...devicePayload }),
      })
    } catch(e) {}
    try { await supabase.from('activity_logs').insert({ user_id: session.user.id, app: 'landing', action: 'login', logged_at: new Date().toISOString() }) } catch(e) {}
  }

  async function signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem('ai0-session')
    lastHandledToken = null
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, denied, signOut }}>{children}</Ctx.Provider>
}

export function useAuth() { return useContext(Ctx) }
