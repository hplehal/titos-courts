import Script from 'next/script'

export const metadata = {
  title: "Volleyball League Rules & FAQ Mississauga | Tito's Courts",
  description: "Complete rules, tier system, scoring format, and frequently asked questions for Tito's Courts recreational volleyball leagues in Mississauga.",
  alternates: { canonical: 'https://titoscourts.com/rules' },
  openGraph: {
    title: "Volleyball League Rules & FAQ",
    description: "Rules, tier system, scoring format, and FAQs for Tito's Courts volleyball leagues.",
    url: 'https://titoscourts.com/rules',
    type: 'website',
    images: ['/images/titosHero.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Volleyball League Rules & FAQ",
    description: "Rules, tier system, and FAQs for Tito's Courts volleyball.",
    images: ['/images/titosHero.jpg'],
  },
}

// FAQPage JSON-LD so Google can display rich FAQ snippets in search results.
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the tier system work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Teams are grouped into tiers of 3. Each week they play a round-robin against the other 2 teams in their tier (6 total games). 1st place in the tier moves up, 2nd stays, 3rd drops down. Tier 1 is the highest skill level.",
      },
    },
    {
      '@type': 'Question',
      name: 'How is scoring calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Weekly points = Tier Factor + Sets Won. Tier 1 = 8 base points, Tier 2 = 7, down to Tier 8 = 1. So winning 3 sets in Tier 1 gives 11 points (8 + 3). Season standings use cumulative weekly points.",
      },
    },
    {
      '@type': 'Question',
      name: 'What happens in the playoffs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "End-of-season standings determine your playoff division: Diamond, Platinum, Gold, Silver, or Bronze. Each division plays its own single-elimination bracket.",
      },
    },
    {
      '@type': 'Question',
      name: 'How many players per team?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Teams register with a minimum of 6 players and can carry a roster of up to 12. Coed leagues require at least 2 women on the court at all times.",
      },
    },
    {
      '@type': 'Question',
      name: 'Where do games take place?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Tuesday Coed and Sunday Men's leagues play at Pakmen Courts (1775 Sismet Road, Mississauga). Thursday Rec Coed plays at Michael Power — St. Joseph High School in Etobicoke.",
      },
    },
  ],
}

export default function RulesLayout({ children }) {
  return (
    <>
      <Script id="rules-faq-jsonld" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(faqJsonLd)}
      </Script>
      {children}
    </>
  )
}
