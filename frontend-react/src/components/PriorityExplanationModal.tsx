/**
 * PriorityExplanationModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows LIME + SHAP word-level explanations for the AI priority classification
 * of a reclamation. Only shown to agents.
 *
 * Usage:
 *   <PriorityExplanationModal
 *     reclamationId={rec.id}
 *     reclamationTitle={rec.title}
 *     token={accessToken}
 *     onClose={() => setShowExplain(false)}
 *   />
 */

import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WordEntry {
  word: string
  score?: number        // LIME
  shap_value?: number   // SHAP
  direction: 'for' | 'against'
}

interface ExplanationData {
  reclamation_id: number
  reclamation_title: string
  stored_priority: string
  predicted_priority: string
  confidence: number
  probabilities: Record<string, number>
  lime: WordEntry[]
  shap: WordEntry[]
  text_used: string
  errors: string[]
}

interface Props {
  reclamationId: number
  reclamationTitle: string
  token: string
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  urgente: { bg: '#ffebee', text: '#b71c1c', label: '🔴 Urgente' },
  normale: { bg: '#fff8e1', text: '#e65100', label: '🟡 Normale' },
  faible:  { bg: '#e8f5e9', text: '#1b5e20', label: '🟢 Faible'  },
}

function getPriorityStyle(p: string) {
  return PRIORITY_COLORS[p] ?? { bg: '#f5f5f5', text: '#444', label: p }
}

/** Map a score in [-max, +max] to a bar width % and color */
function barProps(value: number, maxVal: number) {
  const pct = maxVal > 0 ? Math.min(100, (Math.abs(value) / maxVal) * 100) : 0
  const color = value >= 0 ? '#2e7d32' : '#c62828'
  return { pct, color }
}

/** Highlight words in a sentence that appear in the explanation */
function HighlightedText({
  text,
  limeWords,
  shapWords,
}: {
  text: string
  limeWords: WordEntry[]
  shapWords: WordEntry[]
}) {
  // Build a map: normalised_word → direction (use SHAP if available, else LIME)
  const wordMap: Record<string, 'for' | 'against'> = {}
  ;[...shapWords, ...limeWords].forEach(w => {
    wordMap[w.word.toLowerCase()] = w.direction
  })

  const tokens = text.split(/(\s+)/)
  return (
    <span style={{ lineHeight: 1.8, fontSize: '0.9rem' }}>
      {tokens.map((tok, i) => {
        const clean = tok.toLowerCase().replace(/[^a-zàâçéèêëîïôùûü]/g, '')
        const dir   = wordMap[clean]
        if (!dir) return <span key={i}>{tok}</span>
        return (
          <mark
            key={i}
            title={dir === 'for' ? 'Pousse vers cette priorité' : 'Contre cette priorité'}
            style={{
              background:    dir === 'for' ? 'rgba(46,125,50,0.18)' : 'rgba(198,40,40,0.15)',
              color:         dir === 'for' ? '#1b5e20' : '#b71c1c',
              borderRadius:  '3px',
              padding:       '0 2px',
              fontWeight:    600,
              cursor:        'help',
            }}
          >
            {tok}
          </mark>
        )
      })}
    </span>
  )
}

