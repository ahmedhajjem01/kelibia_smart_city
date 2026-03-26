const CAT = {
  lighting: { label: '💡 Éclairage',  cls: 'cat-lighting' },
  trash:    { label: '🗑️ Déchets',     cls: 'cat-trash'    },
  roads:    { label: '🛣️ Voirie',       cls: 'cat-roads'    },
  noise:    { label: '🔊 Nuisances',   cls: 'cat-noise'    },
  other:    { label: '📌 Autre',        cls: 'cat-other'    },
}
export default function CategoryBadge({ category }) {
  const c = CAT[category] || CAT.other
  return <span className={('cat-badge ' + c.cls)}>{c.label}</span>
}
export { CAT }