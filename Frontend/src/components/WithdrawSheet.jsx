import { useState } from 'react'
import { useStore } from '../store.jsx'
import { formatRupees } from '../utils.js'
import Sheet from './Sheet.jsx'
import { useToast } from './Toast.jsx'

const MINIMUM = 100

export default function WithdrawSheet({ open, onClose }) {
  return (
    <Sheet open={open} title="Withdraw money" onClose={onClose}>
      <WithdrawForm onClose={onClose} />
    </Sheet>
  )
}

function WithdrawForm({ onClose }) {
  const { wallet, actions } = useStore()
  const showToast = useToast()
  const [amount, setAmount] = useState('')
  const [upi, setUpi] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isInteger(value) || value < MINIMUM) {
      return setError(`Enter at least ${formatRupees(MINIMUM)}`)
    }
    if (value > wallet.balance) return setError('Amount is more than your balance')
    if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim())) {
      return setError('Enter a valid UPI ID, like name@bank')
    }
    actions.withdraw(value, upi.trim())
    showToast(`Withdrawal of ${formatRupees(value)} requested`)
    onClose()
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <p className="form__hint">Available: {formatRupees(wallet.balance)}</p>
      <label>
        Amount (₹)
        <input
          inputMode="numeric"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value.replace(/\D/g, ''))
            setError('')
          }}
        />
      </label>
      <label>
        UPI ID
        <input
          autoCapitalize="none"
          spellCheck="false"
          placeholder="name@bank"
          value={upi}
          onChange={(e) => {
            setUpi(e.target.value)
            setError('')
          }}
        />
      </label>
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary-button">
        Request withdrawal
      </button>
    </form>
  )
}
