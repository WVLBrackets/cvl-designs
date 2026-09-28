/**
 * Homepage hero media list (code config, not a CMS).
 * Version 1 uses a single image. Extra items can be appended later; HeroMedia
 * only mounts carousel behavior when length > 1.
 */

export type HeroMediaItem =
  | {
      type: 'image'
      src: string
      alt: string
      /** CSS object-position, e.g. `center 40%` */
      objectPosition?: string
    }
  | {
      type: 'video'
      src: string
      poster: string
      alt: string
      objectPosition?: string
    }

/** Public marketing routes used by the brand homepage. */
export const TEAM_STORES_ROUTE = '/team-stores'
export const CELEBRATIONS_ROUTE = '/studio'
export const BALLOONS_ROUTE = '/studio?category=balloons'
export const BANNERS_ROUTE = '/studio?category=banners'
export const QUOTE_ROUTE = '/studio/quote'
export const ABOUT_ROUTE = '/home#about'

export const HERO_MEDIA: HeroMediaItem[] = [
  {
    type: 'image',
    src: '/images/home/reedy-hoco-2026.jpg',
    alt: 'Hand-painted kraft paper banner reading Reedy HOCO 2026 with a football and bow',
    objectPosition: 'center center',
  },
]
