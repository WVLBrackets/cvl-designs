import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CVL Designs',
  description: 'Custom Apparel & Clothing',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if we're in a non-production environment
  // Only check VERCEL_ENV - NODE_ENV is always 'production' in builds
  const isProduction = process.env.VERCEL_ENV === 'production'
  const envName = process.env.VERCEL_ENV || 'development'
  
  return (
    <html lang="en">
      <body className={`${inter.className} w-full max-w-full overflow-x-clip`}>
        {/* Staging/Preview Banner - Only shows in non-production. No rotate: iOS treats
            transformed corners as extra page width and forces pinch-to-fit. */}
        {!isProduction && (
          <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
            <div className="absolute top-2 right-2 rounded-md bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
              {envName.toUpperCase()}
            </div>
          </div>
        )}
        <div className="w-full max-w-full overflow-x-clip">
          {children}
        </div>
      </body>
    </html>
  )
}

