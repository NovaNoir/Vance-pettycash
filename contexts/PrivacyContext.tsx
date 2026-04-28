"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface PrivacyContextType {
  privacyMode: boolean
  togglePrivacyMode: () => void
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("pettycash_privacy_mode")
    if (saved) {
      setPrivacyMode(JSON.parse(saved))
    }
  }, [])

  const togglePrivacyMode = () => {
    const newMode = !privacyMode
    setPrivacyMode(newMode)
    localStorage.setItem("pettycash_privacy_mode", JSON.stringify(newMode))
  }

  return <PrivacyContext.Provider value={{ privacyMode, togglePrivacyMode }}>{children}</PrivacyContext.Provider>
}

export function usePrivacy() {
  const context = useContext(PrivacyContext)
  if (context === undefined) {
    throw new Error("usePrivacy must be used within a PrivacyProvider")
  }
  return context
}
