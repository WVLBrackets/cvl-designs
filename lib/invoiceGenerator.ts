/**
 * Invoice PDF Generator
 * Creates PDF invoices in 3 different template styles
 */

import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import type { Order, OrderItem } from './types'

export type InvoiceTemplate = 'minimal' | 'professional' | 'detailed'

interface InvoiceData {
  orderNumber: string
  shortOrderNumber: string
  date: string
  customer: {
    name: string
    email: string
    phone: string
  }
  items: OrderItem[]
  subtotal: number
  total: number
  storeName: string
  businessName: string
  headerLogo?: string
  storeLogo?: string
  paymentInstructions: {
    venmo?: string
    cashapp?: string
    zelle?: string
  }
  environment: string
  invoiceFooter?: string
}

/**
 * Generate an invoice PDF as a Buffer (for email attachments)
 * @param order - The order data
 * @param template - Which template style to use
 * @param config - Site configuration
 * @returns Buffer containing the PDF data
 */
export async function generateInvoicePDFBuffer(
  order: Order & { orderNumber: string; shortOrderNumber: string },
  template: InvoiceTemplate,
  config: any
): Promise<Buffer> {
  const invoiceData: InvoiceData = {
    orderNumber: order.orderNumber,
    shortOrderNumber: order.shortOrderNumber,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    customer: {
      name: `${order.contactInfo.parentFirstName} ${order.contactInfo.parentLastName}`,
      email: order.contactInfo.email,
      phone: order.contactInfo.phoneNumber,
    },
    items: order.items,
    subtotal: order.totalAmount,
    total: order.totalAmount,
    storeName: order.storeSlug?.toUpperCase() || 'STORE',
    businessName: config['Business Name'] || config.Business_Name || config.BusinessName || 'CVL Designs',
    headerLogo: config.Header_Logo,
    storeLogo: config.Store_Header_Logo,
    paymentInstructions: {
      venmo: config.Venmo_Handle,
      cashapp: config.CashApp_Handle,
      zelle: config.Zelle_Email,
    },
    environment: process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV',
    invoiceFooter: config.Invoice_Footer || config['Invoice Footer'],
  }

  // Generate PDF based on template and return as Buffer
  switch (template) {
    case 'minimal':
      return await generateMinimalTemplateBuffer(invoiceData)
    case 'professional':
      return await generateProfessionalTemplateBuffer(invoiceData)
    case 'detailed':
      return await generateDetailedTemplateBuffer(invoiceData)
    default:
      return await generateProfessionalTemplateBuffer(invoiceData)
  }
}

/**
 * Generate an invoice PDF (legacy function - now writes to disk if needed)
 * @param order - The order data
 * @param template - Which template style to use
 * @param config - Site configuration
 * @returns Path to the generated PDF file
 */
export async function generateInvoicePDF(
  order: Order & { orderNumber: string; shortOrderNumber: string },
  template: InvoiceTemplate,
  config: any
): Promise<string> {
  const invoiceData: InvoiceData = {
    orderNumber: order.orderNumber,
    shortOrderNumber: order.shortOrderNumber,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    customer: {
      name: `${order.contactInfo.parentFirstName} ${order.contactInfo.parentLastName}`,
      email: order.contactInfo.email,
      phone: order.contactInfo.phoneNumber,
    },
    items: order.items,
    subtotal: order.totalAmount,
    total: order.totalAmount,
    storeName: order.storeSlug?.toUpperCase() || 'STORE',
    businessName: config['Business Name'] || config.Business_Name || config.BusinessName || 'CVL Designs',
    headerLogo: config.Header_Logo,
    storeLogo: config.Store_Header_Logo,
    paymentInstructions: {
      venmo: config.Venmo_Handle,
      cashapp: config.CashApp_Handle,
      zelle: config.Zelle_Email,
    },
    environment: process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV',
    invoiceFooter: config.Invoice_Footer || config['Invoice Footer'],
  }

  // Ensure invoices directory exists
  const invoicesDir = path.join(process.cwd(), 'invoices', invoiceData.environment.toLowerCase())
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true })
  }

  // Generate filename with timestamp
  const customerLastName = order.contactInfo.parentLastName.replace(/[^a-zA-Z0-9]/g, '')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0]
  const filename = `Invoice_${order.orderNumber}_${customerLastName}_${timestamp}_${invoiceData.environment}.pdf`
  const filepath = path.join(invoicesDir, filename)

  // Generate PDF based on template
  switch (template) {
    case 'minimal':
      await generateMinimalTemplate(filepath, invoiceData)
      break
    case 'professional':
      await generateProfessionalTemplate(filepath, invoiceData)
      break
    case 'detailed':
      await generateDetailedTemplate(filepath, invoiceData)
      break
  }

  return filepath
}

