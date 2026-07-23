export const metadata = {
  title: "Volleyball Hall of Champions — Mississauga | Tito's Courts",
  description: "Past season champions of Tito's Courts volleyball leagues in Mississauga. Tuesday Coed and Sunday Men's Diamond division winners across 14 seasons.",
  alternates: { canonical: 'https://titoscourts.com/champions' },
  openGraph: {
    title: "Volleyball Hall of Champions — Tito's Courts",
    description: "Past Diamond division champions across 14 seasons of Tito's Courts volleyball.",
    url: 'https://titoscourts.com/champions',
    type: 'website',
    images: ['/images/titosHero.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Volleyball Hall of Champions — Tito's Courts",
    description: "Past Diamond division champions of Tito's Courts volleyball.",
    images: ['/images/titosHero.jpg'],
  },
}

export default function ChampionsLayout({ children }) {
  return children
}
