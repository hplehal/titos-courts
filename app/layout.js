import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: 'Arial',
  preload: true,
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  adjustFontFallback: 'Arial',
  preload: true,
  weight: ['400', '500', '600', '700', '800'],
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
    images: [
      {
        url: 'https://titoscourts.com/images/titosHero.jpg',
        width: 1920,
        height: 1080,
        alt: "Tito's Courts volleyball game night",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Tito's Courts Volleyball Leagues",
    description:
      "Recreational volleyball leagues in Mississauga & Toronto. Three weekly leagues, tier-based competition, championship playoffs.",
    images: ['https://titoscourts.com/images/titosHero.jpg'],
  },
  metadataBase: new URL('https://titoscourts.com'),
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
  alternateName: 'Titos Courts Volleyball',
  description: "Mississauga and Toronto's premier recreational volleyball leagues and tournaments. Three weekly leagues with tier-based competition at Pakmen Courts.",
  url: 'https://titoscourts.com',
  logo: 'https://titoscourts.com/images/titos.png',
  image: 'https://titoscourts.com/images/titosHero.jpg',
  sport: 'Volleyball',
  email: 'info@titoscourts.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '1775 Sismet Road',
    addressLocality: 'Mississauga',
    addressRegion: 'ON',
    postalCode: 'L4W 1R3',
    addressCountry: 'CA',
  },
  location: [
    {
      '@type': 'Place',
      name: 'Pakmen Courts',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '1775 Sismet Road',
        addressLocality: 'Mississauga',
        addressRegion: 'ON',
        postalCode: 'L4W 1R3',
        addressCountry: 'CA',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 43.6532,
        longitude: -79.6108,
      },
    },
    {
      '@type': 'Place',
      name: 'Michael Power — St. Joseph High School',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '105 Eringate Dr',
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
  areaServed: [
    { '@type': 'City', name: 'Mississauga' },
    { '@type': 'City', name: 'Toronto' },
    { '@type': 'City', name: 'Etobicoke' },
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
