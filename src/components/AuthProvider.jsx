import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

const ALLOWED = ['maxmicallefa@gmail.com', 'leontrebor112@gmail.com']
const Ctx = createContext(null)

function getDevicePayload(extra = {}) {
  const ua = navigator.userAgent
  return {
    user_agent:    ua,
    device_type:   /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop',
    os:            /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' :
                   /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : 'Linux',
    browser:       /Edg/i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' :
                   /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : 'Other',
    screen_width:  window.screen.width,
    screen_height: window.screen.height,
    timezone:      Intl.DateTimeFormat().resolvedOptions().timeZone,
    language:      navigator.language,
    referrer:      document.referrer || null,
    ...extra,
  }
}

async function callEdgeFn(payload) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/log-auth-event`
  console.log('Calling edge function:', url, payload)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    console.log('Edge function response:', res.status, data)
  } catch(e) {
    console.error('Edge function error:', e.message)
  }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [denied,  setDenied]  = useState(false)
  const handledRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    const timeout = setTimeout(() => setLoading(false), 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSession(session) {
    if (!session?.user) {
      setUser(null)
      setLoading(false)
      return
    }
    // Prevent duplicate handling of same session
    if (handledRef.current === session.access_token) return
    handledRef.current = session.access_token

    const email = session.user.email

    if (!ALLOWED.includes(email)) {
      await callEdgeFn(getDevicePayload({ email, reason: 'not_whitelisted' }))
      await supabase.auth.signOut()
      setUser(null)
      setDenied(true)
      setLoading(false)
      return
    }

    // Successful login — log device + IP
    callEdgeFn(getDevicePayload({
      email,
      reason: 'success',
      user_id: session.user.id,
    }))

    // Also log to activity_logs
    try {
      await supabase.from('activity_logs').insert({
        user_id: session.user.id, app: 'landing', action: 'login',
        logged_at: new Date().toISOString(),
      })
    } catch(e) {}

    localStorage.setItem('ai0-session', JSON.stringify({
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
      expires_at:    session.expires_at,
      user:          session.user,
    }))

    setUser(session.user)
    setDenied(false)
    setLoading(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem('ai0-session')
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, loading, denied, signOut }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  return useContext(Ctx)
}