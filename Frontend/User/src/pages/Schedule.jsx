import { useState } from 'react'
import { Redirect, useRouter } from '../routes/router.jsx'
import { useDefaultAddress, useStore } from '../context/store.jsx'
import { getSchedule } from '../utils/utils.js'
import AddressForm from '../components/AddressForm.jsx'
import FlowHeader from '../components/FlowHeader.jsx'
import Icon from '../components/Icon.jsx'
import Sheet from '../components/Sheet.jsx'

export default function Schedule() {
  const { navigate } = useRouter()
  const { booking, addresses, actions } = useStore()
  const defaultAddress = useDefaultAddress()
  const [sheet, setSheet] = useState(null)
  const [emptyCart] = useState(() => Object.keys(booking.cart).length === 0)

  if (emptyCart) return <Redirect to="/home" />

  const address = addresses.find((a) => a.id === booking.addressId) ?? defaultAddress
  const { days, slots, date, slot } = getSchedule(booking)

  const review = () =>
    navigate('/review', {
      onUpdate: () => actions.setBooking({ date, slot: slot.id }),
    })

  return (
    <main className="screen">
      <FlowHeader title="Pickup & delivery" step={2} fallback="/items" />

      <div className="screen__scroll">
        <section className="card address">
          <Icon name="pin" />
          <div>
            <h2>{address.label}</h2>
            <p>{address.line}</p>
            <p>Same address for delivery</p>
          </div>
          <button type="button" className="text-button" onClick={() => setSheet('pick')}>
            Change
          </button>
        </section>

        <h2 className="section-title">Pickup day</h2>
        <div className="days" role="group" aria-label="Pickup day">
          {days.map((d) => (
            <button
              key={d.date}
              type="button"
              className="option"
              disabled={d.disabled}
              aria-pressed={d.date === date}
              onClick={() => actions.setBooking({ date: d.date })}
            >
              <small>{d.label}</small>
              <strong>{d.day}</strong>
            </button>
          ))}
        </div>

        <h2 className="section-title">Pickup time</h2>
        <div className="slots" role="group" aria-label="Pickup time">
          {slots.map((s) => (
            <button
              key={s.id}
              type="button"
              className="option"
              disabled={s.disabled}
              aria-pressed={s.id === slot.id}
              onClick={() => actions.setBooking({ date, slot: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>

        <p className="delivery-note">
          <strong>Estimated delivery:</strong> 2 days after pickup, in the same time slot
        </p>

        <label className="section-title" htmlFor="instructions">
          Special instructions
        </label>
        <textarea
          id="instructions"
          className="instructions"
          rows={3}
          maxLength={200}
          placeholder="e.g. Use mild detergent, ring the bell twice"
          value={booking.instructions}
          onChange={(e) => actions.setBooking({ instructions: e.target.value })}
        />
      </div>

      <footer className="screen__footer">
        <button type="button" className="primary-button" onClick={review}>
          Review order
        </button>
      </footer>

      <Sheet
        open={sheet !== null}
        title={sheet === 'new' ? 'Add address' : 'Choose address'}
        onClose={() => setSheet(null)}
      >
        {sheet === 'new' ? (
          <AddressForm onSaved={() => setSheet('pick')} />
        ) : (
          <div className="choices">
            {addresses.map((a) => (
              <button
                key={a.id}
                type="button"
                className="choice"
                aria-pressed={a.id === address.id}
                onClick={() => {
                  actions.setBooking({ addressId: a.id })
                  setSheet(null)
                }}
              >
                <strong>{a.label}</strong>
                <small>{a.line}</small>
              </button>
            ))}
            <button type="button" className="text-button" onClick={() => setSheet('new')}>
              + Add new address
            </button>
          </div>
        )}
      </Sheet>
    </main>
  )
}
