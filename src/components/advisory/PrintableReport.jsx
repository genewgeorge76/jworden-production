/**
 * PrintableReport — wraps content in a print-friendly container.
 * Includes a "Print / Save as PDF" button.
 *
 * Props:
 *   title    — report title shown at top when printing
 *   children — the content to print
 */
export default function PrintableReport({ title, children }) {
  return (
    <div>
      {/* Print trigger button — hidden when printing */}
      <div className="flex justify-end mb-4 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-brand-navy text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-navy/90 transition-colors"
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      {/* Print header — only visible when printing */}
      <div className="hidden print:block mb-6 border-b-2 border-brand-navy pb-4">
        <p className="text-xs text-gray-500 mb-1">J. Worden &amp; Sons Legal Advisory Board</p>
        <h1 className="text-xl font-bold text-brand-navy">{title}</h1>
        <p className="text-xs text-gray-400 mt-1">
          For reference only — not legal advice · Verify with applicable state agency ·{' '}
          {new Date().toLocaleDateString()}
        </p>
      </div>

      {children}
    </div>
  )
}
