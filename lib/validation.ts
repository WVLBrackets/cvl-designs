/**
 * Validation schemas for CVL Designs
 * Uses Zod for runtime type checking and validation
 */

import { z } from 'zod'

/**
 * Sanitize string input - removes HTML tags and trims whitespace
 * @param value - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove any remaining angle brackets
    .trim()
}

/**
 * Phone number regex - accepts common US formats
 * Examples: (123) 456-7890, 123-456-7890, 1234567890, +1 123 456 7890
 */
const phoneRegex = /^[\d\s()+-]{10,20}$/

/**
 * Contact information schema
 */
export const contactInfoSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .max(254, 'Email is too long')
    .email('Invalid email format')
    .transform((val: string) => val.toLowerCase().trim()),
  
  parentFirstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .transform(sanitizeString),
  
  parentLastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .transform(sanitizeString),
  
  phoneNumber: z
    .string()
    .min(10, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .regex(phoneRegex, 'Invalid phone number format')
    .transform((val: string) => val.trim()),
})

/**
 * Selected design option schema
 */
export const selectedDesignOptionSchema = z.object({
  optionNumber: z.number().int().min(1).max(99),
  title: z.string().max(100).transform(sanitizeString),
  price: z.number().min(0).max(1000),
})

/**
 * Selected customization option schema
 */
export const selectedCustomizationOptionSchema = z.object({
  optionNumber: z.number().int().min(1).max(99),
  title: z.string().max(100).transform(sanitizeString),
  price: z.number().min(0).max(1000),
  customName: z
    .string()
    .max(30, 'Custom name is too long')
    .transform(sanitizeString)
    .optional(),
  customNumber: z
    .string()
    .max(4, 'Custom number is too long')
    .regex(/^[0-9]*$/, 'Custom number must contain only digits')
    .optional(),
})

/**
 * Order item schema
 */
export const orderItemSchema = z.object({
  productId: z
    .string()
    .min(1, 'Product ID is required')
    .max(100)
    .transform(sanitizeString),
  
  productName: z
    .string()
    .min(1, 'Product name is required')
    .max(200)
    .transform(sanitizeString),
  
  size: z
    .string()
    .min(1, 'Size is required')
    .max(10)
    .transform(sanitizeString),
  
  sizeUpcharge: z
    .number()
    .min(0, 'Size upcharge cannot be negative')
    .max(100, 'Size upcharge is too high')
    .default(0),
  
  itemPrice: z
    .number()
    .min(0, 'Item price cannot be negative')
    .max(10000, 'Item price is too high'),
  
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100'),
  
  designOptions: z.array(selectedDesignOptionSchema).max(10),
  designOptionsTotal: z.number().min(0).max(10000),
  
  customizationOptions: z.array(selectedCustomizationOptionSchema).max(10),
  customizationOptionsTotal: z.number().min(0).max(10000),
  
  totalPrice: z
    .number()
    .min(0, 'Total price cannot be negative')
    .max(50000, 'Total price is too high'),
})

/**
 * Complete order submission schema
 */
export const orderSubmissionSchema = z.object({
  contactInfo: contactInfoSchema,
  
  items: z
    .array(orderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(50, 'Order cannot contain more than 50 items'),
  
  totalAmount: z
    .number()
    .min(0, 'Total amount cannot be negative')
    .max(100000, 'Total amount is too high'),
  
  storeSlug: z
    .string()
    .max(50)
    .transform(sanitizeString)
    .optional(),
})

/**
 * Type inference from schemas
 */
export type ValidatedContactInfo = z.infer<typeof contactInfoSchema>
export type ValidatedOrderItem = z.infer<typeof orderItemSchema>
export type ValidatedOrderSubmission = z.infer<typeof orderSubmissionSchema>

/**
 * Validate order submission data
 * @param data - Raw order data from request
 * @returns Validation result with either validated data or error details
 */
export function validateOrderSubmission(data: unknown): {
  success: boolean
  data?: ValidatedOrderSubmission
  errors?: string[]
} {
  try {
    const validated = orderSubmissionSchema.parse(data)
    return { success: true, data: validated }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err: z.ZodIssue) => {
        const path = err.path.join('.')
        return `${path}: ${err.message}`
      })
      return { success: false, errors }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}

