export default function StatCard({ value, label, color, bgColor, icon }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div className="icon-box" style={{ background: bgColor }}>
        <i className={['fas', icon].join(' ')} style={{ color }}></i>
      </div>
      <div>
        <div className="stat-val">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}