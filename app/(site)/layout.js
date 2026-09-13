import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getActiveLeagues } from '@/lib/server/leagues'

export default async function SiteLayout({ children }) {
  // Active leagues for the navbar's Leagues dropdown, so renamed or newly
  // visible leagues appear without a code change.
  const leagues = await getActiveLeagues().catch(() => [])
  return (
    <>
      <Navbar leagues={leagues.map(l => ({ slug: l.slug, name: l.name }))} />
      <main className="flex-1 pt-16 lg:pt-20">
        {children}
      </main>
      <Footer />
    </>
  )
}
