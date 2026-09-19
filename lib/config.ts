/**
 * Central configuration file for CVL Designs
 * Manages environment-specific settings and Google Sheets access
 */

/**
 * Where the app is running. Uses VERCEL_ENV only — NODE_ENV is "production" in Vercel builds.
 */
export type RuntimeSurface = 'production' | 'preview' | 'local'

/**
 * Corner badge shown on non-production surfaces. Size and placement stay the same.
 */
export interface EnvBadge {
  label: string
  /** `bg-red-600` (Preview) or `bg-orange-600` (LOCAL). Applied in layout.tsx so Tailwind sees the classes. */
  backgroundClass: 'bg-red-600' | 'bg-orange-600'
}

/**
 * Identify production, Vercel Preview (staging), or local `next dev`.
 *
 * @returns Runtime surface used for the corner badge and sheet routing
 */
export function getRuntimeSurface(): RuntimeSurface {
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv === 'production') return 'production'
  if (vercelEnv === 'preview') return 'preview'
  return 'local'
}

/**
 * Corner badge for the current surface. Production has no badge.
 *
 * @returns Badge label and Tailwind background class, or null on production
 */
export function getEnvBadge(): EnvBadge | null {
  const surface = getRuntimeSurface()
  if (surface === 'production') return null
  if (surface === 'preview') {
    return { label: 'Preview', backgroundClass: 'bg-red-600' }
  }
  return { label: 'LOCAL', backgroundClass: 'bg-orange-600' }
}

/**
 * Whether this process should read Production sheet columns and rows.
 */
export function isProductionSurface(): boolean {
  return getRuntimeSurface() === 'production'
}

/**
 * Environment label written onto new Gallery / Gallery Categories rows.
 *
 * @returns `Production` on Vercel production, otherwise `Preview` (staging and local)
 */
export function getSheetEnvironmentLabel(): 'Production' | 'Preview' {
  return isProductionSurface() ? 'Production' : 'Preview'
}

/**
 * Whether a sheet Environment cell is visible on this runtime.
 * Empty or `All` → both surfaces. `Production` → prod only. `Preview` → staging and local.
 *
 * @param environmentCell - Value from the Environment column
 */
export function isVisibleOnCurrentSurface(environmentCell: unknown): boolean {
  const raw = String(environmentCell ?? '').trim().toLowerCase()
  if (!raw || raw === 'all') return true
  if (isProductionSurface()) {
    return raw === 'production' || raw === 'prod'
  }
  return raw === 'preview'
}

/**
 * Get the current environment (development or production)
 */
export function getEnvironment(): 'development' | 'production' {
  return process.env.NEXT_PUBLIC_SITE_ENV === 'production' ? 'production' : 'development'
}

/**
 * Check if the current environment is production
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

/**
 * Check if the current environment is development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}

/**
 * Get the Google Sheets configuration
 */
export function getGoogleSheetsConfig() {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Google Service Account credentials are not configured')
  }

  // Check if privateKey already has actual newlines (dotenv might have converted them)
  // If it doesn't contain actual newlines but contains \n, convert them
  const processedKey = privateKey.includes('\n') && !privateKey.includes('\\n')
    ? privateKey  // Already has actual newlines, use as-is
    : privateKey.replace(/\\n/g, '\n')  // Has escaped \n, convert to actual newlines

  return {
    serviceAccountEmail,
    privateKey: processedKey,
  }
}

/**
 * Get the Google Sheet IDs based on sheet type
 */
export function getSheetId(sheetType: 'config' | 'products' | 'orders'): string {
  const env = getEnvironment()
  
  switch (sheetType) {
    case 'config': {
      const vercelEnv = process.env.VERCEL_ENV
      let configId: string | undefined

      if (vercelEnv === 'production') {
        configId = process.env.GOOGLE_SHEET_CONFIG_ID
      } else {
        configId =
          process.env.GOOGLE_SHEET_CONFIG_STAGING_ID ||
          process.env.GOOGLE_SHEET_CONFIG_ID
      }

      if (!configId) {
        throw new Error(
          `Config sheet ID not configured for environment: ${vercelEnv || 'local'}`
        )
      }
      return configId
    }
      
    case 'products': {
      const vercelEnv = process.env.VERCEL_ENV
      let productsId: string | undefined

      if (vercelEnv === 'production') {
        productsId = process.env.GOOGLE_SHEET_PRODUCTS_ID
      } else {
        productsId =
          process.env.GOOGLE_SHEET_PRODUCTS_STAGING_ID ||
          process.env.GOOGLE_SHEET_PRODUCTS_ID
      }

      if (!productsId) {
        throw new Error(
          `Products sheet ID not configured for environment: ${vercelEnv || 'local'}`
        )
      }
      return productsId
    }
      
    case 'orders':
      // Determine which orders sheet to use based on Vercel environment
      const vercelEnv = process.env.VERCEL_ENV
      let ordersId: string | undefined
      
      if (vercelEnv === 'production') {
        // Production deployment (main branch)
        ordersId = process.env.GOOGLE_SHEET_ORDERS_PROD_ID
      } else if (vercelEnv === 'preview') {
        // Preview deployment (staging branch and other preview deployments)
        ordersId = process.env.GOOGLE_SHEET_ORDERS_PREVIEW_ID
      } else {
        // Development (local dev server and other environments)
        ordersId = process.env.GOOGLE_SHEET_ORDERS_DEV_ID
      }
      
      if (!ordersId) {
        throw new Error(`Orders sheet ID not configured for environment: ${vercelEnv || 'local'}`)
      }
      return ordersId
      
    default:
      throw new Error(`Unknown sheet type: ${sheetType}`)
  }
}

/**
 * Site configuration (can be extended with Google Sheets data)
 */
export const siteConfig = {
  name: 'CVL Designs',
  description: 'Custom Apparel & Clothing',
  environment: getEnvironment(),
}

