/**
 * Color Selector Component
 * Displays available color variants with optional hex swatches and upcharge pricing
 */

'use client'

import type { Product } from '@/lib/types'
import { normalizeHex } from '@/lib/productColors'

interface ColorSelectorProps {
  product: Product
  selectedColorId: string
  onSelect: (colorId: string, colorName: string, upcharge: number) => void
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
              className={`w-16 h-16 border-2 rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 overflow-hidden ${
                isSelected
                  ? 'border-primary-600 ring-2 ring-primary-200'
                  : 'border-gray-300 bg-white hover:border-primary-400'
              }`}
            >
              {swatchHex ? (
                <span
                  className="w-5 h-5 rounded-full border border-gray-300 shrink-0"
                  style={{ backgroundColor: swatchHex }}
                  aria-hidden
                />
              ) : null}
              <span
                className={`text-[9px] text-center leading-tight line-clamp-2 w-full px-0.5 ${
                  isSelected ? 'text-primary-700 font-semibold' : 'text-gray-700'
                }`}
              >
                {color.name}
              </span>
              {hasUpcharge && (
                <span
                  className={`text-[8px] leading-none ${isSelected ? 'text-primary-600' : 'text-green-600'}`}
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
