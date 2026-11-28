export default function Stepper({ label, value, min, max, onChange }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <span>{label}</span>
      <div className="stepper__control">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <output>
          {/* A new key replays the bump each time the number changes. */}
          <span key={value}>{value}</span>
        </output>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}
