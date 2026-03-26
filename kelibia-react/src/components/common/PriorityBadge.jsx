const PRIORITY = {
  urgente: { label: '🔴 Urgente', cls: 'priority-urgente' },
  normale: { label: '🔵 Normale', cls: 'priority-normale' },
  faible:  { label: '🟣 Faible',  cls: 'priority-faible'  },
}
export default function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || PRIORITY.normale
  return <span className={('priority-badge ' + p.cls)}>{p.label}</span>
}
export { PRIORITY }