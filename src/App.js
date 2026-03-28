import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './pages/Auth'
import HomeSetup from './pages/HomeSetup'
import Weekly from './pages/Dashboard'
import General from './pages/General'
import Profile from './pages/Profile'
import Housemates from './pages/Housemates'

const THEMES = [
  { primary: '#F0A500', bg: '#FFF8E1', dark: '#1a1a2e' },
  { primary: '#E91E8C', bg: '#FFF0F5', dark: '#2D0A1E' },
  { primary: '#7C3AED', bg: '#F5F0FF', dark: '#1A0A2E' },
  { primary: '#10B981', bg: '#F0FFF8', dark: '#0A2E1A' },
  { primary: '#3B82F6', bg: '#F0F5FF', dark: '#0A1A2E' },
  { primary: '#F97316', bg: '#FFF5F0', dark: '#2E1A0A' },
]

function App() {
  const [session, setSession] = useState(null)
  const [home, setHome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('general') // 'general' | 'weekly'
  const [page, setPage] = useState('main') // 'main' | 'profile' | 'housemates'
  const [theme, setTheme] = useState(() => localStorage.getItem('saribez_theme') || '#F0A500')

  const themeObj = THEMES.find(t => t.primary === theme) || THEMES[0]

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
  onBack={() => setPage('main')}
  onThemeChange={handleThemeChange}
  currentTheme={theme}
  onViewMembers={() => setPage('housemates')}
/>
  )
  if (page === 'housemates') return (
  <Housemates
    user={session.user}
    home={home}
    theme={theme}
    onBack={() => setPage('main')}
  />
)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', height: '100vh', background: themeObj.bg, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ ...styles.header, background: themeObj.dark }}>
        <div>
          <div style={styles.headerSub}>
  <img src="/logo512.png" alt="Sarı Bez" style={{ width: 20, height: 20, borderRadius: 4, marginRight: 4, verticalAlign: 'middle' }} />
  Sarı Bez
</div>
          <div style={styles.headerTitle}>{home.name}</div>
        </div>
        <div style={styles.headerRight}>
          <div style={{ ...styles.inviteCode, color: themeObj.primary, background: themeObj.primary + '22' }}>
            Davet: <strong>{home.invite_code}</strong>
          </div>
          <div style={styles.headerBtns}>
            <button style={styles.profileBtn} onClick={() => setPage('profile')}>👤</button>
            <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut()}>Çıkış</button>
          </div>
        </div>
      </div>

      {/* İçerik */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'general'
          ? <General user={session.user} home={home} theme={theme} />
          : <Weekly user={session.user} home={home} theme={theme} />
        }
      </div>

      {/* Alt navigasyon */}
      <div style={{ ...styles.bottomNav, background: themeObj.dark }}>
        <button
          style={{
            ...styles.navBtn,
            ...(tab === 'general' ? { ...styles.navBtnActive, color: themeObj.primary } : {})
          }}
          onClick={() => setTab('general')}
        >
          <span style={styles.navIcon}>✅</span>
          <span style={styles.navLabel}>Genel</span>
          {tab === 'general' && <div style={{ ...styles.navDot, background: themeObj.primary }} />}
        </button>
        <button
          style={{
            ...styles.navBtn,
            ...(tab === 'weekly' ? { ...styles.navBtnActive, color: themeObj.primary } : {})
          }}
          onClick={() => setTab('weekly')}
        >
          <span style={styles.navIcon}>📅</span>
          <span style={styles.navLabel}>Haftalık</span>
          {tab === 'weekly' && <div style={{ ...styles.navDot, background: themeObj.primary }} />}
        </button>
      </div>
    </div>
  )
}

const styles = {
  header: { color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  headerSub: { fontSize: 11, color: '#aaa', marginBottom: 2 },
  headerTitle: { fontSize: 18, fontWeight: 700 },
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  headerBtns: { display: 'flex', gap: 8, alignItems: 'center' },
  inviteCode: { fontSize: 11, padding: '3px 10px', borderRadius: 20 },
  profileBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 10, padding: '5px 10px', fontSize: 16, cursor: 'pointer' },
  logoutBtn: { background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer' },
  bottomNav: { display: 'flex', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)' },
  navBtn: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 0 8px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', position: 'relative', gap: 2 },
  navBtnActive: { color: 'white' },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 11, fontWeight: 600 },
  navDot: { width: 4, height: 4, borderRadius: '50%', marginTop: 2 },
}

export default App
