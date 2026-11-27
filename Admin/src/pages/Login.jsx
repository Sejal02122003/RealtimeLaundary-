import { useState } from 'react'
import { api } from '../api.js'
import { useRouter } from '../router.jsx'
import { useSession } from '../session.jsx'

export default function Login() {
  const { navigate } = useRouter()
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { token } = await api('/auth/login', { method: 'POST', body: { email, password } })
      navigate('/dashboard', { replace: true, onUpdate: () => signIn(token) })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <form className="login__card form" onSubmit={handleSubmit}>
        <div>
          <h1>FreshFold</h1>
          <p>Admin panel</p>
        </div>
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button button--blue button--block" disabled={busy}>
          Log in
        </button>
      </form>
    </main>
  )
}
