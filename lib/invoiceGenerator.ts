/**
 * Invoice PDF Generator
 * Creates PDF invoices in 3 different template styles
 */

import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import type { Order, OrderItem } from './types'

export type InvoiceTemplate = 'minimal' | 'professional' | 'detailed'

type PDFDoc = InstanceType<typeof PDFDocument>

const ORDER_ITEM_PRODUCT_WIDTH = 350
const ORDER_ITEM_OPTION_WIDTH = 470
const ORDER_ITEM_LINE_HEIGHT = 13
const ORDER_ITEM_TOP_PADDING = 5
const ORDER_ITEM_BOTTOM_PADDING = 5
const ORDER_ITEM_SUBLINE_GAP = 2

/**
 * Build the product line label shown on invoice rows
 */
function formatOrderItemLabel(item: OrderItem): string {
  const variant = [item.color, item.size].filter(Boolean).join(' / ')
  return variant ? `${item.productName} (${variant})` : item.productName
}

/**
 * Measure wrapped product title height and total row height for PDF layout
 */
function measureOrderItemRow(
  doc: PDFDoc,
  item: OrderItem
): { productNameHeight: number; rowHeight: number } {
  const productLabel = formatOrderItemLabel(item)

  doc.font('Helvetica').fontSize(10)
  const productNameHeight = doc.heightOfString(productLabel, {
    width: ORDER_ITEM_PRODUCT_WIDTH,
  })

  let sublinesHeight = 0
  if (item.quantity > 1) {
    sublinesHeight += ORDER_ITEM_LINE_HEIGHT
  }
  sublinesHeight +=
    (item.designOptions.length + item.customizationOptions.length) *
    ORDER_ITEM_LINE_HEIGHT

  const hasSublines =
    item.quantity > 1 ||
    item.designOptions.length > 0 ||
    item.customizationOptions.length > 0

  const rowHeight =
    ORDER_ITEM_TOP_PADDING +
    productNameHeight +
    (hasSublines ? ORDER_ITEM_SUBLINE_GAP : 0) +
    sublinesHeight +
    ORDER_ITEM_BOTTOM_PADDING

  return { productNameHeight, rowHeight }
}

/**
 * Draw one order item row in the professional invoice template
 */
function drawProfessionalOrderItem(
  doc: PDFDoc,
  item: OrderItem,
  currentY: number,
  index: number
): number {
  const itemTotal = item.totalPrice * item.quantity
  const bgColor = index % 2 === 0 ? '#f3f4f6' : '#ffffff'
  const productLabel = formatOrderItemLabel(item)
  const { productNameHeight, rowHeight } = measureOrderItemRow(doc, item)

  doc.rect(50, currentY, 495, rowHeight).fillAndStroke(bgColor, bgColor)

  doc.font('Helvetica').fontSize(10).fillColor('#000000')
  doc.text(productLabel, 60, currentY + ORDER_ITEM_TOP_PADDING, {
    width: ORDER_ITEM_PRODUCT_WIDTH,
  })
  doc.text(
    `$${itemTotal.toFixed(2)}`,
    480,
    currentY + ORDER_ITEM_TOP_PADDING,
    { width: 55, align: 'right' }
  )

  const hasSublines =
    item.quantity > 1 ||
    item.designOptions.length > 0 ||
    item.customizationOptions.length > 0

  let textY =
    currentY +
    ORDER_ITEM_TOP_PADDING +
    productNameHeight +
    (hasSublines ? ORDER_ITEM_SUBLINE_GAP : 0)

  if (item.quantity > 1) {
    doc.fontSize(8).fillColor('#666666')
    doc.text(
      `Qty: ${item.quantity} × $${item.totalPrice.toFixed(2)}`,
      60,
      textY
    )
    textY += ORDER_ITEM_LINE_HEIGHT
  }

  doc.fontSize(8).fillColor('#666666')

  item.designOptions.forEach(opt => {
    const optText = `  • ${opt.title}${opt.price > 0 ? ` (+$${opt.price.toFixed(2)})` : ''}`
    doc.text(optText, 60, textY, { width: ORDER_ITEM_OPTION_WIDTH })
    textY += ORDER_ITEM_LINE_HEIGHT
  })

  item.customizationOptions.forEach(opt => {
    let optText = `  • ${opt.title}${opt.price > 0 ? ` (+$${opt.price.toFixed(2)})` : ''}`
    if (opt.customName) optText += ` - ${opt.customName}`
    if (opt.customNumber) optText += ` #${opt.customNumber}`
    doc.text(optText, 60, textY, { width: ORDER_ITEM_OPTION_WIDTH })
    textY += ORDER_ITEM_LINE_HEIGHT
  })

  return currentY + rowHeight
}

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
      const productLabel = formatOrderItemLabel(item)
      doc.fontSize(10).text(productLabel, { width: 450, continued: true })
      doc.text(`$${itemTotal.toFixed(2)}`, { align: 'right' })

      if (item.quantity > 1) {
        doc.moveDown(0.2)
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

    // Check environment for watermark (we'll add it at the end)
    const vercelEnv = process.env.VERCEL_ENV
    const nodeEnv = process.env.NODE_ENV
    const isProduction = vercelEnv === 'production'
    
    console.log('[PDF] Environment check:', { vercelEnv, nodeEnv, isProduction })

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
      currentY = drawProfessionalOrderItem(doc, item, currentY, index)
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

    // Add environment watermark on all pages (drawn last so it's on top)
    if (!isProduction) {
      const envLabel = (vercelEnv || nodeEnv || 'DEV').toUpperCase()
      console.log('[PDF] Adding watermark:', envLabel)
      
      // Get page range
      const range = doc.bufferedPageRange()
      
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i)
        
        // Save the current state
        doc.save()
        
        // Apply rotation and draw watermark
        doc.rotate(-45, { origin: [306, 400] })
        doc.fontSize(80)
        doc.fillColor('#ff0000')
        doc.opacity(0.15)
        doc.text(envLabel, 0, 400, {
          align: 'center',
          width: 612
        })
        
        // Restore state
        doc.restore()
      }
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
      currentY = drawProfessionalOrderItem(doc, item, currentY, index)
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
      if (item.color) {
        currentY += 12
        doc.text(`Color: ${item.color}`, 70, currentY)
      }
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

