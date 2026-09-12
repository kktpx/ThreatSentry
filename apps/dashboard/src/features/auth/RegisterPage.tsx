import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../../lib/supabase'

export function RegisterPage() {
  const [message, setMessage] = useState<string | null>(null)

  const navigate = useNavigate()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const { data, error } = await supabase.auth.signUp({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    })
    
    if (error) {
      setMessage(error.message)
    } else if (data.session) {
      navigate('/dashboard', { replace: true })
    } else {
      setMessage('Account created. Check your email to confirm your account.')
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="register-title">
        <p className="eyebrow">THREATSENTRY</p>
        <h1 id="register-title">Create your account</h1>
        <p className="subtitle">Set up your authorized security operations console.</p>
        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <button type="submit">Create account</button>
        </form>
        <p>Already have an account? <a href="/login">Sign in</a></p>
        {message ? <p role="status">{message}</p> : null}
      </section>
    </main>
  )
}
