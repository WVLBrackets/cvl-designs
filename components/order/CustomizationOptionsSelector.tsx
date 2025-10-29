/**
 * Customization Options Selector Component
 */

'use client'

import type { Product, CustomizationOption } from '@/lib/types'
import ProductImage from '../ProductImage'
import ProductImageWithZoom from '../ProductImageWithZoom'

interface CustomizationData {
  optionNumber: number
  customName?: string
  customNumber?: string
}

interface CustomizationOptionsSelectorProps {
  product: Product
  availableOptions: CustomizationOption[]
  selectedOptions: number[]
  customizationData: CustomizationData[]
  onToggle: (optionNumber: number) => void
  onDataChange: (optionNumber: number, field: 'customName' | 'customNumber', value: string) => void
  title?: string
  instructionRequired?: string
  instructionOptional?: string
  noCostLabel?: string
}

export default function CustomizationOptionsSelector({
  product,
  availableOptions,
  selectedOptions,
  customizationData,
  onToggle,
  onDataChange,
  title = 'Customization Options',
  instructionRequired = 'Select one customization',
  instructionOptional = 'Select one customization',
  noCostLabel = 'Included',
}: CustomizationOptionsSelectorProps) {
  // Filter to only show options available for this product
  const productOptions = availableOptions.filter(opt =>
    product.availableCustomizationOptions.includes(opt.number)
  )
  
  if (productOptions.length === 0) {
    return null
  }
  
  const canSelectMultiple = product.customizationSelectionMode === 'Multi'
  const isRequired = product.customizationRequired
  
  // Check if filled: at least one option selected AND all required inputs are complete
  const isFilled = selectedOptions.length > 0 && selectedOptions.every(optNum => {
    const option = productOptions.find(o => o.number === optNum)
    if (!option) return false
    
    const data = customizationData.find(d => d.optionNumber === optNum)
    
    // If option requires input, check that the required fields are filled
    if (option.requiresInput === 'name') {
      return !!(data?.customName)
    }
    if (option.requiresInput === 'number') {
      return !!(data?.customNumber)
    }
    if (option.requiresInput === 'both') {
      return !!(data?.customName && data?.customNumber)
    }
    
    // No input required, so it's complete
    return true
  })
  
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
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {productOptions.map(option => {
          const isSelected = selectedOptions.includes(option.number)
          const data = customizationData.find(d => d.optionNumber === option.number)
          const requiresInput = option.requiresInput && option.requiresInput !== 'none'
          
          return (
            <div
              key={option.number}
              className={`${requiresInput && isSelected ? 'col-span-2 sm:col-span-4' : ''}`}
            >
              <div
                className={`p-1 border-2 rounded-lg transition-all flex flex-col ${
                  isSelected
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <button
                  onClick={() => onToggle(option.number)}
                  className="w-full relative flex flex-col flex-1"
                >
                  {/* Mobile: Square layout without zoom */}
                  <div className="sm:hidden flex flex-col flex-1 items-center text-center">
                    {option.image && (
                      <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                        <ProductImage
                          src={option.image}
                          alt={option.title}
                          type="customization"
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="font-medium text-gray-900 text-xs mt-1 px-1 line-clamp-2">
                      {option.title}{option.price > 0 ? ` ($${option.price})` : ''}
                    </p>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Desktop: Square layout with zoom on hover */}
                  <div className="hidden sm:flex flex-col flex-1 items-center text-center">
                    {option.image && (
                      <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                        <ProductImageWithZoom
                          src={option.image}
                          alt={option.title}
                          type="customization"
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="font-medium text-gray-900 text-xs mt-1 px-1 line-clamp-2">
                      {option.title}{option.price > 0 ? ` ($${option.price})` : ''}
                    </p>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
                
                {/* Show input fields if selected and requires input */}
                {isSelected && requiresInput && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    {(option.requiresInput === 'name' || option.requiresInput === 'both') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Player Name *
                        </label>
                        <input
                          type="text"
                          value={data?.customName || ''}
                          onChange={(e) => onDataChange(option.number, 'customName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter player name"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    
                    {(option.requiresInput === 'number' || option.requiresInput === 'both') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Player Number *
                        </label>
                        <input
                          type="text"
                          value={data?.customNumber || ''}
                          onChange={(e) => onDataChange(option.number, 'customNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter player number"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

