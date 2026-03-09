import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './pages/Auth'
import HomeSetup from './pages/HomeSetup'
import Dashboard from './pages/Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [home, setHome] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checkHome(session.user.id)
      else setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checkHome(session.user.id)
      else setLoading(false)
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

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontSize:24}}>⏳</div>
  if (!session) return <Auth />
  if (!home) return <HomeSetup user={session.user} />
  return <Dashboard user={session.user} home={home} />
}

export default App