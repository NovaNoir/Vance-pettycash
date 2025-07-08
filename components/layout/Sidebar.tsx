"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Plus, Minus, History, BarChart3, FileText, Settings, DollarSign } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Initialize Fund", href: "/initialize", icon: DollarSign },
  { name: "Record Disbursement", href: "/disburse", icon: Minus },
  { name: "Replenish Fund", href: "/replenish", icon: Plus },
  { name: "Transaction History", href: "/history", icon: History },
  { name: "Reconcile", href: "/reconcile", icon: BarChart3 },
  { name: "Reports", href: "/report", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      <div className="flex h-16 items-center border-b px-6">
        <DollarSign className="h-6 w-6 text-primary" />
        <span className="ml-2 text-lg font-semibold">Petty Cash Manager</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
