import { useRef, useState } from 'react'
import { api } from '../api/api.js'
import { isValidPhone, phoneDigits } from '../utils/utils.js'

/** Sends the login OTP and remembers which number it went to. */
export function useOtpRequest(phone, setError) {
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  const sentTo = useRef('')

  const send = async () => {
    const number = phoneDigits(phone)
    if (!isValidPhone(phone) || sending) return
    setSending(true)
    setError('')
    try {
      const { demoOtp } = await api('/auth/otp', { method: 'POST', body: { phone: number } })
      sentTo.current = number
      setNotice(demoOtp ? `Demo mode: no SMS is sent. Use ${demoOtp}.` : 'OTP sent by SMS.')
    } catch (err) {
      // "Just sent" means an earlier code is still valid.
      if (err.status === 429) sentTo.current = number
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const isSent = sentTo.current !== '' && sentTo.current === phoneDigits(phone)
  return { send, sending, isSent, notice: isSent ? notice : '' }
}

export default function OtpFields({ otp, onChange, request, inputRef }) {
  return (
    <>
      <label className="field">
        OTP
        <input
          ref={inputRef}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          placeholder="4-digit code"
          value={otp}
          // Asking for the code as soon as the driver reaches this box.
          onFocus={() => !request.isSent && request.send()}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        />
      </label>
      {request.isSent && (
        <p className="auth__notice" role="status">
          {request.notice}{' '}
          <button type="button" onClick={request.send} disabled={request.sending}>
            Resend OTP
          </button>
        </p>
      )}
    </>
  )
}
