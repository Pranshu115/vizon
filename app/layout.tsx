import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import BottomNav from '@/components/BottomNav'
import GlobalErrorHandler from '@/components/GlobalErrorHandler'

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Axlerator - Truck Marketplace',
  description: 'Your Premier Truck Marketplace',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <GlobalErrorHandler />
        {children}
        <BottomNav />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
