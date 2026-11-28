import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import Step from './Step.jsx'

/** Opens the phone camera and shows a thumbnail of the chosen photo. */
export default function PhotoPicker({ step, label, photo, onSelect }) {
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!photo) return setPreview('')
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  return (
    <label className={photo ? 'photo photo--added' : 'photo'}>
      <Step number={step} done={Boolean(photo)}>
        {photo ? 'Photo added · Retake' : label}
      </Step>
      {preview ? <img src={preview} alt="" /> : <Icon name="camera" size={24} />}
      <input
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files[0]
          if (file) onSelect(file)
          e.target.value = ''
        }}
      />
    </label>
  )
}
