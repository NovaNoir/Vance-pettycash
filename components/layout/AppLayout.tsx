"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Menu, Bell, User, Shield, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sidebar } from "./Sidebar"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { ThemeToggle } from "@/components/theme-toggle"
import { isSecureContext } from "@/lib/security"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isSecure, setIsSecure] = useState(true)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Check secure context
  useEffect(() => {
    setIsSecure(isSecureContext())
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Security Warning */}
        {!isSecure && (
          <Alert className="rounded-none border-red-500 bg-red-50 dark:bg-red-950">
            <Shield className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>Security Warning:</strong> This application should be accessed over HTTPS for security.
            </AlertDescription>
          </Alert>
        )}

        {/* Offline Warning */}
        {!isOnline && (
          <Alert className="rounded-none border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <WifiOff className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <strong>Offline Mode:</strong> You're currently offline. Some features may not be available.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="hidden lg:flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">PC</span>
                </div>
                <div>
                  <h1 className="font-semibold text-lg">Petty Cash Manager</h1>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Online Status */}
              <div className="hidden sm:flex items-center space-x-2">
                {isOnline ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs">Offline</span>
                  </div>
                )}
              </div>

              {/* Notifications (placeholder for future) */}
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  0
                </Badge>
              </Button>

              {/* User Menu (placeholder for future) */}
              <Button variant="ghost" size="icon" aria-label="User menu">
                <User className="h-5 w-5" />
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar isOpen={true} onClose={() => {}} />
          </div>

          {/* Mobile Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Main Content */}
          <main className="flex-1 lg:ml-0">
            <div className="container mx-auto px-4 py-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {children}
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