/** Horizontal bar chart row for one word */
function BarRow({ word, value, maxVal, label }: { word: string; value: number; maxVal: number; label: string }) {
  const { pct, color } = barProps(value, maxVal)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <span style={{
        width: '130px', fontSize: '0.78rem', textAlign: 'right',
        color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0,
      }} title={word}>
        {word}
      </span>
      <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '4px', height: '14px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color, borderRadius: '4px',
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.72rem', color, width: '52px', textAlign: 'left', flexShrink: 0 }}>
        {value > 0 ? '+' : ''}{value.toFixed(3)}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PriorityExplanationModal({ reclamationId, reclamationTitle, token, onClose }: Props) {
  const [data,    setData]    = useState<ExplanationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [tab,     setTab]     = useState<'lime' | 'shap'>('lime')

  useEffect(() => {
    setLoading(true)
    setError(null)
    const base = window.location.hostname === 'localhost' ? 'http://localhost:8000' : ''
    fetch(`${base}/api/reclamations/${reclamationId}/explain_priority/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [reclamationId, token])

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.backdrop) onClose()
  }

  const prioStyle      = data ? getPriorityStyle(data.predicted_priority) : null
  const activeWords    = data ? (tab === 'lime' ? data.lime : data.shap) : []
  const maxVal         = activeWords.length
    ? Math.max(...activeWords.map(w => Math.abs(tab === 'lime' ? (w.score ?? 0) : (w.shap_value ?? 0))))
    : 1

  return (
    <div
      data-backdrop="1"
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: '14px', width: '100%', maxWidth: '680px',
        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        fontFamily: '"Segoe UI", sans-serif',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: 'linear-gradient(135deg,#1a3a5c,#1565c0)',
          color: '#fff', padding: '18px 22px',
          borderRadius: '14px 14px 0 0',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', opacity: 0.75, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              🤖 Explication IA — Priorité
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
              {reclamationTitle}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '3px' }}>
              Réclamation #{reclamationId}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer',
              fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 22px' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
              <div>Calcul des explications LIME &amp; SHAP en cours…</div>
              <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '6px' }}>
                Cela peut prendre quelques secondes
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '8px', padding: '14px', color: '#b71c1c' }}>
              <strong>Erreur :</strong> {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* ── Prediction summary ── */}
              <div style={{
                background: '#f8f9fc', borderRadius: '10px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
                marginBottom: '18px', border: '1px solid #e8eaf0',
              }}>
                {/* Predicted priority badge */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Priorité prédite
                  </div>
                  <span style={{
                    background: prioStyle!.bg, color: prioStyle!.text,
                    padding: '5px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.88rem',
                  }}>
                    {prioStyle!.label}
                  </span>
                </div>

                {/* Confidence */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Confiance
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1565c0' }}>
                    {(data.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Stored priority */}
                {data.stored_priority !== data.predicted_priority && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: '#888', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Priorité enregistrée
                    </div>
                    <span style={{
                      background: getPriorityStyle(data.stored_priority).bg,
                      color: getPriorityStyle(data.stored_priority).text,
                      padding: '5px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.88rem',
                    }}>
                      {getPriorityStyle(data.stored_priority).label}
                    </span>
                    <div style={{ fontSize: '0.68rem', color: '#e65100', marginTop: '3px' }}>
                      ⚠️ Différente (modifiée manuellement ?)
                    </div>
                  </div>
                )}

                {/* Probability bars for all 3 classes */}
                <div style={{ marginLeft: 'auto', minWidth: '160px' }}>
                  {Object.entries(data.probabilities)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cls, prob]) => {
                      const s = getPriorityStyle(cls)
                      return (
                        <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.7rem', width: '55px', color: s.text, fontWeight: 600 }}>{s.label}</span>
                          <div style={{ flex: 1, background: '#e0e0e0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ width: `${prob * 100}%`, height: '100%', background: s.text, borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#666', width: '36px' }}>{(prob * 100).toFixed(0)}%</span>
                        </div>
                      )
                    })}
                </div>
              </div>

              {/* ── Text with word highlights ── */}
              <div style={{
                background: '#fffde7', border: '1px solid #fff176',
                borderRadius: '8px', padding: '12px 14px', marginBottom: '18px',
              }}>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Texte analysé — mots colorés selon leur influence
                  &nbsp;
                  <span style={{ color: '#2e7d32', fontWeight: 700 }}>■ pour</span>
                  &nbsp;
                  <span style={{ color: '#c62828', fontWeight: 700 }}>■ contre</span>
                </div>
                <HighlightedText
                  text={data.text_used}
                  limeWords={data.lime}
                  shapWords={data.shap}
                />
              </div>

              {/* ── Tab switch LIME / SHAP ── */}
              <div style={{ display: 'flex', gap: '0', marginBottom: '14px', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                {(['lime', 'shap'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1, border: 'none', padding: '9px',
                      background: tab === t ? '#1565c0' : '#fff',
                      color: tab === t ? '#fff' : '#555',
                      fontWeight: tab === t ? 700 : 400,
                      cursor: 'pointer', fontSize: '0.85rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t === 'lime' ? '🟢 LIME' : '🔵 SHAP'}
                    <span style={{ fontSize: '0.7rem', opacity: 0.75, marginLeft: '6px' }}>
                      {t === 'lime' ? '(perturbation locale)' : '(valeurs de Shapley)'}
                    </span>
                  </button>
                ))}
              </div>

              {/* ── Method description ── */}
              <div style={{
                background: tab === 'lime' ? '#e8f5e9' : '#e3f2fd',
                borderRadius: '7px', padding: '9px 12px', marginBottom: '14px',
                fontSize: '0.77rem', color: '#444', border: `1px solid ${tab === 'lime' ? '#a5d6a7' : '#90caf9'}`,
              }}>
                {tab === 'lime'
                  ? '🟢 LIME perturbe aléatoirement le texte et entraîne un modèle linéaire local pour mesurer l\'impact de chaque mot sur la prédiction de priorité.'
                  : '🔵 SHAP calcule la contribution exacte de chaque mot (valeurs de Shapley issues de la théorie des jeux coopératifs) — plus rigoureux mathématiquement.'}
              </div>

              {/* ── Word contribution bars ── */}
              {activeWords.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>
                  Aucune donnée disponible pour {tab.toUpperCase()}
                </div>
              ) : (
                <>
                  {/* FOR group */}
                  {activeWords.filter(w => w.direction === 'for').length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        ✅ Mots qui POUSSENT vers « {data.predicted_priority} »
                      </div>
                      {activeWords.filter(w => w.direction === 'for').map((w, i) => (
                        <BarRow
                          key={i}
                          word={w.word}
                          value={tab === 'lime' ? (w.score ?? 0) : (w.shap_value ?? 0)}
                          maxVal={maxVal}
                          label={tab}
                        />
                      ))}
                    </div>
                  )}

                  {/* AGAINST group */}
                  {activeWords.filter(w => w.direction === 'against').length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c62828', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        ❌ Mots qui S'OPPOSENT à « {data.predicted_priority} »
                      </div>
                      {activeWords.filter(w => w.direction === 'against').map((w, i) => (
                        <BarRow
                          key={i}
                          word={w.word}
                          value={Math.abs(tab === 'lime' ? (w.score ?? 0) : (w.shap_value ?? 0))}
                          maxVal={maxVal}
                          label={tab}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── Errors / warnings ── */}
              {data.errors.length > 0 && (
                <div style={{ background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: '8px', padding: '10px 14px', marginTop: '10px' }}>
                  <div style={{ fontWeight: 700, color: '#e65100', fontSize: '0.8rem', marginBottom: '4px' }}>⚠️ Avertissements</div>
                  {data.errors.map((e, i) => (
                    <div key={i} style={{ fontSize: '0.77rem', color: '#bf360c' }}>• {e}</div>
                  ))}
                </div>
              )}

              {/* ── Legend ── */}
              <div style={{
                marginTop: '18px', padding: '10px 14px',
                background: '#f5f5f5', borderRadius: '8px', fontSize: '0.72rem', color: '#666',
              }}>
                <strong>Légende :</strong>{' '}
                Les barres montrent l'importance relative de chaque mot dans la décision.
                <span style={{ color: '#2e7d32', fontWeight: 600 }}> Vert</span> = pousse vers la priorité prédite.
                <span style={{ color: '#c62828', fontWeight: 600 }}> Rouge</span> = s'y oppose.
                Les mots sont des <em>stems</em> (racines French Snowball) du texte original.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
