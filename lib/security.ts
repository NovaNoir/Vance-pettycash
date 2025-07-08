import DOMPurify from "isomorphic-dompurify"

/* ----------------------------------------------------------------
 *  Sanitation helpers
 * ---------------------------------------------------------------- */
export const sanitizeInput = (input: string): string => (input ? DOMPurify.sanitize(input.trim()) : "")

/**
 * Convert a user-entered money string to a positive number.
 * Strips everything except digits, - (minus) & . (decimal point).
 */
export const sanitizeAmount = (amount: string): number => {
  const numeric = amount.replace(/[^0-9.-]/g, "")
  const parsed = Number.parseFloat(numeric)
  return isNaN(parsed) ? 0 : Math.max(0, parsed)
}

/* ----------------------------------------------------------------
 *  Validation helpers
 * ---------------------------------------------------------------- */
export const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const validateAmount = (amount: number, max?: number): { isValid: boolean; error?: string } => {
  if (amount <= 0) return { isValid: false, error: "Amount must be greater than 0" }
  if (max && amount > max)
    return {
      isValid: false,
      error: `Amount cannot exceed ${max.toFixed(2)}`,
    }
  return { isValid: true }
}

export const validateDate = (date: string): { isValid: boolean; error?: string } => {
  const selected = new Date(date)
  const today = new Date()

  if (isNaN(selected.getTime())) return { isValid: false, error: "Invalid date format" }
  if (selected > today) return { isValid: false, error: "Date cannot be in the future" }
  return { isValid: true }
}

/* ----------------------------------------------------------------
 *  Rate limiting (client-side only)
 * ---------------------------------------------------------------- */
class RateLimiter {
  private attempts = new Map<string, number[]>()

  isAllowed(key: string, maxAttempts = 5, windowMs = 60_000): boolean {
    const now = Date.now()
    const windowAttempts = this.attempts.get(key) ?? []
    const recent = windowAttempts.filter((t) => now - t < windowMs)

    if (recent.length >= maxAttempts) return false

    recent.push(now)
    this.attempts.set(key, recent)
    return true
  }

  reset(key: string) {
    this.attempts.delete(key)
  }
}

export const rateLimiter = new RateLimiter()

/* ----------------------------------------------------------------
 *  Error logging (restored)
 * ---------------------------------------------------------------- */
export const logError = (error: Error, context?: Record<string, unknown>) => {
  const payload = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server-side",
  }

  // eslint-disable-next-line no-console
  console.error("Application Error:", payload)

  /* Example: send to an external service
     fetch("/api/log", { method: "POST", body: JSON.stringify(payload) })
  */

  if (typeof window !== "undefined" && (window as any).gtag) {
    ;(window as any).gtag("event", "exception", {
      description: error.message,
      fatal: false,
    })
  }
}

/* ----------------------------------------------------------------
 *  Misc. helpers
 * ---------------------------------------------------------------- */
export const generateSessionId = (): string => {
  const bytes = new Uint8Array(32)
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(bytes)
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export const isSecureContext = (): boolean =>
  typeof window !== "undefined" ? window.isSecureContext || window.location.protocol === "https:" : true

/* ----------------------------------------------------------------
 *  Optional secure localStorage wrapper (retains previous addition)
 * ---------------------------------------------------------------- */
const generateHash = (data: string): string => {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + data.charCodeAt(i)
    // eslint-disable-next-line no-bitwise
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

export const secureStorage = {
  setItem(key: string, value: unknown): void {
    try {
      const serialized = JSON.stringify({
        data: value,
        time: Date.now(),
        hash: generateHash(JSON.stringify(value)),
      })
      localStorage.setItem(key, serialized)
    } catch (err) {
      console.error("secureStorage.setItem failed:", err)
    }
  },

  getItem<T = unknown>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (generateHash(JSON.stringify(parsed.data)) !== parsed.hash) {
        console.warn("secureStorage integrity check failed for", key)
        localStorage.removeItem(key)
        return null
      }
      return parsed.data as T
    } catch (err) {
      console.error("secureStorage.getItem failed:", err)
      return null
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key)
  },
}