/**
 * Template A: Clean & Minimal - Buffer version
 */
async function generateMinimalTemplateBuffer(data: InvoiceData): Promise<Buffer> {
  // For now, just use the professional template
  return generateProfessionalTemplateBuffer(data)
}

/**
 * Template C: Detailed & Structured - Buffer version
 */
async function generateDetailedTemplateBuffer(data: InvoiceData): Promise<Buffer> {
  // For now, just use the professional template
  return generateProfessionalTemplateBuffer(data)
}

/**
 * Template A: Clean & Minimal
 */
async function generateMinimalTemplate(filepath: string, data: InvoiceData): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const stream = fs.createWriteStream(filepath)

    doc.pipe(stream)

    // Header
    doc.fontSize(24).text('INVOICE', { align: 'center' })
    doc.moveDown()
    doc.fontSize(10).text(`Order #${data.shortOrderNumber}`, { align: 'center' })
    doc.text(data.date, { align: 'center' })
    doc.moveDown(2)

    // Customer Info
    doc.fontSize(12).text('Bill To:', { underline: true })
    doc.fontSize(10).text(data.customer.name)
    doc.text(data.customer.email)
    doc.text(data.customer.phone)
    doc.moveDown(2)

    // Items Table
    doc.fontSize(12).text('Items:', { underline: true })
    doc.moveDown(0.5)

    data.items.forEach((item) => {
      const itemTotal = item.totalPrice * item.quantity
      doc.fontSize(10).text(`${item.productName} (${item.size})`, { continued: true })
      doc.text(`$${itemTotal.toFixed(2)}`, { align: 'right' })
      
      if (item.quantity > 1) {
        doc.fontSize(8).text(`  Qty: ${item.quantity} × $${item.totalPrice.toFixed(2)}`)
      }
      
      item.designOptions.forEach((opt) => {
        doc.fontSize(8).text(`  • ${opt.title}${opt.price > 0 ? ` (+$${opt.price})` : ''}`)
      })
      
      item.customizationOptions.forEach((opt) => {
        let optText = `  • ${opt.title}${opt.price > 0 ? ` (+$${opt.price})` : ''}`
        if (opt.customName) optText += ` - ${opt.customName}`
        if (opt.customNumber) optText += ` #${opt.customNumber}`
        doc.text(optText)
      })
      
      doc.moveDown(0.5)
    })

    // Total
    doc.moveDown()
    doc.fontSize(14).text(`Total: $${data.total.toFixed(2)}`, { align: 'right' })
    doc.moveDown(2)

    // Payment Instructions
    doc.fontSize(10).text('Payment Instructions:', { underline: true })
    doc.fontSize(9)
    if (data.paymentInstructions.venmo) {
      doc.text(`Venmo: ${data.paymentInstructions.venmo}`)
    }
    if (data.paymentInstructions.cashapp) {
      doc.text(`Cash App: ${data.paymentInstructions.cashapp}`)
    }
    if (data.paymentInstructions.zelle) {
      doc.text(`Zelle: ${data.paymentInstructions.zelle}`)
    }

    // Footer
    doc.moveDown(2)
    doc.fontSize(8).text(`${data.businessName} • Order ${data.orderNumber}`, { align: 'center' })

    doc.end()
    stream.on('finish', () => resolve())
    stream.on('error', reject)
  })
}

/**
 * Template B: Professional with Branding - Buffer version for serverless
 */
