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

export default function Housemates({ user, home, theme: themePrimary, onBack }) {
  const theme = THEMES.find(t => t.primary === themePrimary) || THEMES[0]
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)

    // Ev üyelerini yükle
    const { data: membersData } = await supabase
      .from('home_members')
      .select('user_id, role')
      .eq('home_id', home.id)

    if (!membersData?.length) { setLoading(false); return }

    const userIds = membersData.map(m => m.user_id)

    // Profilleri yükle
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    // Bugünkü tamamlamaları yükle
    const { data: completionsData } = await supabase
      .from('task_completions')
      .select('completed_by')
      .eq('completed_date', getTodayStr())

    // Toplam tamamlamaları yükle
    const { data: allCompletions } = await supabase
      .from('task_completions')
      .select('completed_by')

    // Her üye için sayıları hesapla
    const result = membersData.map(m => {
      const profile = profilesData?.find(p => p.id === m.user_id)
      const todayCount = completionsData?.filter(c => c.completed_by === m.user_id).length || 0
      const totalCount = allCompletions?.filter(c => c.completed_by === m.user_id).length || 0
      return {
        ...profile,
        role: m.role,
        todayCount,
        totalCount,
        isMe: m.user_id === user.id,
      }
    })

    // Kendini en üste al
    result.sort((a, b) => (b.isMe ? 1 : 0) - (a.isMe ? 1 : 0))

    setMembers(result)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: 24 }}>⏳</div>
  )

  return (
  <div style={{ ...styles.container, background: theme.bg }}>
    <div style={{ ...styles.housematesHeader, background: theme.dark }}>
      <button style={styles.backBtn} onClick={onBack}>←</button>
      <span style={styles.housematesTitle}>Ev Sakinleri</span>
      <div style={{ width: 36 }} />
    </div>
    <div style={styles.content}>

        {/* Başlık */}
        <div style={styles.sectionTitle}>Ev Sakinleri</div>

        {/* Üye kartları */}
        {members.map(m => (
          <div key={m.id} style={{ ...styles.memberCard, borderColor: m.isMe ? theme.primary : '#e8e2da' }}>
            <div style={{ ...styles.avatar, background: theme.primary + '22', borderColor: theme.primary + '44' }}>
              <span style={styles.avatarEmoji}>{m.avatar_emoji || '😊'}</span>
            </div>
            <div style={styles.memberInfo}>
              <div style={styles.memberName}>
                {m.display_name || 'Kullanıcı'}
                {m.isMe && <span style={{ ...styles.meBadge, background: theme.primary }}>Ben</span>}
                {m.role === 'admin' && <span style={styles.adminBadge}>👑</span>}
              </div>
              <div style={styles.memberEmail}>{m.email}</div>
            </div>
            <div style={styles.memberStats}>
              <div style={styles.statBox}>
                <span style={{ ...styles.statNum, color: theme.primary }}>{m.todayCount}</span>
                <span style={styles.statLabel}>bugün</span>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statBox}>
                <span style={{ ...styles.statNum, color: theme.primary }}>{m.totalCount}</span>
                <span style={styles.statLabel}>toplam</span>
              </div>
            </div>
          </div>
        ))}

        {/* Davet kodu */}
        <div style={{ ...styles.inviteCard, borderColor: theme.primary + '44', background: theme.primary + '11' }}>
          <div style={styles.inviteTitle}>🔑 Davet Kodu</div>
          <div style={{ ...styles.inviteCode, color: theme.primary }}>{home.invite_code}</div>
          <div style={styles.inviteHint}>Bu kodu paylaşarak eve yeni üye ekleyebilirsin</div>
        </div>

      </div>
    </div>
  )
}

const styles = {
  container: { flex: 1, fontFamily: 'sans-serif', overflowY: 'auto' },
  content: { padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#8a8a9a', textTransform: 'uppercase', letterSpacing: 1, padding: '4px 0' },
  memberCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: 'white', borderRadius: 16, padding: '14px 16px',
    border: '1.5px solid', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid', flexShrink: 0,
  },
  avatarEmoji: { fontSize: 26 },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 15, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 6 },
  memberEmail: { fontSize: 11, color: '#aaa', marginTop: 2 },
  meBadge: { fontSize: 10, fontWeight: 700, color: 'white', padding: '2px 7px', borderRadius: 20 },
  adminBadge: { fontSize: 14 },
  memberStats: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  statBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 },
  statNum: { fontSize: 20, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 10, color: '#aaa' },
  statDivider: { width: 1, height: 28, background: '#eee' },
  inviteCard: {
    borderRadius: 16, padding: '16px 20px',
    border: '1.5px solid', textAlign: 'center',
    marginTop: 8,
  },
  inviteTitle: { fontSize: 13, color: '#8a8a9a', marginBottom: 8 },
  inviteCode: { fontSize: 32, fontWeight: 800, letterSpacing: 6, marginBottom: 8 },
  inviteHint: { fontSize: 12, color: '#aaa' },
  housematesHeader: { padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' },
housematesTitle: { fontSize: 17, fontWeight: 700, color: 'white' },
backBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 10, fontSize: 18, cursor: 'pointer' },
}
