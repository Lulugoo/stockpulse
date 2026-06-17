import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthModal({ dark, onClose }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else onClose()
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const bg = dark ? '#444441' : '#ffffff'
  const text = dark ? '#F1EFE8' : '#2C2C2A'
  const subtext = dark ? '#B4B2A9' : '#888780'
  const inputBg = dark ? '#2C2C2A' : '#F1EFE8'
  const border = dark ? '#5F5E5A' : '#D3D1C7'

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: '400px', borderRadius: '20px', padding: '28px', backgroundColor: bg, margin: '0 16px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <span style={{ fontWeight: 700, fontSize: '18px', color: text }}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </span>
          <button onClick={onClose} style={{ color: subtext, fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <button
          onClick={handleGoogle}
          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `1px solid ${border}`, backgroundColor: inputBg, color: text, fontSize: '14px', fontWeight: 500, cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: border }}></div>
          <span style={{ color: subtext, fontSize: '12px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: border }}></div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${border}`, backgroundColor: inputBg, color: text, fontSize: '14px', marginBottom: '10px', outline: 'none', boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${border}`, backgroundColor: inputBg, color: text, fontSize: '14px', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }}
          />
          {error && <p style={{ color: '#E24B4A', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
          {message && <p style={{ color: '#639922', fontSize: '13px', marginBottom: '12px' }}>{message}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: subtext }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}
            style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}