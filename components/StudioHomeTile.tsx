'use client'

import Link from 'next/link'
import FallbackImage from './FallbackImage'

interface StudioHomeTileProps {
  href: string
  title: string
  imageSrc: string
  fallbackImageSrc: string
}

/**
 * Home-page entry tile for the Balloons and Banners Design Studio.
 * Falls back to the bundled balloon image if the configured src fails to load.
 */
export default function StudioHomeTile({
  href,
  title,
  imageSrc,
  fallbackImageSrc,
}: StudioHomeTileProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center group"
      aria-label={`${title} design studio`}
    >
      <div className="w-full aspect-square rounded-lg border-4 border-pink-400 transition-all hover:scale-105 hover:shadow-xl bg-white flex items-center justify-center p-6">
        <div className="relative w-full h-full">
          <FallbackImage
            src={imageSrc}
            fallbackSrc={fallbackImageSrc}
            alt={title}
          />
        </div>
      </div>
      <p className="mt-3 text-center font-semibold text-lg text-pink-600">
        {title}
      </p>
    </Link>
  )
}
