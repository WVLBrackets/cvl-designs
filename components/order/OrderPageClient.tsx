'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Client component to handle store slug from localStorage
 * This runs on the client side to check if there's a saved store
 */
export default function OrderPageClient({ errorMessage }: { errorMessage?: string }) {
  const router = useRouter()

  useEffect(() => {
    // If there's an error message, redirect to home with error
    if (errorMessage) {
      router.push(`/team-stores?error=${encodeURIComponent(errorMessage)}`)
      return
    }
    
    router.push('/home')
  }, [router, errorMessage])

  // Show a loading state while checking
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{errorMessage ? 'Redirecting...' : 'Loading...'}</p>
      </div>
    </div>
  )
}

