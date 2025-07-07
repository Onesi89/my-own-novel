/**
 * Input Validation and Sanitization Utilities
 * Provides XSS protection and input validation
 */

// Character limits for different input types
export const INPUT_LIMITS = {
  // Text fields
  USERNAME: 50,
  EMAIL: 254,
  PASSWORD: 128,
  
  // Story related
  STORY_TITLE: 200,
  LOCATION_NAME: 100,
  LOCATION_DESCRIPTION: 500,
  STORY_HINT: 300,
  CHOICE_TEXT: 200,
  CHOICE_DESCRIPTION: 300,
  
  // General text areas
  SHORT_TEXT: 100,
  MEDIUM_TEXT: 500,
  LONG_TEXT: 1000,
  STORY_CONTENT: 50000,
  
  // Search and filters
  SEARCH_QUERY: 100,
  TAG: 30,
} as const

/**
 * Sanitizes HTML to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')
  
  // Escape dangerous characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
  
  return sanitized
}

/**
 * Sanitizes input for safe use in attributes
 */
export function sanitizeAttribute(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/[^\w\s-_.]/g, '') // Keep only safe characters
    .trim()
}

/**
 * Validates and truncates input based on character limit
 */
export function validateLength(input: string, maxLength: number): string {
  if (!input || typeof input !== 'string') return ''
  
  // Trim whitespace
  const trimmed = input.trim()
  
  // Truncate if exceeds limit
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength)
  }
  
  return trimmed
}

/**
 * Sanitizes user input with length validation
 */
export function sanitizeInput(
  input: string, 
  maxLength: number = INPUT_LIMITS.MEDIUM_TEXT
): string {
  if (!input || typeof input !== 'string') return ''
  
  // First validate length
  const validated = validateLength(input, maxLength)
  
  // Then sanitize for XSS
  return sanitizeHtml(validated)
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= INPUT_LIMITS.EMAIL
}

/**
 * Validates and sanitizes JSON input
 */
export function sanitizeJson(input: any): any {
  if (typeof input === 'string') {
    return sanitizeInput(input)
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeJson(item))
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      // Sanitize the key as well
      const safeKey = sanitizeAttribute(key)
      sanitized[safeKey] = sanitizeJson(value)
    }
    return sanitized
  }
  
  // For numbers, booleans, null
  return input
}

/**
 * Validates file names to prevent directory traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName || typeof fileName !== 'string') return ''
  
  // Remove path separators and dangerous characters
  return fileName
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\.{2,}/g, '_') // Replace multiple dots
    .trim()
}

/**
 * Sanitizes URL parameters
 */
export function sanitizeUrlParam(param: string): string {
  if (!param || typeof param !== 'string') return ''
  
  return encodeURIComponent(sanitizeInput(param))
}

/**
 * Batch sanitize an object's string properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  limits: Partial<Record<keyof T, number>> = {}
): T {
  const sanitized = {} as T
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const limit = limits[key as keyof T] || INPUT_LIMITS.MEDIUM_TEXT
      sanitized[key as keyof T] = sanitizeInput(value, limit) as any
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeJson(value)
    } else {
      sanitized[key as keyof T] = value
    }
  }
  
  return sanitized
}

/**
 * Validates and sanitizes search queries
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return ''
  
  // Remove special regex characters that could cause issues
  const sanitized = query
    .replace(/[.*+?^${}()|[\]\\]/g, ' ')
    .trim()
  
  return validateLength(sanitized, INPUT_LIMITS.SEARCH_QUERY)
}