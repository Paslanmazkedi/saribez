import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const THEMES = [
  { primary: '#F0A500', bg: '#FFF8E1', dark: '#1a1a2e' },
  { primary: '#E91E8C', bg: '#FFF0F5', dark: '#2D0A1E' },
  { primary: '#7C3AED', bg: '#F5F0FF', dark: '#1A0A2E' },
  { primary: '#10B981', bg: '#F0FFF8', dark: '#0A2E1A' },
  { primary: '#3B82F6', bg: '#F0F5FF', dark: '#0A1A2E' },
  { primary: '#F97316', bg: '#FFF5F0', dark: '#2E1A0A' },
]

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Günaydın'
  if (h < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - (day === 0 ? 6 : day - 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

export default function Home({ user, home, theme: themePrimary }) {
  const theme = THEMES.find(t => t.primary === themePrimary) || THEMES[0]

  const [profile, setProfile] = useState(null)
  const [todayDone, setTodayDone] = useState(0)
  const [todayTotal, setTodayTotal] = useState(0)
  const [weekDone, setWeekDone] = useState(0)
  const [pendingTodos, setPendingTodos] = useState(0)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)
    const today = getTodayStr()
    const weekStart = getWeekStart()
    const dayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay()

    // Profil
    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)

    // Bugünkü haftalık görevler
    const { data: tasks } = await supabase
      .from('tasks').select('id, days_of_week')
      .eq('home_id', home.id).eq('is_active', true)

    const todayTasks = (tasks || []).filter(t =>
      t.days_of_week.map(Number).includes(dayOfWeek)
    )
    setTodayTotal(todayTasks.length)

    // Bugün tamamlanan haftalık görevler
    const { data: todayCompletions } = await supabase
      .from('task_completions').select('task_id, completed_by')
      .eq('completed_date', today)
    const myTodayDone = (todayCompletions || []).filter(c => c.completed_by === user.id).length
    setTodayDone(myTodayDone)

    // Bu hafta tamamlanan görevler (benim)
    const { data: weekCompletions } = await supabase
      .from('task_completions').select('id')
      .eq('completed_by', user.id)
      .gte('completed_date', weekStart)
    setWeekDone((weekCompletions || []).length)

    // Bekleyen todo'lar
    const { data: todos } = await supabase
      .from('todos').select('id')
      .eq('home_id', home.id).eq('is_done', false)
    setPendingTodos((todos || []).length)

    // Ev sakinleri + bugünkü tamamlamaları
    const { data: membersData } = await supabase
      .from('home_members').select('user_id').eq('home_id', home.id)

    if (membersData?.length) {
      const userIds = membersData.map(m => m.user_id)
      const { data: profilesData } = await supabase
        .from('profiles').select('*').in('id', userIds)

      const result = (profilesData || []).map(p => ({
        ...p,
        todayCount: (todayCompletions || []).filter(c => c.completed_by === p.id).length,
        isMe: p.id === user.id,
      }))
      result.sort((a, b) => (b.isMe ? 1 : 0) - (a.isMe ? 1 : 0))
      setMembers(result)
    }

    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: 24, background: theme.bg }}>⏳</div>
  )

  const myName = profile?.display_name?.split(' ')[0] || 'Orada'
  const myEmoji = profile?.avatar_emoji || '😊'
  const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0

  return (
    <div style={{ ...styles.container, background: theme.bg }}>

      {/* Karşılama */}
      <div style={{ ...styles.welcomeCard, background: theme.dark }}>
        <div style={styles.welcomeTop}>
          <div>
            <div style={styles.greeting}>{getGreeting()},</div>
            <div style={styles.welcomeName}>{myEmoji} {myName}!</div>
          </div>
          <div style={{ ...styles.homeChip, background: theme.primary + '22', color: theme.primary }}>
            🏠 {home.name}
          </div>
        </div>
      </div>

      <div style={styles.content}>

        {/* Bugünkü özet */}
        <div style={styles.sectionLabel}>Bugün</div>
        <div style={{ ...styles.summaryCard, borderColor: theme.primary + '44' }}>
          <div style={styles.summaryRow}>
            <div style={styles.summaryItem}>
              <span style={{ ...styles.summaryNum, color: theme.primary }}>{todayDone}</span>
              <span style={styles.summaryLabel}>Tamamlandı</span>
            </div>
            <div style={styles.summaryDivider} />
            <div style={styles.summaryItem}>
              <span style={{ ...styles.summaryNum, color: theme.primary }}>{todayTotal - todayDone}</span>
              <span style={styles.summaryLabel}>Bekliyor</span>
            </div>
            <div style={styles.summaryDivider} />
            <div style={styles.summaryItem}>
              <span style={{ ...styles.summaryNum, color: theme.primary }}>{pendingTodos}</span>
              <span style={styles.summaryLabel}>Genel Görev</span>
            </div>
          </div>

          {/* İlerleme barı */}
          {todayTotal > 0 && (
            <div style={styles.progressWrap}>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${todayPct}%`,
                  background: `linear-gradient(90deg, ${theme.primary}, ${theme.primary}99)`
                }} />
              </div>
              <span style={styles.progressText}>{todayPct}%</span>
            </div>
          )}
        </div>

        {/* Bu hafta */}
        <div style={styles.sectionLabel}>Bu Hafta</div>
        <div style={{ ...styles.weekCard, borderColor: theme.primary + '44' }}>
          <div style={styles.weekRow}>
            <span style={styles.weekLabel}>Tamamlanan görev</span>
            <span style={{ ...styles.weekNum, color: theme.primary }}>{weekDone}</span>
          </div>
        </div>

        {/* Ev sakinleri bugün */}
        {members.length > 1 && (
          <>
            <div style={styles.sectionLabel}>Ev Sakinleri Bugün</div>
            <div style={styles.membersList}>
              {members.map(m => (
                <div key={m.id} style={{ ...styles.memberCard, borderColor: m.isMe ? theme.primary : '#e8e2da' }}>
                  <div style={{ ...styles.memberAvatar, background: theme.primary + '22' }}>
                    {m.avatar_emoji || '😊'}
                  </div>
                  <span style={styles.memberName}>
                    {m.display_name || 'Kullanıcı'}
                    {m.isMe && <span style={{ ...styles.meBadge, background: theme.primary }}> Ben</span>}
                  </span>
                  <span style={{ ...styles.memberDone, color: theme.primary }}>
                    {m.todayCount} görev
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

const styles = {
  container: { flex: 1, fontFamily: 'sans-serif', overflowY: 'auto' },
  welcomeCard: { padding: '20px 20px 24px', color: 'white' },
  welcomeTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: '#aaa', marginBottom: 2 },
  welcomeName: { fontSize: 24, fontWeight: 800, color: 'white' },
  homeChip: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20 },
  content: { padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  summaryCard: { background: 'white', borderRadius: 16, padding: '16px', border: '1.5px solid', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  summaryRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-around' },
  summaryItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  summaryNum: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  summaryLabel: { fontSize: 11, color: '#aaa' },
  summaryDivider: { width: 1, height: 36, background: '#eee' },
  progressWrap: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 },
  progressBar: { flex: 1, height: 7, background: '#eee', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, transition: 'width 0.4s ease' },
  progressText: { fontSize: 12, color: '#aaa', fontWeight: 600, width: 32, textAlign: 'right' },
  weekCard: { background: 'white', borderRadius: 16, padding: '14px 16px', border: '1.5px solid', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  weekRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  weekLabel: { fontSize: 14, color: '#555' },
  weekNum: { fontSize: 22, fontWeight: 800 },
  membersList: { display: 'flex', flexDirection: 'column', gap: 8 },
  memberCard: { display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderRadius: 14, padding: '12px 14px', border: '1.5px solid', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
  memberAvatar: { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 },
  memberName: { flex: 1, fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
  meBadge: { fontSize: 10, color: 'white', padding: '1px 6px', borderRadius: 20, marginLeft: 4 },
  memberDone: { fontSize: 13, fontWeight: 700 },
}
