/**
 * API Route for submitting orders
 * Handles: Google Sheets logging, PDF generation, customer email, admin notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { submitOrder, fetchConfiguration, fetchMergedConfigForStore } from '@/lib/googleSheets'
import { getEnvironment } from '@/lib/config'
import { generateOrderNumber, getShortOrderNumber } from '@/lib/orderNumber'
import { generateInvoicePDF } from '@/lib/invoiceGenerator'
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
    
    // Process order asynchronously (don't wait for completion)
    console.log(`[${fullOrderNumber}] Starting async order processing...`)
    processOrderAsync(order, config).catch(error => {
      console.error(`[${fullOrderNumber}] ❌ Async order processing failed:`, error)
      console.error('Error stack:', error.stack)
      
      // Log error to file
      logOrderError(fullOrderNumber, 'Async Processing', error, order)
      
      // Send tech support email about the failure
      sendTechSupportEmail(error, order, config).catch(err => {
        console.error('Failed to send tech support email:', err)
        const techEmail = 'Tech_Support_Email' in config ? String(config.Tech_Support_Email || 'unknown') : 'unknown'
        logEmailError(techEmail, 'Tech Support Error Notification', err)
      })
    })
    
    // Return success immediately to user
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

/**
 * Process order asynchronously (Google Sheets, PDF, emails)
 */
async function processOrderAsync(
  order: Order & { orderNumber: string; shortOrderNumber: string },
  config: any
) {
  try {
    // Step 1: Generate Invoice PDF (using professional template by default)
    console.log(`[${order.orderNumber}] Generating invoice PDF...`)
    const pdfPath = await generateInvoicePDF(order, 'professional', config)
    const invoiceFilename = pdfPath.split(/[\\/]/).pop() || 'invoice.pdf' // Extract filename from path
    console.log(`[${order.orderNumber}] ✓ PDF generated: ${pdfPath}`)
    
    // Add invoice filename to order object for Google Sheets
    ;(order as any).invoiceFilename = invoiceFilename
    
    // Step 2: Submit to Google Sheets (now with invoice filename)
    console.log(`[${order.orderNumber}] Submitting to Google Sheets...`)
    const sheetResult = await submitOrder(order)
    if (!sheetResult.success) {
      throw new Error(`Google Sheets submission failed: ${sheetResult.error}`)
    }
    console.log(`[${order.orderNumber}] ✓ Saved to Google Sheets`)
    
    // Step 3: Send customer confirmation email with PDF attachment
    console.log(`[${order.orderNumber}] Sending customer email...`)
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
      attachments: [{
        filename: `Invoice_${order.shortOrderNumber}.pdf`,
        path: pdfPath,
      }],
    })
    console.log(`[${order.orderNumber}] ✓ Customer email sent`)
    
    // Step 4: Send admin notification email with PDF attachment
    console.log(`[${order.orderNumber}] Sending admin notification...`)
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
        attachments: [{
          filename: `Invoice_${order.shortOrderNumber}.pdf`,
          path: pdfPath,
        }],
      })
      console.log(`[${order.orderNumber}] ✓ Admin notification sent`)
    }
    
    console.log(`[${order.orderNumber}] ✅ Order processing complete`)
    
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

