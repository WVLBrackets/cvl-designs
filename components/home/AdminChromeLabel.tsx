'use client'

interface AdminChromeLabelProps {
  title: string
  /** When set, the label is a disclosure control. */
  expanded?: boolean
  onToggle?: () => void
  bordered?: boolean
}

/**
 * Yellow uppercase band used for Site Admin, Header preview, and similar admin sections.
 */
export default function AdminChromeLabel({
  title,
  expanded = false,
  onToggle,
  bordered = false,
}: AdminChromeLabelProps) {
  return (
    <div
      className={`flex items-center gap-1 bg-yellow-50 px-4 py-2 sm:px-6 ${
        bordered ? 'border-t home-border' : ''
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-yellow-950">{title}</p>
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? `Hide ${title}` : `Show ${title}`}
          className="inline-flex h-11 w-11 items-center justify-center text-lg font-bold leading-none text-yellow-950 hover:bg-yellow-100"
        >
          {expanded ? '−' : '+'}
        </button>
      ) : null}
    </div>
  )
}