async function generateProfessionalTemplateBuffer(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const buffers: Buffer[] = []

    // Collect PDF data in buffers
    doc.on('data', (chunk) => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // Add environment watermark for non-production
    const vercelEnv = process.env.VERCEL_ENV
    const nodeEnv = process.env.NODE_ENV
    const isProduction = vercelEnv === 'production' || nodeEnv === 'production'
    
    console.log('[PDF] Environment check:', { vercelEnv, nodeEnv, isProduction })
    
    if (!isProduction) {
      const envLabel = (vercelEnv || nodeEnv || 'DEV').toUpperCase()
      console.log('[PDF] Adding watermark:', envLabel)
      doc.save()
      doc.rotate(-45, { origin: [306, 400] })
      doc.fontSize(60).fillColor('#ff0000').opacity(0.1)
      doc.text(envLabel, 0, 400, {
        align: 'center',
        width: 612
      })
      doc.restore()
    }

    // Get logo paths
    const headerLogoPath = path.join(process.cwd(), 'public', 'images', 'brand', data.headerLogo || 'VL Design Logo - Trimmed.png')
    const storeLogoPath = path.join(process.cwd(), 'public', 'images', 'brand', data.storeLogo || '')

    // Top left: Header logo (60x60)
    let logoY = 50
    if (fs.existsSync(headerLogoPath)) {
      doc.image(headerLogoPath, 50, logoY, { width: 60, height: 60 })
    }

    // Top left: Business info (3 lines next to logo, with one line of whitespace above)
    const textX = 120
    const textStartY = logoY + 13 // Add one line of whitespace (13px)
    doc.fontSize(14).fillColor('#000000').text(data.businessName, textX, textStartY, { width: 350 })
    doc.fontSize(10).text(`${data.storeName} - Order #${data.shortOrderNumber}`, textX, textStartY + 18, { width: 350 })
    doc.fontSize(9).fillColor('#666666').text(data.date, textX, textStartY + 33, { width: 350 })

    // Top right: Store logo (60x60)
    if (data.storeLogo && fs.existsSync(storeLogoPath)) {
      doc.image(storeLogoPath, 495, logoY, { width: 60, height: 60 })
    }

    // Horizontal black line
    const lineY = logoY + 70
    doc.moveTo(50, lineY).lineTo(545, lineY).lineWidth(2).stroke('#000000')

    // Bill To box
    const billToY = lineY + 15
    doc.rect(50, billToY, 250, 70).stroke('#000000')
    doc.fontSize(9).fillColor('#666666').text('BILL TO', 60, billToY + 8)
    doc.fontSize(11).fillColor('#000000').text(data.customer.name, 60, billToY + 23)
    doc.fontSize(9).text(data.customer.email, 60, billToY + 38)
    doc.text(data.customer.phone, 60, billToY + 51)

    // Detailed cost breakdown (compressed)
    let currentY = billToY + 90
    doc.fontSize(11).fillColor('#000000').text('ORDER DETAILS', 50, currentY)
    currentY += 20

    data.items.forEach((item, index) => {
      const itemTotal = item.totalPrice * item.quantity
      const bgColor = index % 2 === 0 ? '#f3f4f6' : '#ffffff'
      
      // Calculate the number of lines dynamically
      let lineCount = 1 // Product name line
      if (item.quantity > 1) lineCount += 1 // Quantity line
      lineCount += item.designOptions.length // Design option lines
      lineCount += item.customizationOptions.length // Customization option lines
      
      // Calculate row height based on actual line count
      const baseHeight = 18
      const lineHeight = 13
      const topPadding = 5
      const bottomPadding = 5
      const rowHeight = topPadding + baseHeight + ((lineCount - 1) * lineHeight) + bottomPadding
      
      // Background for entire row
      doc.rect(50, currentY, 495, rowHeight).fillAndStroke(bgColor, bgColor)
      
      // Product name and total
      doc.fontSize(10).fillColor('#000000')
      doc.text(`${item.productName} (${item.size})`, 60, currentY + topPadding, { width: 350, continued: false })
      doc.text(`$${itemTotal.toFixed(2)}`, 480, currentY + topPadding, { width: 55, align: 'right' })
      
      let textY = currentY + topPadding + 14 // Start below product name
      
      // Quantity info (if > 1)
      if (item.quantity > 1) {
        doc.fontSize(8).fillColor('#666666')
        doc.text(`Qty: ${item.quantity} × $${item.totalPrice.toFixed(2)}`, 60, textY)
        textY += lineHeight
      }
      
      // Options (same background color, closer to parent)
      doc.fontSize(8).fillColor('#666666')
      
      item.designOptions.forEach((opt) => {
        const optText = `  • ${opt.title}${opt.price > 0 ? ` (+$${opt.price.toFixed(2)})` : ''}`
        doc.text(optText, 60, textY, { width: 470 })
        textY += lineHeight
      })
      
      item.customizationOptions.forEach((opt) => {
        let optText = `  • ${opt.title}${opt.price > 0 ? ` (+$${opt.price.toFixed(2)})` : ''}`
        if (opt.customName) optText += ` - ${opt.customName}`
        if (opt.customNumber) optText += ` #${opt.customNumber}`
        doc.text(optText, 60, textY, { width: 470 })
        textY += lineHeight
      })
      
      currentY += rowHeight
    })

    // Total due (full width, slightly darker gray, larger font)
    currentY += 5
    doc.rect(50, currentY, 495, 35).fillAndStroke('#d1d5db', '#d1d5db')
    doc.fontSize(13).fillColor('#000000').text('TOTAL DUE', 60, currentY + 10)
    doc.fontSize(16).text(`$${data.total.toFixed(2)}`, 50, currentY + 9, { width: 485, align: 'right' })
    
    currentY += 45

    // Payment Options image
    const paymentImagePath = path.join(process.cwd(), 'public', 'images', 'brand', 'Payment Options.jpg')
    if (fs.existsSync(paymentImagePath)) {
      // Center the image and scale it appropriately
      doc.image(paymentImagePath, 50, currentY, { width: 495, align: 'center' })
      currentY += 210 // Approximate height of payment image + spacing
    }

    // Invoice footer message (centered, italics, below payment image)
    if (data.invoiceFooter) {
      doc.fontSize(9).fillColor('#666666').font('Helvetica-Oblique')
      doc.text(data.invoiceFooter, 50, currentY, { 
        width: 495, 
        align: 'center'
      })
      doc.font('Helvetica') // Reset to normal font
    }

    doc.end()
  })
}

