import { useEffect, useRef, useState } from 'react'

/** A dialog built on <dialog>, which handles focus trapping and Escape. */
export default function Modal({ title, onClose, wide, children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current.open) ref.current.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      className={wide ? 'modal modal--wide' : 'modal'}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
    >
      <div className="modal__body">
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="text-button" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}

export function ConfirmModal({ title, message, confirmLabel, danger, busy, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="modal__message">{message}</p>
      <button
        type="button"
        className={`button button--block ${danger ? 'button--danger' : 'button--blue'}`}
        disabled={busy}
        onClick={onConfirm}
      >
        {confirmLabel}
      </button>
    </Modal>
  )
}

/**
 * A short form in a dialog. `fields` describes the inputs; `onSubmit` receives
 * their values.
 */
export function FormModal({ title, fields, submitLabel, busy, onSubmit, onClose }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      fields.map((f) => [f.name, f.value ?? (f.type === 'checkbox' ? false : (f.options?.[0]?.[0] ?? ''))]),
    ),
  )
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }))

  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(values)
        }}
      >
        {fields.map(({ name, label, type = 'text', options, ...props }) => {
          if (type === 'checkbox') {
            return (
              <label key={name} className="check">
                <input type="checkbox" checked={values[name]} onChange={(e) => set(name, e.target.checked)} />
                {label}
              </label>
            )
          }
          const common = {
            ...props,
            value: values[name],
            onChange: (e) => set(name, e.target.value),
          }
          return (
            <label key={name} className="field">
              {label}
              {options ? (
                <select {...common}>
                  {options.map(([value, text]) => (
                    <option key={value} value={value}>
                      {text}
                    </option>
                  ))}
                </select>
              ) : (
                <input type={type} required {...common} />
              )}
            </label>
          )
        })}
        <button type="submit" className="button button--blue button--block" disabled={busy}>
          {submitLabel}
        </button>
      </form>
    </Modal>
  )
}
