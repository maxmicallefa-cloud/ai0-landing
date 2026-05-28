import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getProfile, logDeviceInfo, logActivity } from '../lib/supabase'

const ALLOWED_EMAILS = ['maxmicallefa@gmail.com', 'leontrebor112@gmail.com']
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [denied,  setDenied]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) await handleSession(session)
      if (event === 'SIGNED_OUT') { setSession(null); setProfile(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSession(sess) {
    try {
      if (!ALLOWED_EMAILS.includes(sess.user.email)) {
        await supabase.auth.signOut()
        setDenied(true)
        return
      }
      setSession(sess)
      try { setProfile(await getProfile(sess.user.id)) } catch(e) {}
      logDeviceInfo(sess.user.id)
      logActivity(sess.user.id, 'login')
      localStorage.setItem('ai0-session', JSON.stringify({
        access_token: sess.access_token,
        refresh_token: sess.refresh_token,
        expires_at: sess.expires_at,
        user: sess.user,
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, denied }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
