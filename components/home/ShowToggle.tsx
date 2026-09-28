'use client'

import { useHomeAdmin } from '@/components/home/HomeAdminContext'

interface ShowToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}

/**
 * Admin-only checkbox to show or hide a button on the public homepage.
 */
export default function ShowToggle({
  checked,
  onChange,
  label = 'Show this button',
  className = 'home-text',
}: ShowToggleProps) {
  const admin = useHomeAdmin()
  if (!admin) return null

  return (
    <label className={`mb-1 flex min-h-9 items-center gap-2 text-xs font-medium ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
        style={{ accentColor: 'var(--home-accent)' }}
      />
      {label}
    </label>
  )
}
