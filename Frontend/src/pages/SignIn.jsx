import { useState } from 'react'
import { useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'
import Basket from '../components/Basket.jsx'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import Sheet from '../components/Sheet.jsx'
import Policies from '../components/Policies.jsx'
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
  const { pathname, query, navigate, back } = useRouter()
  const isSignUp = pathname === '/signup'
  const { actions } = useStore()
  const [referralCode, setReferralCode] = useState(
    () => query.get('ref')?.toUpperCase() ?? 'PRIYA482',
  )
  const [error, setError] = useState('')
  const [showPolicies, setShowPolicies] = useState(false)

  const referrer = isSignUp ? REFERRERS[referralCode] : null

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!isValidContact(contact)) {
      setError('Enter a valid mobile number or email')
      return
    }
    setError('')
    // TODO: call the send-OTP API here.
    navigate('/verify', { onUpdate: () => actions.startLogin(contact.trim()) })
  }

  return (
    <main className="screen signin">
      <header className="signin__hero">
        <button type="button" className="signin__back" aria-label="Back" onClick={() => back('/')}>
          <Icon name="back" size={22} strokeWidth={2.4} />
        </button>
        <Logo />
        <Basket className="signin__art" sparkle />
      </header>

      <form className="signin__form" onSubmit={handleSubmit} noValidate>
        <h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="signin__intro">We will send you a one-time code.</p>

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

        {isSignUp && (
          <>
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
          </>
        )}

        <div className="signin__footer">
          <button type="submit" className="primary-button">
            Send OTP
          </button>
          <p>
            By continuing you accept the{' '}
            <button type="button" onClick={() => setShowPolicies(true)}>
              Terms
            </button>{' '}
            and{' '}
            <button type="button" onClick={() => setShowPolicies(true)}>
              Privacy Policy
            </button>
          </p>
        </div>
      </form>

      <Sheet open={showPolicies} title="Terms and privacy" onClose={() => setShowPolicies(false)}>
        <Policies />
      </Sheet>
    </main>
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
