/**
 * Order Summary Component
 * Shows running subtotal with line-item breakdown
 */

'use client'

import { useState } from 'react'
import type { OrderItem } from '@/lib/types'

interface OrderSummaryProps {
  items: OrderItem[]
  onRemoveItem: (index: number) => void
  onEditItem: (index: number) => void
  onCopyItem: (index: number) => void
  onUpdateQuantity: (index: number, quantity: number) => void
  accentColor?: string
  confirmRemoveMessage?: string
}

export default function OrderSummary({ 
  items, 
  onRemoveItem, 
  onEditItem,
  onCopyItem,
  onUpdateQuantity,
  accentColor = '',
  confirmRemoveMessage = 'Are you sure you want to remove this item?',
}: OrderSummaryProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null)

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const handleRemoveClick = (index: number) => {
    setConfirmRemove(index)
  }

  const confirmRemoveItem = (index: number) => {
    onRemoveItem(index)
    setConfirmRemove(null)
  }

  const cancelRemove = () => {
    setConfirmRemove(null)
  }

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">Your order is empty. Add items to get started!</p>
      </div>
    )
  }
  
  const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0)
  
  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6"
      style={accentColor ? { borderWidth: '2px', borderStyle: 'solid', borderColor: accentColor } : {}}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Order</h2>
      
      <div className="space-y-3">
        {items.map((item, index) => {
          const isExpanded = expandedItems.has(index)
          const itemTotal = item.totalPrice * item.quantity
          
          return (
        <div key={index} className="border rounded-lg p-3">
          {/* Mobile: Multi-row layout */}
          <div className="sm:hidden space-y-2">
            {/* Row 1: Product Name and Size */}
            <div className="font-semibold text-gray-900">
              {item.productName} <span className="text-sm text-gray-600">({item.size})</span>
            </div>
            
            {/* Row 2: Quantity Controls and Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                <button
                  onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-10 text-center font-medium text-gray-900">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded font-bold text-lg"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onCopyItem(index)}
                  className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded flex items-center justify-center"
                  title="Copy"
                  aria-label="Copy item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => onEditItem(index)}
                  className="w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center justify-center"
                  title="Edit"
                  aria-label="Edit item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleRemoveClick(index)}
                  className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-700 rounded flex items-center justify-center"
                  title="Remove"
                  aria-label="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Row 3: Details Button and Price (price hidden when expanded) */}
            <div className="flex items-center justify-between pt-1 border-t">
              <button
                onClick={() => toggleExpand(index)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <span className="w-5 h-5 flex items-center justify-center rounded border border-gray-400 font-bold text-xs">
                  {isExpanded ? '−' : '+'}
                </span>
                <span>Details</span>
              </button>
              
              {!isExpanded && (
                <div className="font-bold text-gray-900 text-lg">
                  ${itemTotal.toFixed(2)}
                </div>
              )}
            </div>
          </div>
          
          {/* Desktop: Original one-line layout */}
          <div className="hidden sm:flex items-start gap-2">
            {/* Expand/Collapse Button with Label */}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => toggleExpand(index)}
                className="w-6 h-6 flex items-center justify-center rounded border border-gray-400 hover:bg-gray-100 text-gray-600 font-bold"
                aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? '−' : '+'}
              </button>
              <span className="text-[9px] text-gray-500 leading-none whitespace-nowrap">Details</span>
            </div>

            {/* Product Name and Size - Aligned with button top */}
            <div className="flex-1 min-w-0 pt-0.5">
              <span className="font-semibold text-gray-900">{item.productName}</span>
              <span className="text-sm text-gray-600 ml-2">({item.size})</span>
            </div>

            {/* Quantity Controls with Label */}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 h-8">
                <button
                  onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded font-bold text-lg"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <span className="text-[9px] text-gray-500 leading-none whitespace-nowrap">Quantity</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={() => onCopyItem(index)}
                className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded flex items-center justify-center"
                title="Copy item"
                aria-label="Copy item"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => onEditItem(index)}
                className="w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center justify-center"
                title="Edit item"
                aria-label="Edit item"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleRemoveClick(index)}
                className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-700 rounded flex items-center justify-center"
                title="Remove item"
                aria-label="Remove item"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Item Total - Far Right, aligned with buttons */}
            <div className="font-semibold text-gray-900 min-w-[80px] text-right flex-shrink-0 pt-1">
              ${itemTotal.toFixed(2)}
            </div>
          </div>

              {/* Expanded View - Details */}
              {isExpanded && (
                <div className="mt-3 pl-8 space-y-2 text-sm border-t pt-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Base Price (per unit):</span>
                    <span>${item.itemPrice.toFixed(2)}</span>
                  </div>
                  
                  {/* Design Options */}
                  {item.designOptions.length > 0 && (
                    <div className="pl-3 border-l-2 border-gray-200">
                      <p className="font-medium text-gray-700 mb-1">Design Options:</p>
                      {item.designOptions.map((opt, idx) => (
                        <div key={idx} className="flex justify-between text-gray-600 text-xs">
                          <span>• {opt.title}</span>
                          <span>${opt.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Customization Options */}
                  {item.customizationOptions.length > 0 && (
                    <div className="pl-3 border-l-2 border-gray-200">
                      <p className="font-medium text-gray-700 mb-1">Customizations:</p>
                      {item.customizationOptions.map((opt, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between text-gray-600">
                            <span>• {opt.title}</span>
                            <span>${opt.price.toFixed(2)}</span>
                          </div>
                          {(opt.customName || opt.customNumber) && (
                            <div className="text-gray-500 ml-3">
                              {opt.customName && <span>Name: {opt.customName}</span>}
                              {opt.customName && opt.customNumber && <span>, </span>}
                              {opt.customNumber && <span>Number: {opt.customNumber}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between font-medium text-gray-900 pt-2 border-t">
                    <span>Unit Price:</span>
                    <span>${item.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Subtotal (×{item.quantity}):</span>
                    <span>${itemTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Confirmation Dialog */}
              {confirmRemove === index && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800 mb-2">{confirmRemoveMessage}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmRemoveItem(index)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                    >
                      Yes, Remove
                    </button>
                    <button
                      onClick={cancelRemove}
                      className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        
        {/* Order Total */}
        <div className="pt-4 border-t-2">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">Order Total:</span>
            <span className="text-2xl font-bold text-primary-600">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