/**
 * Template B: Professional with Branding
 */
async function generateProfessionalTemplate(filepath: string, data: InvoiceData): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const stream = fs.createWriteStream(filepath)

    doc.pipe(stream)

    // Get logo paths
    const headerLogoPath = path.join(process.cwd(), 'public', 'images', 'brand', data.headerLogo || 'VL Design Logo - Trimmed.png')
    const storeLogoPath = path.join(process.cwd(), 'public', 'images', 'brand', data.storeLogo || '')

    // Top left: Header logo (60x60)
    let logoY = 50
    if (fs.existsSync(headerLogoPath)) {
      doc.image(headerLogoPath, 50, logoY, { width: 60, height: 60 })
    }

    // Top left: Business info (3 lines next to logo, with one line of whitespace above)
    const textX = 120
    const textStartY = logoY + 13 // Add one line of whitespace (13px)
    doc.fontSize(14).fillColor('#000000').text(data.businessName, textX, textStartY, { width: 350 })
    doc.fontSize(10).text(`${data.storeName} - Order #${data.shortOrderNumber}`, textX, textStartY + 18, { width: 350 })
    doc.fontSize(9).fillColor('#666666').text(data.date, textX, textStartY + 33, { width: 350 })

    // Top right: Store logo (60x60)
    if (data.storeLogo && fs.existsSync(storeLogoPath)) {
      doc.image(storeLogoPath, 495, logoY, { width: 60, height: 60 })
    }

    // Horizontal black line
    const lineY = logoY + 70
    doc.moveTo(50, lineY).lineTo(545, lineY).lineWidth(2).stroke('#000000')

    // Bill To box
    const billToY = lineY + 15
    doc.rect(50, billToY, 250, 70).stroke('#000000')
    doc.fontSize(9).fillColor('#666666').text('BILL TO', 60, billToY + 8)
    doc.fontSize(11).fillColor('#000000').text(data.customer.name, 60, billToY + 23)
    doc.fontSize(9).text(data.customer.email, 60, billToY + 38)
    doc.text(data.customer.phone, 60, billToY + 51)

    // Detailed cost breakdown (compressed)
    let currentY = billToY + 90
    doc.fontSize(11).fillColor('#000000').text('ORDER DETAILS', 50, currentY)
    currentY += 20

    data.items.forEach((item, index) => {
      const itemTotal = item.totalPrice * item.quantity
      const bgColor = index % 2 === 0 ? '#f3f4f6' : '#ffffff'
      
      // Calculate the number of lines dynamically
      let lineCount = 1 // Product name line
      if (item.quantity > 1) lineCount += 1 // Quantity line
      lineCount += item.designOptions.length // Design option lines
      lineCount += item.customizationOptions.length // Customization option lines
      
      // Calculate row height based on actual line count
      // Base height: 18px for product name + 5px top padding + 5px bottom padding
      // Each additional line: 13px
      const baseHeight = 18
      const lineHeight = 13
      const topPadding = 5
      const bottomPadding = 5
      const rowHeight = topPadding + baseHeight + ((lineCount - 1) * lineHeight) + bottomPadding
      
      // Background for entire row
      doc.rect(50, currentY, 495, rowHeight).fillAndStroke(bgColor, bgColor)
      
      // Product name and total
      doc.fontSize(10).fillColor('#000000')
      doc.text(`${item.productName} (${item.size})`, 60, currentY + topPadding, { width: 350, continued: false })
      doc.text(`$${itemTotal.toFixed(2)}`, 480, currentY + topPadding, { width: 55, align: 'right' })
      
      let textY = currentY + topPadding + 14 // Start below product name
      
      // Quantity info (if > 1)
      if (item.quantity > 1) {
        doc.fontSize(8).fillColor('#666666')
        doc.text(`Qty: ${item.quantity} × $${item.totalPrice.toFixed(2)}`, 60, textY)
        textY += lineHeight
      }
      
      // Options (same background color, closer to parent)
      doc.fontSize(8).fillColor('#666666')
      
      item.designOptions.forEach((opt) => {
        const optText = `  • ${opt.title}${opt.price > 0 ? ` (+$${opt.price.toFixed(2)})` : ''}`
        doc.text(optText, 60, textY, { width: 470 })
        textY += lineHeight
      })
      
      item.customizationOptions.forEach((opt) => {
        let optText = `  • ${opt.title}${opt.price > 0 ? ` (+$${opt.price.toFixed(2)})` : ''}`
        if (opt.customName) optText += ` - ${opt.customName}`
        if (opt.customNumber) optText += ` #${opt.customNumber}`
        doc.text(optText, 60, textY, { width: 470 })
        textY += lineHeight
      })
      
      currentY += rowHeight
    })

    // Total due (full width, slightly darker gray, larger font)
    currentY += 5
    doc.rect(50, currentY, 495, 35).fillAndStroke('#d1d5db', '#d1d5db')
    doc.fontSize(13).fillColor('#000000').text('TOTAL DUE', 60, currentY + 10)
    doc.fontSize(16).text(`$${data.total.toFixed(2)}`, 50, currentY + 9, { width: 485, align: 'right' })
    
    currentY += 45

    // Payment Options image
    const paymentImagePath = path.join(process.cwd(), 'public', 'images', 'brand', 'Payment Options.jpg')
    if (fs.existsSync(paymentImagePath)) {
      // Center the image and scale it appropriately
      doc.image(paymentImagePath, 50, currentY, { width: 495, align: 'center' })
      currentY += 210 // Approximate height of payment image + spacing
    }

    // Invoice footer message (centered, italics, below payment image)
    if (data.invoiceFooter) {
      doc.fontSize(9).fillColor('#666666').font('Helvetica-Oblique')
      doc.text(data.invoiceFooter, 50, currentY, { 
        width: 495, 
        align: 'center'
      })
      doc.font('Helvetica') // Reset to normal font
    }

    doc.end()
    stream.on('finish', () => resolve())
    stream.on('error', reject)
  })
}

