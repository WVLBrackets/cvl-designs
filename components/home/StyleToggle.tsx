'use client'

import { useHomeAdmin } from '@/components/home/HomeAdminContext'
import type { HeroButtonStyle } from '@/lib/homeContent'

interface StyleToggleProps {
  name: string
  value: HeroButtonStyle
  onChange: (value: HeroButtonStyle) => void
}

/**
 * Admin control to pick filled (style 1) or outlined (style 2) button chrome.
 */
export default function StyleToggle({ name, value, onChange }: StyleToggleProps) {
  const admin = useHomeAdmin()
  if (!admin) return null

  return (
    <fieldset className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium home-text">
      <legend className="sr-only">Button style</legend>
      {([1, 2] as const).map((style) => {
        const selected = value === style
        return (
          <label
            key={style}
            className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 ${
              selected ? 'home-accent-bg border-transparent text-white' : 'home-border home-bg-2'
            }`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={selected}
              onChange={() => onChange(style)}
            />
            Style {style}
          </label>
        )
      })}
    </fieldset>
  )
}
