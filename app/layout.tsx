import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google" // Import Inter font
import "./globals.css"
import { cn } from "@/lib/utils" // Assuming cn utility is available

// Configure Inter font with Vietnamese subset and display swap for performance
const inter = Inter({
  subsets: ["vietnamese", "latin"], // Include 'vietnamese' subset
  display: "swap", // Optimize font loading [^3]
  variable: "--font-sans", // Use as a CSS variable if needed
})

export const metadata: Metadata = {
  title: "TikTok Viral Content Finder",
  description: "Công cụ tìm kiếm video TikTok viral và gợi ý nội dung AI cho Affiliate Marketing.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
      <body>{children}</body>
    </html>
  )
}
