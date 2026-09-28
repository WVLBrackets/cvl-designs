/**
 * Structured homepage copy and offering flags.
 * Persisted as JSON in Config attribute `Home_Content` (Production vs Preview columns).
 */

import { z } from 'zod'
import { getStudioHomeContent, resolveBrandImageSrc } from '@/lib/studio'
import {
  BALLOONS_ROUTE,
  BANNERS_ROUTE,
  CELEBRATIONS_ROUTE,
  QUOTE_ROUTE,
  TEAM_STORES_ROUTE,
} from '@/lib/homeHeroMedia'
import type { SiteConfiguration } from '@/lib/types'

/** Config sheet attribute that stores homepage JSON. */
export const HOME_CONTENT_CONFIG_KEY = 'Home_Content'

export const OFFERING_IDS = ['balloons', 'banners', 'apparel'] as const
export type OfferingId = (typeof OFFERING_IDS)[number]
export type HeroButtonStyle = 1 | 2

export interface HomeOffering {
  id: OfferingId
  enabled: boolean
  title: string
  body: string
  cta: string
  ctaVisible: boolean
  ctaHref: string
  imageSrc: string
  imageAlt: string
}

export interface HomeContent {
  headerTitle: string
  headerLogoSrc: string
  navBalloons: string
  navBalloonsHref: string
  navBanners: string
  navBannersHref: string
  navTeamStores: string
  navTeamStoresHref: string
  navAbout: string
  navAboutHref: string
  navContact: string
  navContactHref: string
  navSlot6: string
  navSlot6Href: string
  navSlot7: string
  navSlot7Href: string
  heroKicker: string
  heroTitle: string
  heroSubtitle: string
  heroCta1: string
  heroCta1Href: string
  heroCta1Style: HeroButtonStyle
  showHeroCta1: boolean
  heroCta2: string
  heroCta2Href: string
  heroCta2Style: HeroButtonStyle
  showHeroCta2: boolean
  heroCta3: string
  heroCta3Href: string
  heroCta3Style: HeroButtonStyle
  showHeroCta3: boolean
  heroImageSrc: string
  heroImageAlt: string
  pathsHeading: string
  path1Title: string
  path1Body: string
  path1Cta: string
  path1Href: string
  showPath1Cta: boolean
  path2Title: string
  path2Body: string
  path2Cta: string
  path2Href: string
  showPath2Cta: boolean
  showPathsSection: boolean
  offeringsHeading: string
  offerings: HomeOffering[]
  showOfferingsSection: boolean
  recentHeading: string
  recentCta: string
  recentCtaHref: string
  showRecentCta: boolean
  recentEmpty: string
  showRecentSection: boolean
  aboutHeading: string
  aboutText: string
  aboutKicker: string
  aboutLead: string
  aboutSignoff: string
  aboutImageSrc: string
  aboutImageAlt: string
  showAboutSection: boolean
  finalHeading: string
  finalBody: string
  finalCtaPrimary: string
  finalCtaSecondary: string
  showFinalCtaPrimary: boolean
  showFinalCtaSecondary: boolean
  showFinalSection: boolean
  footerHome: string
  footerHomeHref: string
  footerContact: string
  footerContactHref: string
  footerTeamStores: string
  footerTeamStoresHref: string
  footerSlot4: string
  footerSlot4Href: string
  footerSlot5: string
  footerSlot5Href: string
  footerText: string
  studioTitle: string
  studioTagline: string
  studioKicker: string
  studioAllLabel: string
  studioQuoteCta: string
  showStudioQuoteCta: boolean
  studioEmpty: string
  heroDelaySeconds: number
  colorBackground: string
  colorBackground2: string
  colorAccent: string
  colorText: string
}

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const offeringSchema = z.object({
  id: z.enum(OFFERING_IDS),
  enabled: z.boolean(),
  title: z.string().max(120),
  body: z.string().max(800),
  cta: z.string().max(80),
  ctaVisible: z.boolean().optional(),
  ctaHref: z.string().max(200).optional(),
  imageSrc: z.string().max(2000),
  imageAlt: z.string().max(200),
})

