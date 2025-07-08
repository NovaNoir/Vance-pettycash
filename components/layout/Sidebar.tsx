"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Home,
  Plus,
  Minus,
  History,
  Scale,
  FileText,
  Settings,
  X,
  DollarSign,
  ChevronRight,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigationGroups = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: Home,
        description: "View fund overview and recent activity",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        name: "Initialize Fund",
        href: "/initialize",
        icon: DollarSign,
        description: "Set up your petty cash fund",
      },
      {
        name: "Record Disbursement",
        href: "/disburse",
        icon: Minus,
        description: "Record money going out",
        color: "text-red-600",
      },
      {
        name: "Replenish Fund",
        href: "/replenish",
        icon: Plus,
        description: "Add money to the fund",
        color: "text-green-600",
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        name: "Transaction History",
        href: "/history",
        icon: History,
        description: "View all transactions",
      },
      {
        name: "Reconcile",
        href: "/reconcile",
        icon: Scale,
        description: "Balance your records",
      },
      {
        name: "Reports",
        href: "/report",
        icon: FileText,
        description: "Generate detailed reports",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Configure system preferences",
      },
    ],
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-72 bg-background border-r border-border overflow-y-auto",
          "lg:translate-x-0 lg:static lg:z-auto",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Navigation</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Groups */}
        <nav className="p-4 space-y-6">
          {navigationGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.title}</h3>
              </div>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Tooltip key={item.name} delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon
                              className={cn(
                                "h-4 w-4 transition-colors",
                                isActive
                                  ? "text-primary-foreground"
                                  : item.color || "text-muted-foreground group-hover:text-foreground",
                              )}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>

                          {isActive && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex-shrink-0">
                              <ChevronRight className="h-3 w-3" />
                            </motion.div>
                          )}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="ml-2">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>

              {groupIndex < navigationGroups.length - 1 && <Separator className="mt-4" />}
            </motion.div>
          ))}
        </nav>

        {/* Help Section */}
        <div className="mt-auto p-4 border-t">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs font-medium">Need Help?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Check the settings page for system information and data management options.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
