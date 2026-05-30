import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
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
    live: true,
  },
  {
    id: 'signal',
    name: 'Signal',
    emoji: '📡',
    desc: 'Signal tracker.',
    color: '#bf57f0',
    bg: '#0e001a',
    border: '#bf57ff20',
    href: import.meta.env.VITE_SIGNAL_URL || 'https://ai0-signal.pages.dev',
    live: true,
  },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [score,    setScore]   = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!user) return
    loadScore(user.id)
  }, [user])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadScore = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles').select('score').eq('id', userId).single()
      if (data) setScore(data.score ?? 0)
    } catch(e) {}
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const handleAppClick = (app) => {
    if (!app.live) return
    try {
      supabase.from('activity_logs').insert({
        user_id: user.id, app: app.id, action: `open_${app.id}`,
        logged_at: new Date().toISOString(),
      })
    } catch(e) {}
    window.location.href = app.href
  }

  if (!user) return null

  const name    = user.user_metadata?.full_name || user.email || ''
  const email   = user.email || ''
  const avatar  = user.user_metadata?.avatar_url
  const initial = name ? name[0].toUpperCase() : '?'
  const isSuper = email === SUPER_EMAIL
  const hour    = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={s.root}>
      <header style={s.header}>
        <span style={s.logo}>AI<span style={{ color: '#e0e0d8' }}>0</span></span>

        <div style={s.right}>
          <div style={s.scorePill}>
            <span style={s.scoreNum}>{score.toLocaleString()}</span>
            <span style={s.scoreLbl}>pts</span>
          </div>

          {isSuper && (
            <a href="/logs.html" style={s.logsBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Logs
            </a>
          )}

          <div style={{ position: 'relative' }} ref={menuRef}>
            <button style={s.userChip} onClick={() => setMenuOpen(p => !p)}>
              {avatar
                ? <img src={avatar} style={s.avatar} alt={name} />
                : <div style={s.avatarFb}>{initial}</div>
              }
              <span style={s.userName}>{name.split(' ')[0]}</span>
              <span style={s.chevron}>{menuOpen ? '▲' : '▼'}</span>
            </button>

            {menuOpen && (
              <div style={s.menu}>
                <div style={s.menuTop}>
                  {avatar
                    ? <img src={avatar} style={s.menuAvatar} alt={name} />
                    : <div style={{ ...s.menuAvatar, ...s.menuAvatarFb }}>{initial}</div>
                  }
                  <div>
                    <div style={s.menuName}>{name}</div>
                    <div style={s.menuEmail}>{email}</div>
                    {isSuper && <div style={s.superBadge}>⚡ SuperAdmin</div>}
                  </div>
                </div>
                <div style={s.menuDivider} />
                <div style={s.menuStats}>
                  <div style={s.menuStat}>
                    <span style={s.menuStatNum}>{score.toLocaleString()}</span>
                    <span style={s.menuStatLbl}>points</span>
                  </div>
                  <div style={s.menuStat}>
                    <span style={s.menuStatNum}>{APPS.filter(a => a.live).length}</span>
                    <span style={s.menuStatLbl}>apps live</span>
                  </div>
                </div>
                <div style={s.menuDivider} />
                {isSuper && <a href="/logs.html" style={s.menuItem}>📋 Audit Logs</a>}
                <button
                  style={{ ...s.menuItem, color: '#ff5040', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
                  onClick={handleSignOut}
                >Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={s.main}>
        <h1 style={s.greeting}>{greeting}, {name.split(' ')[0]}.</h1>
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
              {app.live && <div style={{ ...s.dot, background: app.color }} />}
              <div style={s.cardEmoji}>{app.emoji}</div>
              <div style={{ ...s.cardName, color: app.color }}>{app.name}</div>
              <div style={s.cardDesc}>{app.desc}</div>
              {!app.live && <div style={s.soon}>Coming soon</div>}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', color: '#e0e0d8', fontFamily: "'Inter', sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 52, background: '#0e0e0e', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, zIndex: 20 },
  logo: { fontFamily: "'Space Mono',monospace", fontSize: 18, fontWeight: 700, color: '#b8ff57', letterSpacing: '0.05em' },
  right: { display: 'flex', alignItems: 'center', gap: 10 },
  scorePill: { display: 'flex', alignItems: 'baseline', gap: 4, background: '#141414', border: '1px solid #222', borderRadius: 20, padding: '3px 10px' },
  scoreNum: { fontFamily: "'Space Mono',monospace", fontSize: 12, fontWeight: 700, color: '#b8ff57' },
  scoreLbl: { fontSize: 10, color: '#555' },
  logsBtn: { display: 'flex', alignItems: 'center', gap: 5, background: '#161616', border: '1px solid #2a2a2a', borderRadius: 6, padding: '5px 10px', color: '#b8ff57', fontSize: 11, fontFamily: "'Space Mono',monospace", textDecoration: 'none' },
  userChip: { display: 'flex', alignItems: 'center', gap: 7, background: '#141414', border: '1px solid #222', borderRadius: 20, padding: '4px 10px 4px 4px', cursor: 'pointer' },
  avatar: { width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' },
  avatarFb: { width: 26, height: 26, borderRadius: '50%', background: '#b8ff5725', color: '#b8ff57', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 12, color: '#ccc', fontWeight: 500 },
  chevron: { fontSize: 8, color: '#555' },
  menu: { position: 'absolute', right: 0, top: 42, width: 240, background: '#141414', border: '1px solid #2a2a2a', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.7)', zIndex: 100, overflow: 'hidden' },
  menuTop: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px' },
  menuAvatar: { width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  menuAvatarFb: { background: '#b8ff5725', color: '#b8ff57', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  menuName: { fontSize: 13, fontWeight: 600, color: '#e0e0d8', marginBottom: 2 },
  menuEmail: { fontSize: 11, color: '#555', marginBottom: 3 },
  superBadge: { fontSize: 9, color: '#b8ff57', fontFamily: "'Space Mono',monospace", letterSpacing: '0.06em' },
  menuDivider: { height: 1, background: '#1e1e1e' },
  menuStats: { display: 'flex', padding: '10px 14px', gap: 20 },
  menuStat: { display: 'flex', flexDirection: 'column' },
  menuStatNum: { fontFamily: "'Space Mono',monospace", fontSize: 15, fontWeight: 700, color: '#b8ff57' },
  menuStatLbl: { fontSize: 9, color: '#555', letterSpacing: '0.06em' },
  menuItem: { display: 'block', padding: '9px 14px', fontSize: 12, color: '#bbb', textDecoration: 'none', fontFamily: "'Inter',sans-serif" },
  main: { maxWidth: 780, margin: '0 auto', padding: '40px 24px' },
  greeting: { fontSize: 24, fontWeight: 600, color: '#e8e8e0', marginBottom: 6, letterSpacing: '-0.02em' },
  sub: { fontSize: 13, color: '#444', marginBottom: 32 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 },
  card: { position: 'relative', border: '1px solid', borderRadius: 14, padding: '22px 18px 18px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 },
  dot: { position: 'absolute', top: 13, right: 13, width: 6, height: 6, borderRadius: '50%', opacity: 0.8 },
  cardEmoji: { fontSize: 28, marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: 700 },
  cardDesc: { fontSize: 11, color: '#666', lineHeight: 1.55 },
  soon: { marginTop: 6, alignSelf: 'flex-start', fontSize: 9, background: '#181818', color: '#444', borderRadius: 3, padding: '2px 6px', fontFamily: "'Space Mono',monospace", letterSpacing: '0.08em' },
}