const homeContentSchema = z.object({
  headerTitle: z.string().max(80),
  headerLogoSrc: z.string().max(2000),
  navBalloons: z.string().max(40),
  navBalloonsHref: z.string().max(200).optional(),
  navBanners: z.string().max(40),
  navBannersHref: z.string().max(200).optional(),
  navTeamStores: z.string().max(40),
  navTeamStoresHref: z.string().max(200).optional(),
  navAbout: z.string().max(40),
  navAboutHref: z.string().max(200).optional(),
  navContact: z.string().max(40),
  navContactHref: z.string().max(200).optional(),
  navSlot6: z.string().max(40).optional(),
  navSlot6Href: z.string().max(200).optional(),
  navSlot7: z.string().max(40).optional(),
  navSlot7Href: z.string().max(200).optional(),
  heroKicker: z.string().max(80),
  heroTitle: z.string().max(160),
  heroSubtitle: z.string().max(400),
  heroCtaPrimary: z.string().max(60).optional(),
  heroCtaSecondary: z.string().max(60).optional(),
  showHeroCtaPrimary: z.boolean().optional(),
  showHeroCtaSecondary: z.boolean().optional(),
  heroCta1: z.string().max(60).optional(),
  heroCta1Href: z.string().max(200).optional(),
  heroCta1Style: z.union([z.literal(1), z.literal(2)]).optional(),
  showHeroCta1: z.boolean().optional(),
  heroCta2: z.string().max(60).optional(),
  heroCta2Href: z.string().max(200).optional(),
  heroCta2Style: z.union([z.literal(1), z.literal(2)]).optional(),
  showHeroCta2: z.boolean().optional(),
  heroCta3: z.string().max(60).optional(),
  heroCta3Href: z.string().max(200).optional(),
  heroCta3Style: z.union([z.literal(1), z.literal(2)]).optional(),
  showHeroCta3: z.boolean().optional(),
  heroImageSrc: z.string().max(2000),
  heroImageAlt: z.string().max(200),
  pathsHeading: z.string().max(120),
  path1Title: z.string().max(80),
  path1Body: z.string().max(400),
  path1Cta: z.string().max(80),
  path1Href: z.string().max(200).optional(),
  showPath1Cta: z.boolean().optional(),
  path2Title: z.string().max(80),
  path2Body: z.string().max(400),
  path2Cta: z.string().max(80),
  path2Href: z.string().max(200).optional(),
  showPath2Cta: z.boolean().optional(),
  showPathsSection: z.boolean().optional(),
  offeringsHeading: z.string().max(120),
  offerings: z.array(offeringSchema).min(1).max(3),
  showOfferingsSection: z.boolean().optional(),
  recentHeading: z.string().max(80),
  recentCta: z.string().max(80),
  recentCtaHref: z.string().max(200).optional(),
  showRecentCta: z.boolean().optional(),
  recentEmpty: z.string().max(240),
  showRecentSection: z.boolean().optional(),
  aboutHeading: z.string().max(80),
  aboutText: z.string().max(4000),
  aboutKicker: z.string().max(80).optional(),
  aboutLead: z.string().max(400).optional(),
  aboutSignoff: z.string().max(200).optional(),
  aboutImageSrc: z.string().max(2000).optional(),
  aboutImageAlt: z.string().max(200).optional(),
  showAboutSection: z.boolean().optional(),
  finalHeading: z.string().max(80),
  finalBody: z.string().max(400),
  finalCtaPrimary: z.string().max(60),
  finalCtaSecondary: z.string().max(60),
  showFinalCtaPrimary: z.boolean().optional(),
  showFinalCtaSecondary: z.boolean().optional(),
  showFinalSection: z.boolean().optional(),
  footerHome: z.string().max(40),
  footerHomeHref: z.string().max(200).optional(),
  footerContact: z.string().max(40),
  footerContactHref: z.string().max(200).optional(),
  footerTeamStores: z.string().max(40),
  footerTeamStoresHref: z.string().max(200).optional(),
  footerSlot4: z.string().max(40).optional(),
  footerSlot4Href: z.string().max(200).optional(),
  footerSlot5: z.string().max(40).optional(),
  footerSlot5Href: z.string().max(200).optional(),
  footerText: z.string().max(240),
  studioTitle: z.string().max(160).optional(),
  studioTagline: z.string().max(400).optional(),
  studioKicker: z.string().max(80).optional(),
  studioAllLabel: z.string().max(40).optional(),
  studioQuoteCta: z.string().max(80).optional(),
  showStudioQuoteCta: z.boolean().optional(),
  studioEmpty: z.string().max(240).optional(),
  heroDelaySeconds: z.coerce.number().min(1).max(60).optional(),
  colorBackground: z.string().max(9).optional(),
  colorBackground2: z.string().max(9).optional(),
  colorAccent: z.string().max(9).optional(),
  colorText: z.string().max(9).optional(),
})

