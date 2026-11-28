import { useState } from 'react'
import { hasMapsKey } from '../api/maps.js'
import { useStore } from '../context/store.jsx'
import LocationPicker from './LocationPicker.jsx'

const AREA_MAX_LENGTH = 30

export default function AddressForm({ onSaved }) {
  const { actions } = useStore()
  const [fields, setFields] = useState({ label: '', line: '', area: '' })
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')

  const handlePick = ({ location, line, area }) => {
    setLocation(location)
    if (line === undefined) return
    setFields((f) => ({ ...f, line, area: area.slice(0, AREA_MAX_LENGTH) }))
    setError('')
  }

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
    actions.addAddress(location ? { ...address, location } : address)
    onSaved()
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label>
        Name
        <input placeholder="Home, Office…" maxLength={20} {...bind('label')} />
      </label>
      {hasMapsKey && <LocationPicker onPick={handlePick} />}
      <label>
        Address
        <input placeholder="Flat, building, street" autoComplete="street-address" {...bind('line')} />
      </label>
      <label>
        Area
        <input placeholder="Locality" maxLength={AREA_MAX_LENGTH} {...bind('area')} />
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
