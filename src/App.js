import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './pages/Auth'
import HomeSetup from './pages/HomeSetup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'

function App() {
  const [session, setSession] = useState(null)
  const [home, setHome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [theme, setTheme] = useState(() => localStorage.getItem('saribez_theme') || '#F0A500')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checkHome(session.user.id)
      else setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checkHome(session.user.id)
      else { setLoading(false); setHome(null) }
    })
  }, [])

  async function checkHome(userId) {
    const { data } = await supabase
      .from('home_members')
      .select('home_id, homes(id, name, invite_code)')
      .eq('user_id', userId)
      .single()
    setHome(data?.homes || null)
    setLoading(false)
  }

  function handleThemeChange(color) {
    setTheme(color)
    localStorage.setItem('saribez_theme', color)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 24 }}>⏳</div>
  )
  if (!session) return <Auth />
  if (!home) return <HomeSetup user={session.user} />

  if (page === 'profile') return (
    <Profile
      user={session.user}
      home={home}
      onBack={() => setPage('dashboard')}
      onThemeChange={handleThemeChange}
      currentTheme={theme}
    />
  )

  return (
    <Dashboard
      user={session.user}
      home={home}
      theme={theme}
      onProfileClick={() => setPage('profile')}
    />
  )
}

export default App
