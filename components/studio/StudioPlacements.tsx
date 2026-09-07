'use client'

import Link from 'next/link'
import FallbackImage from '../FallbackImage'

interface StudioHomeContentProps {
  href: string
  title: string
  tagline: string
  imageSrc: string
  fallbackImageSrc: string
}

/**
 * Large featured tile meant to sit above the team-store grid.
 */
export function StudioFeaturedTile({
  href,
  title,
  tagline,
  imageSrc,
  fallbackImageSrc,
}: StudioHomeContentProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center group max-w-[240px] mx-auto"
      aria-label={`${title} design studio`}
    >
      <div className="w-full aspect-square rounded-lg border-4 border-pink-400 transition-all hover:scale-105 hover:shadow-xl bg-white flex items-center justify-center p-6">
        <div className="relative w-full h-full">
          <FallbackImage src={imageSrc} fallbackSrc={fallbackImageSrc} alt={title} />
        </div>
      </div>
      <p className="mt-3 text-center font-semibold text-xl text-pink-600">{title}</p>
      {tagline ? (
        <p className="mt-1 text-center text-sm text-gray-500">{tagline}</p>
      ) : null}
    </Link>
  )
}

/**
 * Horizontal lead banner inside the home card: image, title, and a clear CTA.
 */
export function StudioLeadBanner({
  href,
  title,
  tagline,
  imageSrc,
  fallbackImageSrc,
}: StudioHomeContentProps) {
  return (
    <Link
      href={href}
      className="block group rounded-xl border-2 border-pink-300 bg-gradient-to-r from-pink-50 via-white to-sky-50 hover:shadow-lg transition-shadow"
      aria-label={`${title} design studio`}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-5 sm:p-6">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0">
          <FallbackImage src={imageSrc} fallbackSrc={fallbackImageSrc} alt="" />
        </div>
        <div className="text-center sm:text-left flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-500 mb-1">
            Design Studio
          </p>
          <p className="text-2xl font-bold text-gray-900">{title}</p>
          {tagline ? <p className="mt-1 text-gray-600">{tagline}</p> : null}
          <span className="inline-block mt-3 px-4 py-2 rounded-lg bg-pink-500 group-hover:bg-pink-600 text-white text-sm font-semibold">
            Open Studio
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * Full-width hero band that sits between the site header and the team-store card.
 */
export function StudioHeroBand({
  href,
  title,
  tagline,
  imageSrc,
  fallbackImageSrc,
}: StudioHomeContentProps) {
  return (
    <Link
      href={href}
      className="block group bg-gradient-to-r from-pink-100 via-rose-50 to-sky-100 border-y border-pink-200 hover:from-pink-200/80 transition-colors"
      aria-label={`${title} design studio`}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0">
          <FallbackImage src={imageSrc} fallbackSrc={fallbackImageSrc} alt="" />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-600 mb-1">
            Design Studio
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</p>
          {tagline ? <p className="mt-2 text-lg text-gray-600">{tagline}</p> : null}
          <span className="inline-block mt-4 px-5 py-2.5 rounded-lg bg-pink-500 group-hover:bg-pink-600 text-white font-semibold">
            Open Studio
          </span>
        </div>
      </div>
    </Link>
  )
}

/**
 * Compact header control so the studio is reachable from the lead banner without competing with team logos.
 */
export function StudioHeaderLink({
  href,
  title,
  imageSrc,
  fallbackImageSrc,
}: Omit<StudioHomeContentProps, 'tagline'>) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border-2 border-pink-400 bg-white pl-1 pr-4 py-1 hover:bg-pink-50 hover:shadow-md transition-all"
      aria-label={`${title} design studio`}
    >
      <span className="relative w-10 h-10 flex-shrink-0">
        <FallbackImage src={imageSrc} fallbackSrc={fallbackImageSrc} alt="" />
      </span>
      <span className="text-sm font-semibold text-pink-600 whitespace-nowrap">{title}</span>
    </Link>
  )
}
