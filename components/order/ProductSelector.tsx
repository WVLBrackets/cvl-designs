/**
 * Product Selector Component
 */

'use client'

import type { Product, Category } from '@/lib/types'
import ProductImage from '../ProductImage'
import ProductImageWithZoom from '../ProductImageWithZoom'

interface ProductSelectorProps {
  products: Product[]
  categories: Category[]
  selectedProduct: Product | null
  onSelect: (product: Product) => void
  detailMode?: boolean
}

export default function ProductSelector({
  products,
  categories,
  selectedProduct,
  onSelect,
  detailMode,
}: ProductSelectorProps) {
  // Group products by category
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category.id] = products.filter(p => p.category === category.id)
    return acc
  }, {} as Record<string, Product[]>)
  
  const isDetail = !!detailMode && !!selectedProduct
  
  if (isDetail && selectedProduct) {
    const product = selectedProduct
    const displayPrice = `${product.name} ($${product.price})`
    return (
      <div className="space-y-4 -mt-2">
        <div className="grid gap-3">
          <div className="p-4 border-2 rounded-lg bg-white">
            {/* Mobile: Stacked layout with larger centered image (non-zoomable) */}
            <div className="sm:hidden flex flex-col items-center gap-3 text-center">
              <ProductImage
                src={product.image}
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
                src={product.image}
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
                return (
                  <button
                    key={product.id}
                    onClick={() => onSelect(product)}
                    className={`p-4 border-2 rounded-lg text-left transition-all border-gray-200 hover:border-primary-300 bg-white`}
                  >
                    <div className="flex gap-3">
                      <ProductImageWithZoom
                        src={product.image}
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
                        {product.status === 'PREVIEW' && (
                          <span className="inline-block mt-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded self-start">
                            Preview
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

