import { useState } from 'react'
import { supabase } from '../supabaseClient'

const SariBezLogo = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Sarı bez — katlanmış kumaş görünümü */}
    <defs>
      <linearGradient id="bezGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE566" />
        <stop offset="50%" stopColor="#F0A500" />
        <stop offset="100%" stopColor="#D4880A" />
      </linearGradient>
      <linearGradient id="bezGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF3A3" />
        <stop offset="100%" stopColor="#FFD700" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#D4880A" floodOpacity="0.4"/>
      </filter>
    </defs>

    {/* Bezin ana gövdesi — katlanmış köşeli kumaş */}
    <path
      d="M15 30 Q18 20 30 18 L75 22 Q85 24 82 35 L78 70 Q76 80 65 82 L28 78 Q18 76 18 65 Z"
      fill="url(#bezGrad)"
      filter="url(#shadow)"
    />

    {/* Üst katlanma çizgisi */}
    <path
      d="M20 38 Q50 34 80 40"
      stroke="#FFE566"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.8"
    />

    {/* Orta katlanma çizgisi */}
    <path
      d="M19 52 Q50 48 81 54"
      stroke="#E09000"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />

    {/* Alt katlanma */}
    <path
      d="M20 65 Q50 62 80 66"
      stroke="#E09000"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.4"
    />

    {/* Köşe kıvrımı — sağ üst */}
    <path
      d="M72 22 Q85 20 83 33 Q78 26 72 22Z"
      fill="url(#bezGrad2)"
      opacity="0.9"
    />

    {/* Köşe kıvrımı — sol alt */}
    <path
      d="M20 74 Q14 78 18 65 Q20 71 20 74Z"
      fill="#D4880A"
      opacity="0.6"
    />

    {/* Temizlik parlaması — sol üst */}
    <circle cx="32" cy="32" r="3" fill="white" opacity="0.6" />
    <circle cx="28" cy="38" r="1.5" fill="white" opacity="0.4" />

    {/* Küçük köpük noktaları */}
    <circle cx="55" cy="28" r="2" fill="white" opacity="0.5" />
    <circle cx="62" cy="55" r="1.5" fill="white" opacity="0.3" />
    <circle cx="38" cy="68" r="2" fill="white" opacity="0.35" />
  </svg>
)

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    setError('')
    setSuccess('')
    if (!email || !password) return setError('E-posta ve şifre gerekli.')
    setLoading(true)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('Giriş başarısız: ' + error.message)
    } else {
      if (!name.trim()) { setLoading(false); return setError('İsim gerekli.') }
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError('Kayıt başarısız: ' + error.message)
      } else if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, display_name: name })
        setSuccess('Kayıt başarılı! Giriş yapılıyor...')
      }
    }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      {/* Arka plan dekoratif elementler */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />
      <div style={styles.bgCircle3} />

      <div style={styles.card}>
        {/* Logo alanı */}
        <div style={styles.logoWrap}>
          <div style={styles.logoCircle}>
            <SariBezLogo size={56} />
          </div>
        </div>

        {/* Başlık */}
        <div style={styles.titleWrap}>
          <h1 style={styles.title}>Sarı Bez</h1>
          <p style={styles.subtitle}>Ev halkının ortak görev takibi</p>
        </div>

        {/* Tab seçici */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isLogin ? styles.tabActive : {}) }}
            onClick={() => { setIsLogin(true); setError(''); setSuccess('') }}
          >
            Giriş Yap
          </button>
          <button
            style={{ ...styles.tab, ...(!isLogin ? styles.tabActive : {}) }}
            onClick={() => { setIsLogin(false); setError(''); setSuccess('') }}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Form */}
        <div style={styles.form}>
          {!isLogin && (
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>👤</span>
              <input
                style={styles.input}
                placeholder="Adın"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div style={styles.inputWrap}>
            <span style={styles.inputIcon}>✉️</span>
            <input
              style={styles.input}
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div style={styles.inputWrap}>
            <span style={styles.inputIcon}>🔒</span>
            <input
              style={styles.input}
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={styles.successBox}>
              ✅ {success}
            </div>
          )}

          <button
            style={{ ...styles.btn, ...(loading ? styles.btnLoading : {}) }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '⏳ Lütfen bekle...' : isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>
        </div>

        {/* Alt yazı */}
        <p style={styles.switchText}>
          {isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
          <span
            style={styles.switchLink}
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }}
          >
            {isLogin ? 'Kayıt ol' : 'Giriş yap'}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFF8E1 0%, #FFF3CD 50%, #FFEAA7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  bgCircle1: {
    position: 'absolute', top: '-80px', right: '-80px',
    width: '300px', height: '300px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,165,0,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute', bottom: '-60px', left: '-60px',
    width: '250px', height: '250px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,165,0,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgCircle3: {
    position: 'absolute', top: '40%', left: '-30px',
    width: '150px', height: '150px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(26,26,46,0.04) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: 'white',
    borderRadius: '28px',
    padding: '40px 36px 32px',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 20px 60px rgba(26,26,46,0.12), 0 4px 16px rgba(240,165,0,0.15)',
    position: 'relative',
    zIndex: 1,
  },
  logoWrap: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  logoCircle: {
    width: '90px', height: '90px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FFF8E1 0%, #FFE566 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(240,165,0,0.3)',
    border: '3px solid rgba(240,165,0,0.2)',
  },
  titleWrap: { textAlign: 'center', marginBottom: '28px' },
  title: {
    fontSize: '28px', fontWeight: '800',
    color: '#1a1a2e', margin: '0 0 6px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px', color: '#999',
    margin: 0, letterSpacing: '0.2px',
  },
  tabs: {
    display: 'flex', background: '#F5F5F5',
    borderRadius: '12px', padding: '4px',
    marginBottom: '24px',
  },
  tab: {
    flex: 1, padding: '10px',
    border: 'none', borderRadius: '9px',
    fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', background: 'transparent',
    color: '#999', transition: 'all 0.2s',
  },
  tabActive: {
    background: 'white',
    color: '#1a1a2e',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    background: '#FAFAFA', borderRadius: '12px',
    border: '1.5px solid #EEEEEE',
    padding: '0 14px', gap: '10px',
    transition: 'border-color 0.2s',
  },
  inputIcon: { fontSize: '16px', flexShrink: 0 },
  input: {
    flex: 1, padding: '13px 0',
    border: 'none', outline: 'none',
    background: 'transparent', fontSize: '15px',
    color: '#1a1a2e',
  },
  errorBox: {
    background: '#FFF0F0', border: '1px solid #FFD0D0',
    borderRadius: '10px', padding: '10px 14px',
    fontSize: '13px', color: '#CC4444',
  },
  successBox: {
    background: '#F0FFF4', border: '1px solid #C3E6CB',
    borderRadius: '10px', padding: '10px 14px',
    fontSize: '13px', color: '#2D7A4F',
  },
  btn: {
    background: 'linear-gradient(135deg, #F0A500 0%, #E08A00 100%)',
    color: 'white', border: 'none',
    borderRadius: '12px', padding: '15px',
    fontSize: '16px', fontWeight: '700',
    cursor: 'pointer', marginTop: '4px',
    boxShadow: '0 4px 15px rgba(240,165,0,0.4)',
    transition: 'all 0.2s',
    letterSpacing: '0.3px',
  },
  btnLoading: { opacity: 0.7, cursor: 'not-allowed' },
  switchText: {
    textAlign: 'center', fontSize: '13px',
    color: '#999', marginTop: '20px', marginBottom: 0,
  },
  switchLink: {
    color: '#F0A500', fontWeight: '700',
    cursor: 'pointer', textDecoration: 'underline',
  },
}