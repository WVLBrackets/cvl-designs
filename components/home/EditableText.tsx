'use client'

import { useEffect, useRef } from 'react'
import AdminLabel from '@/components/home/AdminLabel'
import { useHomeAdmin, patchHomeField, patchOffering } from '@/components/home/HomeAdminContext'
import { emptyPlaceholder } from '@/lib/homeVocabulary'
import type { HomeContent, HomeOffering, OfferingId } from '@/lib/homeContent'

const ACTIVE_LIGHT =
  'outline outline-2 outline-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.85)]'
const ACTIVE_ON_DARK =
  'outline outline-2 outline-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.85)] !bg-yellow-200 !text-yellow-950'
const IDLE = 'hover:outline hover:outline-1 hover:outline-yellow-300'

interface EditableFrameProps {
  fieldId: string
  value: string
  label: string
  className?: string
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3'
  multiline?: boolean
  onDark?: boolean
  onCommit: (value: string) => void
}

/**
 * Shared contentEditable frame used by homepage field helpers.
 */
function EditableFrame({
  fieldId,
  value,
  label,
  className = '',
  as: Tag = 'span',
  multiline = false,
  onDark = false,
  onCommit,
}: EditableFrameProps) {
  const admin = useHomeAdmin()
  const ref = useRef<HTMLElement>(null)
  const active = admin?.activeField === fieldId
  const activeClass = onDark ? ACTIVE_ON_DARK : ACTIVE_LIGHT
  const trimmed = value.trim()

  useEffect(() => {
    if (!admin || !ref.current) return
    if (document.activeElement === ref.current) return
    if (ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [admin, value])

  if (!admin) {
    if (!trimmed) return null
    return <Tag className={className}>{value}</Tag>
  }

  const showEmptyHint = !trimmed && !active

  return (
    <AdminLabel label={label}>
      <div className="relative">
        {showEmptyHint ? (
          <span
            aria-hidden
            className="pointer-events-none block min-h-[1.25em] italic font-serif font-normal normal-case tracking-normal opacity-50 home-text"
          >
            {emptyPlaceholder(label)}
          </span>
        ) : null}
        <Tag
          ref={ref as never}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label={label}
          aria-multiline={multiline}
          className={`cursor-text rounded-sm ${active ? activeClass : IDLE} ${
            showEmptyHint ? 'absolute inset-0 min-h-[1.25em] text-transparent' : className
          }`}
          style={
            active && onDark
              ? { backgroundColor: '#FDE047', color: '#422006' }
              : undefined
          }
          onFocus={() => admin.setActiveField(fieldId)}
          onBlur={(event) => {
            admin.setActiveField(null)
            const next = (event.currentTarget.innerText || '').replace(/\s+\n/g, '\n').trim()
            const placeholder = emptyPlaceholder(label)
            onCommit(next === placeholder ? '' : next)
          }}
          onKeyDown={(event) => {
            if (!multiline && event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
        >
          {value}
        </Tag>
      </div>
    </AdminLabel>
  )
}

interface EditableTextProps {
  field: keyof HomeContent
  value: string
  label: string
  className?: string
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3'
  multiline?: boolean
  onDark?: boolean
}

/**
 * Click-to-edit text on the homepage admin clone. Renders static text for visitors.
 */
export default function EditableText({
  field,
  value,
  label,
  className,
  as,
  multiline,
  onDark,
}: EditableTextProps) {
  const admin = useHomeAdmin()
  return (
    <EditableFrame
      fieldId={String(field)}
      value={value}
      label={label}
      className={className}
      as={as}
      multiline={multiline}
      onDark={onDark}
      onCommit={(next) => {
        if (admin) patchHomeField(admin.setContent, field, next)
      }}
    />
  )
}

interface EditableOfferingTextProps {
  id: OfferingId
  offeringKey: 'title' | 'body' | 'cta'
  value: string
  label: string
  className?: string
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3'
  multiline?: boolean
  onDark?: boolean
}

/**
 * Click-to-edit text on an offering card.
 */
export function EditableOfferingText({
  id,
  offeringKey,
  value,
  label,
  className,
  as,
  multiline,
  onDark,
}: EditableOfferingTextProps) {
  const admin = useHomeAdmin()
  return (
    <EditableFrame
      fieldId={`offering.${id}.${offeringKey}`}
      value={value}
      label={label}
      className={className}
      as={as}
      multiline={multiline}
      onDark={onDark}
      onCommit={(next) => {
        if (admin) patchOffering(admin.setContent, id, { [offeringKey]: next } as Partial<HomeOffering>)
      }}
    />
  )
}
