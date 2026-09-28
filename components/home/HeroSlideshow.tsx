'use client'

import { useEffect, useRef, useState } from 'react'
import GalleryMedia from '@/components/studio/GalleryMedia'
import { isGalleryVideoUrl } from '@/lib/galleryMedia'

export interface HeroSlide {
  id: string
  src: string
  alt: string
  /** Videos only: play once then advance instead of using hero delay. */
  playFull?: boolean
}

interface HeroSlideshowProps {
  slides: HeroSlide[]
  delayMs: number
  sizes: string
  aspectClass?: string
  objectPosition?: string
  onSelect?: (slide: HeroSlide) => void
  onSlideChange?: (slide: HeroSlide) => void
  /** Pause auto-advance (and hero video) while a modal is open. */
  hold?: boolean
}

/**
 * Previous / next icons with no text nodes, so server and client HTML stay aligned.
 */
function ChevronIcon({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
      {direction === 'prev' ? (
        <path d="M15.4 4.6 8 12l7.4 7.4 1.4-1.4L10.8 12l6-5.6z" />
      ) : (
        <path d="M8.6 4.6 7.2 6l6 5.6-6 6 1.4 1.4L16 12z" />
      )}
    </svg>
  )
}

/**
 * Shared rotating hero media with previous, next, and pause when more than one slide.
 */
export default function HeroSlideshow({
  slides,
  delayMs,
  sizes,
  aspectClass = 'aspect-[4/3] sm:aspect-[16/10]',
  objectPosition,
  onSelect,
  onSlideChange,
  hold = false,
}: HeroSlideshowProps) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [canRotate, setCanRotate] = useState(false)
  const count = slides.length
  const current = slides[Math.min(index, Math.max(count - 1, 0))] || slides[0]
  const showControls = count > 1
  const frozen = paused || hold
  const playFullVideo = Boolean(
    current && isGalleryVideoUrl(current.src) && current.playFull
  )
  const onSlideChangeRef = useRef(onSlideChange)
  onSlideChangeRef.current = onSlideChange
  const slideIds = slides.map((slide) => slide.id).join('|')

  useEffect(() => {
    setCanRotate(true)
  }, [])

  useEffect(() => {
    setIndex(0)
  }, [slideIds])

  useEffect(() => {
    if (!canRotate || frozen || count < 2 || playFullVideo) return undefined
    const timer = window.setTimeout(() => {
      setIndex((value) => (value + 1) % count)
    }, delayMs)
    return () => window.clearTimeout(timer)
  }, [canRotate, frozen, count, index, delayMs, playFullVideo])

  /**
   * Move one slide, wrapping at both ends.
   *
   * @param delta - `-1` previous, `1` next
   */
  function go(delta: number) {
    if (count < 2) return
    setIndex((value) => (value + delta + count) % count)
  }

  /**
   * Advance after a Play in Full video finishes.
   */
  function handleVideoEnded() {
    if (frozen || count < 2) return
    go(1)
  }

  useEffect(() => {
    if (current) onSlideChangeRef.current?.(current)
  }, [current])

  if (!current) return null

  return (
    <div className={`relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl home-bg shadow-sm ${aspectClass}`}>
      <GalleryMedia
        src={current.src}
        alt={current.alt}
        sizes={sizes}
        priority
        mode="hero"
        paused={frozen}
        playFull={playFullVideo}
        onEnded={handleVideoEnded}
        objectPosition={objectPosition}
      />
      {onSelect ? (
        <button
          type="button"
          className="absolute inset-0 z-[1]"
          onClick={() => onSelect(current)}
          aria-label={`View ${current.alt}`}
        />
      ) : null}
      {showControls ? (
        <>
          <button
            type="button"
            className="absolute left-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="Previous photo"
            onClick={() => go(-1)}
          >
            <ChevronIcon direction="prev" />
          </button>
          <button
            type="button"
            className="absolute right-2 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="Next photo"
            onClick={() => go(1)}
          >
            <ChevronIcon direction="next" />
          </button>
          <button
            type="button"
            className="absolute bottom-2 left-1/2 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
              </svg>
            )}
          </button>
        </>
      ) : null}
    </div>
  )
}
