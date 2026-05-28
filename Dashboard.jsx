import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SUPER_EMAIL = 'maxmicallefa@gmail.com'

const APPS = [
  {
    id: 'snake',
    name: 'Snake',
    emoji: '🐍',
    desc: 'Classic snake — 3 difficulties, 10 levels.',
    color: '#b8ff57',
    bg: '#0a1a00',
    border: '#b8ff5730',
    href: import.meta.env.VITE_SNAKE_URL || 'https://ai0-snake.pages.dev',
    live: true,
  },
  {
    id: 'rank',
    name: 'Rank',
    emoji: '🏹',
    desc: 'Bow & arrow — 20 ranks. Can you beat Max?',
    color: '#ffd040',
    bg: '#1a1200',
    border: '#ffd04030',
    href: import.meta.env.VITE_RANK_URL || 'https://aio-rank.pages.dev',
    live: true,
  },
  {
    id: 'notes',
    name: 'Notes',
    emoji: '📝',
    desc: 'Block notes with folders, tags & real-time sync.',
    color: '#57b8ff',
    bg: '#00101a',
    border: '#57b8ff30',
    href: import.meta.env.VITE_NOTES_URL || 'https://ai0-notes.pages.dev',
    live: true,
  },
  {
    id: 'eyepik',
    name: 'EyePik',
    emoji: '📄',
    desc: 'AI-powered Maltese accountancy documents.',
    color: '#bf57ff',
    bg: '#0e001a',
    border: '#bf57ff20',
    href: import.meta.env.VITE_EYEPIK_URL || '#',
    live: false,
  },
]

export default function Dashboard() {
  const navigate  = useNavigate()
  const [user,   setUser]   = useState(null)
  const [score,  setScore]  = useState(0)
  const [isSuper, setIsSuper] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); return }
      const u = session.user
      setUser(u)
      setIsSuper(u.email === SUPER_EMAIL)
      loadProfile(u.id)
      logActivity(u.id, 'dashboard_view')
    })
  }, [navigate])

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('score')
      .eq('id', userId)
      .single()
    if (data) setScore(data.score ?? 0)
  }

  const logActivity = async (userId, action) => {
    await supabase.from('activity_logs').insert({
      user_id: userId, app: 'landing', action,
      logged_at: new Date().toISOString(),
    }).catch(() => {})
  }

  const handleSignOut = async () => {
    if (user) logActivity(user.id, 'logout')
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleAppClick = (app) => {
    if (!app.live) return
    if (user) logActivity(user.id, `open_${app.id}`)
    window.location.href = app.href
  }

  const name   = user?.user_metadata?.full_name || user?.email || ''
  const avatar = user?.user_metadata?.avatar_url
  const initials = name ? name[0].toUpperCase() : '?'

  return (
    <div style={s.root}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={s.header}>
        <span style={s.logo}>AI<span style={{ color: '#e0e0d8' }}>0</span></span>

        <div style={s.headerRight}>

          {/* Score */}
          <div style={s.scorePill}>
            <span style={s.scoreNum}>{score.toLocaleString()}</span>
            <span style={s.scoreLbl}>pts</span>
          </div>

          {/* Logs icon — SuperAdmin only */}
          {isSuper && (
            <a
              href={import.meta.env.VITE_LOGS_URL || 'https://ai0-landing.pages.dev/logs'}
              style={s.logsBtn}
              title="Audit Logs (SuperAdmin)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Logs
            </a>
          )}

          {/* User */}
          <div style={s.userChip}>
            {avatar
              ? <img src={avatar} style={s.avatar} alt={name} />
              : <div style={s.avatarFallback}>{initials}</div>
            }
            <div style={s.userMeta}>
              <span style={s.userName}>{name.split(' ')[0]}</span>
              {isSuper && <span style={s.superBadge}>SuperAdmin</span>}
            </div>
          </div>

          <button style={s.signOutBtn} onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main style={s.main}>
        <h1 style={s.greeting}>
          Good{new Date().getHours() < 12 ? ' morning' : new Date().getHours() < 18 ? ' afternoon' : ' evening'}
          {name ? `, ${name.split(' ')[0]}` : ''}.
        </h1>
        <p style={s.sub}>Choose an app to launch.</p>

        <div style={s.grid}>
          {APPS.map(app => (
            <button
              key={app.id}
              style={{
                ...s.card,
                background: app.bg,
                borderColor: app.live ? app.border : '#1a1a1a',
                cursor: app.live ? 'pointer' : 'default',
                opacity: app.live ? 1 : 0.45,
              }}
              onClick={() => handleAppClick(app)}
              disabled={!app.live}
            >
              {/* Live dot */}
              {app.live && <div style={{ ...s.liveDot, background: app.color }} />}

              <div style={s.cardEmoji}>{app.emoji}</div>
              <div style={{ ...s.cardName, color: app.color }}>{app.name}</div>
              <div style={s.cardDesc}>{app.desc}</div>

              {!app.live && (
                <div style={s.soonBadge}>Coming soon</div>
              )}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#e0e0d8',
    fontFamily: "'Inter', sans-serif",
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: 52,
    background: '#0e0e0e',
    borderBottom: '1px solid #1a1a1a',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },
  logo: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 18,
    fontWeight: 700,
    color: '#b8ff57',
    letterSpacing: '0.05em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  scorePill: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 4,
    background: '#141414',
    border: '1px solid #222',
    borderRadius: 20,
    padding: '3px 10px',
  },
  scoreNum: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    color: '#b8ff57',
  },
  scoreLbl: {
    fontSize: 10,
    color: '#555',
  },
  logsBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 6,
    padding: '5px 10px',
    color: '#b8ff57',
    fontSize: 12,
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.05em',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#141414',
    border: '1px solid #222',
    borderRadius: 20,
    padding: '4px 12px 4px 4px',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: '#b8ff5725',
    color: '#b8ff57',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMeta: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
  },
  userName: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: 500,
  },
  superBadge: {
    fontSize: 9,
    color: '#b8ff57',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.06em',
  },
  signOutBtn: {
    background: 'transparent',
    color: '#444',
    border: '1px solid #1e1e1e',
    borderRadius: 4,
    padding: '4px 10px',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // ── Main ────────────────────────────────────────────────────────────────
  main: {
    maxWidth: 780,
    margin: '0 auto',
    padding: '40px 24px',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 600,
    color: '#e8e8e0',
    marginBottom: 6,
    letterSpacing: '-0.02em',
  },
  sub: {
    fontSize: 13,
    color: '#444',
    marginBottom: 32,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: 14,
  },
  card: {
    position: 'relative',
    border: '1px solid',
    borderRadius: 14,
    padding: '22px 18px 18px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    transition: 'transform 0.12s, border-color 0.12s',
  },
  liveDot: {
    position: 'absolute',
    top: 13,
    right: 13,
    width: 6,
    height: 6,
    borderRadius: '50%',
    opacity: 0.8,
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  cardDesc: {
    fontSize: 11,
    color: '#666',
    lineHeight: 1.55,
  },
  soonBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    fontSize: 9,
    background: '#181818',
    color: '#444',
    borderRadius: 3,
    padding: '2px 6px',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.08em',
  },
}
