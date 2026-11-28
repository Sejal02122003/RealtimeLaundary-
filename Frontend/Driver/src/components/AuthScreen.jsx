import { useRef, useState } from 'react'
import { api } from '../api/api.js'
import { useRouter } from '../routes/router.jsx'
import { useSession } from '../context/session.jsx'
import { isValidPhone, phoneDigits, spacedPhone } from '../utils/utils.js'
import Icon from './Icon.jsx'
import OtpFields, { useOtpRequest } from './OtpFields.jsx'

const PHONE_KEY = 'freshfold-driver-phone'
const DEMO_PHONE = '99887 76655'

function lastPhone() {
  try {
    const saved = window.localStorage.getItem(PHONE_KEY)
    if (saved) return spacedPhone(saved)
  } catch {
    // Storage can be blocked.
  }
  return import.meta.env.DEV ? DEMO_PHONE : ''
}

/** Login and registration share the hero and the phone + OTP form. */
export default function AuthScreen({ register = false }) {
  const { navigate } = useRouter()
  const { signIn } = useSession()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState(() => (register ? '' : lastPhone()))
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const otpRef = useRef(null)
  const otpRequest = useOtpRequest(phone, setError)

  const edit = (setter) => (value) => {
    setter(value)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (register && name.trim().length < 2) return setError('Enter your full name')
    if (!isValidPhone(phone)) return setError('Enter a valid 10-digit mobile number')
    if (otp.length < 4) {
      if (otpRequest.isSent) setError('Enter the 4-digit OTP')
      // Focusing the box sends the code; if it already has focus, send it here.
      if (document.activeElement !== otpRef.current) otpRef.current.focus()
      else if (!otpRequest.isSent) otpRequest.send()
      return undefined
    }

    setBusy(true)
    setError('')
    try {
      const number = phoneDigits(phone)
      const session = await api(register ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: { phone: number, otp, name: name.trim() },
      })
      try {
        window.localStorage.setItem(PHONE_KEY, number)
      } catch {
        // Storage can be blocked.
      }
      const next = session.driver.status === 'approved' ? '/jobs' : '/profile'
      navigate(next, { replace: true, onUpdate: () => signIn(session) })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
    return undefined
  }

  return (
    <main className="screen auth">
      <header className={register ? 'auth__hero auth__hero--compact' : 'auth__hero'}>
        <div className="auth__logo">
          <Icon name="truck" size={34} strokeWidth={2.2} />
        </div>
        <h1>
          FreshFold
          <br />
          Driver
        </h1>
        <p>
          {register
            ? 'Create your account, then upload your documents.'
            : 'Your pickups and deliveries, one job at a time.'}
        </p>
      </header>

      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {register && (
          <label className="field">
            Full name
            <input
              autoComplete="name"
              maxLength={60}
              placeholder="As on your driving licence"
              value={name}
              onChange={(e) => edit(setName)(e.target.value)}
            />
          </label>
        )}
        <label className="field">
          {register ? 'Mobile number' : 'Registered mobile number'}
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={15}
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => edit(setPhone)(e.target.value.replace(/[^\d\s+]/g, ''))}
          />
        </label>
        <OtpFields otp={otp} onChange={edit(setOtp)} request={otpRequest} inputRef={otpRef} />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="button button--primary" disabled={busy}>
          {busy ? <span className="spinner" aria-label="Please wait" /> : register ? 'Register' : 'Log in'}
        </button>
        <button
          type="button"
          className="auth__switch"
          onClick={() =>
            navigate(register ? '/' : '/register', { transition: register ? 'back' : 'forward' })
          }
        >
          {register ? 'Already registered? Log in' : 'New driver? Register and upload documents'}
        </button>
      </form>
    </main>
  )
}
