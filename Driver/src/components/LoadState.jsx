/** Shown while a screen's data is loading or when it could not be loaded. */
export default function LoadState({ error, onRetry }) {
  if (!error) {
    return (
      <div className="load-state" role="status">
        <span className="spinner spinner--dark" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  return (
    <div className="load-state" role="alert">
      <p>{error.message}</p>
      <button type="button" className="button button--soft" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
