export default function Spinner({ text = 'Loading...' }) {
  return (
    <div className="spinner-overlay">
      <div className="text-center">
        <div className="spinner-border text-primary mb-2" role="status" />
        <p className="text-muted small">{text}</p>
      </div>
    </div>
  )
}
