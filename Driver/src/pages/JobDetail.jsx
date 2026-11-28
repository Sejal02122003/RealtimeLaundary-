import { useState } from 'react'
import { useRouter } from '../router.jsx'
import { useSession } from '../session.jsx'
import { useResource } from '../useResource.js'
import {
  clockTime,
  dayKey,
  formatRupees,
  historyDetail,
  jobTitle,
  jobWindow,
  mapsUrl,
  plural,
} from '../utils.js'
import { toFormData } from '../api.js'
import Header from '../components/Header.jsx'
import LoadState from '../components/LoadState.jsx'
import MapPreview from '../components/MapPreview.jsx'
import PhotoPicker from '../components/PhotoPicker.jsx'
import Sheet from '../components/Sheet.jsx'
import Stepper from '../components/Stepper.jsx'
import { useToast } from '../components/Toast.jsx'

const CASH_OPTIONS = [
  { id: 'collected', label: 'Collected' },
  { id: 'partial', label: 'Partial' },
  { id: 'not_paid', label: 'Not paid' },
]

const MISSED_REASONS = ['Customer unavailable', 'Wrong address', 'Customer asked to reschedule']

export default function JobDetail({ jobId }) {
  const { data, error, reload } = useResource(`/jobs/${jobId}`)

  if (!data) {
    return (
      <main className="screen">
        <Header title="Job" />
        <LoadState error={error} onRetry={reload} />
      </main>
    )
  }

  const { job } = data
  const today = dayKey(Date.now())
  let subtitle = jobWindow(job, today)
  if (job.day === today) {
    subtitle = job.type === 'pickup' ? `Today, ${job.slotLabel}` : `Due by ${clockTime(job.dueAt)}`
  }

  return (
    <main className="screen">
      <Header title={jobTitle(job)} subtitle={subtitle} />
      {job.status === 'assigned' ? (
        <JobForm job={job} />
      ) : (
        <div className="screen__scroll">
          <div className="card">
            <h2 className="card__title">
              {job.status === 'offered' ? 'Waiting for your answer' : `Job ${job.status}`}
            </h2>
            <p className="card__text">{closedNote(job, today)}</p>
          </div>
        </div>
      )}
    </main>
  )
}

function closedNote(job, today) {
  if (job.status === 'cancelled') return 'The office removed this job. You do not need to do it.'
  return job.closedAt ? historyDetail(job, today) : 'Accept or decline it from the Jobs screen.'
}

function ContactCard({ job }) {
  const { customer } = job
  const detail =
    job.type === 'pickup'
      ? customer.note && `"${customer.note}"`
      : `${plural(job.bags, 'bag')}, ${plural(job.pieces, 'piece')}`

  return (
    <section className="card contact">
      <h2>{customer.name}</h2>
      <p>
        {customer.address}
        {detail && ` · ${detail}`}
      </p>
      <div className="contact__actions">
        <a className="button button--blue" href={mapsUrl(customer)} target="_blank" rel="noreferrer">
          Navigate
        </a>
        <a className="button button--soft" href={`tel:${customer.phone}`}>
          Call customer
        </a>
      </div>
    </section>
  )
}

