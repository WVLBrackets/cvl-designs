/**
 * Size Selector Component
 */

'use client'

import { useState } from 'react'
import type { Product } from '@/lib/types'
import Image from 'next/image'

interface SizeSelectorProps {
  product: Product
  selectedSize: string
  onSelect: (size: string) => void
}

export default function SizeSelector({
  product,
  selectedSize,
  onSelect,
}: SizeSelectorProps) {
  const [showSizingModal, setShowSizingModal] = useState(false)
  
  // Check if sizing chart is a PDF
  const isPDF = product.sizingChart?.toLowerCase().endsWith('.pdf') || false
  
  if (product.availableSizes.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No size selection required for this product
      </div>
    )
  }
  
  const isComplete = !!selectedSize

  return (
    <div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Size {isComplete ? <span className="text-green-600">✓</span> : <span className="text-red-600">*</span>}
          </h3>
          {product.sizingChart && (
            <button
              onClick={() => setShowSizingModal(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
            >
              View Sizing Chart
            </button>
          )}
        </div>
      
      <div className="flex flex-wrap gap-2">
        {product.availableSizes.map(size => {
          const isSelected = selectedSize === size
          const isTBD = size === 'TBD'
          
          return (
            <button
              key={size}
              onClick={() => !isTBD && onSelect(size)}
              disabled={isTBD}
              className={`px-4 py-2 border-2 rounded-lg font-medium transition-all ${
                isTBD
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isSelected
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-primary-400'
              }`}
            >
              {size}
            </button>
          )
        })}
      </div>
    </div>

    {/* Sizing Chart Modal */}
    {showSizingModal && product.sizingChart && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowSizingModal(false)}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Sizing Chart</h3>
            <div className="flex items-center gap-4">
              {/* Desktop only: Open in New Tab link */}
              <a
                href={`/images/product/Sizing/${product.sizingChart}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline text-blue-600 hover:text-blue-700 text-sm font-medium underline"
              >
                Open in New Tab
              </a>
              <button
                onClick={() => setShowSizingModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
          <div className="p-4">
            {isPDF ? (
              <iframe
                src={`/images/product/Sizing/${product.sizingChart}`}
                className="w-full"
                style={{ height: '70vh', minHeight: '500px' }}
                title="Sizing Chart PDF"
              />
            ) : (
              <div className="relative w-full" style={{ minHeight: '500px' }}>
                <Image
                  src={`/images/product/Sizing/${product.sizingChart}`}
                  alt="Sizing Chart"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  )
}

