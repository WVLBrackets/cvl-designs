'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import StudioHero from './StudioHero'
import type { GalleryCategory, PublicGalleryItem } from '@/lib/types'

interface StudioGalleryClientProps {
  title: string
  tagline: string
  categories: GalleryCategory[]
  items: PublicGalleryItem[]
}

/**
 * Public studio gallery: rotating hero, category chips, grid, and lightbox.
 */
export default function StudioGalleryClient({
  title,
  tagline,
  categories,
  items,
}: StudioGalleryClientProps) {
  const [filter, setFilter] = useState('all')
  const [active, setActive] = useState<PublicGalleryItem | null>(null)

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.categorySlug === filter)),
    [filter, items]
  )

  const categoryName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name || slug

  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <StudioHero items={items} title={title} tagline={tagline} onSelect={setActive} />

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8 sm:py-10 min-w-0">
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${
              filter === 'all'
                ? 'bg-pink-500 text-white border-pink-500'
                : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setFilter(category.slug)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${
                filter === category.slug
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            No pieces in this category yet. Caryn’s latest work will show up here.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item)}
                className="group text-left bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow min-w-0"
              >
                <div className="relative aspect-square bg-gray-100">
                  <Image
                    src={item.imageUrl}
                    alt={item.caption || 'Gallery piece'}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                <div className="p-3 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-pink-600 font-semibold">
                    {categoryName(item.categorySlug)}
                  </p>
                  <p className="mt-1 text-sm text-gray-800 line-clamp-2 break-words">{item.caption}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 overflow-y-auto"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.caption || 'Gallery image'}
        >
          <div
            className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto min-w-0"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
              <Image
                src={active.imageUrl}
                alt={active.caption || 'Gallery piece'}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-xs uppercase tracking-wide text-pink-600 font-semibold">
                {categoryName(active.categorySlug)}
              </p>
              <p className="mt-2 text-gray-800 break-words">{active.caption}</p>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
