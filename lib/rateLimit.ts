/**
 * Rate Limiting for CVL Designs API
 * Simple in-memory rate limiter for serverless environments
 * 
 * Note: In a serverless environment, each function instance has its own memory,
 * so this provides "best effort" rate limiting. For stricter enforcement,
 * consider upgrading to Vercel KV or a similar distributed cache.
 */

interface RateLimitEntry {
  count: number
  firstRequestTime: number
}

// In-memory store for rate limiting
// Key: IP address, Value: request tracking data
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
let lastCleanup = Date.now()

/**
 * Clean up expired rate limit entries
 * @param windowMs - The rate limit window in milliseconds
 */
function cleanupExpiredEntries(windowMs: number): void {
  const now = Date.now()
  
  // Only cleanup periodically to avoid performance overhead
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return
  }
  
  lastCleanup = now
  
  // Use forEach for better compatibility
  rateLimitStore.forEach((entry, ip) => {
    if (now - entry.firstRequestTime > windowMs) {
      rateLimitStore.delete(ip)
    }
  })
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Number of requests remaining in the current window */
  remaining: number
  /** Time in milliseconds until the rate limit resets */
  resetIn: number
  /** Total requests made in the current window */
  current: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (usually IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  
  // Cleanup old entries periodically
  cleanupExpiredEntries(config.windowMs)
  
  // Get or create entry for this identifier
  let entry = rateLimitStore.get(identifier)
  
  // If no entry exists or the window has expired, create a new one
  if (!entry || now - entry.firstRequestTime > config.windowMs) {
    entry = {
      count: 1,
      firstRequestTime: now,
    }
    rateLimitStore.set(identifier, entry)
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
      current: 1,
    }
  }
  
  // Increment the counter
  entry.count++
  
  // Calculate time until reset
  const resetIn = config.windowMs - (now - entry.firstRequestTime)
  
  // Check if over the limit
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      current: entry.count,
    }
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn,
    current: entry.count,
  }
}

/**
 * Extract client IP from Next.js request
 * Handles various proxy headers used by Vercel and other platforms
 * @param request - The incoming request
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(request: Request): string {
  // Vercel-specific header (most reliable on Vercel)
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }
  
  // Standard forwarded-for header
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  // Real IP header (used by some proxies)
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }
  
  // Cloudflare-specific header
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }
  
  // Fallback
  return 'unknown'
}

/**
 * Pre-configured rate limiter for order submissions
 * 3 orders per IP per minute
 */
export const ORDER_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 60 * 1000, // 1 minute
}

/**
 * Generate rate limit headers for the response
 * @param result - Rate limit check result
 * @param config - Rate limit configuration
 * @returns Headers object to add to the response
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
  config: RateLimitConfig
): Record<string, string> {
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
  }
}
