/**
 * Client-side Vercel Blob upload token for gallery photos and videos.
 */

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isValidStudioAdminCookie, STUDIO_ADMIN_COOKIE } from '@/lib/studioAdminAuth'
import {
  GALLERY_IMAGE_TYPES,
  GALLERY_VIDEO_MAX_BYTES,
  GALLERY_VIDEO_TYPES,
} from '@/lib/galleryMedia'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const cookieStore = cookies()
        if (!isValidStudioAdminCookie(cookieStore.get(STUDIO_ADMIN_COOKIE)?.value)) {
          throw new Error('Unauthorized')
        }
        if (!pathname.startsWith('gallery/')) {
          throw new Error('Invalid upload path')
        }
        return {
          allowedContentTypes: [...GALLERY_IMAGE_TYPES, ...GALLERY_VIDEO_TYPES],
          maximumSizeInBytes: GALLERY_VIDEO_MAX_BYTES,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    )
  }
}
