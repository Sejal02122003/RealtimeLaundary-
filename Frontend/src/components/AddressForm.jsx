import { useState } from 'react'
import { useStore } from '../store.jsx'

export default function AddressForm({ onSaved }) {
  const { actions } = useStore()
  const [fields, setFields] = useState({ label: '', line: '', area: '' })
  const [error, setError] = useState('')

  const bind = (name) => ({
    value: fields[name],
    onChange: (e) => {
      setFields((f) => ({ ...f, [name]: e.target.value }))
      setError('')
    },
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    const address = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.trim()]))
    if (Object.values(address).some((v) => !v)) return setError('Fill in all three fields')
    actions.addAddress(address)
    onSaved()
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label>
        Name
        <input placeholder="Home, Office…" maxLength={20} {...bind('label')} />
      </label>
      <label>
        Address
        <input placeholder="Flat, building, street" autoComplete="street-address" {...bind('line')} />
      </label>
      <label>
        Area
        <input placeholder="Locality" maxLength={30} {...bind('area')} />
      </label>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary-button">
        Save address
      </button>
    </form>
  )
}
