'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { isGalleryVideoUrl } from '@/lib/galleryMedia'

interface GalleryMediaProps {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
  objectFit?: 'cover' | 'contain'
  objectPosition?: string
  mode?: 'thumb' | 'hero' | 'lightbox'
  paused?: boolean
  /** Hero only: loop until delay vs play once. */
  playFull?: boolean
  onEnded?: () => void
}

/**
 * Render a gallery photo or video inside a relatively positioned frame.
 */
export default function GalleryMedia({
  src,
  alt,
  sizes = '100vw',
  priority = false,
  className = '',
  objectFit = 'cover',
  objectPosition,
  mode = 'thumb',
  paused = false,
  playFull = false,
  onEnded,
}: GalleryMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isVideo = isGalleryVideoUrl(src)
  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover'
  const positionStyle = objectPosition ? { objectPosition } : undefined

  useEffect(() => {
    const el = videoRef.current
    if (!el || !isVideo) return undefined
    if (mode === 'hero') {
      if (paused) {
        el.pause()
      } else {
        void el.play().catch(() => undefined)
      }
    }
    return undefined
  }, [isVideo, mode, paused, src])

  if (isVideo) {
    const hero = mode === 'hero'
    const lightbox = mode === 'lightbox'
    const loop = hero && !playFull
    return (
      <>
        <video
          ref={videoRef}
          src={src}
          className={`absolute inset-0 h-full w-full ${fitClass} ${className}`}
          style={positionStyle}
          muted={hero || mode === 'thumb'}
          loop={loop}
          playsInline
          controls={lightbox}
          autoPlay={hero || lightbox}
          preload={mode === 'thumb' ? 'metadata' : 'auto'}
          aria-label={alt}
          onEnded={() => {
            if (hero && playFull) onEnded?.()
          }}
        />
        {mode === 'thumb' ? (
          <span
            className="pointer-events-none absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        ) : null}
      </>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={`${fitClass} ${className}`}
      style={positionStyle}
      sizes={sizes}
    />
  )
}
