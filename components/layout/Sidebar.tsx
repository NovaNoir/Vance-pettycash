"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Home, DollarSign, TrendingDown, TrendingUp, History, BarChart3, Settings, RefreshCw, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Initialize", href: "/initialize", icon: DollarSign },
  { name: "Disburse", href: "/disburse", icon: TrendingDown },
  { name: "Replenish", href: "/replenish", icon: TrendingUp },
  { name: "History", href: "/history", icon: History },
  { name: "Reports", href: "/report", icon: BarChart3 },
  { name: "Reconcile", href: "/reconcile", icon: RefreshCw },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isMobile: boolean
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6" />
          <span className="font-bold">Petty Cash Manager</span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Button
                key={item.name}
                variant={isActive ? "secondary" : "ghost"}
                className={cn("w-full justify-start", isActive && "bg-secondary")}
                asChild
                onClick={onClose}
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              </Button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

export function Sidebar({ open, onOpenChange, isMobile }: SidebarProps) {
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent onClose={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-64 border-r bg-background">
      <SidebarContent />
    </div>
  )
}
