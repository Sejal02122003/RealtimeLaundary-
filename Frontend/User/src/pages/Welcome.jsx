import { useState } from 'react'
import { useRouter } from '../routes/router.jsx'
import LaundryScene from '../components/LaundryScene.jsx'
import Logo from '../components/Logo.jsx'
import Policies from '../components/Policies.jsx'
import Sheet from '../components/Sheet.jsx'
import './Welcome.css'

export default function Welcome() {
  const { query, navigate } = useRouter()
  const [showPolicies, setShowPolicies] = useState(false)

  // Invite links open this screen, so carry their code into sign up.
  const referral = query.get('ref')
  const signUpPath = referral ? `/signup?ref=${encodeURIComponent(referral)}` : '/signup'

  return (
    <main className="screen welcome">
      <div className="welcome__hero">
        <Logo />
        <LaundryScene />
      </div>

      <div className="welcome__body">
        <h1>
          Laundry, done for you.
          <br />
          Anytime, anywhere
        </h1>

        <button type="button" className="primary-button" onClick={() => navigate(signUpPath)}>
          Get Started
        </button>
        <button type="button" className="soft-button" onClick={() => navigate('/signin')}>
          I already have an account
        </button>

        <p>
          By continuing you agree to our{' '}
          <button type="button" onClick={() => setShowPolicies(true)}>
            Terms of Services
          </button>{' '}
          and{' '}
          <button type="button" onClick={() => setShowPolicies(true)}>
            Privacy Policy
          </button>
        </p>
      </div>

      <Sheet open={showPolicies} title="Terms and privacy" onClose={() => setShowPolicies(false)}>
        <Policies />
      </Sheet>
    </main>
  )
}
