/**
 * Helpers for product color variant selection and display
 */

import type { ColorVariant, Product, SizeWithPrice } from './types'

/**
 * Whether the product requires an explicit color selection step
 */
export function productHasColorChoice(product: Product): boolean {
  return product.availableColors.length > 1
}

/**
 * Normalize hex color for CSS; returns undefined if invalid
 */
export function normalizeHex(hex?: string): string | undefined {
  if (!hex) return undefined
  const trimmed = hex.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed}`
  return undefined
}

/**
 * Pick white or black text for readable contrast on a hex background
 */
export function getContrastTextColor(hex?: string): 'white' | 'black' {
  const normalized = normalizeHex(hex)
  if (!normalized) return 'black'
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? 'black' : 'white'
}

/**
 * Resolve the default color variant for a product (first listed color)
 */
export function getDefaultColorVariant(product: Product): ColorVariant | undefined {
  if (product.availableColors.length === 0) return undefined
  return (
    product.availableColors.find(c => c.id === product.defaultColorId) ||
    product.availableColors[0]
  )
}

/**
 * Find a color variant by id or display name
 */
export function findColorVariant(
  product: Product,
  colorId?: string,
  colorName?: string
): ColorVariant | undefined {
  if (!product.availableColors.length) return undefined
  if (colorId) {
    const byId = product.availableColors.find(c => c.id === colorId)
    if (byId) return byId
  }
  if (colorName) {
    return product.availableColors.find(
      c => c.name.toLowerCase() === colorName.toLowerCase()
    )
  }
  return undefined
}

/**
 * Sizes available for the active color (or the single-SKU product row)
 */
export function getActiveSizes(
  product: Product,
  colorId?: string,
  colorName?: string
): SizeWithPrice[] {
  const variant = findColorVariant(product, colorId, colorName)
  if (variant) return variant.availableSizes
  return product.availableSizes
}

/**
 * Catalog/detail image for a product given optional selected color
 */
export function getProductDisplayImage(
  product: Product,
  colorId?: string,
  colorName?: string
): string | undefined {
  const variant = findColorVariant(product, colorId, colorName) || getDefaultColorVariant(product)
  if (variant?.image) return variant.image
  return product.image
}
