import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthProvider'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'

function AppRoutes() {
  const { user, loading, denied } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6366f1', fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>
        AI<span style={{ color: '#fff' }}>0</span>
      </div>
    </div>
  )

  if (!user) return <LoginPage denied={denied} />

  return (
    <Routes>
      <Route path="/"       element={<Dashboard />} />
      <Route path="/admin"  element={<AdminPanel />} />
      <Route path="*"       element={<Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
