import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bookshelf - Track Your Reading Journey',
  description: 'A modern, minimalist book tracking application',
  keywords: ['books', 'reading', 'tracker', 'library', 'goodreads alternative'],
  authors: [{ name: 'Bookshelf Team' }],
  openGraph: {
    title: 'Bookshelf - Track Your Reading Journey',
    description: 'A modern, minimalist book tracking application',
    url: 'https://bookshelf.sh',
    siteName: 'Bookshelf',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bookshelf - Track Your Reading Journey',
    description: 'A modern, minimalist book tracking application',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              {children}
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
