import type { Metadata, Viewport } from "next"
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/syne'
import "./globals.css"
import "./academy.css"
import "./immersive.css"
import "./night-study.css"
import "./auth.css"
import { BRAND } from "@/lib/brand"
import { Providers } from "./providers"
import { PwaInstall } from "@/components/PwaInstall"
import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: `${BRAND.full}`,
  applicationName: BRAND.short,
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-180.png' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: BRAND.short },
  description:
    "Omni-Intelligent Investment Advisor & Risk Management AI — lightweight financial copilot for ordinary investors. Natural-language strategy generation, live risk monitoring, and one-click portfolio execution.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070809",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-[var(--bg-0)] text-[var(--fg-0)]">
        <Providers>{children}<PwaInstall /></Providers>
        {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && <Analytics />}
      </body>
    </html>
  )
}
