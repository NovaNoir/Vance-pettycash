"use client"

import { Menu, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavbarProps {
  onMenuClick: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Petty Cash Manager</h1>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
