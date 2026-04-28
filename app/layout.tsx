import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { PettyCashProvider } from "@/contexts/PettyCashContext"
import { PrivacyProvider } from "@/contexts/PrivacyContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Petty Cash Manager",
  description: "A comprehensive petty cash management system",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <PrivacyProvider>
            <PettyCashProvider>
              <AppLayout>{children}</AppLayout>
              <Toaster />
            </PettyCashProvider>
          </PrivacyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
