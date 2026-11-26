import { useEffect, useRef } from 'react'

/** Bottom sheet built on <dialog>, which handles focus trapping and Escape. */
export default function Sheet({ open, title, onClose, children }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
    >
      {open && (
        <div className="sheet__body">
          <div className="sheet__head">
            <h2>{title}</h2>
            <button type="button" className="text-button" onClick={onClose}>
              Close
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
