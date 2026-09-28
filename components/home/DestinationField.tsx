'use client'

import AdminLabel from '@/components/home/AdminLabel'
import { useHomeAdmin } from '@/components/home/HomeAdminContext'
import { HOME_LABELS } from '@/lib/homeVocabulary'

interface DestinationFieldProps {
  value: string
  onChange: (value: string) => void
}

/**
 * Admin-only relative path for a public link, e.g. `/studio` or `/team-stores`.
 */
export default function DestinationField({ value, onChange }: DestinationFieldProps) {
  const admin = useHomeAdmin()
  if (!admin) return null

  return (
    <AdminLabel label={HOME_LABELS.destination}>
      <label className="mt-2 block text-left text-xs font-medium home-text">
        Destination
        <input
          type="text"
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-md border home-border bg-white px-2 py-1.5 font-mono text-xs home-text"
          aria-label={HOME_LABELS.destination}
          placeholder="/studio"
        />
      </label>
    </AdminLabel>
  )
}