function JobForm({ job }) {
  const isPickup = job.type === 'pickup'
  const isCod = !isPickup && job.payment.method === 'cod'
  const { navigate } = useRouter()
  const { request } = useSession()
  const showToast = useToast()

  const [count, setCount] = useState({ bags: job.bags, pieces: job.pieces, weightKg: job.weightKg })
  const [cashStatus, setCashStatus] = useState('collected')
  const [partial, setPartial] = useState('')
  const [photo, setPhoto] = useState(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reporting, setReporting] = useState(false)

  // Any edit clears the last error message.
  const edit = (setter) => (value) => {
    setter(value)
    setError('')
  }

  const partialAmount = Number(partial)
  const partialInvalid =
    isCod && cashStatus === 'partial' && !(partialAmount > 0 && partialAmount < job.payment.amount)

  // The button label always says what is still missing.
  let blocker = ''
  if (otp.length < 4) blocker = `Enter OTP to ${isPickup ? 'confirm' : 'complete'}`
  else if (partialInvalid) blocker = 'Enter the cash received'
  else if (!photo) blocker = `Take ${job.type} photo first`

  const finish = (message) => {
    showToast(message)
    navigate(`/jobs?tab=${isPickup ? 'pickups' : 'deliveries'}`, {
      replace: true,
      transition: 'back',
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (blocker || busy) return
    setBusy(true)
    setError('')
    let details = {}
    if (isPickup) details = count
    else if (isCod) {
      details = { cashStatus, ...(cashStatus === 'partial' && { collected: partialAmount }) }
    }

    try {
      await request(`/jobs/${job.id}/complete`, {
        method: 'POST',
        body: toFormData({ ...details, otp, photo }),
      })
      finish(isPickup ? 'Pickup confirmed' : 'Delivery completed')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const reportMissed = async (reason) => {
    try {
      await request(`/jobs/${job.id}/missed`, { method: 'POST', body: { reason } })
      setReporting(false)
      finish('Marked as missed')
    } catch (err) {
      setReporting(false)
      setError(err.message)
    }
  }

  const stepper = (key, label, min, max) => (
    <Stepper
      label={label}
      value={count[key]}
      min={min}
      max={max}
      onChange={(value) => edit(setCount)({ ...count, [key]: value })}
    />
  )

  // Prepaid deliveries have no cash step, so the numbering shifts up.
  const photoStep = isPickup || isCod ? 2 : 1

  return (
    <>
      <form className="screen__form" onSubmit={handleSubmit} noValidate>
        <div className="screen__scroll job-detail">
          {isPickup && <MapPreview customer={job.customer} />}
          <ContactCard job={job} />

          {isPickup && (
            <section className="card counts">
              <h2>1. Count the clothes</h2>
              {stepper('bags', 'Bags', 1, 50)}
              {stepper('pieces', 'Pieces', 1, 500)}
              {stepper('weightKg', 'Weight (kg)', 0, 200)}
            </section>
          )}

          {isCod && (
            <section className="cash">
              <div className="cash__top">
                <h2 id="cash-title">1. Collect cash</h2>
                <strong>{formatRupees(job.payment.amount)}</strong>
              </div>
              <div className="cash__options" role="group" aria-labelledby="cash-title">
                {CASH_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={cashStatus === option.id}
                    onClick={() => edit(setCashStatus)(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {cashStatus === 'partial' && (
                <label className="field cash__partial">
                  Cash received (₹)
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={`Less than ${job.payment.amount}`}
                    value={partial}
                    onChange={(e) => edit(setPartial)(e.target.value.replace(/\D/g, ''))}
                  />
                </label>
              )}
            </section>
          )}

          {!isPickup && !isCod && (
            <p className="banner">Already paid. Do not collect cash.</p>
          )}

          <PhotoPicker
            label={`${photoStep}. Take ${job.type} photo`}
            photo={photo}
            onSelect={edit(setPhoto)}
          />

          <label className="otp">
            {photoStep + 1}. {isPickup ? 'Ask customer for pickup OTP' : 'Enter delivery OTP'}
            <input
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              placeholder="0000"
              value={otp}
              onChange={(e) => edit(setOtp)(e.target.value.replace(/\D/g, ''))}
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="button" className="text-button report" onClick={() => setReporting(true)}>
            Could not {isPickup ? 'pick up' : 'deliver'}?
          </button>
        </div>

        <footer className="screen__footer">
          <button
            type="submit"
            className="button button--primary button--large"
            disabled={Boolean(blocker) || busy}
          >
            {busy ? (
              <span className="spinner" aria-label="Please wait" />
            ) : (
              blocker || (isPickup ? 'Confirm pickup' : 'Complete delivery')
            )}
          </button>
        </footer>
      </form>

      <Sheet open={reporting} title="Mark as missed" onClose={() => setReporting(false)}>
        <div className="choices">
          {MISSED_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              className="button button--outline"
              onClick={() => reportMissed(reason)}
            >
              {reason}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}
