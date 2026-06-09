/**
 * Color Selector Component
 * Displays available color variants with optional hex swatches and upcharge pricing
 */

'use client'

import type { Product } from '@/lib/types'

interface ColorSelectorProps {
  product: Product
  selectedColorId: string
  onSelect: (colorId: string, colorName: string, upcharge: number) => void
}

/**
 * Normalize hex color for CSS; returns undefined if invalid
 */
function normalizeHex(hex?: string): string | undefined {
  if (!hex) return undefined
  const trimmed = hex.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`
  return undefined
}

export default function ColorSelector({
  product,
  selectedColorId,
  onSelect,
}: ColorSelectorProps) {
  if (product.availableColors.length <= 1) {
    return null
  }

  const isComplete = !!selectedColorId

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        Select Color{' '}
        {isComplete ? (
          <span className="text-green-600">✓</span>
        ) : (
          <span className="text-red-600">*</span>
        )}
      </h3>

      <div className="flex flex-wrap gap-2">
        {product.availableColors.map(color => {
          const isSelected = selectedColorId === color.id
          const hasUpcharge = color.upcharge > 0
          const swatchHex = normalizeHex(color.hexCode)

          return (
            <button
              key={color.id}
              type="button"
              onClick={() => onSelect(color.id, color.name, color.upcharge)}
              className={`min-w-[72px] px-3 py-2 border-2 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-primary-400'
              }`}
            >
              {swatchHex ? (
                <span
                  className="w-6 h-6 rounded-full border border-gray-300 shrink-0"
                  style={{ backgroundColor: swatchHex }}
                  aria-hidden
                />
              ) : null}
              <span className="text-sm text-center leading-tight">{color.name}</span>
              {hasUpcharge && (
                <span
                  className={`text-xs ${isSelected ? 'text-white/90' : 'text-green-600'}`}
                >
                  +${color.upcharge.toFixed(0)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
