// Security utilities for petty cash management
export const SUPPORTED_CURRENCIES = {
  USD: { symbol: "$", name: "US Dollar", decimals: 2 },
  EUR: { symbol: "€", name: "Euro", decimals: 2 },
  GBP: { symbol: "£", name: "British Pound", decimals: 2 },
  CAD: { symbol: "C$", name: "Canadian Dollar", decimals: 2 },
  AUD: { symbol: "A$", name: "Australian Dollar", decimals: 2 },
  JPY: { symbol: "¥", name: "Japanese Yen", decimals: 0 },
  CHF: { symbol: "CHF", name: "Swiss Franc", decimals: 2 },
  CNY: { symbol: "¥", name: "Chinese Yuan", decimals: 2 },
  INR: { symbol: "₹", name: "Indian Rupee", decimals: 2 },
  BRL: { symbol: "R$", name: "Brazilian Real", decimals: 2 },
} as const

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES

export interface ValidationResult {
  isValid: boolean
  error?: string
}

// Amount validation and sanitization
export function sanitizeAmount(amount: string | number): number {
  if (typeof amount === "number") {
    if (isNaN(amount) || !isFinite(amount)) {
      throw new Error("Amount must be a valid number")
    }
    return Math.max(0, Math.round(amount * 100) / 100)
  }

  if (typeof amount === "string") {
    const cleaned = amount.replace(/[^\d.-]/g, "")
    const parsed = Number.parseFloat(cleaned)

    if (isNaN(parsed) || !isFinite(parsed)) {
      throw new Error("Amount must be a valid number")
    }

    return Math.max(0, Math.round(parsed * 100) / 100)
  }

  throw new Error("Amount must be a valid number")
}

export function validateAmount(amount: string | number): ValidationResult {
  try {
    const sanitized = sanitizeAmount(amount)
    if (sanitized < 0) {
      return { isValid: false, error: "Amount cannot be negative" }
    }
    if (sanitized > 999999.99) {
      return { isValid: false, error: "Amount exceeds maximum limit" }
    }
    return { isValid: true }
  } catch (error) {
    return { isValid: false, error: (error as Error).message }
  }
}

// Input sanitization
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return ""
  return input.trim().replace(/[<>]/g, "").substring(0, 500)
}

// Date validation
export function validateDate(date: string | Date): ValidationResult {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: "Invalid date" }
    }
    return { isValid: true }
  } catch {
    return { isValid: false, error: "Invalid date format" }
  }
}

// Safe arithmetic operations
export function safeAdd(a: number, b: number): number {
  const result = Math.round((a + b) * 100) / 100
  if (!isFinite(result)) {
    throw new Error("Arithmetic overflow")
  }
  return result
}

export function safeSubtract(a: number, b: number): number {
  const result = Math.round((a - b) * 100) / 100
  if (!isFinite(result)) {
    throw new Error("Arithmetic overflow")
  }
  return result
}

// Secure storage wrapper
export const secureStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(`pettycash_${key}`, serialized)
    } catch (error) {
      console.error("Failed to save to storage:", error)
    }
  },

  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(`pettycash_${key}`)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error("Failed to load from storage:", error)
      return null
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(`pettycash_${key}`)
    } catch (error) {
      console.error("Failed to remove from storage:", error)
    }
  }
}

// Error logging
export function logError(error: Error, context?: string): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  }

  console.error("Application Error:", errorInfo)

  // In a real app, you might send this to an error tracking service
  // Example: sendToErrorService(errorInfo)
}

// Currency formatting
export function formatCurrency(amount: number, currency: SupportedCurrency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

// Rate limiting for sensitive operations
const rateLimits = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now()
  const limit = rateLimits.get(key)

  if (!limit || now > limit.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (limit.count >= maxAttempts) {
    return false
  }

  limit.count++
  return true
}

export const rateLimiter = {
  check: checkRateLimit
}

// Generate secure IDs
export function generateSecureId(prefix: string = ""): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `${prefix}${prefix ? "_" : ""}${timestamp}_${random}`
}
