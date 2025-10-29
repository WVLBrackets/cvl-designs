/**
 * Design Options Selector Component
 */

'use client'

import type { Product, DesignOption } from '@/lib/types'
import ProductImage from '../ProductImage'

interface DesignOptionsSelectorProps {
  product: Product
  availableOptions: DesignOption[]
  selectedOptions: number[]
  onToggle: (optionNumber: number) => void
  title?: string
  instructionRequired?: string
  instructionOptional?: string
  noCostLabel?: string
}

export default function DesignOptionsSelector({
  product,
  availableOptions,
  selectedOptions,
  onToggle,
  title = 'Design Options',
  instructionRequired = 'Select one option',
  instructionOptional = 'Select one option',
  noCostLabel = 'Included',
}: DesignOptionsSelectorProps) {
  // Filter to only show options available for this product
  const productOptions = availableOptions.filter(opt =>
    product.availableDesignOptions.includes(opt.number)
  )
  
  if (productOptions.length === 0) {
    return null
  }
  
  const canSelectMultiple = product.designSelectionMode === 'Multi'
  const isRequired = product.designRequired
  const isFilled = selectedOptions.length > 0
  
  // Show icon logic:
  // - Green checkmark if filled (required or not)
  // - Red asterisk if required but not filled
  // - No icon if optional and not filled
  const showCheckmark = isFilled
  const showAsterisk = isRequired && !isFilled
  
  const instruction = isRequired ? instructionRequired : instructionOptional
  
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {title}{' '}
          {showCheckmark && <span className="text-green-600">✓</span>}
          {showAsterisk && <span className="text-red-600">*</span>}
        </h3>
        <p className="text-sm text-gray-600">
          {instruction}
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {productOptions.map(option => {
          const isSelected = selectedOptions.includes(option.number)
          
          return (
            <button
              key={option.number}
              onClick={() => onToggle(option.number)}
              className={`p-2 border-2 rounded-lg transition-all relative ${
                isSelected
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 bg-white'
              }`}
            >
              {/* Square layout with centered image and title below */}
              <div className="flex flex-col items-center text-center">
                {option.image && (
                  <div className="w-full aspect-square mb-2 flex items-center justify-center">
                    <ProductImage
                      src={option.image}
                      alt={option.title}
                      type="design"
                      width={200}
                      height={200}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <p className="font-medium text-gray-900 text-sm">
                  {option.title}{option.price > 0 ? ` ($${option.price})` : ''}
                </p>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

