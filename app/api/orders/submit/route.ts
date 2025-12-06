/**
 * API Route for submitting orders
 * Handles: Input validation, rate limiting, price verification,
 *          Google Sheets logging, PDF generation, customer email, admin notification
 * 
 * Security measures:
 * - Zod schema validation for all input data
 * - Rate limiting (3 orders per IP per minute)
 * - Price verification against product catalog
 * - Input sanitization (HTML stripping, length limits)
 */

import { NextRequest, NextResponse } from 'next/server'
import { submitOrder, fetchConfiguration, fetchMergedConfigForStore, fetchProducts, fetchDesignOptions, fetchCustomizationOptions } from '@/lib/googleSheets'
import { getEnvironment } from '@/lib/config'
import { generateOrderNumber, getShortOrderNumber } from '@/lib/orderNumber'
import { generateInvoicePDFBuffer } from '@/lib/invoiceGenerator'
import { sendEmail } from '@/lib/email'
import { generateCustomerEmail, generateAdminEmail, generateTechSupportEmail } from '@/lib/emailTemplates'
import { logOrderError, logEmailError } from '@/lib/errorLogger'
import { validateOrderSubmission, verifyPrices, ValidatedOrderSubmission } from '@/lib/validation'
import { checkRateLimit, getClientIP, ORDER_RATE_LIMIT, getRateLimitHeaders } from '@/lib/rateLimit'
import type { Order } from '@/lib/types'

