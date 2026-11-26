import { useState } from 'react'
import './SignIn.css'

// Placeholder data until the referral lookup API exists in the backend.
const REFERRERS = {
  PRIYA482: 'Priya Sharma',
}

const isValidContact = (value) => {
  const trimmed = value.trim()
  if (trimmed.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  return /^(\+91)?[6-9]\d{9}$/.test(trimmed.replace(/\s/g, ''))
}

export default function SignIn() {
  const [contact, setContact] = useState('98765 43210')
  const [referralCode, setReferralCode] = useState('PRIYA482')
  const [error, setError] = useState('')

  const referrer = REFERRERS[referralCode]

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!isValidContact(contact)) {
      setError('Enter a valid mobile number or email')
      return
    }
    setError('')
    // TODO: call the send-OTP API here.
  }

  return (
    <main className="signin">
      <header className="signin__hero">
        <div className="signin__logo" aria-hidden="true">
          <WasherIcon />
        </div>
        <h1>
          Laundry picked up.
          <br />
          Rewards earned.
        </h1>
        <p>FreshFold collects, cleans and delivers to your door.</p>
      </header>

      <form className="signin__form" onSubmit={handleSubmit} noValidate>
        <h2>Sign in or create account</h2>

        <label htmlFor="contact">Mobile number or email</label>
        <input
          id="contact"
          className="field"
          type="text"
          autoComplete="username"
          placeholder="Mobile number or email"
          value={contact}
          onChange={(e) => {
            setContact(e.target.value)
            setError('')
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'contact-error' : undefined}
        />
        {error && (
          <p id="contact-error" className="signin__error" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="referral">Referral code (optional)</label>
        <input
          id="referral"
          className="field field--referral"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          maxLength={12}
          placeholder="ENTER CODE"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase().trim())}
        />

        <div aria-live="polite">
          {referrer && (
            <p className="signin__referrer">
              <CheckIcon />
              You are joining {referrer}&apos;s network
            </p>
          )}
        </div>

        <div className="signin__footer">
          <button type="submit">Send OTP</button>
          <p>
            By continuing you accept the <a href="#terms">Terms</a> and{' '}
            <a href="#privacy">Privacy Policy</a>
          </p>
        </div>
      </form>
    </main>
  )
}

function WasherIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="3.5" y="2.5" width="17" height="19" rx="3.5" />
      <circle cx="12" cy="13" r="4.5" />
      <path d="M7.5 6.5h.01" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  )
}
