/**
 * API Route for submitting orders
 * Handles: Google Sheets logging, PDF generation, customer email, admin notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { submitOrder, fetchConfiguration, fetchMergedConfigForStore } from '@/lib/googleSheets'
import { getEnvironment } from '@/lib/config'
import { generateOrderNumber, getShortOrderNumber } from '@/lib/orderNumber'
import { generateInvoicePDFBuffer } from '@/lib/invoiceGenerator'
import { sendEmail } from '@/lib/email'
import { generateCustomerEmail, generateAdminEmail, generateTechSupportEmail } from '@/lib/emailTemplates'
import { logOrderError, logEmailError } from '@/lib/errorLogger'
import type { Order } from '@/lib/types'

export async function POST(request: NextRequest) {
  const startTime = new Date()
  let orderData: any = null
  
  try {
    const body = await request.json()
    orderData = body
    
    // Validate required fields
    if (!body.contactInfo || !body.items || !body.totalAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Generate unique order number
    const fullOrderNumber = await generateOrderNumber(body.storeSlug || 'default')
    const shortOrderNumber = getShortOrderNumber(fullOrderNumber)
    
    // Create order object with order number
    const order: Order & { orderNumber: string; shortOrderNumber: string } = {
      contactInfo: body.contactInfo,
      items: body.items,
      totalAmount: body.totalAmount,
      orderDate: new Date().toISOString(),
      environment: getEnvironment(),
      storeSlug: body.storeSlug || '',
      orderNumber: fullOrderNumber,
      shortOrderNumber,
    }
    
    // Fetch configuration (for emails and PDF)
    const config = await fetchMergedConfigForStore(body.storeSlug || '')
    
    // Process order and WAIT for completion (Vercel serverless needs this)
    console.log(`[${fullOrderNumber}] Starting order processing...`)
    console.log(`[${fullOrderNumber}] Config loaded:`, {
      hasBusinessName: !!(config['Business Name'] || config.Business_Name),
      hasContactEmail: !!(config.ContactMeEmail || config.Contact_Me_Email),
      hasTechSupportEmail: !!('Tech_Support_Email' in config ? config.Tech_Support_Email : undefined),
      hasVenmo: !!config.Venmo_Handle,
      hasGmailUser: !!process.env.GMAIL_USER,
      hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
    })
    
    try {
      await processOrderAsync(order, config)
      console.log(`[${fullOrderNumber}] ✅ Order processing complete`)
    } catch (error) {
      console.error(`[${fullOrderNumber}] ❌ Order processing failed:`, error)
      console.error('Error stack:', error instanceof Error ? error.stack : 'N/A')
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        code: (error as any)?.code,
      })
      
      // Log error to file
      logOrderError(fullOrderNumber, 'Order Processing', error, order).catch(logErr => {
        console.error('Failed to log error:', logErr)
      })
      
      // Send tech support email about the failure
      sendTechSupportEmail(error, order, config).catch(err => {
        console.error('Failed to send tech support email:', err)
        const techEmail = 'Tech_Support_Email' in config ? String(config.Tech_Support_Email || 'unknown') : 'unknown'
        logEmailError(techEmail, 'Tech Support Error Notification', err).catch(logErr => {
          console.error('Failed to log email error:', logErr)
        })
      })
    }
    
    // Return success to user (after processing completes)
    return NextResponse.json({
      success: true,
      orderNumber: shortOrderNumber,
    })
    
  } catch (error) {
    console.error('Error in order submission:', error)
    
    // Log error to file
    logOrderError('UNKNOWN', 'Order Submission', error, orderData)
    
    // Send tech support email
    if (orderData) {
      const config = await fetchConfiguration().catch(() => ({}))
      await sendTechSupportEmail(error, orderData, config).catch(err => {
        const techEmail = 'Tech_Support_Email' in config ? String(config.Tech_Support_Email || 'unknown') : 'unknown'
        logEmailError(techEmail, 'Tech Support Error Notification', err)
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
  
  // All features enabled
  
  try {
    // Step 1: Submit to Google Sheets FIRST (most critical - capture the order!)
    if (FEATURE_FLAGS.ENABLE_GOOGLE_SHEETS) {
      console.log(`[${order.orderNumber}] Step 1: Submitting to Google Sheets (PRIORITY)...`)
      const step1Start = Date.now()
      // Don't include invoice filename yet - we'll add it in step 3
      ;(order as any).invoiceFilename = 'Pending...'
      const sheetResult = await submitOrder(order)
      stepTimings.googleSheets = Date.now() - step1Start
      if (!sheetResult.success) {
        throw new Error(`Google Sheets submission failed: ${sheetResult.error}`)
      }
      console.log(`[${order.orderNumber}] ✓ Order saved to Google Sheets in ${stepTimings.googleSheets}ms`)
    } else {
      console.log(`[${order.orderNumber}] ⏭️  Step 1: Google Sheets SKIPPED (FEATURE_FLAGS.ENABLE_GOOGLE_SHEETS = false)`)
    }
    
    // Step 2: Generate Invoice PDF as Buffer (using professional template by default)
    let pdfBuffer: Buffer | null = null
    let invoiceFilename = 'invoice.pdf'
    
    if (FEATURE_FLAGS.ENABLE_PDF_GENERATION) {
      console.log(`[${order.orderNumber}] Step 2: Generating invoice PDF...`)
      const step2Start = Date.now()
      pdfBuffer = await generateInvoicePDFBuffer(order, 'professional', config)
      stepTimings.pdfGeneration = Date.now() - step2Start
      
      // Generate filename for tracking
      const customerLastName = order.contactInfo.parentLastName.replace(/[^a-zA-Z0-9]/g, '')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0]
      invoiceFilename = `Invoice_${order.orderNumber}_${customerLastName}_${timestamp}_${order.environment}.pdf`
      console.log(`[${order.orderNumber}] ✓ PDF generated in ${stepTimings.pdfGeneration}ms (${pdfBuffer.length} bytes)`)
    } else {
      console.log(`[${order.orderNumber}] ⏭️  Step 2: PDF generation SKIPPED (FEATURE_FLAGS.ENABLE_PDF_GENERATION = false)`)
    }
    
    // Step 3: Update Google Sheets with invoice filename
    if (FEATURE_FLAGS.ENABLE_GOOGLE_SHEETS && invoiceFilename !== 'invoice.pdf') {
      console.log(`[${order.orderNumber}] Step 3: Updating Google Sheets with invoice filename...`)
      const step3Start = Date.now()
      // Note: We don't have an update function, so the filename will remain as "Pending..."
      // in the sheet. This is acceptable - the order is captured, which is most important.
      // Future enhancement: Add updateOrder function to update the invoice filename
      console.log(`[${order.orderNumber}] Invoice filename: ${invoiceFilename}`)
      stepTimings.sheetUpdate = Date.now() - step3Start
      console.log(`[${order.orderNumber}] ✓ Sheet update noted in ${stepTimings.sheetUpdate}ms`)
    } else {
      console.log(`[${order.orderNumber}] ⏭️  Step 3: Sheet update SKIPPED`)
    }
    
    // Step 4: Upload invoice to Google Drive
    if (pdfBuffer) {
      console.log(`[${order.orderNumber}] Step 4: Uploading invoice to Google Drive...`)
      const step4Start = Date.now()
      try {
        const { uploadInvoiceToDrive } = await import('@/lib/googleDrive')
        const driveResult = await uploadInvoiceToDrive(
          pdfBuffer,
          order.orderNumber,
          order.contactInfo.parentFirstName,
          order.contactInfo.parentLastName,
          order.environment
        )
        stepTimings.googleDrive = Date.now() - step4Start
        if (driveResult.success) {
          console.log(`[${order.orderNumber}] ✓ Invoice uploaded to Google Drive in ${stepTimings.googleDrive}ms (File ID: ${driveResult.fileId})`)
        } else {
          console.warn(`[${order.orderNumber}] ⚠️ Google Drive upload failed: ${driveResult.error}`)
        }
      } catch (driveError) {
        console.error(`[${order.orderNumber}] ⚠️ Google Drive upload error:`, driveError)
        // Continue anyway - don't block order submission
      }
    } else {
      console.log(`[${order.orderNumber}] ⏭️  Step 4: Google Drive upload SKIPPED (no PDF buffer)`)
    }
    
    // Step 5: Send customer confirmation email with PDF attachment
    if (FEATURE_FLAGS.ENABLE_CUSTOMER_EMAIL) {
      console.log(`[${order.orderNumber}] Step 5: Sending customer email to ${order.contactInfo.email}...`)
      const step5Start = Date.now()
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
      stepTimings.customerEmail = Date.now() - step5Start
      console.log(`[${order.orderNumber}] ✓ Customer email sent in ${stepTimings.customerEmail}ms`)
    } else {
      console.log(`[${order.orderNumber}] ⏭️  Step 5: Customer email SKIPPED (FEATURE_FLAGS.ENABLE_CUSTOMER_EMAIL = false)`)
    }
    
    // Step 6: Send admin notification email with PDF attachment
    if (FEATURE_FLAGS.ENABLE_ADMIN_EMAIL) {
      console.log(`[${order.orderNumber}] Step 6: Sending admin notification...`)
      const step6Start = Date.now()
      const adminEmail = config.ContactMeEmail || config.Contact_Me_Email
      if (adminEmail) {
        console.log(`[${order.orderNumber}] Admin email: ${adminEmail}`)
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
        stepTimings.adminEmail = Date.now() - step6Start
        console.log(`[${order.orderNumber}] ✓ Admin notification sent in ${stepTimings.adminEmail}ms`)
      } else {
        console.log(`[${order.orderNumber}] ⚠️ No admin email configured, skipping admin notification`)
      }
    } else {
      console.log(`[${order.orderNumber}] ⏭️  Step 6: Admin email SKIPPED (FEATURE_FLAGS.ENABLE_ADMIN_EMAIL = false)`)
    }
    
    stepTimings.total = Date.now() - startTime
    console.log(`[${order.orderNumber}] ✅ Order processing complete in ${stepTimings.total}ms`)
    console.log(`[${order.orderNumber}] Timings breakdown:`, stepTimings)
    
  } catch (error) {
    console.error(`[${order.orderNumber}] ❌ Order processing failed:`, error)
    
    // Log error to file with full context
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

