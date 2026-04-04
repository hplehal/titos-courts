import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

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
    default: "Tito's Courts | Mississauga's Premier Recreational Volleyball Leagues",
    template: "%s | Tito's Courts",
  },
  description:
    "Mississauga and Toronto's premier recreational volleyball leagues and tournaments. Multiple weekly leagues for all skill levels at Pakmen Courts and Michael Power HS. Join the community.",
  openGraph: {
    title: "Tito's Courts Volleyball Leagues",
    description:
      "Mississauga's premier recreational volleyball leagues and tournaments at Pakmen Courts.",
    type: 'website',
    locale: 'en_CA',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Tito's Courts Volleyball Leagues",
    description:
      "Mississauga's premier recreational volleyball leagues and tournaments.",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col bg-titos-surface text-titos-gray-200 antialiased">
        <Navbar />
        <main className="flex-1 pt-16 lg:pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
