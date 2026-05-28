import { useAuth } from '../components/AuthProvider'
import { signOut, logActivity } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const APPS = [
  {
    id: 'snake',
    name: 'Snake',
    icon: '🐍',
    desc: 'Classic snake — 3 difficulties, unlimited levels.',
    color: '#b8ff57',
    bg: '#0a1a00',
    href: import.meta.env.VITE_SNAKE_URL || 'https://ai0-snake.pages.dev'
  },
  {
    id: 'eyepik',
    name: 'EyePik',
    icon: '📄',
    desc: 'AI-powered accountancy & document management.',
    color: '#6366f1',
    bg: '#0d0d2e',
    href: import.meta.env.VITE_EYEPIK_URL || '#'
  },
  {
    id: 'rank',
    name: 'Rank',
    icon: '🏹',
    desc: '20 levels. One final target. Aim true.',
    color: '#f59e0b',
    bg: '#1a0f00',
    href: import.meta.env.VITE_RANK_URL || '#'
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: '📝',
    desc: 'Quick notes, checklists, always in sync.',
    color: '#06b6d4',
    bg: '#001a1f',
    href: import.meta.env.VITE_NOTES_URL || '#'
  }
]

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [score, setScore] = useState(profile?.score ?? 0)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('score')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setScore(data.score) })
  }, [user])

  async function handleAppClick(app) {
    if (app.href === '#') return
    await logActivity(user?.id, app.id, 'app_opened')
    window.location.href = app.href
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const isSuperUser = user?.email === 'maxmicallefa@gmail.com'

  return (
    <div style={s.page}>
      <div style={s.nav}>
        <div style={s.logo}>AI<span style={{ color: '#fff', opacity: 0.4 }}>0</span></div>
        <div style={s.navRight}>
          {isSuperUser && (
            <button style={s.adminBtn} onClick={() => navigate('/admin')}>Admin</button>
          )}
          <div style={s.scoreChip}>
            <span style={s.scoreLabel}>Score</span>
            <span style={s.scoreVal}>{score.toLocaleString()}</span>
          </div>
          <button style={s.signOutBtn} onClick={handleSignOut}>Sign out</button>
        </div>
      </div>

      <div style={s.greeting}>
        <h1 style={s.h1}>
          {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}.
        </h1>
        <p style={s.sub}>Pick an app to get started.</p>
      </div>

      <div style={s.grid}>
        {APPS.map(app => (
          <button
            key={app.id}
            style={{
              ...s.card,
              background: app.bg,
              border: `1px solid ${app.color}22`,
              cursor: app.href === '#' ? 'not-allowed' : 'pointer',
              opacity: app.href === '#' ? 0.45 : 1,
            }}
            onClick={() => handleAppClick(app)}
          >
            <div style={{ ...s.cardIcon, color: app.color }}>{app.icon}</div>
            <div style={{ ...s.cardName, color: app.color }}>{app.name}</div>
            <div style={s.cardDesc}>{app.desc}</div>
            {app.href === '#' && (
              <div style={s.comingSoon}>coming soon</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#fff',
    fontFamily: "'Syne', sans-serif",
    padding: '0 24px 48px',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 40,
  },
  logo: {
    fontSize: 24,
    fontWeight: 800,
    color: '#b8ff57',
    letterSpacing: -1,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  adminBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.5)',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scoreChip: {
    background: 'rgba(184,255,87,0.08)',
    border: '1px solid rgba(184,255,87,0.2)',
    borderRadius: 20,
    padding: '5px 14px',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    color: 'rgba(184,255,87,0.6)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: "'Space Mono', monospace",
  },
  scoreVal: {
    fontSize: 15,
    fontWeight: 700,
    color: '#b8ff57',
    fontFamily: "'Space Mono', monospace",
  },
  signOutBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.4)',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
  },
  greeting: {
    marginBottom: 36,
  },
  h1: {
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: -1.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    fontFamily: "'Space Mono', monospace",
    letterSpacing: 0.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: '28px 24px',
    textAlign: 'left',
    transition: 'transform 0.15s, box-shadow 0.15s',
    position: 'relative',
    overflow: 'hidden',
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 12,
    display: 'block',
  },
  cardName: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 1.5,
  },
  comingSoon: {
    marginTop: 12,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.25)',
    fontFamily: "'Space Mono', monospace",
  }
}
