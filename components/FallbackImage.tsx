'use client'

import { useState } from 'react'
import Image from 'next/image'

interface FallbackImageProps {
  src: string
  fallbackSrc: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
}

/**
 * next/image wrapper that swaps to a fallback src if the primary image fails to load.
 */
export default function FallbackImage({
  src,
  fallbackSrc,
  alt,
  fill = true,
  className = 'object-contain',
  sizes = '(max-width: 640px) 45vw, 200px',
}: FallbackImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc)
        }
      }}
    />
  )
}