/**
 * Default homepage copy matching the current landing page.
 */
export function defaultHomeContent(): HomeContent {
  return {
    headerTitle: 'CVL Designs',
    headerLogoSrc: '/images/brand/VL Design Logo - Trimmed.png',
    navBalloons: 'Balloons',
    navBalloonsHref: BALLOONS_ROUTE,
    navBanners: 'Banners',
    navBannersHref: BANNERS_ROUTE,
    navTeamStores: 'Team Stores',
    navTeamStoresHref: TEAM_STORES_ROUTE,
    navAbout: 'About',
    navAboutHref: '/home#about',
    navContact: 'Contact',
    navContactHref: QUOTE_ROUTE,
    navSlot6: '',
    navSlot6Href: '/home',
    navSlot7: '',
    navSlot7Href: '/home',
    heroKicker: 'Custom celebrations & team gear',
    heroTitle: 'Handmade celebrations. Custom team gear.',
    heroSubtitle: 'Specializing in apparel, balloons, and banners',
    heroCta1: 'Plan Your Celebration',
    heroCta1Href: QUOTE_ROUTE,
    heroCta1Style: 1,
    showHeroCta1: true,
    heroCta2: 'Shop Team Stores',
    heroCta2Href: TEAM_STORES_ROUTE,
    heroCta2Style: 2,
    showHeroCta2: true,
    heroCta3: '',
    heroCta3Href: '/home#about',
    heroCta3Style: 1,
    showHeroCta3: false,
    heroImageSrc: '/images/home/reedy-hoco-2026.jpg',
    heroImageAlt:
      'Hand-painted kraft paper banner reading Reedy HOCO 2026 with a football and bow',
    pathsHeading: 'What can we create for you?',
    path1Title: 'Celebrations',
    path1Body:
      'Custom balloons and painted banners for parties, homecoming, and school events.',
    path1Cta: 'Explore celebrations',
    path1Href: CELEBRATIONS_ROUTE,
    showPath1Cta: true,
    path2Title: 'Team stores',
    path2Body: 'Official custom apparel for schools and teams — pick your store and order.',
    path2Cta: 'Find your store',
    path2Href: TEAM_STORES_ROUTE,
    showPath2Cta: true,
    showPathsSection: true,
    offeringsHeading: 'Event offerings',
    offerings: [
      {
        id: 'balloons',
        enabled: true,
        title: 'Balloons',
        body: 'Garlands, clusters, and event installs in your colors.',
        cta: 'View gallery',
        ctaVisible: true,
        ctaHref: BALLOONS_ROUTE,
        imageSrc: '/images/brand/CVLBalloons.png',
        imageAlt: 'Balloon illustration',
      },
      {
        id: 'banners',
        enabled: true,
        title: 'Banners',
        body: 'Kraft-paper banners lettered by hand for schools and families.',
        cta: 'View gallery',
        ctaVisible: true,
        ctaHref: BANNERS_ROUTE,
        imageSrc: '/images/brand/CVLBanners1.png',
        imageAlt: 'Banner illustration',
      },
      {
        id: 'apparel',
        enabled: true,
        title: 'Apparel',
        body: 'Custom team and school apparel from your store.',
        cta: 'Shop team stores',
        ctaVisible: true,
        ctaHref: TEAM_STORES_ROUTE,
        imageSrc: '/images/brand/CVLApparel1.png',
        imageAlt: 'Apparel illustration',
      },
    ],
    showOfferingsSection: true,
    recentHeading: 'Selected work',
    recentCta: 'See the gallery',
    recentCtaHref: CELEBRATIONS_ROUTE,
    showRecentCta: true,
    recentEmpty: 'New photos from recent celebrations will appear here.',
    showRecentSection: true,
    aboutKicker: 'Meet the artist',
    aboutHeading: 'The person behind the pieces',
    aboutLead: 'Hi, I’m Caryn — the hands behind CVL Designs.',
    aboutText:
      'I paint banners, build balloon installations, and help teams look like they belong together. What started as a craft table at the kitchen counter is now a small studio for celebrations and school spirit.\n\nI care about the details that make a space feel personal: the colors a family actually loves, the mascot a senior has worn for four years, the moment when the banner goes up and the room changes. Thank you for being here and for trusting me with yours.',
    aboutSignoff: 'With love, Caryn',
    aboutImageSrc: '/images/brand/balloons-and-banners-default.png',
    aboutImageAlt: 'Portrait of Caryn Vander Laan with recent studio work',
    showAboutSection: true,
    finalHeading: 'Ready to start?',
    finalBody:
      'Request a custom quote for balloons and banners, or shop an existing team store.',
    finalCtaPrimary: 'Request a Quote',
    finalCtaSecondary: 'Shop Team Stores',
    showFinalCtaPrimary: true,
    showFinalCtaSecondary: true,
    showFinalSection: true,
    footerHome: 'Home',
    footerHomeHref: '/home',
    footerContact: 'Contact',
    footerContactHref: QUOTE_ROUTE,
    footerTeamStores: 'Team Stores',
    footerTeamStoresHref: TEAM_STORES_ROUTE,
    footerSlot4: '',
    footerSlot4Href: '/home',
    footerSlot5: '',
    footerSlot5Href: '/home',
    footerText: '',
    studioTitle: 'Balloons and Banners',
    studioTagline: 'Design custom balloon arches, banners, and event decor',
    studioKicker: 'Handmade celebrations',
    studioAllLabel: 'All',
    studioQuoteCta: 'Request a Quote',
    showStudioQuoteCta: true,
    studioEmpty: 'No pieces in this category yet. Caryn’s latest work will show up here.',
    heroDelaySeconds: 5,
    colorBackground: '#F4F1EB',
    colorBackground2: '#FFFFFF',
    colorAccent: '#B47E7E',
    colorText: '#000000',
  }
}

