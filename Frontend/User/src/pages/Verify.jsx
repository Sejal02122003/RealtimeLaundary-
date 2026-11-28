import { useState } from 'react'
import { Redirect, useRouter } from '../routes/router.jsx'
import { useStore } from '../context/store.jsx'
import { useToast } from '../components/Toast.jsx'
import FlowHeader from '../components/FlowHeader.jsx'

// Demo only: a real OTP must be generated and checked by the backend.
const DEMO_OTP = '1234'

export default function Verify() {
  const { navigate } = useRouter()
  const { pendingContact, actions } = useStore()
  const showToast = useToast()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [missingContact] = useState(!pendingContact)

  if (missingContact) return <Redirect to="/" />

  const handleSubmit = (event) => {
    event.preventDefault()
    if (otp !== DEMO_OTP) return setError('That OTP is not correct')
    navigate('/home', { replace: true, onUpdate: actions.login })
  }

  return (
    <main className="screen">
      <FlowHeader title="Verify OTP" fallback="/" />
      <form className="screen__form" onSubmit={handleSubmit} noValidate>
        <div className="screen__scroll">
          <p className="muted">
            Enter the 4-digit code for <strong>{pendingContact}</strong>
          </p>
          <input
            className="otp-input"
            aria-label="4-digit OTP"
            aria-invalid={Boolean(error)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            placeholder="••••"
            autoFocus
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ''))
              setError('')
            }}
          />
          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}
          <p className="note">Demo mode: no message is sent. Use {DEMO_OTP}.</p>
          <button
            type="button"
            className="text-button text-button--start"
            onClick={() => showToast(`Demo OTP is ${DEMO_OTP}`)}
          >
            Resend OTP
          </button>
        </div>
        <footer className="screen__footer">
          <button type="submit" className="primary-button" disabled={otp.length < 4}>
            Verify and continue
          </button>
        </footer>
      </form>
    </main>
  )
}
