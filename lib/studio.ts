/**
 * Balloons and Banners Design Studio — home-page entry and routing helpers.
 *
 * Admin Config sheet keys (Attribute | Value):
 * - Studio_Home_Title — label under the home-page tile
 * - Studio_Home_Image — filename in /images/brand/, or an absolute /path or URL
 * - Studio_Home_Tagline — optional supporting line on banner/hero layouts
 */

import type { SiteConfiguration } from './types'

/** Route for the Balloons and Banners Design Studio. */
export const STUDIO_ROUTE = '/studio'

/** Fallback label when Studio_Home_Title is missing or blank. */
export const DEFAULT_STUDIO_TITLE = 'Balloons and Banners'

/** Bundled fallback art when Studio_Home_Image is missing or fails to load. */
export const DEFAULT_STUDIO_IMAGE_SRC = '/images/brand/balloons-and-banners-default.png'

/** Config sheet attribute for the home-page studio tile label. */
export const STUDIO_TITLE_CONFIG_KEY = 'Studio_Home_Title'

/** Config sheet attribute for the home-page studio tile image. */
export const STUDIO_IMAGE_CONFIG_KEY = 'Studio_Home_Image'

/** Fallback supporting line for banner and hero layouts. */
export const DEFAULT_STUDIO_TAGLINE =
  'Design custom balloon arches, banners, and event decor'

/** Config sheet attribute for the optional studio tagline. */
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
  imageSrc: string
  fallbackImageSrc: string
}

/**
 * Build the home-page studio tile content from Config, with defaults when keys are absent.
 *
 * @param config - Site configuration from Google Sheets
 * @returns Title and image sources for the studio entry tile
 */
export function getStudioHomeContent(config: SiteConfiguration): StudioHomeContent {
  const configuredTitle = getConfigString(config, STUDIO_TITLE_CONFIG_KEY)
  const configuredImage = getConfigString(config, STUDIO_IMAGE_CONFIG_KEY)
  const configuredTagline = getConfigString(config, STUDIO_TAGLINE_CONFIG_KEY)

  return {
    title: configuredTitle || DEFAULT_STUDIO_TITLE,
    tagline: configuredTagline || DEFAULT_STUDIO_TAGLINE,
    imageSrc: resolveBrandImageSrc(configuredImage, DEFAULT_STUDIO_IMAGE_SRC),
    fallbackImageSrc: DEFAULT_STUDIO_IMAGE_SRC,
  }
}
