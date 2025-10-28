/**
 * Google Drive Integration
 * Handles uploading invoice PDFs to Google Drive for permanent storage
 * 
 * Note: Service accounts don't have storage quota in regular "My Drive" folders.
 * Solution: Service account creates and owns the folder structure, then shares
 * it with admin users so they can access the invoices.
 */

import { google } from 'googleapis'
import { getGoogleSheetsConfig } from './config'

// Root folder will be created by service account if it doesn't exist
let INVOICES_FOLDER_ID: string | null = null
const FOLDER_NAME = 'CVL Invoices'

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
      'https://www.googleapis.com/auth/drive',
    ],
  })

  const authClient = await auth.getClient()
  return google.drive({ version: 'v3', auth: authClient as any })
}

/**
 * Share folder with admin users
 */
async function shareFolder(drive: any, folderId: string): Promise<void> {
  const adminEmails = [
    'carynvldesigns@gmail.com',
    'wvanderlaan@gmail.com',
  ]

  console.log(`[GoogleDrive] Sharing folder ${folderId} with admins...`)

  for (const email of adminEmails) {
    try {
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          type: 'user',
          role: 'writer',
          emailAddress: email,
        },
        fields: 'id',
      })
      console.log(`[GoogleDrive] ✓ Shared with ${email}`)
    } catch (error) {
      console.error(`[GoogleDrive] ⚠️ Failed to share with ${email}:`, error)
      // Continue even if sharing fails
    }
  }
}

/**
 * Get or create the root invoices folder (owned by service account)
 */
async function getOrCreateRootFolder(drive: any): Promise<string> {
  if (INVOICES_FOLDER_ID) {
    return INVOICES_FOLDER_ID
  }

  console.log(`[GoogleDrive] Looking for root folder: ${FOLDER_NAME}...`)

  try {
    // Search for existing folder in service account's drive
    const response = await drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'me' in owners`,
      fields: 'files(id, name)',
      spaces: 'drive',
    })

    if (response.data.files && response.data.files.length > 0) {
      const folderId = response.data.files[0].id
      if (!folderId) {
        throw new Error('Found folder but no ID returned')
      }
      INVOICES_FOLDER_ID = folderId
      console.log(`[GoogleDrive] ✓ Found existing root folder: ${INVOICES_FOLDER_ID}`)
      return INVOICES_FOLDER_ID
    }

    // Create root folder if it doesn't exist
    console.log(`[GoogleDrive] Creating root folder: ${FOLDER_NAME}...`)
    const folderMetadata = {
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    })

    const folderId = folder.data.id
    if (!folderId) {
      throw new Error('Created folder but no ID returned')
    }
    INVOICES_FOLDER_ID = folderId
    console.log(`[GoogleDrive] ✓ Created root folder: ${INVOICES_FOLDER_ID}`)

    // Share with admin users
    await shareFolder(drive, INVOICES_FOLDER_ID)

    return INVOICES_FOLDER_ID
  } catch (error) {
    console.error(`[GoogleDrive] Error getting/creating root folder:`, error)
    throw error
  }
}

/**
 * Get or create environment subfolder
 * @param drive - Google Drive client
 * @param environment - PROD, PREVIEW, or DEV
 * @returns Folder ID
 */
async function getOrCreateEnvironmentFolder(
  drive: any,
  environment: string
): Promise<string> {
  const folderName = environment.toUpperCase()
  console.log(`[GoogleDrive] Looking for ${folderName} folder...`)

  // Ensure root folder exists first
  const rootFolderId = await getOrCreateRootFolder(drive)

  try {
    // Search for existing environment folder
    const response = await drive.files.list({
      q: `name='${folderName}' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    })

    if (response.data.files && response.data.files.length > 0) {
      const folderId = response.data.files[0].id
      console.log(`[GoogleDrive] ✓ Found existing ${folderName} folder: ${folderId}`)
      return folderId
    }

    // Create environment folder if it doesn't exist
    console.log(`[GoogleDrive] Creating ${folderName} folder...`)
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
    }

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    })

    const folderId = folder.data.id
    if (!folderId) {
      throw new Error(`Created ${folderName} folder but no ID returned`)
    }
    console.log(`[GoogleDrive] ✓ Created ${folderName} folder: ${folderId}`)
    return folderId
  } catch (error) {
    console.error(`[GoogleDrive] Error getting/creating ${folderName} folder:`, error)
    throw error
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
    const folderId = await getOrCreateEnvironmentFolder(drive, environment)
    
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
