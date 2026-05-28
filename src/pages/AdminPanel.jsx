import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../components/AuthProvider'
import { useNavigate } from 'react-router-dom'

export default function AdminPanel() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('activity')
  const [logs, setLogs] = useState([])
  const [deviceLogs, setDeviceLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.role !== 'superuser') { navigate('/'); return }
    fetchAll()
  }, [profile])

  async function fetchAll() {
    setLoading(true)
    const [{ data: acts }, { data: devs }, { data: profs }] = await Promise.all([
      supabase.from('activity_logs').select('*, profiles(display_name,email)').order('logged_at', { ascending: false }).limit(200),
      supabase.from('device_logs').select('*, profiles(display_name,email)').order('logged_at', { ascending: false }).limit(100),
      supabase.from('profiles').select('*').order('created_at', { ascending: false })
    ])
    setLogs(acts ?? [])
    setDeviceLogs(devs ?? [])
    setUsers(profs ?? [])
    setLoading(false)
  }

  const tabs = [
    { id: 'activity', label: '📋 Activity' },
    { id: 'devices',  label: '💻 Devices' },
    { id: 'users',    label: '👥 Users' }
  ]

  return (
    <div style={s.root}>
      <header style={s.header}>
        <button style={s.back} onClick={() => navigate('/')}>← Dashboard</button>
        <h1 style={s.title}>Admin Panel</h1>
        <span style={s.badge}>SuperUser</span>
      </header>

      <div style={s.tabs}>
        {tabs.map(t => (
          <button key={t.id} style={{ ...s.tab, ...(tab === t.id ? s.activeTab : {}) }} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.content}>
        {loading && <p style={s.muted}>Loading...</p>}

        {!loading && tab === 'activity' && (
          <table style={s.table}>
            <thead><tr>
              {['Time','User','Action','App','Page','Metadata'].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={s.td}>{new Date(l.logged_at).toLocaleString()}</td>
                  <td style={s.td}>{l.profiles?.email}</td>
                  <td style={s.td}><span style={{...s.pill, background: actionColor(l.action)}}>{l.action}</span></td>
                  <td style={s.td}>{l.app}</td>
                  <td style={s.td}>{l.page ?? '—'}</td>
                  <td style={s.td}><code style={s.code}>{JSON.stringify(l.metadata)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && tab === 'devices' && (
          <table style={s.table}>
            <thead><tr>
              {['Time','User','Device','OS','Browser','Screen','Network','Battery','Memory','Cores'].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {deviceLogs.map(d => (
                <tr key={d.id}>
                  <td style={s.td}>{new Date(d.logged_at).toLocaleString()}</td>
                  <td style={s.td}>{d.profiles?.email}</td>
                  <td style={s.td}>{d.device_type}</td>
                  <td style={s.td}>{d.os}</td>
                  <td style={s.td}>{d.browser} {d.browser_version}</td>
                  <td style={s.td}>{d.screen_width}×{d.screen_height}</td>
                  <td style={s.td}>{d.network_type ?? '—'}</td>
                  <td style={s.td}>{d.battery_level != null ? `${d.battery_level}%${d.battery_charging ? '⚡' : ''}` : '—'}</td>
                  <td style={s.td}>{d.memory_gb != null ? `${d.memory_gb}GB` : '—'}</td>
                  <td style={s.td}>{d.cpu_cores ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && tab === 'users' && (
          <table style={s.table}>
            <thead><tr>
              {['Name','Email','Role','Score','Created','Last Seen'].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={s.td}>{u.display_name}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}><span style={{...s.pill, background: u.role === 'superuser' ? '#2a1a6a' : '#1a2a1a', color: u.role === 'superuser' ? '#a0a0ff' : '#80ff80'}}>{u.role}</span></td>
                  <td style={s.td}>{u.score.toLocaleString()}</td>
                  <td style={s.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={s.td}>{new Date(u.last_seen_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function actionColor(action) {
  const map = { login: '#0a3a0a', logout: '#3a0a0a', app_open: '#0a1a3a', app_close: '#2a1a00', page_view: '#1a1a1a' }
  return map[action] ?? '#1a1a2a'
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0f', color: '#fff', fontFamily: "'Inter',system-ui,sans-serif" },
  header: { display: 'flex', alignItems: 'center', gap: 16, padding: '20px 32px', borderBottom: '1px solid #1a1a2a' },
  back: { background: 'none', border: '1px solid #2a2a3a', color: '#888', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 },
  title: { fontSize: 20, fontWeight: 700, flex: 1 },
  badge: { background: '#1e1e3a', color: '#a0a0ff', fontSize: 11, padding: '4px 12px', borderRadius: 20, letterSpacing: 1, textTransform: 'uppercase' },
  tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #1a1a2a', padding: '0 32px' },
  tab: { background: 'none', border: 'none', color: '#555570', padding: '12px 20px', cursor: 'pointer', fontSize: 14, borderBottom: '2px solid transparent' },
  activeTab: { color: '#fff', borderBottomColor: '#6366f1' },
  content: { padding: '24px 32px', overflowX: 'auto' },
  muted: { color: '#555570' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '8px 12px', color: '#555570', fontWeight: 500, borderBottom: '1px solid #1a1a2a', whiteSpace: 'nowrap' },
  td: { padding: '8px 12px', borderBottom: '1px solid #0f0f1a', color: '#c0c0d0', verticalAlign: 'top' },
  pill: { display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11 },
  code: { fontSize: 11, color: '#555570', fontFamily: 'monospace' }
}
