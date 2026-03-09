import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const EMOJIS = [
  '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸',
  '🐺', '🦋', '🐙', '🦄', '🐧', '🦩', '🐝', '🦖',
  '🍀', '🌸', '🌻', '⭐', '🌈', '🔥', '💎', '🎯',
]

const THEMES = [
  { name: 'Altın', primary: '#F0A500', bg: '#FFF8E1', dark: '#1a1a2e' },
  { name: 'Pembe', primary: '#E91E8C', bg: '#FFF0F5', dark: '#2D0A1E' },
  { name: 'Mor', primary: '#7C3AED', bg: '#F5F0FF', dark: '#1A0A2E' },
  { name: 'Yeşil', primary: '#10B981', bg: '#F0FFF8', dark: '#0A2E1A' },
  { name: 'Mavi', primary: '#3B82F6', bg: '#F0F5FF', dark: '#0A1A2E' },
  { name: 'Mercan', primary: '#F97316', bg: '#FFF5F0', dark: '#2E1A0A' },
]

export default function Profile({ user, home, onBack, onThemeChange, currentTheme }) {
  const [profile, setProfile] = useState(null)
  const [members, setMembers] = useState([])
  const [completionCount, setCompletionCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => { loadAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)
    setNewName(profileData?.display_name || '')

    const { data: membersData } = await supabase
      .from('home_members')
      .select('user_id')
      .eq('home_id', home.id)

    if (membersData?.length) {
      const userIds = membersData.map(m => m.user_id)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      setMembers(profilesData || [])
    }

    const { count } = await supabase
      .from('task_completions')
      .select('*', { count: 'exact', head: true })
      .eq('completed_by', user.id)
    setCompletionCount(count || 0)

    setLoading(false)
  }

  async function saveName() {
    if (!newName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newName })
      .eq('id', user.id)
    if (!error) {
      setProfile(prev => ({ ...prev, display_name: newName }))
      setEditingName(false)
      setSaveMsg('✓ İsim kaydedildi')
      setTimeout(() => setSaveMsg(''), 2000)
    }
    setSaving(false)
  }

  async function saveEmoji(emoji) {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_emoji: emoji })
      .eq('id', user.id)
    if (!error) {
      setProfile(prev => ({ ...prev, avatar_emoji: emoji }))
      setSaveMsg('✓ Avatar kaydedildi')
      setTimeout(() => setSaveMsg(''), 2000)
    }
    setShowEmojiPicker(false)
  }

  async function leaveHome() {
    if (!window.confirm('Evden ayrılmak istediğine emin misin?')) return
    setLeaving(true)
    await supabase.from('home_members').delete()
      .eq('user_id', user.id)
      .eq('home_id', home.id)
    window.location.reload()
  }

  const theme = THEMES.find(t => t.primary === currentTheme) || THEMES[0]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 24 }}>⏳</div>
  )

  const myEmoji = profile?.avatar_emoji || '😊'
  const myName = profile?.display_name || 'Kullanıcı'
  const otherMembers = members.filter(m => m.id !== user.id)

  return (
    <div style={{ ...styles.container, background: theme.bg }}>

      {/* Header */}
      <div style={{ ...styles.header, background: theme.dark }}>
        <button style={styles.backBtn} onClick={onBack}>←</button>
        <span style={styles.headerTitle}>Profilim</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Kayıt mesajı */}
      {saveMsg && (
        <div style={{ ...styles.saveMsg, background: theme.primary }}>
          {saveMsg}
        </div>
      )}

      {/* Avatar + İsim */}
      <div style={{ ...styles.avatarSection, borderColor: theme.primary + '33' }}>
        <div
          style={{ ...styles.avatarBig, background: theme.primary + '22', borderColor: theme.primary }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <span style={styles.avatarEmoji}>{myEmoji}</span>
          <div style={{ ...styles.editBadge, background: theme.primary }}>✏️</div>
        </div>

        {showEmojiPicker && (
          <div style={styles.emojiPicker}>
            <p style={styles.emojiPickerTitle}>Avatarını seç</p>
            <div style={styles.emojiGrid}>
              {EMOJIS.map(e => (
                <button
                  key={e}
                  style={{
                    ...styles.emojiBtn,
                    ...(e === myEmoji ? { background: theme.primary + '33', borderColor: theme.primary } : {})
                  }}
                  onClick={() => saveEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {editingName ? (
          <div style={styles.nameEdit}>
            <input
              style={{ ...styles.nameInput, borderColor: theme.primary }}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && saveName()}
            />
            <div style={styles.nameEditBtns}>
              <button style={{ ...styles.saveNameBtn, background: theme.primary }} onClick={saveName} disabled={saving}>
                {saving ? '...' : 'Kaydet'}
              </button>
              <button style={styles.cancelNameBtn} onClick={() => { setEditingName(false); setNewName(profile?.display_name || '') }}>
                İptal
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.nameRow}>
            <span style={styles.nameText}>{myName}</span>
            <button style={{ ...styles.editNameBtn, color: theme.primary }} onClick={() => setEditingName(true)}>✏️ Düzenle</button>
          </div>
        )}

        <span style={styles.emailText}>{user.email}</span>
      </div>

      {/* İstatistik */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderColor: theme.primary + '44' }}>
          <span style={{ ...styles.statNumber, color: theme.primary }}>{completionCount}</span>
          <span style={styles.statLabel}>Tamamlanan Görev</span>
        </div>
        <div style={{ ...styles.statCard, borderColor: theme.primary + '44' }}>
          <span style={{ ...styles.statNumber, color: theme.primary }}>{members.length}</span>
          <span style={styles.statLabel}>Ev Sakini</span>
        </div>
      </div>

      {/* Ev Bilgisi */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🏠 Ev</h3>
        <div style={{ ...styles.homeCard, borderColor: theme.primary + '44' }}>
          <div style={styles.homeInfo}>
            <span style={styles.homeName}>{home.name}</span>
            <span style={{ ...styles.inviteCode, background: theme.primary + '22', color: theme.primary }}>
              Davet: {home.invite_code}
            </span>
          </div>
          {otherMembers.length > 0 && (
            <div style={styles.membersSection}>
              <span style={styles.membersLabel}>Ev arkadaşları</span>
              <div style={styles.membersList}>
                {otherMembers.map(m => (
                  <div key={m.id} style={styles.memberRow}>
                    <div style={{ ...styles.memberAvatar, background: theme.primary + '22', borderColor: theme.primary + '44' }}>
                      {m.avatar_emoji || '😊'}
                    </div>
                    <span style={styles.memberName}>{m.display_name || 'Kullanıcı'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tema Seçimi */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>🎨 Tema Rengi</h3>
        <div style={styles.themeGrid}>
          {THEMES.map(t => (
            <button
              key={t.primary}
              style={{
                ...styles.themeBtn,
                background: t.primary,
                ...(t.primary === currentTheme ? styles.themeBtnActive : {})
              }}
              onClick={() => onThemeChange(t.primary)}
              title={t.name}
            >
              {t.primary === currentTheme && <span style={styles.themeCheck}>✓</span>}
            </button>
          ))}
        </div>
        <p style={styles.themeHint}>Seçilen tema tüm uygulamaya yansır</p>
      </div>

      {/* Tehlikeli Bölge */}
      <div style={styles.section}>
        <button style={styles.leaveBtn} onClick={leaveHome} disabled={leaving}>
          {leaving ? '⏳ Ayrılıyor...' : '🚪 Evden Ayrıl'}
        </button>
        <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut()}>
          Çıkış Yap
        </button>
      </div>

      <div style={{ height: 40 }} />
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", paddingBottom: 40 },
  header: { padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white' },
  backBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 10, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: 700 },
  saveMsg: { color: 'white', textAlign: 'center', padding: '10px', fontSize: 14, fontWeight: 600 },
  avatarSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 24px', borderBottom: '1.5px solid', position: 'relative' },
  avatarBig: { width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid', cursor: 'pointer', position: 'relative', marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  avatarEmoji: { fontSize: 52 },
  editBadge: { position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
  emojiPicker: { background: 'white', borderRadius: 16, padding: '16px', marginBottom: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #eee', width: '100%', maxWidth: 320 },
  emojiPickerTitle: { fontSize: 13, color: '#999', margin: '0 0 10px', textAlign: 'center' },
  emojiGrid: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  emojiBtn: { fontSize: 26, background: '#F5F5F5', border: '2px solid transparent', borderRadius: 10, width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  nameRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  nameText: { fontSize: 22, fontWeight: 700, color: '#1a1a2e' },
  editNameBtn: { fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 },
  emailText: { fontSize: 13, color: '#999' },
  nameEdit: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280, marginBottom: 4 },
  nameInput: { padding: '10px 14px', borderRadius: 10, border: '2px solid', fontSize: 16, outline: 'none', textAlign: 'center', fontWeight: 600 },
  nameEditBtns: { display: 'flex', gap: 8 },
  saveNameBtn: { flex: 1, padding: '10px', borderRadius: 10, border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  cancelNameBtn: { flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid #eee', background: 'white', color: '#999', cursor: 'pointer', fontSize: 14 },
  statsRow: { display: 'flex', gap: 12, padding: '20px 20px 0' },
  statCard: { flex: 1, background: 'white', borderRadius: 16, padding: '16px', border: '1.5px solid', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  statNumber: { fontSize: 32, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#999', textAlign: 'center' },
  section: { padding: '20px 20px 0' },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: '0 0 12px' },
  homeCard: { background: 'white', borderRadius: 16, padding: '16px', border: '1.5px solid', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  homeInfo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  homeName: { fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  inviteCode: { fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 },
  membersSection: { borderTop: '1px solid #f0f0f0', paddingTop: 12 },
  membersLabel: { fontSize: 12, color: '#999', marginBottom: 8, display: 'block' },
  membersList: { display: 'flex', flexDirection: 'column', gap: 8 },
  memberRow: { display: 'flex', alignItems: 'center', gap: 10 },
  memberAvatar: { width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1.5px solid' },
  memberName: { fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
  themeGrid: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 },
  themeBtn: { width: 44, height: 44, borderRadius: '50%', border: '3px solid transparent', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  themeBtnActive: { border: '3px solid white', outline: '3px solid #333' },
  themeCheck: { color: 'white', fontSize: 18, fontWeight: 700 },
  themeHint: { fontSize: 12, color: '#aaa', margin: '0' },
  leaveBtn: { width: '100%', padding: '14px', background: '#FFF0F0', border: '1.5px solid #FFCCCC', borderRadius: 12, color: '#CC4444', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 },
  logoutBtn: { width: '100%', padding: '14px', background: '#F5F5F5', border: '1.5px solid #EEEEEE', borderRadius: 12, color: '#888', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
}
