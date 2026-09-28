'use client'

import { patchHomeField, useHomeAdmin } from '@/components/home/HomeAdminContext'
import { normalizeHexColor, normalizeHeroDelay, type HomeContent } from '@/lib/homeContent'

const FIELDS: Array<{ key: keyof HomeContent; label: string }> = [
  { key: 'colorBackground', label: 'Background' },
  { key: 'colorBackground2', label: 'Background 2' },
  { key: 'colorAccent', label: 'Accent' },
  { key: 'colorText', label: 'Text' },
]

/**
 * Expand #RGB to #RRGGBB for native color inputs.
 *
 * @param hex - Stored hex color
 */
function toPickerValue(hex: string): string {
  const value = normalizeHexColor(hex, '#000000')
  return value
}

/**
 * Admin color tokens shown at the top of the homepage editor.
 */
export default function HomeColorFields() {
  const admin = useHomeAdmin()
  if (!admin) return null
  const { content, setContent } = admin

  return (
    <div className="border-b border-yellow-300 bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FIELDS.map((field) => {
          const value = String(content[field.key] || '')
          return (
            <label key={field.key} className="flex items-center gap-3 text-sm text-yellow-950">
              <input
                type="color"
                value={toPickerValue(value)}
                onChange={(event) =>
                  patchHomeField(setContent, field.key, event.target.value.toUpperCase())
                }
                className="h-10 w-10 cursor-pointer rounded border border-yellow-400 bg-white"
                aria-label={`${field.label} color picker`}
              />
              <span className="min-w-0">
                <span className="block font-semibold">{field.label}</span>
                <input
                  type="text"
                  value={value}
                  spellCheck={false}
                  onChange={(event) => patchHomeField(setContent, field.key, event.target.value)}
                  onBlur={(event) => {
                    const next = normalizeHexColor(event.target.value, toPickerValue(value))
                    patchHomeField(setContent, field.key, next)
                  }}
                  className="mt-0.5 w-full rounded border border-yellow-300 bg-yellow-50 px-2 py-1 font-mono text-xs uppercase tracking-wide"
                  aria-label={`${field.label} hex value`}
                />
              </span>
            </label>
          )
        })}
        <label className="flex items-center gap-3 text-sm text-yellow-950">
          <span className="min-w-0">
            <span className="block font-semibold">Hero delay (seconds)</span>
            <input
              type="number"
              min={1}
              max={60}
              value={content.heroDelaySeconds}
              onChange={(event) =>
                patchHomeField(setContent, 'heroDelaySeconds', Number(event.target.value))
              }
              onBlur={() => {
                patchHomeField(
                  setContent,
                  'heroDelaySeconds',
                  normalizeHeroDelay(content.heroDelaySeconds, 5)
                )
              }}
              className="mt-0.5 w-full rounded border border-yellow-300 bg-yellow-50 px-2 py-1 font-mono text-xs tracking-wide"
              aria-label="Hero delay in seconds"
            />
          </span>
        </label>
      </div>
    </div>
  )
}
