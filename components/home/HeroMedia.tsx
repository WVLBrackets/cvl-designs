import Image from 'next/image'
import type { ReactNode } from 'react'

interface HeroMediaProps {
  src: string
  alt: string
  objectPosition?: string
  className?: string
  editableSlot?: ReactNode
}

/**
 * Renders homepage hero media. A single image is static (no carousel JS).
 */
export default function HeroMedia({
  src,
  alt,
  objectPosition = 'center center',
  className = '',
  editableSlot,
}: HeroMediaProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl home-bg shadow-sm ${className}`}
    >
      <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9]">
        {editableSlot || (
          <Image
            src={src}
            alt={alt}
            fill
            priority
            className="object-cover"
            style={{ objectPosition }}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 70vw, 900px"
          />
        )}
      </div>
    </div>
  )
}
