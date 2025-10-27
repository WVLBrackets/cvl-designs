/**
 * HTML Email Templates
 */

import type { Order, OrderItem } from './types'

interface CustomerEmailData {
  customerName: string
  shortOrderNumber: string
  orderDate: string
  items: OrderItem[]
  total: number
  paymentInstructions: {
    venmo?: string
    cashapp?: string
    zelle?: string
  }
  businessName: string
}

interface AdminEmailData {
  customerName: string
  customerEmail: string
  customerPhone: string
  fullOrderNumber: string
  shortOrderNumber: string
  orderDate: string
  items: OrderItem[]
  total: number
  storeName: string
  businessName: string
  primaryColor?: string
}

interface TechSupportEmailData {
  error: string
  stackTrace?: string
  orderData: any
  timestamp: string
}

/**
 * Customer confirmation email template
 */
export function generateCustomerEmail(data: CustomerEmailData): string {
  const itemsHtml = data.items.map((item, index) => {
    const itemTotal = item.totalPrice * item.quantity
    const designOptions = item.designOptions.map(opt => 
      `<li style="font-size: 13px; color: #6b7280;">${opt.title}${opt.price > 0 ? ` (+$${opt.price})` : ''}</li>`
    ).join('')
    
    const customOptions = item.customizationOptions.map(opt => {
      let text = opt.title
      if (opt.customName) text += ` - ${opt.customName}`
      if (opt.customNumber) text += ` #${opt.customNumber}`
      if (opt.price > 0) text += ` (+$${opt.price})`
      return `<li style="font-size: 13px; color: #6b7280;">${text}</li>`
    }).join('')

    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 15px 10px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 5px;">
            ${item.productName} (${item.size})
          </div>
          ${designOptions || customOptions ? `
            <ul style="margin: 5px 0 0 0; padding-left: 20px; list-style-type: disc;">
              ${designOptions}
              ${customOptions}
            </ul>
          ` : ''}
        </td>
        <td style="padding: 15px 10px; text-align: center; color: #6b7280;">
          ${item.quantity}
        </td>
        <td style="padding: 15px 10px; text-align: right; font-weight: 600; color: #111827;">
          $${itemTotal.toFixed(2)}
        </td>
      </tr>
    `
  }).join('')

  const paymentMethodsHtml = []
  if (data.paymentInstructions.venmo) {
    paymentMethodsHtml.push(`
      <div style="margin-bottom: 15px;">
        <strong style="color: #2563eb;">Venmo:</strong> ${data.paymentInstructions.venmo}
      </div>
    `)
  }
  if (data.paymentInstructions.cashapp) {
    paymentMethodsHtml.push(`
      <div style="margin-bottom: 15px;">
        <strong style="color: #10b981;">Cash App:</strong> ${data.paymentInstructions.cashapp}
      </div>
    `)
  }
  if (data.paymentInstructions.zelle) {
    paymentMethodsHtml.push(`
      <div style="margin-bottom: 15px;">
        <strong style="color: #8b5cf6;">Zelle:</strong> ${data.paymentInstructions.zelle}
      </div>
    `)
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                    Thank You for Your Order!
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                    Order #${data.shortOrderNumber}
                  </p>
                </td>
              </tr>
              
              <!-- Greeting -->
              <tr>
                <td style="padding: 30px 30px 20px 30px;">
                  <p style="margin: 0; font-size: 16px; color: #374151; line-height: 1.6;">
                    Hi ${data.customerName},
                  </p>
                  <p style="margin: 15px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">
                    Thank you for your order! We've received your request and your custom items will be prepared soon.
                  </p>
                </td>
              </tr>
              
              <!-- Order Details -->
              <tr>
                <td style="padding: 20px 30px;">
                  <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #111827; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                    Order Details
                  </h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 12px 10px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase;">
                          Item
                        </th>
                        <th style="padding: 12px 10px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase;">
                          Qty
                        </th>
                        <th style="padding: 12px 10px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase;">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                    <tfoot>
                      <tr style="background-color: #f9fafb;">
                        <td colspan="2" style="padding: 15px 10px; text-align: right; font-size: 18px; font-weight: bold; color: #111827;">
                          Total:
                        </td>
                        <td style="padding: 15px 10px; text-align: right; font-size: 18px; font-weight: bold; color: #2563eb;">
                          $${data.total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </td>
              </tr>
              
              <!-- Payment Instructions -->
              <tr>
                <td style="padding: 20px 30px 30px 30px;">
                  <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #111827; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                    Payment Instructions
                  </h2>
                  <div style="background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 6px; padding: 20px; margin-bottom: 15px;">
                    <p style="margin: 0 0 15px 0; font-size: 15px; color: #166534; font-weight: 600;">
                      Please send payment of $${data.total.toFixed(2)} using one of the following methods:
                    </p>
                    ${paymentMethodsHtml.join('')}
                  </div>
                  <p style="margin: 15px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                    Your invoice is attached to this email for your records. Please reference order #${data.shortOrderNumber} when making payment.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    Questions? Contact us and we'll be happy to help!
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                    ${data.businessName} • Order Date: ${data.orderDate}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Admin notification email template
 */
export function generateAdminEmail(data: AdminEmailData): string {
  const itemsHtml = data.items.map((item, index) => {
    const itemTotal = item.totalPrice * item.quantity
    const details: string[] = []
    
    item.designOptions.forEach(opt => {
      details.push(`${opt.title}${opt.price > 0 ? ` (+$${opt.price})` : ''}`)
    })
    
    item.customizationOptions.forEach(opt => {
      let text = opt.title
      if (opt.customName) text += ` - ${opt.customName}`
      if (opt.customNumber) text += ` #${opt.customNumber}`
      if (opt.price > 0) text += ` (+$${opt.price})`
      details.push(text)
    })

    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-size: 14px;">
          <strong>${item.productName}</strong> (${item.size})<br>
          ${details.length > 0 ? `<span style="font-size: 12px; color: #6b7280;">${details.join(', ')}</span>` : ''}
        </td>
        <td style="padding: 10px; text-align: center; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right; font-size: 14px;">$${itemTotal.toFixed(2)}</td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: ${data.primaryColor || '#dc2626'}; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                    🔔 New Order Received
                  </h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
                    Order #${data.shortOrderNumber} • ${data.storeName}
                  </p>
                </td>
              </tr>
              
              <!-- Customer Info -->
              <tr>
                <td style="padding: 25px 30px;">
                  <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #111827;">Customer Information</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; padding: 15px;">
                    <tr>
                      <td style="padding: 5px 0; font-size: 14px;">
                        <strong>Name:</strong> ${data.customerName}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; font-size: 14px;">
                        <strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #2563eb;">${data.customerEmail}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; font-size: 14px;">
                        <strong>Phone:</strong> ${data.customerPhone}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; font-size: 14px;">
                        <strong>Order Date:</strong> ${data.orderDate}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; font-size: 12px; color: #6b7280;">
                        <strong>Full Order #:</strong> ${data.fullOrderNumber}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Order Items -->
              <tr>
                <td style="padding: 0 30px 25px 30px;">
                  <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #111827;">Order Items</h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f9fafb;">
                        <th style="padding: 10px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600;">Item</th>
                        <th style="padding: 10px; text-align: center; font-size: 12px; color: #6b7280; font-weight: 600;">Qty</th>
                        <th style="padding: 10px; text-align: right; font-size: 12px; color: #6b7280; font-weight: 600;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                    <tfoot>
                      <tr style="background-color: #f9fafb;">
                        <td colspan="2" style="padding: 12px 10px; text-align: right; font-size: 16px; font-weight: bold;">
                          Order Total:
                        </td>
                        <td style="padding: 12px 10px; text-align: right; font-size: 16px; font-weight: bold; color: ${data.primaryColor || '#dc2626'};">
                          $${data.total.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 12px; color: #6b7280;">
                    ${data.businessName} • Admin Notification
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Tech support error email template
 */
export function generateTechSupportEmail(data: TechSupportEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Submission Error</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Courier New', monospace; background-color: #1f2937;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1f2937; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="700" cellpadding="0" cellspacing="0" style="background-color: #111827; border-radius: 8px; overflow: hidden; border: 2px solid #ef4444;">
              <!-- Header -->
              <tr>
                <td style="background-color: #7f1d1d; padding: 25px; text-align: center;">
                  <h1 style="margin: 0; color: #fecaca; font-size: 22px; font-weight: bold;">
                    ⚠️ ORDER SUBMISSION ERROR
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #fca5a5; font-size: 13px;">
                    Timestamp: ${data.timestamp}
                  </p>
                </td>
              </tr>
              
              <!-- Error Message -->
              <tr>
                <td style="padding: 25px; background-color: #1f2937;">
                  <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #fca5a5;">Error Message:</h2>
                  <pre style="margin: 0; padding: 15px; background-color: #0f172a; border-left: 4px solid #ef4444; color: #fecaca; font-size: 13px; overflow-x: auto; border-radius: 4px;">${data.error}</pre>
                </td>
              </tr>
              
              <!-- Stack Trace -->
              ${data.stackTrace ? `
              <tr>
                <td style="padding: 0 25px 25px 25px; background-color: #1f2937;">
                  <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #fca5a5;">Stack Trace:</h2>
                  <pre style="margin: 0; padding: 15px; background-color: #0f172a; border-left: 4px solid #f59e0b; color: #fde68a; font-size: 11px; overflow-x: auto; border-radius: 4px; max-height: 300px; overflow-y: auto;">${data.stackTrace}</pre>
                </td>
              </tr>
              ` : ''}
              
              <!-- Order Data -->
              <tr>
                <td style="padding: 0 25px 25px 25px; background-color: #1f2937;">
                  <h2 style="margin: 0 0 10px 0; font-size: 16px; color: #fca5a5;">Order Data (for manual processing):</h2>
                  <pre style="margin: 0; padding: 15px; background-color: #0f172a; border-left: 4px solid #3b82f6; color: #93c5fd; font-size: 11px; overflow-x: auto; border-radius: 4px; max-height: 400px; overflow-y: auto;">${JSON.stringify(data.orderData, null, 2)}</pre>
                </td>
              </tr>
              
              <!-- Action Required -->
              <tr>
                <td style="padding: 20px 25px; background-color: #7f1d1d; border-top: 2px solid #ef4444;">
                  <p style="margin: 0; color: #fecaca; font-size: 14px; text-align: center;">
                    <strong>⚡ ACTION REQUIRED:</strong> Please investigate this error and manually process the order if needed.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

