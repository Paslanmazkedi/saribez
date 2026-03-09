import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function HomeSetup({ user }) {
  const [mode, setMode] = useState(null) // 'create' veya 'join'
  const [homeName, setHomeName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function createHome() {
    if (!homeName.trim()) { setMessage('Ev adı gerekli!'); return }
    setLoading(true)
    setMessage('')

    // Ev oluştur
    const { data: home, error } = await supabase
      .from('homes')
      .insert({ name: homeName, created_by: user.id })
      .select()
      .single()

    if (error) { setMessage('Hata: ' + error.message); setLoading(false); return }

    // Oluşturana admin olarak üyelik ekle
    await supabase.from('home_members').insert({
      home_id: home.id,
      user_id: user.id,
      role: 'admin'
    })

    setLoading(false)
    window.location.reload()
  }

  async function joinHome() {
    if (!inviteCode.trim()) { setMessage('Davet kodu gerekli!'); return }
    setLoading(true)
    setMessage('')

    // Kodu ara
    const { data: home, error } = await supabase
      .from('homes')
      .select()
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (error || !home) { setMessage('Geçersiz davet kodu!'); setLoading(false); return }

    // Üyelik ekle
    const { error: memberError } = await supabase.from('home_members').insert({
      home_id: home.id,
      user_id: user.id,
      role: 'member'
    })

    if (memberError) { setMessage('Zaten bu eve üyesin veya hata oluştu.'); setLoading(false); return }

    setLoading(false)
    window.location.reload()
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🏠</div>
        <h1 style={styles.title}>Evinizi Kurun</h1>
        <p style={styles.subtitle}>Yeni bir ev oluşturun ya da davet koduyla mevcut bir eve katılın</p>

        {!mode && (
          <div style={styles.buttonGroup}>
            <button style={styles.primaryBtn} onClick={() => setMode('create')}>
              🏠 Yeni Ev Oluştur
            </button>
            <button style={styles.secondaryBtn} onClick={() => setMode('join')}>
              🔑 Davet Koduyla Katıl
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={styles.form}>
            <input
              style={styles.input}
              type="text"
              placeholder="Ev adı (örn: Bizim Ev)"
              value={homeName}
              onChange={e => setHomeName(e.target.value)}
            />
            {message && <p style={styles.message}>{message}</p>}
            <button style={styles.primaryBtn} onClick={createHome} disabled={loading}>
              {loading ? 'Oluşturuluyor...' : 'Evi Oluştur'}
            </button>
            <button style={styles.backBtn} onClick={() => { setMode(null); setMessage('') }}>
              ← Geri
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div style={styles.form}>
            <input
              style={styles.input}
              type="text"
              placeholder="6 haneli davet kodu"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              maxLength={6}
            />
            {message && <p style={styles.message}>{message}</p>}
            <button style={styles.primaryBtn} onClick={joinHome} disabled={loading}>
              {loading ? 'Katılınıyor...' : 'Eve Katıl'}
            </button>
            <button style={styles.backBtn} onClick={() => { setMode(null); setMessage('') }}>
              ← Geri
            </button>
          </div>
        )}

        <button style={styles.logoutBtn} onClick={() => supabase.auth.signOut()}>
          Çıkış Yap
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f0eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: 20,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' },
  subtitle: { fontSize: 14, color: '#8a8a9a', marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  buttonGroup: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e8e2da',
    fontSize: 15, outline: 'none', fontFamily: 'sans-serif', textAlign: 'left'
  },
  primaryBtn: {
    padding: '14px', borderRadius: 10, border: 'none',
    background: '#f0a500', color: 'white', fontSize: 16,
    fontWeight: 600, cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '14px', borderRadius: 10, border: '2px solid #f0a500',
    background: 'white', color: '#f0a500', fontSize: 16,
    fontWeight: 600, cursor: 'pointer',
  },
  backBtn: {
    background: 'none', border: 'none', color: '#8a8a9a',
    fontSize: 14, cursor: 'pointer',
  },
  logoutBtn: {
    background: 'none', border: 'none', color: '#ccc',
    fontSize: 13, cursor: 'pointer', marginTop: 24,
  },
  message: { fontSize: 13, color: '#e07b39', margin: 0 },
}
