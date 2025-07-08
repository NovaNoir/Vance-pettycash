import DOMPurify from "isomorphic-dompurify"

// Input sanitization utilities
export const sanitizeInput = (input: string): string => {
  if (!input) return ""
  return DOMPurify.sanitize(input.trim())
}

export const sanitizeAmount = (amount: string): number => {
  const sanitized = amount.replace(/[^0-9.-]/g, "")
  const parsed = Number.parseFloat(sanitized)
  return isNaN(parsed) ? 0 : Math.max(0, parsed)
}

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateAmount = (amount: number, max?: number): { isValid: boolean; error?: string } => {
  if (amount <= 0) {
    return { isValid: false, error: "Amount must be greater than 0" }
  }
  if (max && amount > max) {
    return { isValid: false, error: `Amount cannot exceed ${max.toFixed(2)}` }
  }
  return { isValid: true }
}

export const validateDate = (date: string): { isValid: boolean; error?: string } => {
  const selectedDate = new Date(date)
  const today = new Date()

  if (isNaN(selectedDate.getTime())) {
    return { isValid: false, error: "Invalid date format" }
  }

  if (selectedDate > today) {
    return { isValid: false, error: "Date cannot be in the future" }
  }

  return { isValid: true }
}

// Rate limiting for client-side
class RateLimiter {
  private attempts: Map<string, number[]> = new Map()

  isAllowed(key: string, maxAttempts = 5, windowMs = 60000): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []

    // Remove old attempts outside the window
    const validAttempts = attempts.filter((time) => now - time < windowMs)

    if (validAttempts.length >= maxAttempts) {
      return false
    }

    validAttempts.push(now)
    this.attempts.set(key, validAttempts)
    return true
  }
}

export const rateLimiter = new RateLimiter()

// Error logging utility
export const logError = (error: Error, context?: Record<string, any>) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
  }

  // In production, send to logging service
  console.error("Application Error:", errorData)

  // Could integrate with services like Sentry, LogRocket, etc.
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "exception", {
      description: error.message,
      fatal: false,
    })
  }
}

// Secure session management utilities
export const generateSessionId = (): string => {
  const array = new Uint8Array(32)
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array)
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export const isSecureContext = (): boolean => {
  return typeof window !== "undefined" && (window.isSecureContext || window.location.protocol === "https:")
}
