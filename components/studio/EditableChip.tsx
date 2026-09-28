'use client'

import { useEffect, useRef } from 'react'
import AdminLabel from '@/components/home/AdminLabel'
import { emptyPlaceholder } from '@/lib/homeVocabulary'

interface EditableChipProps {
  label: string
  value: string
  className?: string
  onCommit: (value: string) => void
}

/**
 * Click-to-edit pill used for studio filter labels on the admin page.
 */
export default function EditableChip({ label, value, className = '', onCommit }: EditableChipProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const trimmed = value.trim()

  useEffect(() => {
    if (!ref.current) return
    if (document.activeElement === ref.current) return
    if (ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value])

  return (
    <AdminLabel label={label}>
      <span
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={label}
        className={`cursor-text rounded-full border home-border px-4 py-2 text-sm font-semibold home-text hover:outline hover:outline-1 hover:outline-yellow-300 ${className}`}
        onBlur={(event) => {
          const next = (event.currentTarget.innerText || '').trim()
          const placeholder = emptyPlaceholder(label)
          onCommit(next === placeholder ? '' : next || value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          }
        }}
      >
        {trimmed || emptyPlaceholder(label)}
      </span>
    </AdminLabel>
  )
}