/**
 * Safe in-site path for admin-entered destinations (`/studio`, `/studio?category=balloons`).
 *
 * @param value - Admin-entered path
 * @param fallback - Default when the value is empty or not a relative site path
 */
export function normalizeInternalHref(value: unknown, fallback: string): string {
  const raw = String(value || '').trim()
  if (!raw) return fallback
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('://')) return fallback
  if (raw.length > 200) return fallback
  if (!/^\/[A-Za-z0-9/_?=#.&%-]*$/.test(raw)) return fallback
  return raw
}

/**
 * Default destination for an offering card when none is stored yet.
 *
 * @param id - Offering identifier
 */
export function defaultOfferingHref(id: OfferingId): string {
  if (id === 'balloons') return BALLOONS_ROUTE
  if (id === 'banners') return BANNERS_ROUTE
  return TEAM_STORES_ROUTE
}

/**
 * Public href for an offering card.
 *
 * @param id - Offering identifier
 * @param href - Optional admin-entered destination
 */
export function offeringHref(id: OfferingId, href?: string): string {
  return normalizeInternalHref(href, defaultOfferingHref(id))
}

/**
 * Filled vs outlined hero button chrome.
 *
 * @param value - Stored style
 * @param fallback - Default style
 */
export function normalizeHeroButtonStyle(value: unknown, fallback: HeroButtonStyle = 1): HeroButtonStyle {
  if (value === 2 || value === '2') return 2
  if (value === 1 || value === '1') return 1
  return fallback
}

/**
 * Clamp hero rotation seconds to a usable range.
 *
 * @param value - Admin-entered delay
 * @param fallback - Default seconds
 */
export function normalizeHeroDelay(value: unknown, fallback = 5): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(60, Math.max(1, Math.round(numeric)))
}

