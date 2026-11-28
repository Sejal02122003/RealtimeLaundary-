import Icon from './Icon.jsx'

/** A numbered step of a job. The number turns into a tick once the step is done. */
export default function Step({ number, done = false, id, children }) {
  return (
    <span className={done ? 'step step--done' : 'step'}>
      <span className="step__dot" aria-hidden="true">
        {done ? <Icon name="check" size={14} strokeWidth={3.2} /> : number}
      </span>
      <span id={id}>{children}</span>
    </span>
  )
}
