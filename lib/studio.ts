/**
 * Balloons and Banners Design Studio — home-page entry and routing helpers.
 *
 * Admin Config sheet keys (Attribute | Production Value | Preview Value):
 * - Show_Studio — `YES` shows the home-page Design Studio banner; any other value hides it
 * - Design_Studio_Image_Left — filename in /images/brand/ for the home banner left image
 * - Design_Studio_Image_Right — filename in /images/brand/ for the home banner right image
 * - Design_Studio_Title — headline on the home-page studio banner
 * - Design_Studio_Subtitle — supporting line under the title
 * - Design_Studio_Button — label on the Open Studio button
 * - Design_Studio_RAQ_Button — label on the gallery Request a Quote button
 * - Design_Studio_Header_Text — company name in the studio gallery header
 */

import type { SiteConfiguration } from './types'

/** Route for the public studio gallery. */
export const STUDIO_ROUTE = '/studio'

/** Route for the studio quote request form. */
export const STUDIO_QUOTE_ROUTE = '/studio/quote'

/** Fallback label when Design_Studio_Title is missing or blank. */
export const DEFAULT_STUDIO_TITLE = 'Balloons and Banners'

/** Fallback button label when Design_Studio_Button is missing or blank. */
export const DEFAULT_STUDIO_BUTTON = 'Open Studio'

/** Fallback button label when Design_Studio_RAQ_Button is missing or blank. */
export const DEFAULT_STUDIO_RAQ_BUTTON = 'Request a Quote'

/** Bundled fallback art when studio banner images are missing or fail to load. */
export const DEFAULT_STUDIO_IMAGE_SRC = '/images/brand/balloons-and-banners-default.png'

/** Config sheet attribute for the home-page studio headline. */
export const STUDIO_TITLE_CONFIG_KEY = 'Design_Studio_Title'

/** Older title key; used only if Design_Studio_Title is empty. */
export const STUDIO_TITLE_LEGACY_CONFIG_KEY = 'Studio_Home_Title'

/** @deprecated Prefer Design_Studio_Image_Left. Kept as a fallback for the left image. */
export const STUDIO_IMAGE_CONFIG_KEY = 'Studio_Home_Image'

/** Config sheet attribute for the studio banner image on the left. */
export const STUDIO_IMAGE_LEFT_CONFIG_KEY = 'Design_Studio_Image_Left'

/** Config sheet attribute for the studio banner image on the right. */
export const STUDIO_IMAGE_RIGHT_CONFIG_KEY = 'Design_Studio_Image_Right'

/** Fallback supporting line for banner and hero layouts. */
export const DEFAULT_STUDIO_TAGLINE =
  'Design custom balloon arches, banners, and event decor'

/** Config sheet attribute that shows or hides the home-page studio banner. */
export const SHOW_STUDIO_CONFIG_KEY = 'Show_Studio'

/** Config sheet attribute for the studio banner subtitle. */
export const STUDIO_SUBTITLE_CONFIG_KEY = 'Design_Studio_Subtitle'

/** Config sheet attribute for the studio banner button label. */
export const STUDIO_BUTTON_CONFIG_KEY = 'Design_Studio_Button'

/** Config sheet attribute for the gallery Request a Quote button. */
export const STUDIO_RAQ_BUTTON_CONFIG_KEY = 'Design_Studio_RAQ_Button'

/** Config sheet attribute for the studio header company name. */
export const STUDIO_HEADER_TEXT_CONFIG_KEY = 'Design_Studio_Header_Text'

/** Older tagline key; used only if Design_Studio_Subtitle is empty. */
export const STUDIO_TAGLINE_CONFIG_KEY = 'Studio_Home_Tagline'

/**
 * Read a trimmed string from site configuration.
 *
 * @param config - Key/value map from the Config sheet
 * @param key - Attribute name
 * @returns Trimmed string, or empty when the key is missing or not a string
 */
function getConfigString(config: SiteConfiguration, key: string): string {
  const value = config[key]
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Whether the home-page Design Studio banner should render.
 * Only the exact flag `YES` (any casing) shows it; missing or any other value hides it.
 *
 * @param config - Site configuration from the Config sheet
 */
export function isStudioVisibleOnHome(config: SiteConfiguration): boolean {
  return getConfigString(config, SHOW_STUDIO_CONFIG_KEY).toUpperCase() === 'YES'
}

/**
 * Resolve a brand image to a public URL.
 * Filenames are served from /images/brand/. Absolute paths and http(s) URLs are kept as-is.
 *
 * @param filenameOrPath - Configured filename, site path, or remote URL
 * @param fallbackSrc - Path to use when the value is empty
 * @returns Image src suitable for next/image
 */
export function resolveBrandImageSrc(
  filenameOrPath: string | undefined,
  fallbackSrc: string
): string {
  const value = (filenameOrPath || '').trim()
  if (!value) return fallbackSrc
  if (value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }
  return `/images/brand/${value}`
}

export interface StudioHomeContent {
  title: string
  tagline: string
  buttonLabel: string
  quoteButtonLabel: string
  headerText: string
  imageSrc: string
  leftImageSrc: string
  rightImageSrc: string
  fallbackImageSrc: string
}

/**
 * Build the home-page studio tile content from Config, with defaults when keys are absent.
 *
 * @param config - Site configuration from Google Sheets
 * @returns Title and image sources for the studio entry tile
 */
export function getStudioHomeContent(config: SiteConfiguration): StudioHomeContent {
  const configuredTitle =
    getConfigString(config, STUDIO_TITLE_CONFIG_KEY) ||
    getConfigString(config, STUDIO_TITLE_LEGACY_CONFIG_KEY)
  const configuredTagline =
    getConfigString(config, STUDIO_SUBTITLE_CONFIG_KEY) ||
    getConfigString(config, STUDIO_TAGLINE_CONFIG_KEY)
  const configuredButton = getConfigString(config, STUDIO_BUTTON_CONFIG_KEY)
  const configuredQuoteButton = getConfigString(config, STUDIO_RAQ_BUTTON_CONFIG_KEY)
  const configuredHeaderText =
    getConfigString(config, STUDIO_HEADER_TEXT_CONFIG_KEY) ||
    getConfigString(config, 'BusinessName')
  const leftConfigured =
    getConfigString(config, STUDIO_IMAGE_LEFT_CONFIG_KEY) ||
    getConfigString(config, STUDIO_IMAGE_CONFIG_KEY)
  const rightConfigured = getConfigString(config, STUDIO_IMAGE_RIGHT_CONFIG_KEY)
  const leftImageSrc = resolveBrandImageSrc(leftConfigured, DEFAULT_STUDIO_IMAGE_SRC)
  const rightImageSrc = rightConfigured
    ? resolveBrandImageSrc(rightConfigured, DEFAULT_STUDIO_IMAGE_SRC)
    : ''

  return {
    title: configuredTitle || DEFAULT_STUDIO_TITLE,
    tagline: configuredTagline || DEFAULT_STUDIO_TAGLINE,
    buttonLabel: configuredButton || DEFAULT_STUDIO_BUTTON,
    quoteButtonLabel: configuredQuoteButton || DEFAULT_STUDIO_RAQ_BUTTON,
    headerText: configuredHeaderText || 'CVL Designs',
    imageSrc: leftImageSrc,
    leftImageSrc,
    rightImageSrc,
    fallbackImageSrc: DEFAULT_STUDIO_IMAGE_SRC,
  }
}
