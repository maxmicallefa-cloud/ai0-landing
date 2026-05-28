import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, signOut, logActivity } from '../lib/supabase'

const APPS = [
  {
    id: 'snake',
    name: 'Snake',
    icon: '🐍',
    desc: 'Classic snake — 3 difficulties, 10 levels.',
    color: '#b8ff57',
    bg: '#0a1a00',
    href: import.meta.env.VITE_SNAKE_URL || 'https://ai0-snake.pages.dev',
    status: 'live',
  },
  {
    id: 'rank',
    name: 'Rank',
    icon: '🏹',
    desc: 'Bow & arrow — 20 ranks. Can you beat Max?',
    color: '#ffd040',
    bg: '#1a1400',
    href: import.meta.env.VITE_RANK_URL || 'https://aio-rank.pages.dev',
    status: 'live',
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: '📝',
    desc: 'Block-based notes with folders, tags & real-time sync.',
    color: '#57b8ff',
    bg: '#00101a',
    href: import.meta.env.VITE_NOTES_URL || 'https://ai0-notes.pages.dev',
    status: 'live',
  },
  {
    id: 'eyepik',
    name: 'EyePik',
    icon: '📄',
    desc: 'AI-powered accountancy & document management.',
    color: '#bf57ff',
    bg: '#0e001a',
    href: import.meta.env.VITE_EYEPIK_URL || '#',
    status: 'soon',
  },
]

export default function Dashboard() {
  const navigate  = useNavigate()
  const [user, setUser]   = useState(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return }
      setUser(session.user)
      loadProfile(session.user.id)
      logActivity({ userId: session.user.id, action: 'dashboard_view' })
    })
  }, [navigate])

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('score, display_name')
      .eq('id', userId)
      .single()
    if (data) setScore(data.score ?? 0)
  }

  const handleSignOut = async () => {
    if (user) logActivity({ userId: user.id, action: 'logout' })
    await signOut()
    navigate('/login')
  }

  const handleAppClick = (app) => {
    if (app.status === 'soon') return
    if (user) logActivity({ userId: user.id, action: `open_${app.id}` })
    window.location.href = app.href
  }

  const name   = user?.user_metadata?.full_name || user?.email || ''
  const avatar = user?.user_metadata?.avatar_url

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <span style={s.logo}>AI<span style={s.zero}>0</span></span>

        <div style={s.userArea}>
          <span style={s.scoreLabel}>
            <span style={s.scoreNum}>{score.toLocaleString()}</span> pts
          </span>

          <div style={s.userInfo}>
            {avatar
              ? <img src={avatar} style={s.avatar} alt={name} />
              : <div style={s.avatarFallback}>{name[0]?.toUpperCase()}</div>
            }
            <span style={s.userName}>{name.split(' ')[0]}</span>
          </div>

          <button style={s.signOutBtn} onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      {/* Grid */}
      <main style={s.main}>
        <h1 style={s.greeting}>Welcome back{name ? `, ${name.split(' ')[0]}` : ''}.</h1>

        <div style={s.grid}>
          {APPS.map(app => (
            <button
              key={app.id}
              style={{
                ...s.card,
                background: app.bg,
                borderColor: app.status === 'soon' ? '#1e1e1e' : `${app.color}30`,
                opacity: app.status === 'soon' ? 0.5 : 1,
                cursor: app.status === 'soon' ? 'not-allowed' : 'pointer',
              }}
              onClick={() => handleAppClick(app)}
            >
              <div style={s.cardIcon}>{app.icon}</div>
              <div style={s.cardName} color={app.color}>{app.name}</div>
              <div style={s.cardDesc}>{app.desc}</div>
              {app.status === 'soon' && <div style={s.soonBadge}>Coming soon</div>}
              {app.status === 'live'  && (
                <div style={{ ...s.liveDot, background: app.color }} />
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', color: '#e0e0d8', fontFamily: "'Inter', sans-serif" },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 28px', borderBottom: '1px solid #181818', background: '#0e0e0e',
  },
  logo: { fontFamily: "'Space Mono',monospace", fontSize: 18, fontWeight: 700, color: '#b8ff57', letterSpacing: '0.05em' },
  zero: { color: '#e0e0d8' },
  userArea: { display: 'flex', alignItems: 'center', gap: 16 },
  scoreLabel: { fontSize: 12, color: '#555' },
  scoreNum: { color: '#b8ff57', fontWeight: 600, fontFamily: "'Space Mono',monospace" },
  userInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' },
  avatarFallback: {
    width: 28, height: 28, borderRadius: '50%',
    background: '#b8ff5720', color: '#b8ff57',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 600,
  },
  userName: { fontSize: 13, color: '#bbb' },
  signOutBtn: {
    background: 'transparent', color: '#555', border: '1px solid #222',
    borderRadius: 4, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
  },
  main: { padding: '36px 28px', maxWidth: 800, margin: '0 auto' },
  greeting: { fontSize: 20, fontWeight: 500, color: '#e8e8e0', marginBottom: 28 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 },
  card: {
    position: 'relative', border: '1px solid', borderRadius: 12,
    padding: '20px 16px 18px', textAlign: 'left', transition: 'transform 0.12s, border-color 0.12s',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  cardIcon: { fontSize: 26, marginBottom: 4 },
  cardName: { fontSize: 15, fontWeight: 600, color: '#e0e0d8' },
  cardDesc: { fontSize: 11, color: '#666', lineHeight: 1.5 },
  soonBadge: {
    marginTop: 6, alignSelf: 'flex-start', fontSize: 9,
    background: '#1e1e1e', color: '#555', borderRadius: 3, padding: '2px 6px',
    fontFamily: "'Space Mono',monospace", letterSpacing: '0.06em',
  },
  liveDot: {
    position: 'absolute', top: 12, right: 12,
    width: 6, height: 6, borderRadius: '50%', opacity: 0.7,
  },
}
