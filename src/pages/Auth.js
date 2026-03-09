import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setMessage('')

    if (isLogin) {
      // Giriş yap
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage('Hata: ' + error.message)
    } else {
      // Kayıt ol
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage('Hata: ' + error.message)
      } else if (data.user) {
        // İsmi profile kaydet
        await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', data.user.id)
        setMessage('Kayıt başarılı! Giriş yapabilirsiniz.')
        setIsLogin(true)
      }
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>🧹</div>
        <h1 style={styles.title}>Sarı Bez</h1>
        <p style={styles.subtitle}>Ev halkının ortak görev takibi</p>

        {/* Form */}
        <div style={styles.form}>
          {!isLogin && (
            <input
              style={styles.input}
              type="text"
              placeholder="Adın (görünen isim)"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {message && (
            <p style={styles.message}>{message}</p>
          )}

          <button
            style={styles.button}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Bekleyin...' : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>

          <button
            style={styles.switchBtn}
            onClick={() => { setIsLogin(!isLogin); setMessage('') }}
          >
            {isLogin ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
          </button>
        </div>
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
  logo: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 6px',
  },
  subtitle: {
    fontSize: 14,
    color: '#8a8a9a',
    marginBottom: 32,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    padding: '12px 16px',
    borderRadius: 10,
    border: '1.5px solid #e8e2da',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'sans-serif',
  },
  button: {
    padding: '14px',
    borderRadius: 10,
    border: 'none',
    background: '#f0a500',
    color: 'white',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#3ab0c8',
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  message: {
    fontSize: 13,
    color: '#e07b39',
    margin: 0,
  }
}
