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
    <html lang="en" className="overflow-x-hidden">
      <body className={`${inter.className} overflow-x-hidden max-w-full`}>
        {/* Staging/Preview Banner - Only shows in non-production */}
        {!isProduction && (
          <div className="fixed top-2 right-2 z-50 pointer-events-none max-w-[40vw]">
            <div className="bg-red-600 text-white px-2 py-1 rounded-lg shadow-lg font-bold text-[10px] sm:text-sm flex items-center gap-1 border-2 border-red-800 rotate-12">
              <span className="text-sm sm:text-xl">⚠️</span>
              <span className="truncate">{envName.toUpperCase()}</span>
            </div>
          </div>
        )}
        {children}
      </body>
    </html>
  )
}

