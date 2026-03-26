const STATUS = {
  pending:     { label: 'En attente',  cls: 'status-pending'     },
  in_progress: { label: 'En cours',    cls: 'status-in_progress' },
  resolved:    { label: 'Résolue',     cls: 'status-resolved'    },
  rejected:    { label: 'Rejetée',     cls: 'status-rejected'    },
}
export default function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, cls: 'status-pending' }
  return <span className={('status-badge ' + s.cls)}>{s.label}</span>
}
export { STATUS }