export async function POST(request: NextRequest) {
  const startTime = new Date()
  let orderData: any = null
  let clientIP = 'unknown'
  
  try {
    // ========================================
    // STEP 1: Rate Limiting
    // ========================================
    clientIP = getClientIP(request)
    console.log(`[Order API] Request from IP: ${clientIP}`)
    
    const rateLimitResult = checkRateLimit(clientIP, ORDER_RATE_LIMIT)
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult, ORDER_RATE_LIMIT)
    
    if (!rateLimitResult.allowed) {
      console.warn(`[Order API] Rate limit exceeded for IP: ${clientIP} (${rateLimitResult.current} requests)`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many orders submitted. Please wait a minute before trying again.',
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        },
        { 
          status: 429,
          headers: {
            ...rateLimitHeaders,
            'Retry-After': Math.ceil(rateLimitResult.resetIn / 1000).toString(),
          },
        }
      )
    }
    
    // ========================================
    // STEP 2: Parse and Validate Input
    // ========================================
    const body = await request.json()
    orderData = body
    
    console.log('[Order API] Validating order submission...')
    const validationResult = validateOrderSubmission(body)
    
    if (!validationResult.success || !validationResult.data) {
      console.warn('[Order API] Validation failed:', validationResult.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid order data',
          details: validationResult.errors,
        },
        { status: 400, headers: rateLimitHeaders }
      )
    }
    
    const validatedData = validationResult.data
    console.log('[Order API] ✓ Validation passed')
    
    // ========================================
    // STEP 3: Verify Prices Against Catalog
    // ========================================
    console.log('[Order API] Verifying prices against product catalog...')
    
    const [products, designOptions, customizationOptions] = await Promise.all([
      fetchProducts(validatedData.storeSlug),
      fetchDesignOptions(),
      fetchCustomizationOptions(),
    ])
    
    const priceVerification = verifyPrices(
      validatedData.items,
      products.map(p => ({ id: p.id, price: p.price, name: p.name })),
      designOptions.map(d => ({ number: d.number, price: d.price })),
      customizationOptions.map(c => ({ number: c.number, price: c.price }))
    )
    
    if (!priceVerification.valid) {
      console.warn('[Order API] Price verification failed:', priceVerification.discrepancies)
      
      // Log potential tampering attempt
      logOrderError(
        'PRICE_TAMPERING',
        'Price Verification',
        new Error(`Price discrepancies detected: ${priceVerification.discrepancies.join('; ')}`),
        { ...orderData, clientIP }
      )
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Price verification failed. Please refresh the page and try again.',
          // Don't expose detailed price discrepancies to potential attackers
        },
        { status: 400, headers: rateLimitHeaders }
      )
    }
    
    console.log('[Order API] ✓ Price verification passed')
    
    // ========================================
    // STEP 4: Recalculate Order Total (Server-Side)
    // ========================================
    // Always use server-calculated totals, never trust client-submitted totals
    const serverCalculatedTotal = validatedData.items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      if (!product) return sum
      
      const designTotal = item.designOptions.reduce((dSum, opt) => {
        const dOpt = designOptions.find(d => d.number === opt.optionNumber)
        return dSum + (dOpt?.price || 0)
      }, 0)
      
      const customTotal = item.customizationOptions.reduce((cSum, opt) => {
        const cOpt = customizationOptions.find(c => c.number === opt.optionNumber)
        return cSum + (cOpt?.price || 0)
      }, 0)
      
      const itemTotal = (product.price + designTotal + customTotal) * item.quantity
      return sum + itemTotal
    }, 0)
    
    console.log(`[Order API] Server-calculated total: $${serverCalculatedTotal.toFixed(2)} (submitted: $${validatedData.totalAmount.toFixed(2)})`)
    
    // ========================================
    // STEP 5: Generate Order Number
    // ========================================
    const fullOrderNumber = await generateOrderNumber(validatedData.storeSlug || 'default')
    const shortOrderNumber = getShortOrderNumber(fullOrderNumber)
    
    console.log(`[Order API] Generated order number: ${fullOrderNumber}`)
    
    // ========================================
    // STEP 6: Create Order Object
    // ========================================
    const order: Order & { orderNumber: string; shortOrderNumber: string } = {
      contactInfo: validatedData.contactInfo,
      items: validatedData.items,
      totalAmount: serverCalculatedTotal, // Use server-calculated total
      orderDate: new Date().toISOString(),
      environment: getEnvironment(),
      storeSlug: validatedData.storeSlug || '',
      orderNumber: fullOrderNumber,
      shortOrderNumber,
    }
    
    // ========================================
    // STEP 7: Fetch Configuration
    // ========================================
    const config = await fetchMergedConfigForStore(validatedData.storeSlug || '')
    
    // ========================================
    // STEP 8: Process Order
    // ========================================
    console.log(`[${fullOrderNumber}] Starting order processing...`)
    
    try {
      await processOrderAsync(order, config)
      console.log(`[${fullOrderNumber}] ✅ Order processing complete`)
    } catch (error) {
      console.error(`[${fullOrderNumber}] ❌ Order processing failed:`, error)
      
      // Log error to file
      logOrderError(fullOrderNumber, 'Order Processing', error, { ...order, clientIP })
      
      // Send tech support email about the failure
      sendTechSupportEmail(error, order, config).catch(err => {
        console.error('Failed to send tech support email:', err)
      })
    }
    
    // Return success with rate limit headers
    return NextResponse.json(
      {
        success: true,
        orderNumber: shortOrderNumber,
      },
      { headers: rateLimitHeaders }
    )
    
  } catch (error) {
    console.error('Error in order submission:', error)
    
    // Log error to file
    logOrderError('UNKNOWN', 'Order Submission', error, { ...orderData, clientIP })
    
    // Send tech support email
    if (orderData) {
      const config = await fetchConfiguration().catch(() => ({}))
      await sendTechSupportEmail(error, orderData, config).catch(err => {
        console.error('Failed to send tech support email:', err)
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Feature flags - Set to true/false to enable/disable each step
const FEATURE_FLAGS = {
  ENABLE_GOOGLE_SHEETS: true,
  ENABLE_PDF_GENERATION: true,
  ENABLE_CUSTOMER_EMAIL: true,
  ENABLE_ADMIN_EMAIL: true,
}

/**
 * Process order asynchronously (Google Sheets, PDF, emails)
 */
async function processOrderAsync(
  order: Order & { orderNumber: string; shortOrderNumber: string },
  config: any
) {
  const stepTimings: any = {}
  const startTime = Date.now()
  
  try {
    // Step 1: Submit to Google Sheets FIRST (most critical - capture the order!)
    if (FEATURE_FLAGS.ENABLE_GOOGLE_SHEETS) {
      console.log(`[${order.orderNumber}] Step 1: Submitting to Google Sheets (PRIORITY)...`)
      const step1Start = Date.now()
      ;(order as any).invoiceFilename = 'Pending...'
      const sheetResult = await submitOrder(order)
      stepTimings.googleSheets = Date.now() - step1Start
      if (!sheetResult.success) {
        throw new Error(`Google Sheets submission failed: ${sheetResult.error}`)
      }
      console.log(`[${order.orderNumber}] ✓ Order saved to Google Sheets in ${stepTimings.googleSheets}ms`)
    } else {
      console.log(`[${order.orderNumber}] ⏭️  Step 1: Google Sheets SKIPPED`)
    }
    
    // Step 2: Generate Invoice PDF as Buffer
    let pdfBuffer: Buffer | null = null
    let invoiceFilename = 'invoice.pdf'
    
    if (FEATURE_FLAGS.ENABLE_PDF_GENERATION) {
      console.log(`[${order.orderNumber}] Step 2: Generating invoice PDF...`)
      const step2Start = Date.now()
      pdfBuffer = await generateInvoicePDFBuffer(order, 'professional', config)
      stepTimings.pdfGeneration = Date.now() - step2Start
      
      const customerLastName = order.contactInfo.parentLastName.replace(/[^a-zA-Z0-9]/g, '')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0]
      invoiceFilename = `Invoice_${order.orderNumber}_${customerLastName}_${timestamp}_${order.environment}.pdf`
      console.log(`[${order.orderNumber}] ✓ PDF generated in ${stepTimings.pdfGeneration}ms (${pdfBuffer.length} bytes)`)
    } else {
      console.log(`[${order.orderNumber}] ⏭️  Step 2: PDF generation SKIPPED`)
    }
    
    // Step 3: Send customer confirmation email with PDF attachment
    if (FEATURE_FLAGS.ENABLE_CUSTOMER_EMAIL) {
      console.log(`[${order.orderNumber}] Step 3: Sending customer email to ${order.contactInfo.email}...`)
      const step3Start = Date.now()
      const customerEmailHtml = generateCustomerEmail({
        customerName: `${order.contactInfo.parentFirstName} ${order.contactInfo.parentLastName}`,
        shortOrderNumber: order.shortOrderNumber,
        orderDate: new Date(order.orderDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        items: order.items,
        total: order.totalAmount,
        paymentInstructions: {
          venmo: config.Venmo_Handle,
          cashapp: config.CashApp_Handle,
          zelle: config.Zelle_Email,
        },
        businessName: config['Business Name'] || config.Business_Name || config.BusinessName || 'CVL Designs',
      })
      
      await sendEmail({
        to: order.contactInfo.email,
        subject: `Order Confirmation #${order.shortOrderNumber} - ${config['Business Name'] || config.Business_Name || 'CVL Designs'}`,
        html: customerEmailHtml,
        attachments: pdfBuffer ? [{
          filename: `Invoice_${order.shortOrderNumber}.pdf`,
          content: pdfBuffer,
        }] : [],
      })
      stepTimings.customerEmail = Date.now() - step3Start
      console.log(`[${order.orderNumber}] ✓ Customer email sent in ${stepTimings.customerEmail}ms`)
    } else {
      console.log(`[${order.orderNumber}] ⏭️  Step 3: Customer email SKIPPED`)
    }
    
    // Step 4: Send admin notification email with PDF attachment
    if (FEATURE_FLAGS.ENABLE_ADMIN_EMAIL) {
      console.log(`[${order.orderNumber}] Step 4: Sending admin notification...`)
      const step4Start = Date.now()
      const adminEmail = config.ContactMeEmail || config.Contact_Me_Email
      if (adminEmail) {
        const adminEmailHtml = generateAdminEmail({
          customerName: `${order.contactInfo.parentFirstName} ${order.contactInfo.parentLastName}`,
          customerEmail: order.contactInfo.email,
          customerPhone: order.contactInfo.phoneNumber,
          fullOrderNumber: order.orderNumber,
          shortOrderNumber: order.shortOrderNumber,
          orderDate: new Date(order.orderDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          items: order.items,
          total: order.totalAmount,
          storeName: order.storeSlug?.toUpperCase() || 'STORE',
          businessName: config['Business Name'] || config.Business_Name || config.BusinessName || 'CVL Designs',
          primaryColor: config.Store_Primary_Color,
        })
        
        await sendEmail({
          to: adminEmail,
          subject: `🔔 New Order #${order.shortOrderNumber} - ${order.storeSlug?.toUpperCase() || 'STORE'}`,
          html: adminEmailHtml,
          attachments: pdfBuffer ? [{
            filename: `Invoice_${order.shortOrderNumber}.pdf`,
            content: pdfBuffer,
          }] : [],
        })
        stepTimings.adminEmail = Date.now() - step4Start
        console.log(`[${order.orderNumber}] ✓ Admin notification sent in ${stepTimings.adminEmail}ms`)
      } else {
        console.log(`[${order.orderNumber}] ⚠️ No admin email configured, skipping admin notification`)
      }
    } else {
      console.log(`[${order.orderNumber}] ⏭️  Step 4: Admin email SKIPPED`)
    }
    
    stepTimings.total = Date.now() - startTime
    console.log(`[${order.orderNumber}] ✅ Order processing complete in ${stepTimings.total}ms`)
    console.log(`[${order.orderNumber}] Timings breakdown:`, stepTimings)
    
  } catch (error) {
    console.error(`[${order.orderNumber}] ❌ Order processing failed:`, error)
    logOrderError(order.orderNumber, 'Order Processing', error, order)
    throw error
  }
}

/**
 * Send tech support email about errors
 */
async function sendTechSupportEmail(error: any, orderData: any, config: any) {
  try {
    const techSupportEmail = config.Tech_Support_Email
    if (!techSupportEmail) {
      console.error('Tech_Support_Email not configured, cannot send error notification')
      return
    }
    
    const emailHtml = generateTechSupportEmail({
      error: error.message || String(error),
      stackTrace: error.stack,
      orderData,
      timestamp: new Date().toISOString(),
    })
    
    await sendEmail({
      to: techSupportEmail,
      subject: '⚠️ Order Submission Error - CVL Designs',
      html: emailHtml,
    })
    
    console.log('✓ Tech support notification sent')
  } catch (emailError) {
    console.error('Failed to send tech support email:', emailError)
  }
}
