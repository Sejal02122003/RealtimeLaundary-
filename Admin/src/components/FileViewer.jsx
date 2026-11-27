import { useEffect, useState } from 'react'
import { useSession } from '../session.jsx'
import Modal from './Modal.jsx'
import { LoadState } from './ui.jsx'

/** Loads a protected file and returns a temporary local address for it. */
export function useProtectedFile(path) {
  const { request } = useSession()
  const [file, setFile] = useState({ url: '', type: '', error: null })

  useEffect(() => {
    let url = ''
    let active = true
    setFile({ url: '', type: '', error: null })
    if (!path) return undefined

    request(path, { file: true })
      .then((blob) => {
        if (!active) return
        url = URL.createObjectURL(blob)
        setFile({ url, type: blob.type, error: null })
      })
      .catch((error) => active && setFile({ url: '', type: '', error }))

    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [path, request])

  return file
}

export default function FileViewer({ title, path, onClose }) {
  const { url, type, error } = useProtectedFile(path)

  return (
    <Modal title={title} onClose={onClose} wide>
      {!url ? (
        <LoadState error={error} onRetry={onClose} />
      ) : type.startsWith('image/') ? (
        <img className="viewer" src={url} alt={title} />
      ) : (
        <>
          <iframe className="viewer viewer--document" src={url} title={title} />
          <a className="viewer__link" href={url} target="_blank" rel="noreferrer">
            Open in a new tab
          </a>
        </>
      )}
    </Modal>
  )
}
