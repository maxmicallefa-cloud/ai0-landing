import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const ALLOWED = ['maxmicallefa@gmail.com', 'leontrebor112@gmail.com']
const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [denied,  setDenied]  = useState(false)

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    // Safety timeout — never stay stuck loading
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

    const email = session.user.email

    if (!ALLOWED.includes(email)) {
      // Log the failed attempt directly to Supabase
      try {
        await supabase.from('failed_logins').insert({
          email,
          reason: 'not_whitelisted',
          user_agent: navigator.userAgent,
          device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          attempted_at: new Date().toISOString(),
        })
      } catch(e) {}
      await supabase.auth.signOut()
      setUser(null)
      setDenied(true)
      setLoading(false)
      return
    }

    // Store session for logs page
    localStorage.setItem('ai0-session', JSON.stringify({
      access_token:  session.access_token,
      refresh_token: session.refresh_token,
      expires_at:    session.expires_at,
      user:          session.user,
    }))

    setUser(session.user)
    setDenied(false)
    setLoading(false)

    // Log activity in background — don't await
    logActivity(session.user.id)
  }

  async function logActivity(userId) {
    try {
      await supabase.from('activity_logs').insert({
        user_id: userId, app: 'landing', action: 'login',
        logged_at: new Date().toISOString(),
      })
    } catch(e) {}
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
