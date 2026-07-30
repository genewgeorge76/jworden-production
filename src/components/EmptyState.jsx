/**
 * EmptyState — what a tab shows when it has nothing to show.
 *
 * The dashboard's tabs are wired to the real backend, but most of the business
 * tables start empty, and a blank grid reads as "this is broken". It is not —
 * it is waiting on a step that has not happened yet.
 *
 * So an empty tab explains three things: that it is working, why it is empty,
 * and the single next action that fills it. Never a fake row, never a sample
 * number — staff and customers see these screens, and one invented figure
 * costs more trust than an honest blank.
 */

import { Link } from 'react-router-dom'
import { ArrowRight, Inbox, Info } from 'lucide-react'

/**
 * @param {string}  title    What is empty, in plain words.
 * @param {string}  body     Why it is empty and what fills it.
 * @param {object}  action   Optional { label, to } or { label, onClick }.
 * @param {string}  hint     Optional secondary line — a prerequisite, a caveat.
 * @param {boolean} degraded True when the feed itself is unavailable (a real
 *                           fault) rather than simply having no data yet. These
 *                           are different situations and must not look alike.
 */
export default function EmptyState({ title, body, action, hint, degraded = false, icon: Icon = Inbox }) {
  const accent = degraded ? '#f59e0b' : '#38bdf8'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        border: '1px dashed #1e293b',
        borderRadius: 16,
        background: '#0a0f1e',
        maxWidth: 560,
        margin: '32px auto',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          background: `${accent}18`,
          border: `1px solid ${accent}45`,
          marginBottom: 16,
        }}
      >
        <Icon size={22} color={accent} />
      </div>

      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#e2e8f0' }}>{title}</h3>

      <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, color: '#94a3b8', maxWidth: 440 }}>
        {body}
      </p>

      {hint && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            marginTop: 16,
            padding: '10px 12px',
            borderRadius: 10,
            background: '#0f172a',
            border: '1px solid #1e293b',
            maxWidth: 460,
          }}
        >
          <Info size={14} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12.5, lineHeight: 1.55, color: '#64748b', textAlign: 'left' }}>{hint}</span>
        </div>
      )}

      {action && (
        action.to ? (
          <Link
            to={action.to}
            style={{
              marginTop: 22,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              background: accent,
              color: '#020617',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            {action.label} <ArrowRight size={15} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              marginTop: 22,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 10,
              background: accent,
              color: '#020617',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {action.label} <ArrowRight size={15} />
          </button>
        )
      )}
    </div>
  )
}
