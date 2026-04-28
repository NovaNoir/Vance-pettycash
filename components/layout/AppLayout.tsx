"use client"

import type React from "react"

import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { Navbar } from "./Navbar"
import { Sidebar } from "./Sidebar"
import { useMobile } from "@/hooks/use-mobile"
import { useState } from "react"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex">
          <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} isMobile={isMobile} />
          <main className="flex-1 p-6 lg:ml-64">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