/**
 * Normalize a hex color from admin input.
 *
 * @param value - User-entered color
 * @param fallback - Default when the value is not a hex color
 */
export function normalizeHexColor(value: string | undefined, fallback: string): string {
  const raw = (value || '').trim()
  if (!HEX_COLOR.test(raw)) return fallback
  if (raw.length === 4) {
    const r = raw[1]
    const g = raw[2]
    const b = raw[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return raw.toUpperCase()
}

/**
 * Whether a stored image path is allowed on the homepage.
 *
 * @param src - Image URL or site path
 */
export function isAllowedHomeImageSrc(src: string): boolean {
  const value = src.trim()
  if (!value || value.length > 2000) return false
  if (value.startsWith('/images/')) return true
  if (value.startsWith('https://')) return true
  return false
}

/**
 * Merge partial JSON with defaults and keep offerings in a stable id order.
 *
 * @param raw - Unknown parsed JSON
 */
export function normalizeHomeContent(raw: unknown): HomeContent {
  const defaults = defaultHomeContent()
  if (!raw || typeof raw !== 'object') return defaults
  const input = raw as Partial<HomeContent> & {
    heroCtaPrimary?: string
    heroCtaSecondary?: string
    showHeroCtaPrimary?: boolean
    showHeroCtaSecondary?: boolean
  }
  const byId = new Map<OfferingId, HomeOffering>()
  defaults.offerings.forEach((item) => byId.set(item.id, item))
  if (Array.isArray(input.offerings)) {
    input.offerings.forEach((item) => {
      if (!item || !OFFERING_IDS.includes(item.id)) return
      const base = byId.get(item.id) || defaults.offerings[0]
      byId.set(item.id, {
        ...base,
        ...item,
        id: item.id,
        enabled: Boolean(item.enabled),
        ctaVisible: item.ctaVisible !== false,
        ctaHref: offeringHref(item.id, item.ctaHref),
        imageSrc: isAllowedHomeImageSrc(item.imageSrc || '') ? item.imageSrc : base.imageSrc,
      })
    })
  }

  const merged: HomeContent = {
    ...defaults,
    ...input,
    offerings: OFFERING_IDS.map((id) => byId.get(id) as HomeOffering),
    headerLogoSrc: isAllowedHomeImageSrc(input.headerLogoSrc || '')
      ? (input.headerLogoSrc as string)
      : defaults.headerLogoSrc,
    heroImageSrc: isAllowedHomeImageSrc(input.heroImageSrc || '')
      ? (input.heroImageSrc as string)
      : defaults.heroImageSrc,
    colorBackground: normalizeHexColor(input.colorBackground, defaults.colorBackground),
    colorBackground2: normalizeHexColor(input.colorBackground2, defaults.colorBackground2),
    colorAccent: normalizeHexColor(input.colorAccent, defaults.colorAccent),
    colorText: normalizeHexColor(input.colorText, defaults.colorText),
    heroCta1:
      typeof input.heroCta1 === 'string'
        ? input.heroCta1
        : typeof input.heroCtaPrimary === 'string'
          ? input.heroCtaPrimary
          : defaults.heroCta1,
    heroCta1Href: normalizeInternalHref(input.heroCta1Href, defaults.heroCta1Href),
    heroCta1Style: normalizeHeroButtonStyle(input.heroCta1Style, defaults.heroCta1Style),
    showHeroCta1:
      input.showHeroCta1 !== undefined
        ? input.showHeroCta1 !== false
        : input.showHeroCtaPrimary !== undefined
          ? input.showHeroCtaPrimary !== false
          : defaults.showHeroCta1,
    heroCta2:
      typeof input.heroCta2 === 'string'
        ? input.heroCta2
        : typeof input.heroCtaSecondary === 'string'
          ? input.heroCtaSecondary
          : defaults.heroCta2,
    heroCta2Href: normalizeInternalHref(input.heroCta2Href, defaults.heroCta2Href),
    heroCta2Style: normalizeHeroButtonStyle(input.heroCta2Style, defaults.heroCta2Style),
    showHeroCta2:
      input.showHeroCta2 !== undefined
        ? input.showHeroCta2 !== false
        : input.showHeroCtaSecondary !== undefined
          ? input.showHeroCtaSecondary !== false
          : defaults.showHeroCta2,
    heroCta3: typeof input.heroCta3 === 'string' ? input.heroCta3 : defaults.heroCta3,
    heroCta3Href: normalizeInternalHref(
      input.heroCta3Href === '/about' ? '/home#about' : input.heroCta3Href,
      defaults.heroCta3Href
    ),
    heroCta3Style: normalizeHeroButtonStyle(input.heroCta3Style, defaults.heroCta3Style),
    showHeroCta3: input.showHeroCta3 === true,
    path1Href: normalizeInternalHref(input.path1Href, defaults.path1Href),
    path2Href: normalizeInternalHref(input.path2Href, defaults.path2Href),
    navBalloonsHref: normalizeInternalHref(input.navBalloonsHref, defaults.navBalloonsHref),
    navBannersHref: normalizeInternalHref(input.navBannersHref, defaults.navBannersHref),
    navTeamStoresHref: normalizeInternalHref(input.navTeamStoresHref, defaults.navTeamStoresHref),
    navAboutHref: normalizeInternalHref(
      input.navAboutHref === '/about' ? '/home#about' : input.navAboutHref,
      defaults.navAboutHref
    ),
    navContactHref: normalizeInternalHref(input.navContactHref, defaults.navContactHref),
    navSlot6: typeof input.navSlot6 === 'string' ? input.navSlot6 : defaults.navSlot6,
    navSlot6Href: normalizeInternalHref(input.navSlot6Href, defaults.navSlot6Href),
    navSlot7: typeof input.navSlot7 === 'string' ? input.navSlot7 : defaults.navSlot7,
    navSlot7Href: normalizeInternalHref(input.navSlot7Href, defaults.navSlot7Href),
    footerHomeHref: normalizeInternalHref(input.footerHomeHref, defaults.footerHomeHref),
    footerContactHref: normalizeInternalHref(input.footerContactHref, defaults.footerContactHref),
    footerTeamStoresHref: normalizeInternalHref(
      input.footerTeamStoresHref,
      defaults.footerTeamStoresHref
    ),
    footerSlot4: typeof input.footerSlot4 === 'string' ? input.footerSlot4 : defaults.footerSlot4,
    footerSlot4Href: normalizeInternalHref(input.footerSlot4Href, defaults.footerSlot4Href),
    footerSlot5: typeof input.footerSlot5 === 'string' ? input.footerSlot5 : defaults.footerSlot5,
    footerSlot5Href: normalizeInternalHref(input.footerSlot5Href, defaults.footerSlot5Href),
    recentCtaHref: normalizeInternalHref(input.recentCtaHref, defaults.recentCtaHref),
    showPath1Cta: input.showPath1Cta !== false,
    showPath2Cta: input.showPath2Cta !== false,
    showPathsSection: input.showPathsSection !== false,
    showOfferingsSection: input.showOfferingsSection !== false,
    showRecentCta: input.showRecentCta !== false,
    showRecentSection: input.showRecentSection !== false,
    showAboutSection: input.showAboutSection !== false,
    showFinalCtaPrimary: input.showFinalCtaPrimary !== false,
    showFinalCtaSecondary: input.showFinalCtaSecondary !== false,
    showFinalSection: input.showFinalSection !== false,
    showStudioQuoteCta: input.showStudioQuoteCta !== false,
    aboutKicker: typeof input.aboutKicker === 'string' ? input.aboutKicker : defaults.aboutKicker,
    aboutLead: typeof input.aboutLead === 'string' ? input.aboutLead : defaults.aboutLead,
    aboutSignoff: typeof input.aboutSignoff === 'string' ? input.aboutSignoff : defaults.aboutSignoff,
    aboutImageSrc: isAllowedHomeImageSrc(input.aboutImageSrc || '')
      ? (input.aboutImageSrc as string)
      : defaults.aboutImageSrc,
    aboutImageAlt: typeof input.aboutImageAlt === 'string' ? input.aboutImageAlt : defaults.aboutImageAlt,
    studioKicker: typeof input.studioKicker === 'string' ? input.studioKicker : defaults.studioKicker,
    studioAllLabel:
      typeof input.studioAllLabel === 'string' && input.studioAllLabel.trim()
        ? input.studioAllLabel.trim()
        : defaults.studioAllLabel,
    heroDelaySeconds: normalizeHeroDelay(input.heroDelaySeconds, defaults.heroDelaySeconds),
  }
  return merged
}

/**
 * Validate and normalize a save payload from the home admin API.
 *
 * @param raw - Request JSON
 */
export function parseHomeContentPayload(raw: unknown): HomeContent {
  const parsed = homeContentSchema.parse(raw)
  const normalized = normalizeHomeContent(parsed)
  if (!isAllowedHomeImageSrc(normalized.headerLogoSrc)) {
    throw new Error('Header logo path is not allowed')
  }
  if (!isAllowedHomeImageSrc(normalized.heroImageSrc)) {
    throw new Error('Hero image path is not allowed')
  }
  if (!isAllowedHomeImageSrc(normalized.aboutImageSrc)) {
    throw new Error('About image path is not allowed')
  }
  normalized.offerings.forEach((item) => {
    if (!isAllowedHomeImageSrc(item.imageSrc)) {
      throw new Error(`Image path is not allowed for ${item.id}`)
    }
  })
  return normalized
}

/**
 * Build homepage content from Config, falling back to current landing defaults.
 *
 * @param config - Site configuration from Google Sheets
 */
export function mergeHomeContent(config: SiteConfiguration): HomeContent {
  const defaults = defaultHomeContent()
  const getCfgStr = (key: string) =>
    typeof config[key] === 'string' ? (config[key] as string).trim() : ''

  const stored = getCfgStr(HOME_CONTENT_CONFIG_KEY)
  let parsedRaw: Record<string, unknown> | null = null
  let content: HomeContent | null = null
  if (stored) {
    try {
      parsedRaw = JSON.parse(stored) as Record<string, unknown>
      content = normalizeHomeContent(parsedRaw)
    } catch (error) {
      console.error('[homeContent] Failed to parse Home_Content JSON:', error)
    }
  }

  if (!content) {
    const headerLogo = getCfgStr('Header_Logo')
    const subtitle = getCfgStr('Header_Subtitle')
    const businessName = getCfgStr('BusinessName')
    const footer = getCfgStr('Footer')
    content = {
      ...defaults,
      headerTitle: businessName || defaults.headerTitle,
      headerLogoSrc: resolveBrandImageSrc(headerLogo, defaults.headerLogoSrc),
      heroSubtitle: subtitle || defaults.heroSubtitle,
      aboutText: subtitle || defaults.aboutText,
      footerText: footer,
    }
  }

  if (!parsedRaw || !('studioTitle' in parsedRaw)) {
    const studio = getStudioHomeContent(config)
    content = {
      ...content,
      studioTitle: studio.title,
      studioTagline: studio.tagline,
      studioQuoteCta: studio.quoteButtonLabel,
    }
  }

  return content
}
