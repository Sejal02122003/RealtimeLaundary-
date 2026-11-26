import { useEffect, useState } from 'react'
import { useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'
import { initials } from '../utils.js'
import AddressForm from '../components/AddressForm.jsx'
import Policies from '../components/Policies.jsx'
import Sheet from '../components/Sheet.jsx'
import { useToast } from '../components/Toast.jsx'

const SHEET_TITLES = {
  profile: 'Edit profile',
  address: 'Add address',
  help: 'Help and policies',
  logout: 'Log out',
}

export default function Account() {
  const { navigate } = useRouter()
  const { user, notifications, addresses, defaultAddressId, actions } = useStore()
  const showToast = useToast()
  const [sheet, setSheet] = useState(null)
  const close = () => setSheet(null)

  useEffect(() => {
    actions.markNotificationsRead()
  }, [actions])

  const menu = [
    { label: 'Order history', onClick: () => navigate('/orders?tab=past') },
    { label: 'My sponsor & team', onClick: () => navigate('/refer') },
    { label: 'Help & policies', onClick: () => setSheet('help') },
  ]

  return (
    <main className="screen">
      <div className="screen__scroll account">
        <header className="profile">
          <span className="avatar avatar--large">{initials(user.name)}</span>
          <div>
            <h1>{user.name}</h1>
            <p>{user.phone}</p>
          </div>
          <button type="button" className="outline-button" onClick={() => setSheet('profile')}>
            Edit
          </button>
        </header>

        <div className="section-head">
          <h2>Notifications</h2>
        </div>
        <ul className="card rows">
          {notifications.slice(0, 3).map((n) => (
            <li key={n.id}>
              <div>
                <h3>{n.title}</h3>
                <p>{n.detail}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="section-head">
          <h2>Saved addresses</h2>
          <button type="button" className="text-button" onClick={() => setSheet('address')}>
            + Add new
          </button>
        </div>
        <ul className="card rows">
          {addresses.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  if (a.id === defaultAddressId) return
                  actions.setDefaultAddress(a.id)
                  showToast(`${a.label} is now your default address`)
                }}
              >
                <div>
                  <h3>
                    {a.label}
                    {a.id === defaultAddressId && ' · Default'}
                  </h3>
                  <p>{a.line}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <ul className="card rows menu">
          {menu.map((entry) => (
            <li key={entry.label}>
              <button type="button" onClick={entry.onClick}>
                <h3>{entry.label}</h3>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="logout" onClick={() => setSheet('logout')}>
          Log out
        </button>
      </div>

      <Sheet open={sheet !== null} title={SHEET_TITLES[sheet] ?? ''} onClose={close}>
        {sheet === 'profile' && <ProfileForm onSaved={close} />}
        {sheet === 'address' && <AddressForm onSaved={close} />}
        {sheet === 'help' && <Policies />}
        {sheet === 'logout' && (
          <div className="form">
            <p className="form__hint">Do you want to log out?</p>
            <button
              type="button"
              className="primary-button primary-button--danger"
              onClick={() =>
                navigate('/', { replace: true, transition: 'back', onUpdate: actions.logout })
              }
            >
              Log out
            </button>
          </div>
        )}
      </Sheet>
    </main>
  )
}

function ProfileForm({ onSaved }) {
  const { user, actions } = useStore()
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone)
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!name.trim()) return setError('Enter your name')
    if (!/^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) {
      return setError('Enter a valid mobile number')
    }
    actions.updateProfile({ name: name.trim(), phone: phone.trim() })
    onSaved()
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label>
        Name
        <input autoComplete="name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Mobile number
        <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary-button">
        Save changes
      </button>
    </form>
  )
}
