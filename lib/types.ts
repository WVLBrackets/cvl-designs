/**
 * Type definitions for CVL Designs
 */

/**
 * Product status determines visibility in different environments
 */
export type ProductStatus = 'PREVIEW' | 'PROD'

/**
 * Selection mode for options
 */
export type SelectionMode = 'Single' | 'Multi' | 'None'

/**
 * Category from Reference Data
 */
export interface Category {
  id: string
  name: string
  displayOrder?: number
}

/**
 * Design Option from Reference Data
 */
export interface DesignOption {
  number: number
  title: string
  short: string
  price: number
  image?: string
}

/**
 * Customization Option from Reference Data
 */
export interface CustomizationOption {
  number: number
  title: string
  short: string
  price: number
  image?: string
  requiresInput?: 'name' | 'number' | 'both' | 'none'
}

/**
 * Product from Google Sheets
 */
export interface Product {
  id: string
  name: string
  displayName: string
  category: string
  price: number
  status: ProductStatus
  image?: string
  availableSizes: SizeWithPrice[] // Updated: now includes upcharge info
  sizingChart?: string
  
  // Design Options
  availableDesignOptions: number[] // Array of design option numbers
  designRequired: boolean
  designSelectionMode: SelectionMode
  
  // Customization Options
  availableCustomizationOptions: number[] // Array of customization option numbers
  customizationRequired: boolean
  customizationSelectionMode: SelectionMode
}

/**
 * Size with optional upcharge pricing
 * Used when sizes like 2XL, 3XL have additional cost
 */
export interface SizeWithPrice {
  size: string
  upcharge: number // 0 = no extra cost, positive number = additional cost
}

/**
 * Size option (legacy - kept for compatibility)
 */
export interface SizeOption {
  value: string
  label: string
  availableFor: ('youth' | 'adult')[]
}

/**
 * Customer contact information
 */
export interface ContactInfo {
  email: string
  parentFirstName: string
  parentLastName: string
  phoneNumber: string
}

/**
 * Selected design option with details
 */
export interface SelectedDesignOption {
  optionNumber: number
  title: string
  price: number
}

/**
 * Selected customization option with details and inputs
 */
export interface SelectedCustomizationOption {
  optionNumber: number
  title: string
  price: number
  customName?: string
  customNumber?: string
}

/**
 * Single order item
 */
export interface OrderItem {
  productId: string
  productName: string
  size: string
  sizeUpcharge: number // Size-based upcharge (e.g., +$2 for 2XL)
  itemPrice: number // Base price + size upcharge (combined)
  quantity: number
  
  // Design options selected
  designOptions: SelectedDesignOption[]
  designOptionsTotal: number
  
  // Customization options selected
  customizationOptions: SelectedCustomizationOption[]
  customizationOptionsTotal: number
  
  // Item total (per unit)
  totalPrice: number
}

/**
 * Complete order submission
 */
export interface Order {
  contactInfo: ContactInfo
  items: OrderItem[]
  totalAmount: number
  orderDate: string
  environment: 'development' | 'production'
  storeSlug?: string
}

/**
 * Configuration from Google Sheets
 */
export interface SiteConfiguration {
  [key: string]: string | number | boolean
}

