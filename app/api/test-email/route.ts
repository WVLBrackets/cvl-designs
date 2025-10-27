/**
 * Test Email API Route
 * Simple endpoint to test email functionality
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Testing email configuration...')
    
    // Check environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({
        success: false,
        error: 'Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables',
      }, { status: 500 })
    }
    
    console.log('Gmail User:', process.env.GMAIL_USER)
    console.log('Gmail Password configured:', !!process.env.GMAIL_APP_PASSWORD)
    
    // Try to load nodemailer
    console.log('Loading nodemailer...')
    const nodemailerModule = await import('nodemailer')
    console.log('Nodemailer module loaded')
    console.log('Module keys:', Object.keys(nodemailerModule))
    console.log('Has default:', 'default' in nodemailerModule)
    console.log('Has createTransporter:', 'createTransporter' in nodemailerModule)
    
    // Try different ways to access nodemailer
    const mailer = nodemailerModule.createTransport 
      ? nodemailerModule 
      : nodemailerModule.default
    
    console.log('Using mailer:', !!mailer)
    console.log('Mailer has createTransport:', typeof mailer?.createTransport)
    
    // Create transporter
    console.log('Creating transporter...')
    const transporter = mailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
    console.log('Transporter created successfully')
    
    // Verify connection
    console.log('Verifying connection...')
    await transporter.verify()
    console.log('Connection verified!')
    
    // Send test email
    console.log('Sending test email...')
    const info = await transporter.sendMail({
      from: `"CVL Designs Test" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER, // Send to yourself
      subject: 'Test Email from CVL Designs',
      html: `
        <h1>Email Test Successful!</h1>
        <p>This is a test email from your CVL Designs application.</p>
        <p>If you're reading this, email sending is working correctly! 🎉</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      `,
    })
    
    console.log('Email sent successfully!')
    console.log('Message ID:', info.messageId)
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully!',
      messageId: info.messageId,
      to: process.env.GMAIL_USER,
    })
    
  } catch (error: any) {
    console.error('Email test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      details: {
        name: error.name,
        code: error.code,
      },
    }, { status: 500 })
  }
}

