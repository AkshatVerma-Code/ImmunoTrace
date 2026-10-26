import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { authApi } from '../services/api'

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const register = mode === 'register'
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [complete, setComplete] = useState(false)

  if (complete) return <Navigate to="/dashboard" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (register && password !== confirm) { setError('Those passwords don’t match yet.'); return }
    setBusy(true)
    try {
      if (register) await authApi.register(username, password)
      else await authApi.login(username, password)
      setComplete(true)
      navigate('/dashboard', { replace: true })
    } catch (err) { setError(err instanceof Error ? err.message : 'Please try again.') }
    finally { setBusy(false) }
  }

  return <AuthLayout title={register ? 'Create your account' : 'Welcome back'} subtitle={register ? 'A little more clarity starts here.' : 'Sign in to pick up where you left off.'}>
    <form className="auth-form" onSubmit={submit}>
      {error && <div className="form-error" role="alert">{error}</div>}
      <label className="field-label" htmlFor="username">Username</label>
      <div className="input-wrap"><UserRound size={17} /><input id="username" autoComplete="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_.-]+" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" /></div>
      <div className="field-label-row"><label className="field-label" htmlFor="password">Password</label>{!register && <span className="password-hint">At least 10 characters</span>}</div>
      <div className="input-wrap"><LockKeyhole size={17} /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 10 : undefined} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" /><button className="reveal-button" type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
      {register && <><label className="field-label" htmlFor="confirm">Confirm password</label><div className="input-wrap"><LockKeyhole size={17} /><input id="confirm" type="password" autoComplete="new-password" required minLength={10} maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Enter your password again" /></div></>}
      {register && <p className="password-note">Use 10 or more characters. Your password is securely encrypted.</p>}
      <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={17} /> {register ? 'Creating account…' : 'Signing in…'}</> : <>{register ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></>}</button>
      <p className="auth-switch">{register ? 'Already have an account?' : 'New to ImmunoTrace?'} <Link to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p>
    </form>
  </AuthLayout>
}
