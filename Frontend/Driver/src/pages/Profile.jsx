import { useState } from 'react'
import { useRouter } from '../routes/router.jsx'
import { useSession } from '../context/session.jsx'
import { useResource } from '../hooks/useResource.js'
import { dayKey, initials, plural, shortDate, spacedPhone } from '../utils/utils.js'
import { toFormData } from '../api/api.js'
import Header from '../components/Header.jsx'
import Icon from '../components/Icon.jsx'
import LoadState from '../components/LoadState.jsx'
import { useToast } from '../components/Toast.jsx'

const VEHICLE_TYPES = [
  { id: 'two_wheeler', label: 'Two wheeler' },
  { id: 'three_wheeler', label: 'Three wheeler' },
  { id: 'four_wheeler', label: 'Four wheeler' },
  { id: 'van', label: 'Van' },
]

const BADGES = {
  verified: { label: 'Verified', tone: 'green' },
  pending: { label: 'In review', tone: 'amber' },
}

export default function Profile() {
  const { data, error, reload } = useResource('/me')
  const { driver } = useSession()

  return (
    <main className="screen">
      {driver ? (
        <ProfileForm driver={driver} />
      ) : (
        <>
          <Header title="My profile" />
          <LoadState error={data ? null : error} onRetry={reload} />
        </>
      )}
    </main>
  )
}

function ProfileForm({ driver }) {
  const { navigate } = useRouter()
  const { request, signOut } = useSession()
  const showToast = useToast()
  const [type, setType] = useState(driver.vehicle.type)
  const [plate, setPlate] = useState(driver.vehicle.plate)
  const [uploading, setUploading] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const approved = driver.status === 'approved'
  const missing = driver.documents.filter((d) => d.status === 'missing' || d.status === 'rejected')
  const uploaded = driver.documents.length - missing.length
  const uploadedShare = uploaded / Math.max(driver.documents.length, 1)

  const upload = async (documentType, file) => {
    if (!file) return
    setUploading(documentType)
    setError('')
    try {
      await request(`/me/documents/${documentType}`, { method: 'POST', body: toFormData({ file }) })
      showToast('Document uploaded')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading('')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (!approved) {
        await request('/me/vehicle', { method: 'PATCH', body: { type, plate } })
        showToast('Profile saved')
      }
      navigate('/jobs')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <>
      <Header title="My profile" />

      <form className="screen__form" onSubmit={handleSubmit} noValidate>
        <div className="screen__scroll stagger">
          <div className="profile">
            <span className="avatar avatar--large">{initials(driver.name)}</span>
            <div>
              <h2>{driver.name}</h2>
              <p>+91 {spacedPhone(driver.phone)}</p>
            </div>
          </div>

          {!approved && (
            <div className="banner">
              <h2>Verification in progress</h2>
              <p>
                {missing.length
                  ? `${plural(missing.length, 'document')} left.`
                  : 'All documents uploaded.'}{' '}
                Jobs start after admin approval.
              </p>
            </div>
          )}

          <h2 className="section-title">Vehicle</h2>
          <div className="vehicle">
            <label className="field">
              Vehicle type
              <select value={type} disabled={approved} onChange={(e) => setType(e.target.value)}>
                {VEHICLE_TYPES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Number plate
              <input
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck="false"
                maxLength={14}
                placeholder="MP09 AB 1234"
                readOnly={approved}
                value={plate}
                onChange={(e) => {
                  setPlate(e.target.value.toUpperCase())
                  setError('')
                }}
              />
            </label>
          </div>

          <h2 className="section-title">Documents</h2>
          <div
            className={missing.length ? 'progress' : 'progress progress--done'}
            role="progressbar"
            aria-label="Documents uploaded"
            aria-valuemin={0}
            aria-valuemax={driver.documents.length}
            aria-valuenow={uploaded}
          >
            <span style={{ width: `${uploadedShare * 100}%` }} />
          </div>
          <ul className="documents">
            {driver.documents.map((document) => (
              <DocumentRow
                key={document.type}
                document={document}
                busy={uploading === document.type}
                disabled={Boolean(uploading)}
                onSelect={(file) => upload(document.type, file)}
              />
            ))}
          </ul>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {/* Clearing the session sends the app back to the login screen. */}
          <button type="button" className="logout" onClick={signOut}>
            Log out
          </button>
        </div>

        <footer className="screen__footer">
          <button type="submit" className="button button--ink" disabled={saving || Boolean(uploading)}>
            Save and continue
          </button>
        </footer>
      </form>
    </>
  )
}

function DocumentRow({ document, busy, disabled, onSelect }) {
  const { label, status, uploadedAt } = document
  const badge = BADGES[status]
  const needsUpload = status === 'missing' || status === 'rejected'

  let detail = 'Photo or PDF'
  if (status === 'rejected') detail = 'Rejected. Upload it again.'
  else if (uploadedAt) detail = `Uploaded ${shortDate(dayKey(uploadedAt))}`

  return (
    <li className={needsUpload ? 'document document--missing' : 'document'}>
      <Icon name="file" size={24} />
      <div>
        <h3>{label}</h3>
        <p>{detail}</p>
      </div>
      {needsUpload ? (
        <label className="button button--primary document__upload" aria-disabled={disabled}>
          {busy ? <span className="spinner" aria-label="Uploading" /> : 'Upload'}
          <input
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={disabled}
            aria-label={`Upload ${label}`}
            onChange={(e) => {
              onSelect(e.target.files[0])
              e.target.value = ''
            }}
          />
        </label>
      ) : (
        <span className={`badge badge--${badge.tone}`}>{badge.label}</span>
      )}
    </li>
  )
}
