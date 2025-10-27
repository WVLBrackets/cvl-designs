/**
 * Central configuration file for CVL Designs
 * Manages environment-specific settings and Google Sheets access
 */

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
    case 'config':
      const configId = process.env.GOOGLE_SHEET_CONFIG_ID
      if (!configId) throw new Error('Config sheet ID not configured')
      return configId
      
    case 'products':
      const productsId = process.env.GOOGLE_SHEET_PRODUCTS_ID
      if (!productsId) throw new Error('Products sheet ID not configured')
      return productsId
      
    case 'orders':
      const ordersId = env === 'production' 
        ? process.env.GOOGLE_SHEET_ORDERS_PROD_ID
        : process.env.GOOGLE_SHEET_ORDERS_DEV_ID
      if (!ordersId) throw new Error(`Orders sheet ID not configured for ${env}`)
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

