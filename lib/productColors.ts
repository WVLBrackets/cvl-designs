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
 * Resolve the default color variant for a product
 */
export function getDefaultColorVariant(product: Product): ColorVariant | undefined {
  if (product.availableColors.length === 0) return undefined
  return (
    product.availableColors.find(c => c.id === product.defaultColorId) ||
    product.availableColors.find(c => c.isDefault) ||
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
