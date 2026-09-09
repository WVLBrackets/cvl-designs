'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { DEFAULT_STUDIO_IMAGE_SRC } from '@/lib/studio'
import type { PublicGalleryItem } from '@/lib/types'

const ROTATE_MS = 5000
const HERO_COUNT = 8

interface StudioHeroProps {
  items: PublicGalleryItem[]
  title: string
  tagline: string
  onSelect?: (item: PublicGalleryItem) => void
}

/**
 * Shuffle a copy of an array (Fisher–Yates).
 *
 * @param list - Source items
 */
function shuffle<T>(list: T[]): T[] {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
  }
  return next
}

/**
 * Pick the rotating hero set: featured items first, otherwise a random public subset.
 *
 * @param items - Public gallery items
 */
function pickHeroItems(items: PublicGalleryItem[]): PublicGalleryItem[] {
  const featured = items.filter((item) => item.featured)
  const pool = featured.length > 0 ? featured : items
  return shuffle(pool).slice(0, HERO_COUNT)
}

/**
 * Full-width rotating hero of previous studio work, with pause and previous/next controls.
 */
export default function StudioHero({ items, title, tagline, onSelect }: StudioHeroProps) {
  const [slides, setSlides] = useState<PublicGalleryItem[]>(() => items.slice(0, HERO_COUNT))
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setSlides(pickHeroItems(items))
    setIndex(0)
  }, [items])

  useEffect(() => {
    if (paused || slides.length < 2) return undefined
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, ROTATE_MS)
    return () => window.clearTimeout(timer)
  }, [paused, slides.length, index])

  /**
   * Move the hero by one slide, wrapping at both ends.
   *
   * @param delta - `-1` for previous, `1` for next
   */
  function go(delta: number) {
    if (slides.length < 2) return
    setIndex((current) => (current + delta + slides.length) % slides.length)
  }

  const current = slides[index]
  const imageSrc = current?.imageUrl || DEFAULT_STUDIO_IMAGE_SRC
  const caption = current?.caption || title
  const showControls = slides.length > 1

  return (
    <section className="relative bg-gradient-to-r from-pink-100 via-rose-50 to-sky-100 border-y border-pink-200 overflow-hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 grid sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 sm:gap-6 items-center min-w-0">
        <div className="relative w-full min-w-0 max-w-full aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden bg-white shadow-md">
          <Image
            src={imageSrc}
            alt={caption}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
          {current && onSelect ? (
            <button
              type="button"
              className="absolute inset-0 z-[1]"
              onClick={() => onSelect(current)}
              aria-label={`View ${caption}`}
            />
          ) : null}
          {showControls ? (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 h-11 w-11 rounded-full bg-black/60 text-white text-2xl leading-none"
                aria-label="Previous photo"
                onClick={() => go(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 h-11 w-11 rounded-full bg-black/60 text-white text-2xl leading-none"
                aria-label="Next photo"
                onClick={() => go(1)}
              >
                ›
              </button>
              <button
                type="button"
                className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 h-11 w-11 rounded-full bg-black/60 text-white flex items-center justify-center"
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
        <div className="text-center sm:text-left min-w-0 px-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-600 mb-1">
            Design Studio
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 break-words">{title}</h1>
          <p className="mt-2 text-base sm:text-lg text-gray-600 break-words">{tagline}</p>
          {current?.caption ? (
            <p className="mt-3 text-gray-700 italic break-words">“{current.caption}”</p>
          ) : (
            <p className="mt-3 text-gray-500">Gallery coming soon — check back for recent work.</p>
          )}
          {showControls ? (
            <div className="mt-4 flex justify-center sm:justify-start gap-2 flex-wrap">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-pink-500' : 'bg-pink-200'}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
