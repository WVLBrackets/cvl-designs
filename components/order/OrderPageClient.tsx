'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Client component to handle store slug from localStorage
 * This runs on the client side to check if there's a saved store
 */
export default function OrderPageClient() {
  const router = useRouter()

  useEffect(() => {
    // Check localStorage for the current store
    try {
      const savedStore = localStorage.getItem('cvl-current-store')
      
      if (savedStore) {
        // Redirect to the store page with the slug
        router.push(`/?store=${savedStore}`)
        return
      }
    } catch (error) {
      console.error('Failed to check localStorage:', error)
    }
    
    // No saved store found, redirect to home page
    router.push('/home')
  }, [router])

  // Show a loading state while checking
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

