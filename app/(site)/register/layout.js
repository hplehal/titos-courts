export const metadata = {
  title: "Register Your Volleyball Team Mississauga | Tito's Courts",
  description: "Sign your team up for Tito's Courts recreational volleyball leagues or one-day tournaments in Mississauga. Coed, Men's, and Rec Coed divisions available.",
  alternates: { canonical: 'https://titoscourts.com/register' },
  openGraph: {
    title: "Register Your Volleyball Team Mississauga",
    description: "Sign your team up for Tito's Courts volleyball leagues and tournaments.",
    url: 'https://titoscourts.com/register',
    type: 'website',
    images: ['/images/titosHero.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Register for Volleyball — Mississauga",
    description: "Sign your team up for Tito's Courts volleyball.",
    images: ['/images/titosHero.jpg'],
  },
}

export default function RegisterLayout({ children }) {
  return children
}
