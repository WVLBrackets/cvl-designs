/**
 * Email service for CVL Designs
 * Sends order confirmations via Gmail
 */

import type { Order, OrderItem } from './types'

/**
 * Get nodemailer instance
 */
async function getNodemailer() {
  try {
    // Try dynamic import first
    const nodemailer = await import('nodemailer')
    return nodemailer.default || nodemailer
  } catch (error) {
    console.error('Failed to import nodemailer:', error)
    throw new Error('Email service unavailable')
  }
}

/**
 * Create Gmail transporter
 */
async function createTransporter() {
  const nodemailer = await getNodemailer()
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

/**
 * Generate invoice HTML (Version 1 - Clean & Artistic)
 */
function generateInvoiceHTML_V1(order: Order, config: any): string {
  const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  
  const itemsHTML = order.items
    .map(
      (item, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        <strong>${item.productName}</strong><br/>
        <span style="font-size: 0.875rem; color: #6b7280;">Size: ${item.size}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${item.designOptions.length > 0 ? item.designOptions.map(opt => opt.title).join(', ') : 'None'}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${
          item.customizationOptions.length > 0
            ? item.customizationOptions
                .map(opt => {
                  let text = opt.title
                  if (opt.customName) text += `<br/><span style="font-size: 0.875rem;">Name: ${opt.customName}</span>`
                  if (opt.customNumber) text += `<br/><span style="font-size: 0.875rem;">Number: ${opt.customNumber}</span>`
                  return text
                })
                .join('<br/>')
            : 'None'
        }
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
        $${item.totalPrice.toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('')
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${config.BusinessName || 'CVL Designs'}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1f2937;">
  
  <!-- Header -->
  <div style="text-align: center; padding: 30px 0; border-bottom: 3px solid #0ea5e9;">
    <h1 style="color: #0ea5e9; font-size: 2.5rem; margin: 0;">Invoice</h1>
    <h2 style="color: #6b7280; font-size: 1.5rem; margin: 10px 0 0 0;">${config.BusinessName || 'Caryn VL Designs'}</h2>
    <p style="color: #9ca3af; margin: 5px 0 0 0;">${config.ContactMeEmail || 'carynvldesigns@gmail.com'}</p>
  </div>
  
  <!-- Order Info -->
  <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-radius: 8px;">
    <p style="margin: 5px 0;"><strong>ORDER DATE:</strong> ${orderDate}</p>
    <p style="margin: 5px 0;"><strong>PARENT NAME:</strong> ${order.contactInfo.parentFirstName} ${order.contactInfo.parentLastName}</p>
    <p style="margin: 5px 0;"><strong>PARENT EMAIL:</strong> ${order.contactInfo.email}</p>
    <p style="margin: 5px 0;"><strong>PHONE:</strong> ${order.contactInfo.phoneNumber}</p>
  </div>
  
  <!-- Order Details -->
  <div style="margin: 30px 0;">
    <h3 style="color: #0ea5e9; font-size: 1.25rem; margin-bottom: 15px;">ORDER DETAILS</h3>
    <table style="width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <thead>
        <tr style="background-color: #5ebbcc; color: white;">
          <th style="padding: 12px; text-align: left;">Item</th>
          <th style="padding: 12px; text-align: left;">Design</th>
          <th style="padding: 12px; text-align: left;">Customization</th>
          <th style="padding: 12px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>
  </div>
  
  <!-- Total -->
  <div style="text-align: right; margin: 30px 0; padding: 20px; background-color: #5ebbcc; border-radius: 8px;">
    <h2 style="color: white; font-size: 1.75rem; margin: 0;">TOTAL DUE: $${order.totalAmount.toFixed(2)}</h2>
  </div>
  
  <!-- Payment Info -->
  <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
    <p style="margin: 0; font-size: 1rem; color: #92400e;">
      <strong>Payment is due upon receipt of this invoice.</strong><br/>
      I accept <strong>Venmo, Zelle, and CashApp</strong>.
    </p>
  </div>
  
  <!-- Thank You -->
  <div style="text-align: center; margin: 40px 0; color: #6b7280;">
    <p style="font-size: 1.125rem; margin: 0;">Thank you for your business!</p>
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 0.875rem;">
    <p style="margin: 0;">${config.Footer || 'Copyright 2024 - Caryn VL Designs'}</p>
  </div>
  
</body>
</html>
  `
}

/**
 * Generate invoice HTML (Version 2 - Playful Professional)
 */
function generateInvoiceHTML_V2(order: Order, config: any): string {
  const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  
  const itemsHTML = order.items
    .map(
      (item, index) => `
    <div style="margin: 15px 0; padding: 15px; background-color: ${index % 2 === 0 ? '#fef3c7' : '#dbeafe'}; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin: 0 0 5px 0; color: #1f2937;">${item.productName}</h4>
          <p style="margin: 3px 0; font-size: 0.875rem; color: #6b7280;">Size: ${item.size}</p>
          ${item.designOptions.length > 0 ? `<p style="margin: 3px 0; font-size: 0.875rem; color: #6b7280;">Design: ${item.designOptions.map(opt => opt.title).join(', ')}</p>` : ''}
          ${
            item.customizationOptions.length > 0
              ? `<p style="margin: 3px 0; font-size: 0.875rem; color: #6b7280;">Customization: ${item.customizationOptions
                  .map(opt => {
                    let text = opt.title
                    if (opt.customName || opt.customNumber) {
                      text += ' ('
                      if (opt.customName) text += opt.customName
                      if (opt.customName && opt.customNumber) text += ', '
                      if (opt.customNumber) text += `#${opt.customNumber}`
                      text += ')'
                    }
                    return text
                  })
                  .join(', ')}</p>`
              : ''
          }
        </div>
        <div style="font-size: 1.25rem; font-weight: 700; color: #0ea5e9;">
          $${item.totalPrice.toFixed(2)}
        </div>
      </div>
    </div>
  `
    )
    .join('')
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${config.BusinessName || 'CVL Designs'}</title>
</head>
<body style="font-family: 'Comic Sans MS', 'Trebuchet MS', sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f9fafb; color: #1f2937;">
  
  <!-- Header with colorful banner -->
  <div style="background: linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%); padding: 40px 20px; border-radius: 15px; text-align: center; color: white; margin-bottom: 30px;">
    <h1 style="font-size: 2.5rem; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">✨ Your Order! ✨</h1>
    <h2 style="font-size: 1.5rem; margin: 10px 0 0 0; font-weight: 400;">${config.BusinessName || 'Caryn VL Designs'}</h2>
  </div>
  
  <!-- Customer Info -->
  <div style="background-color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h3 style="color: #ec4899; margin: 0 0 15px 0; font-size: 1.25rem;">📋 Order Information</h3>
    <p style="margin: 8px 0;"><strong>Date:</strong> ${orderDate}</p>
    <p style="margin: 8px 0;"><strong>Name:</strong> ${order.contactInfo.parentFirstName} ${order.contactInfo.parentLastName}</p>
    <p style="margin: 8px 0;"><strong>Email:</strong> ${order.contactInfo.email}</p>
    <p style="margin: 8px 0;"><strong>Phone:</strong> ${order.contactInfo.phoneNumber}</p>
  </div>
  
  <!-- Order Items -->
  <div style="background-color: white; padding: 25px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h3 style="color: #8b5cf6; margin: 0 0 15px 0; font-size: 1.25rem;">🎨 Your Items</h3>
    ${itemsHTML}
  </div>
  
  <!-- Total -->
  <div style="background: linear-gradient(135deg, #10b981 0%, #0ea5e9 100%); padding: 30px; border-radius: 12px; text-align: center; color: white; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <p style="margin: 0; font-size: 1.125rem; font-weight: 400;">Total Amount Due</p>
    <h2 style="margin: 10px 0 0 0; font-size: 2.5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">$${order.totalAmount.toFixed(2)}</h2>
  </div>
  
  <!-- Payment Info -->
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 12px; border: 3px dashed #f59e0b; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 1rem; color: #92400e; text-align: center;">
      💳 <strong>Payment Methods:</strong> Venmo • Zelle • CashApp<br/>
      <span style="font-size: 0.875rem;">Payment is due upon receipt</span>
    </p>
  </div>
  
  <!-- Thank You -->
  <div style="text-align: center; padding: 30px 0;">
    <p style="font-size: 1.5rem; margin: 0; color: #8b5cf6;">Thank you! 💜</p>
  </div>
  
</body>
</html>
  `
}

/**
 * Generate invoice HTML (Version 3 - Bold & Bright)
 */
function generateInvoiceHTML_V3(order: Order, config: any): string {
  const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  
  const itemsHTML = order.items
    .map(
      (item, index) => `
    <tr style="border-bottom: 2px solid #e5e7eb;">
      <td style="padding: 15px;">
        <div style="font-weight: 700; font-size: 1.125rem; color: #1f2937;">${item.productName}</div>
        <div style="font-size: 0.875rem; color: #6b7280; margin-top: 5px;">Size: ${item.size}</div>
      </td>
      <td style="padding: 15px; font-size: 0.875rem; color: #6b7280;">
        ${item.designOptions.length > 0 ? item.designOptions.map(opt => opt.title).join('<br/>') : '—'}
      </td>
      <td style="padding: 15px; font-size: 0.875rem; color: #6b7280;">
        ${
          item.customizationOptions.length > 0
            ? item.customizationOptions
                .map(opt => {
                  let text = opt.title
                  if (opt.customName || opt.customNumber) {
                    text += '<br/><span style="font-size: 0.75rem;">'
                    if (opt.customName) text += opt.customName
                    if (opt.customName && opt.customNumber) text += ' • '
                    if (opt.customNumber) text += `#${opt.customNumber}`
                    text += '</span>'
                  }
                  return text
                })
                .join('<br/>')
            : '—'
        }
      </td>
      <td style="padding: 15px; text-align: right; font-weight: 700; font-size: 1.25rem; color: #dc2626;">
        $${item.totalPrice.toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('')
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${config.BusinessName || 'CVL Designs'}</title>
</head>
<body style="font-family: 'Arial Black', 'Arial Bold', sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background-color: #000; color: #fff;">
  
  <!-- Bold Header -->
  <div style="background: linear-gradient(90deg, #dc2626 0%, #ea580c 50%, #facc15 100%); padding: 60px 30px; text-align: center; border: 5px solid #fff; margin-bottom: 30px;">
    <h1 style="font-size: 3.5rem; margin: 0; color: #000; text-transform: uppercase; letter-spacing: 3px;">INVOICE</h1>
    <h2 style="font-size: 2rem; margin: 15px 0 0 0; color: #fff; text-transform: uppercase;">${config.BusinessName || 'CVL DESIGNS'}</h2>
  </div>
  
  <!-- Order Info Block -->
  <div style="background-color: #1f2937; padding: 30px; border-left: 8px solid #dc2626; margin-bottom: 30px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <p style="margin: 0 0 10px 0; color: #dc2626; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 1px;">Order Date</p>
        <p style="margin: 0; font-size: 1.125rem; font-weight: 700;">${orderDate}</p>
      </div>
      <div>
        <p style="margin: 0 0 10px 0; color: #dc2626; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 1px;">Customer</p>
        <p style="margin: 0; font-size: 1.125rem; font-weight: 700;">${order.contactInfo.parentFirstName} ${order.contactInfo.parentLastName}</p>
      </div>
      <div>
        <p style="margin: 0 0 10px 0; color: #dc2626; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 1px;">Email</p>
        <p style="margin: 0; font-size: 1rem;">${order.contactInfo.email}</p>
      </div>
      <div>
        <p style="margin: 0 0 10px 0; color: #dc2626; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 1px;">Phone</p>
        <p style="margin: 0; font-size: 1rem;">${order.contactInfo.phoneNumber}</p>
      </div>
    </div>
  </div>
  
  <!-- Order Table -->
  <div style="background-color: #fff; color: #000; margin-bottom: 30px;">
    <div style="background-color: #dc2626; padding: 15px 20px;">
      <h3 style="margin: 0; color: #fff; font-size: 1.5rem; text-transform: uppercase; letter-spacing: 2px;">ORDER DETAILS</h3>
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f3f4f6; border-bottom: 3px solid #dc2626;">
          <th style="padding: 15px; text-align: left; text-transform: uppercase; font-size: 0.875rem; letter-spacing: 1px;">Item</th>
          <th style="padding: 15px; text-align: left; text-transform: uppercase; font-size: 0.875rem; letter-spacing: 1px;">Design</th>
          <th style="padding: 15px; text-align: left; text-transform: uppercase; font-size: 0.875rem; letter-spacing: 1px;">Customization</th>
          <th style="padding: 15px; text-align: right; text-transform: uppercase; font-size: 0.875rem; letter-spacing: 1px;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>
  </div>
  
  <!-- Total Banner -->
  <div style="background: linear-gradient(90deg, #dc2626 0%, #ea580c 100%); padding: 40px; text-align: center; border: 5px solid #fff; margin-bottom: 30px;">
    <p style="margin: 0; color: #fff; font-size: 1.5rem; text-transform: uppercase; letter-spacing: 2px;">TOTAL DUE</p>
    <h1 style="margin: 10px 0 0 0; color: #000; font-size: 4rem; text-shadow: 3px 3px 0px #fff;">$${order.totalAmount.toFixed(2)}</h1>
  </div>
  
  <!-- Payment Info -->
  <div style="background-color: #facc15; color: #000; padding: 25px; text-align: center; margin-bottom: 30px;">
    <p style="margin: 0; font-size: 1.25rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
      PAYMENT DUE UPON RECEIPT
    </p>
    <p style="margin: 10px 0 0 0; font-size: 1.125rem;">
      Accepted: <strong>VENMO • ZELLE • CASHAPP</strong>
    </p>
  </div>
  
  <!-- Footer -->
  <div style="text-align: center; padding: 20px; color: #9ca3af;">
    <p style="margin: 0; font-size: 1.125rem;">THANK YOU FOR YOUR BUSINESS!</p>
  </div>
  
</body>
</html>
  `
}

/**
 * Generic send email function with attachment support
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    path: string
  }>
}): Promise<void> {
  const transporter = await createTransporter()
  
  const mailOptions = {
    from: `"CVL Designs" <${process.env.GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  }
  
  await transporter.sendMail(mailOptions)
}

/**
 * Send order confirmation email (legacy function, kept for compatibility)
 */
export async function sendOrderConfirmation(
  order: Order,
  config: any,
  invoiceVersion: 1 | 2 | 3 = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await createTransporter()
    
    // Select invoice version
    let invoiceHTML: string
    switch (invoiceVersion) {
      case 2:
        invoiceHTML = generateInvoiceHTML_V2(order, config)
        break
      case 3:
        invoiceHTML = generateInvoiceHTML_V3(order, config)
        break
      case 1:
      default:
        invoiceHTML = generateInvoiceHTML_V1(order, config)
    }
    
    const mailOptions = {
      from: `"${config.BusinessName || 'CVL Designs'}" <${process.env.GMAIL_USER}>`,
      to: order.contactInfo.email,
      subject: `Order Confirmation - ${config.BusinessName || 'CVL Designs'}`,
      html: invoiceHTML,
    }
    
    await transporter.sendMail(mailOptions)
    
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

