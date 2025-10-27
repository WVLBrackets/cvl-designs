/**
 * Product Image Component
 * Handles image display with proper error states
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductImageProps {
  src?: string
  alt: string
  type: 'item' | 'design' | 'customization' | 'sizing'
  className?: string
  width?: number
  height?: number
}

/**
 * Get the full image path based on type
 */
function getImagePath(src: string | undefined, type: string): string | null {
  if (!src || src.toLowerCase() === 'none' || src.trim() === '') {
    return null
  }
  
  const basePath = '/images/product'
  const typeFolder = {
    item: 'Item',
    design: 'Design',
    customization: 'Customizations',
    sizing: 'Sizing',
  }[type] || 'Item'
  
  return `${basePath}/${typeFolder}/${src}`
}

export default function ProductImage({ 
  src, 
  alt, 
  type,
  className = '',
  width = 200,
  height = 200,
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false)
  const imagePath = getImagePath(src, type)
  
  // No image referenced - show "Image not Available"
  if (!imagePath) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded ${className}`}
        style={{ width, height }}
      >
        <p className="text-gray-500 text-sm text-center px-2">Image not Available</p>
      </div>
    )
  }
  
  // Image referenced but not found - show "Image not Found"
  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border-2 border-dashed border-red-300 rounded ${className}`}
        style={{ width, height }}
      >
        <p className="text-red-600 text-sm text-center px-2">Image not Found<br/><span className="text-xs">{src}</span></p>
      </div>
    )
  }
  
  // Display image
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src={imagePath}
        alt={alt}
        fill
        className="object-contain"
        onError={() => setImageError(true)}
      />
    </div>
  )
}

