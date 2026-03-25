import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WISAR Vehicle Log',
  description: 'Water Island S&R Vehicle Maintenance Tracking System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