/**
 * Size with upcharge info for price verification
 */
interface SizeInfo {
  size: string
  upcharge: number
}

/**
 * Verify that submitted prices match the product catalog
 * @param items - Order items to verify
 * @param products - Product catalog from Google Sheets (with size pricing)
 * @param designOptions - Design options from reference data
 * @param customizationOptions - Customization options from reference data
 * @returns Object with success status and any price discrepancies found
 */
export function verifyPrices(
  items: ValidatedOrderItem[],
  products: Array<{ id: string; price: number; name: string; availableSizes?: SizeInfo[] }>,
  designOptions: Array<{ number: number; price: number }>,
  customizationOptions: Array<{ number: number; price: number }>
): { valid: boolean; discrepancies: string[] } {
  const discrepancies: string[] = []
  
  for (const item of items) {
    // Find the product
    const product = products.find(p => p.id === item.productId)
    
    if (!product) {
      discrepancies.push(`Product not found: ${item.productId}`)
      continue
    }
    
    // Find the size and its upcharge
    const sizeInfo = product.availableSizes?.find(s => s.size === item.size)
    const expectedSizeUpcharge = sizeInfo?.upcharge || 0
    const submittedSizeUpcharge = item.sizeUpcharge || 0
    
    // Verify size upcharge
    if (Math.abs(submittedSizeUpcharge - expectedSizeUpcharge) > 0.01) {
      discrepancies.push(
        `Size upcharge mismatch for ${product.name} (${item.size}): submitted $${submittedSizeUpcharge}, actual $${expectedSizeUpcharge}`
      )
    }
    
    // Verify item price (base price + size upcharge)
    const expectedItemPrice = product.price + expectedSizeUpcharge
    if (Math.abs(item.itemPrice - expectedItemPrice) > 0.01) {
      discrepancies.push(
        `Item price mismatch for ${product.name}: submitted $${item.itemPrice}, expected $${expectedItemPrice} (base $${product.price} + size $${expectedSizeUpcharge})`
      )
    }
    
    // Verify design option prices
    let expectedDesignTotal = 0
    for (const opt of item.designOptions) {
      const designOpt = designOptions.find(d => d.number === opt.optionNumber)
      if (designOpt) {
        expectedDesignTotal += designOpt.price
        if (Math.abs(opt.price - designOpt.price) > 0.01) {
          discrepancies.push(
            `Design option price mismatch: option ${opt.optionNumber} submitted $${opt.price}, actual $${designOpt.price}`
          )
        }
      }
    }
    
    // Verify customization option prices
    let expectedCustomTotal = 0
    for (const opt of item.customizationOptions) {
      const customOpt = customizationOptions.find(c => c.number === opt.optionNumber)
      if (customOpt) {
        expectedCustomTotal += customOpt.price
        if (Math.abs(opt.price - customOpt.price) > 0.01) {
          discrepancies.push(
            `Customization option price mismatch: option ${opt.optionNumber} submitted $${opt.price}, actual $${customOpt.price}`
          )
        }
      }
    }
    
    // Verify item total (item price already includes size upcharge)
    const expectedTotal = expectedItemPrice + expectedDesignTotal + expectedCustomTotal
    if (Math.abs(item.totalPrice - expectedTotal) > 0.01) {
      discrepancies.push(
        `Item total mismatch for ${product.name}: submitted $${item.totalPrice}, expected $${expectedTotal}`
      )
    }
  }
  
  return {
    valid: discrepancies.length === 0,
    discrepancies,
  }
}
