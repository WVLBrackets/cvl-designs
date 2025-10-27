/**
 * Product Image with Hover Zoom Component
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import ProductImage from './ProductImage'

interface ProductImageWithZoomProps {
  src?: string
  alt: string
  type: 'item' | 'design' | 'customization' | 'sizing'
  width: number
  height: number
  className?: string
}

export default function ProductImageWithZoom({
  src,
  alt,
  type,
  width,
  height,
  className = '',
}: ProductImageWithZoomProps) {
  const [showZoom, setShowZoom] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // Set timeout for 250ms before showing zoom
    hoverTimeoutRef.current = setTimeout(() => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect()
        // Position zoomed image so its top-left aligns with original's top-left
        setZoomPosition({
          x: rect.left,
          y: rect.top,
        })
      }
      setShowZoom(true)
    }, 250)
  }

  const handleMouseLeave = () => {
    // Clear timeout if mouse leaves before 250ms
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setShowZoom(false)
  }

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={imageRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
      >
        <ProductImage
          src={src}
          alt={alt}
          type={type}
          width={width}
          height={height}
        />
      </div>

      {/* Zoomed Image Overlay */}
      {showZoom && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${zoomPosition.x}px`,
            top: `${zoomPosition.y}px`,
            // No transform - align top-left corners directly
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-300 overflow-hidden">
            <ProductImage
              src={src}
              alt={`${alt} (zoomed)`}
              type={type}
              width={width * 3}
              height={height * 3}
            />
          </div>
        </div>
      )}
    </>
  )
}

