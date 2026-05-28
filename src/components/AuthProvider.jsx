import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getProfile, logDeviceInfo, logActivity } from '../lib/supabase'

const ALLOWED_EMAILS = ['maxmicallefa@gmail.com', 'leontrebor112@gmail.com']

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSession(session) {
    if (!session?.user) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }

    const email = session.user.email
    if (!ALLOWED_EMAILS.includes(email)) {
      await supabase.auth.signOut()
      setDenied(true)
      setLoading(false)
      return
    }

    setUser(session.user)
    try {
      const p = await getProfile(session.user.id)
      setProfile(p)
      // Log device info and login activity
      await logDeviceInfo(session.user.id)
      await logActivity('login', 'landing')
    } catch (e) {
      console.error('Profile fetch error', e)
    }
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, denied }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
