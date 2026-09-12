import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'

import { supabase } from '../../lib/supabase'

export function LoginPage() {
  const [message, setMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    })
    if (error) {
      setMessage(error.message)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <p className="eyebrow">THREATSENTRY</p>
        <h1 id="login-title">Sign in to ThreatSentry</h1>
        <p className="subtitle">Access your authorized security operations console.</p>
        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          <button type="submit">Sign in</button>
        </form>
        <p>New to ThreatSentry? <a href="/register">Create an account</a></p>
        {message ? <p role="status">{message}</p> : null}
      </section>
    </main>
  )
}
