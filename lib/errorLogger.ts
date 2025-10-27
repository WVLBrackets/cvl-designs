/**
 * Error Logger
 * Writes errors to a local log file for debugging
 */

import fs from 'fs'
import path from 'path'

/**
 * Log an error to file
 */
export function logError(context: string, error: any, additionalData?: any) {
  try {
    const timestamp = new Date().toISOString()
    const env = process.env.NODE_ENV || 'development'
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }
    
    // Create log filename with date
    const dateStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const logFile = path.join(logsDir, `error-${env}-${dateStr}.log`)
    
    // Format error message
    const logEntry = {
      timestamp,
      environment: env,
      context,
      error: {
        message: error?.message || String(error),
        name: error?.name,
        code: error?.code,
        stack: error?.stack,
      },
      additionalData,
    }
    
    // Format as readable text
    const logText = `
${'='.repeat(80)}
[${timestamp}] ERROR in ${context}
${'='.repeat(80)}
Environment: ${env}
Error: ${error?.message || String(error)}
${error?.name ? `Type: ${error.name}` : ''}
${error?.code ? `Code: ${error.code}` : ''}

${error?.stack ? `Stack Trace:\n${error.stack}\n` : ''}
${additionalData ? `\nAdditional Data:\n${JSON.stringify(additionalData, null, 2)}\n` : ''}
${'='.repeat(80)}

`
    
    // Append to log file
    fs.appendFileSync(logFile, logText, 'utf8')
    
    // Also log to console
    console.error(`[ERROR LOGGED] ${context}:`, error?.message || String(error))
    console.error(`Log file: ${logFile}`)
    
    return logFile
    
  } catch (loggingError) {
    // If logging fails, at least log to console
    console.error('Failed to write error log:', loggingError)
    console.error('Original error:', error)
    return null
  }
}

/**
 * Log order submission error with full context
 */
export function logOrderError(orderNumber: string, step: string, error: any, orderData?: any) {
  return logError(
    `Order Submission [${orderNumber}] - ${step}`,
    error,
    {
      orderNumber,
      step,
      orderData: orderData ? {
        contactInfo: orderData.contactInfo,
        itemCount: orderData.items?.length,
        totalAmount: orderData.totalAmount,
        storeSlug: orderData.storeSlug,
      } : undefined,
    }
  )
}

/**
 * Log email sending error
 */
export function logEmailError(recipient: string, subject: string, error: any) {
  return logError(
    'Email Sending',
    error,
    {
      recipient,
      subject,
      gmailUser: process.env.GMAIL_USER,
      hasPassword: !!process.env.GMAIL_APP_PASSWORD,
    }
  )
}

/**
 * Get list of recent log files
 */
export function getRecentLogs(days: number = 7): string[] {
  try {
    const logsDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logsDir)) {
      return []
    }
    
    const files = fs.readdirSync(logsDir)
    const logFiles = files.filter(f => f.startsWith('error-') && f.endsWith('.log'))
    
    // Sort by date (newest first)
    return logFiles.sort().reverse().slice(0, days)
    
  } catch (error) {
    console.error('Failed to get recent logs:', error)
    return []
  }
}

