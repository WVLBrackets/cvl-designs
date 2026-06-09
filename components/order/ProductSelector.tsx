/**
 * Product Selector Component
 */

'use client'

import { useState } from 'react'
import type { Product, Category } from '@/lib/types'
import {
  getDefaultColorVariant,
  getProductDisplayImage,
  normalizeHex,
  productHasColorChoice,
} from '@/lib/productColors'
import ProductImage from '../ProductImage'
import ProductImageWithZoom from '../ProductImageWithZoom'

interface ProductSelectorProps {
  products: Product[]
  categories: Category[]
  selectedProduct: Product | null
  selectedColorId?: string
  onSelect: (product: Product, initialColorId?: string) => void
  detailMode?: boolean
}

export default function ProductSelector({
  products,
  categories,
  selectedProduct,
  selectedColorId,
  onSelect,
  detailMode,
}: ProductSelectorProps) {
  const [catalogColorIds, setCatalogColorIds] = useState<Record<string, string>>({})

  // Group products by category
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category.id] = products.filter(p => p.category === category.id)
    return acc
  }, {} as Record<string, Product[]>)
  
  const isDetail = !!detailMode && !!selectedProduct
  
  if (isDetail && selectedProduct) {
    const product = selectedProduct
    const displayPrice = `${product.name} ($${product.price})`
    const imageSrc = getProductDisplayImage(product, selectedColorId)
    return (
      <div className="space-y-4 -mt-2">
        <div className="grid gap-3">
          <div className="p-4 border-2 rounded-lg bg-white">
            {/* Mobile: Stacked layout with larger centered image (non-zoomable) */}
            <div className="sm:hidden flex flex-col items-center gap-3 text-center">
              <ProductImage
                src={imageSrc}
                alt={product.name}
                type="item"
                width={180}
                height={180}
                className="flex-shrink-0"
              />
              <div className="w-full">
                <p className="font-medium text-gray-900 text-lg">{displayPrice}</p>
                {product.status === 'PREVIEW' && (
                  <span className="inline-block mt-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Preview</span>
                )}
              </div>
            </div>
            
            {/* Desktop: Original horizontal layout with zoom */}
            <div className="hidden sm:flex items-center gap-3">
              <ProductImageWithZoom
                src={imageSrc}
                alt={product.name}
                type="item"
                width={120}
                height={120}
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-lg truncate">{displayPrice}</p>
                {product.status === 'PREVIEW' && (
                  <span className="inline-block mt-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Preview</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className={'space-y-4'}>
      {categories.map(category => {
        const categoryProducts = productsByCategory[category.id] || []
        if (categoryProducts.length === 0) return null
        
        return (
          <div key={category.id} className="space-y-2">
            <h4 className="text-md font-medium text-gray-700 capitalize">{category.name}</h4>
            <div className={`grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`}>
              {categoryProducts.map(product => {
                const defaultColor = getDefaultColorVariant(product)
                const selectedCatalogColorId =
                  catalogColorIds[product.id] || defaultColor?.id
                const catalogImage = getProductDisplayImage(product, selectedCatalogColorId)
                const hasColorChoice = productHasColorChoice(product)

                return (
                  <div
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(product, selectedCatalogColorId)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelect(product, selectedCatalogColorId)
                      }
                    }}
                    className="p-4 border-2 rounded-lg text-left transition-all border-gray-200 hover:border-primary-300 bg-white cursor-pointer"
                  >
                    <div className="flex gap-3">
                      <ProductImageWithZoom
                        src={catalogImage}
                        alt={product.name}
                        type="item"
                        width={60}
                        height={60}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{product.displayName}</p>
                        <p className="text-xs text-gray-600 capitalize mt-0.5">{category.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Base Price: ${product.price}</p>
                        {hasColorChoice && (
                          <div
                            className="flex gap-1 mt-1.5"
                            onClick={event => event.stopPropagation()}
                            onKeyDown={event => event.stopPropagation()}
                          >
                            {product.availableColors.map(color => {
                              const isActive = selectedCatalogColorId === color.id
                              const swatchHex = normalizeHex(color.hexCode) || '#d1d5db'
                              return (
                                <button
                                  key={color.id}
                                  type="button"
                                  title={color.name}
                                  aria-label={`${color.name}${isActive ? ' (selected)' : ''}`}
                                  aria-pressed={isActive}
                                  onClick={event => {
                                    event.stopPropagation()
                                    setCatalogColorIds(prev => ({
                                      ...prev,
                                      [product.id]: color.id,
                                    }))
                                  }}
                                  className={`w-5 h-5 rounded-sm border-2 shrink-0 transition-all ${
                                    isActive
                                      ? 'border-primary-600 ring-1 ring-primary-300'
                                      : 'border-gray-300 hover:border-primary-400'
                                  }`}
                                  style={{ backgroundColor: swatchHex }}
                                />
                              )
                            })}
                          </div>
                        )}
                        {product.status === 'PREVIEW' && (
                          <span className="inline-block mt-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded self-start">
                            Preview
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
