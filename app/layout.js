import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
})

export const metadata = {
  title: {
    default: "Tito's Courts | Recreational Volleyball Leagues in Mississauga & Toronto",
    template: "%s | Tito's Courts Volleyball",
  },
  description:
    "Join Mississauga and Toronto's top recreational volleyball leagues. Three weekly leagues (COED, MENS, REC) with tier-based competition, playoffs, and tournaments at Pakmen Courts. Register your team today.",
  keywords: [
    'volleyball league Mississauga',
    'recreational volleyball Toronto',
    'volleyball Mississauga',
    'volleyball league GTA',
    'coed volleyball league',
    'mens volleyball league',
    'Pakmen Courts volleyball',
    'volleyball tournaments Mississauga',
    'rec volleyball Toronto',
    'Titos Courts',
    'volleyball Etobicoke',
    'adult volleyball league',
  ],
  openGraph: {
    title: "Tito's Courts — Recreational Volleyball Leagues",
    description:
      "Mississauga & Toronto's premier recreational volleyball leagues. Three nights a week. Tier-based competition. Join 150+ players.",
    type: 'website',
    locale: 'en_CA',
    siteName: "Tito's Courts",
    url: 'https://titoscourts.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Tito's Courts Volleyball Leagues",
    description:
      "Recreational volleyball leagues in Mississauga & Toronto. Three weekly leagues, tier-based competition, championship playoffs.",
  },
  alternates: {
    canonical: 'https://titoscourts.com',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SportsOrganization',
  name: "Tito's Courts",
  description: "Mississauga and Toronto's premier recreational volleyball leagues and tournaments.",
  url: 'https://titoscourts.com',
  sport: 'Volleyball',
  email: 'info@titoscourts.com',
  location: [
    {
      '@type': 'Place',
      name: 'Pakmen Courts',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '1775 Sismet Road',
        addressLocality: 'Mississauga',
        addressRegion: 'ON',
        addressCountry: 'CA',
      },
    },
    {
      '@type': 'Place',
      name: 'Michael Power — St. Joseph High School',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Etobicoke',
        addressRegion: 'ON',
        addressCountry: 'CA',
      },
    },
  ],
  sameAs: [
    'https://www.instagram.com/titoscourts',
    'https://www.youtube.com/@titoscourts',
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="min-h-screen flex flex-col bg-titos-surface text-titos-gray-200 antialiased">
        <Navbar />
        <main className="flex-1 pt-16 lg:pt-20">
          {children}
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
