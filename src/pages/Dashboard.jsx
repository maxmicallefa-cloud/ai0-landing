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
    color: '#22c55e',
    bg: '#052012',
    href: import.meta.env.VITE_SNAKE_URL || '/apps/snake'
  },
  {
    id: 'eyepik',
    name: 'EyePik',
    icon: '📄',
    desc: 'AI-powered accountancy & document management.',
    color: '#6366f1',
    bg: '#0d0d2e',
    href: import.meta.env.VITE_EYEPIK_URL || '/apps/eyepik'
  },
  {
    id: 'rank',
    name: 'Rank',
    icon: '🏹',
    desc: '20 levels. One final target. Aim true.',
    color: '#f59e0b',
    bg: '#1a0f00',
    href: import.meta.env.VITE_RANK_URL || '/apps/rank'
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: '📝',
    desc: 'Quick notes, checklists, always in sync.',
    color: '#06b6d4',
    bg: '#001a1f',
    href: import.meta.env.VITE_NOTES_URL || '/apps/notes'
  }
]

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [score, setScore] = useState(profile?.score ?? 0)

  useEffect(() => {
    if (!profile?.id) return
    // Realtime score updates
    const sub = supabase
      .channel('profile-score')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profile.id}`
      }, payload => setScore(payload.new.score))
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [profile?.id])

  function openApp(app) {
    logActivity('app_open', app.id)
    window.location.href = app.href
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div style={s.logoWrap}>
          <span style={s.logo}>AI<span style={s.zero}>0</span></span>
          <span style={s.logoSub}>AllInOne</span>
        </div>
        <div style={s.headerRight}>
          {profile?.role === 'superuser' && (
            <button style={s.adminBtn} onClick={() => navigate('/admin')}>
              ⚙ Admin
            </button>
          )}
          <div style={s.profileChip}>
            <div style={s.avatar}>
              {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={s.profileName}>{profile?.display_name}</div>
              <div style={s.profileRole}>
                {profile?.role === 'superuser' ? '⭐ SuperUser' : 'User'}
              </div>
            </div>
          </div>
          <button style={s.signOutBtn} onClick={signOut}>Sign out</button>
        </div>
      </header>

      {/* Score bar */}
      <div style={s.scoreBanner}>
        <span style={s.scoreLabel}>Your Score</span>
        <span style={s.scoreValue}>{score.toLocaleString()} pts</span>
        <span style={s.scoreHint}>Play apps and spend time to earn more</span>
      </div>

      {/* App grid */}
      <main style={s.main}>
        <h2 style={s.sectionTitle}>Your Apps</h2>
        <div style={s.grid}>
          {APPS.map(app => (
            <button key={app.id} style={{ ...s.appCard, background: app.bg, '--accent': app.color }} onClick={() => openApp(app)}>
              <div style={s.appIcon}>{app.icon}</div>
              <div style={{ ...s.appName, color: app.color }}>{app.name}</div>
              <div style={s.appDesc}>{app.desc}</div>
              <div style={{ ...s.appArrow, color: app.color }}>→</div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Inter',system-ui,sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #1a1a2a' },
  logoWrap: { display: 'flex', alignItems: 'baseline', gap: 8 },
  logo: { fontSize: 28, fontWeight: 900, letterSpacing: -1 },
  zero: { color: '#6366f1' },
  logoSub: { fontSize: 12, color: '#444460', letterSpacing: 3, textTransform: 'uppercase' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  adminBtn: { background: '#1e1e3a', border: '1px solid #3a3a5a', color: '#a0a0ff', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' },
  profileChip: { display: 'flex', alignItems: 'center', gap: 10, background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 10, padding: '6px 14px' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 },
  profileName: { fontSize: 13, fontWeight: 600 },
  profileRole: { fontSize: 11, color: '#666680' },
  signOutBtn: { background: 'none', border: '1px solid #2a2a3a', color: '#666680', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' },
  scoreBanner: { display: 'flex', alignItems: 'center', gap: 16, background: '#0d0d1f', borderBottom: '1px solid #1a1a3a', padding: '12px 32px' },
  scoreLabel: { fontSize: 12, color: '#555570', textTransform: 'uppercase', letterSpacing: 1 },
  scoreValue: { fontSize: 22, fontWeight: 800, color: '#6366f1' },
  scoreHint: { fontSize: 12, color: '#333350' },
  main: { padding: '40px 32px', maxWidth: 1000, margin: '0 auto' },
  sectionTitle: { fontSize: 16, fontWeight: 500, color: '#555570', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  appCard: { position: 'relative', border: '1px solid #2a2a3a', borderRadius: 16, padding: '28px 24px', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.15s, border-color 0.15s', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 180 },
  appIcon: { fontSize: 36, lineHeight: 1 },
  appName: { fontSize: 20, fontWeight: 800, letterSpacing: -0.5 },
  appDesc: { fontSize: 13, color: '#777790', lineHeight: 1.5, flex: 1 },
  appArrow: { fontSize: 20, fontWeight: 700, alignSelf: 'flex-end' }
}