/**
 * Template C: Detailed & Structured
 */
async function generateDetailedTemplate(filepath: string, data: InvoiceData): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    const stream = fs.createWriteStream(filepath)

    doc.pipe(stream)

    // Header section
    doc.rect(0, 0, 612, 100).fill('#1e40af')
    doc.fillColor('#ffffff').fontSize(32).text(data.businessName, 50, 30)
    doc.fontSize(14).text(`${data.storeName} Team Store`, 50, 65)
    
    // Invoice info box
    doc.rect(400, 20, 162, 60).fillAndStroke('#ffffff', '#ffffff')
    doc.fillColor('#1e40af').fontSize(20).text('INVOICE', 410, 30)
    doc.fontSize(10).fillColor('#000000').text(`Order: ${data.shortOrderNumber}`, 410, 55)
    doc.text(data.date, 410, 68)

    doc.fillColor('#000000')
    doc.moveDown(4)

    // Customer Information Section
    doc.fontSize(14).text('CUSTOMER INFORMATION', 50, 120, { underline: true })
    doc.rect(50, 140, 250, 80).stroke()
    doc.fontSize(11).text(data.customer.name, 60, 150)
    doc.fontSize(9).text(data.customer.email, 60, 170)
    doc.text(data.customer.phone, 60, 185)
    doc.text(`Order Number: ${data.orderNumber}`, 60, 200)

    // Order Details Section
    let currentY = 240
    doc.fontSize(14).text('ORDER DETAILS', 50, currentY, { underline: true })
    currentY += 25

    data.items.forEach((item, index) => {
      // Item header
      doc.rect(50, currentY, 495, 30).fillAndStroke('#e5e7eb', '#d1d5db')
      doc.fontSize(12).fillColor('#000000')
      doc.text(`Item ${index + 1}: ${item.productName}`, 60, currentY + 8)
      doc.text(`$${(item.totalPrice * item.quantity).toFixed(2)}`, 480, currentY + 8, { align: 'right' })
      currentY += 35

      // Item details
      doc.fontSize(10)
      doc.text(`Size: ${item.size}`, 70, currentY)
      doc.text(`Quantity: ${item.quantity}`, 250, currentY)
      doc.text(`Unit Price: $${item.totalPrice.toFixed(2)}`, 380, currentY)
      currentY += 20

      // Design options
      if (item.designOptions.length > 0) {
        doc.fontSize(9).fillColor('#374151').text('Design Options:', 70, currentY)
        currentY += 15
        item.designOptions.forEach((opt) => {
          doc.text(`  • ${opt.title}${opt.price > 0 ? ` (+$${opt.price})` : ''}`, 80, currentY)
          currentY += 12
        })
        currentY += 5
      }

      // Customization options
      if (item.customizationOptions.length > 0) {
        doc.fontSize(9).text('Customization Options:', 70, currentY)
        currentY += 15
        item.customizationOptions.forEach((opt) => {
          let optText = `  • ${opt.title}${opt.price > 0 ? ` (+$${opt.price})` : ''}`
          if (opt.customName || opt.customNumber) {
            optText += ' -'
            if (opt.customName) optText += ` ${opt.customName}`
            if (opt.customNumber) optText += ` #${opt.customNumber}`
          }
          doc.text(optText, 80, currentY)
          currentY += 12
        })
        currentY += 5
      }

      currentY += 15
    })

    // Summary section
    doc.rect(350, currentY, 195, 60).fillAndStroke('#f9fafb', '#d1d5db')
    doc.fontSize(11).fillColor('#000000')
    doc.text('Subtotal:', 360, currentY + 10)
    doc.text(`$${data.subtotal.toFixed(2)}`, 480, currentY + 10, { align: 'right' })
    
    doc.fontSize(14).text('TOTAL:', 360, currentY + 35)
    doc.fontSize(16).text(`$${data.total.toFixed(2)}`, 480, currentY + 33, { align: 'right' })

    currentY += 80

    // Payment section
    doc.rect(50, currentY, 495, 100).stroke()
    doc.fontSize(12).text('PAYMENT INSTRUCTIONS', 60, currentY + 10, { underline: true })
    currentY += 30
    doc.fontSize(10)
    doc.text('Please send payment via one of the following methods:', 60, currentY)
    currentY += 20

    if (data.paymentInstructions.venmo) {
      doc.text(`• Venmo: ${data.paymentInstructions.venmo}`, 70, currentY)
      currentY += 15
    }
    if (data.paymentInstructions.cashapp) {
      doc.text(`• Cash App: ${data.paymentInstructions.cashapp}`, 70, currentY)
      currentY += 15
    }
    if (data.paymentInstructions.zelle) {
      doc.text(`• Zelle: ${data.paymentInstructions.zelle}`, 70, currentY)
    }

    // Footer
    doc.fontSize(8).fillColor('#6b7280')
    doc.text('Thank you for your order!', 50, 750, { align: 'center' })
    doc.text(`${data.businessName} • ${data.orderNumber}`, 50, 765, { align: 'center' })

    doc.end()
    stream.on('finish', () => resolve())
    stream.on('error', reject)
  })
}

