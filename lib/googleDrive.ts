/**
 * Google Drive Integration
 * Handles uploading invoice PDFs to Google Drive for permanent storage
 */

import { google } from 'googleapis'
import { getGoogleSheetsConfig } from './config'

const INVOICES_FOLDER_ID = '1SML9mTvsWZI4vsTV3vZZxKoy8v1XdWb3'

/**
 * Get authenticated Google Drive client
 */
async function getDriveClient() {
  const { serviceAccountEmail, privateKey } = getGoogleSheetsConfig()
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: serviceAccountEmail,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
    ],
  })

  const authClient = await auth.getClient()
  return google.drive({ version: 'v3', auth: authClient as any })
}

/**
 * Get or create environment subfolder
 * @param environment - PROD, PREVIEW, or DEV
 * @returns Folder ID
 */
async function getOrCreateEnvironmentFolder(environment: string): Promise<string> {
  try {
    const drive = await getDriveClient()
    
    // Search for existing folder
    const searchResponse = await drive.files.list({
      q: `name='${environment}' and '${INVOICES_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    })
    
    const existingFolder = searchResponse.data.files?.[0]
    
    if (existingFolder?.id) {
      console.log(`[GoogleDrive] Using existing ${environment} folder: ${existingFolder.id}`)
      return existingFolder.id
    }
    
    // Create new folder
    console.log(`[GoogleDrive] Creating ${environment} folder...`)
    const createResponse = await drive.files.create({
      requestBody: {
        name: environment,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [INVOICES_FOLDER_ID],
      },
      fields: 'id',
    })
    
    const folderId = createResponse.data.id
    console.log(`[GoogleDrive] ✓ Created ${environment} folder: ${folderId}`)
    return folderId || INVOICES_FOLDER_ID
    
  } catch (error) {
    console.error(`[GoogleDrive] Error getting/creating ${environment} folder:`, error)
    // Fallback to root invoices folder
    return INVOICES_FOLDER_ID
  }
}

/**
 * Upload invoice PDF to Google Drive
 * @param pdfBuffer - PDF file as Buffer
 * @param orderNumber - Full order number (e.g., CVL-PROD-BLUEPRINT-20250127-000042)
 * @param customerFirstName - Customer's first name
 * @param customerLastName - Customer's last name
 * @param environment - PROD, PREVIEW, or DEV
 */
export async function uploadInvoiceToDrive(
  pdfBuffer: Buffer,
  orderNumber: string,
  customerFirstName: string,
  customerLastName: string,
  environment: string
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    console.log(`[GoogleDrive] Uploading invoice for order ${orderNumber}...`)
    
    const drive = await getDriveClient()
    
    // Get or create environment subfolder
    const folderId = await getOrCreateEnvironmentFolder(environment)
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const sanitizedFirstName = customerFirstName.replace(/[^a-zA-Z0-9]/g, '')
    const sanitizedLastName = customerLastName.replace(/[^a-zA-Z0-9]/g, '')
    const filename = `${orderNumber}_${sanitizedFirstName}-${sanitizedLastName}_${timestamp}.pdf`
    
    console.log(`[GoogleDrive] Filename: ${filename}`)
    
    // Upload file
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
        mimeType: 'application/pdf',
      },
      media: {
        mimeType: 'application/pdf',
        body: require('stream').Readable.from(pdfBuffer),
      },
      fields: 'id, name, webViewLink',
    })
    
    const fileId = response.data.id
    const webViewLink = response.data.webViewLink
    
    console.log(`[GoogleDrive] ✓ Invoice uploaded successfully`)
    console.log(`[GoogleDrive] File ID: ${fileId}`)
    console.log(`[GoogleDrive] View link: ${webViewLink}`)
    
    return {
      success: true,
      fileId: fileId || undefined,
    }
    
  } catch (error) {
    console.error('[GoogleDrive] ❌ Error uploading invoice:', error)
    console.error('[GoogleDrive] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error,
    })
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

