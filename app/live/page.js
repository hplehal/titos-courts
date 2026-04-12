import LiveClient from './LiveClient'

export const metadata = {
  title: 'Live Scores',
  description: 'Real-time volleyball scores from Tito\'s Courts game nights. Auto-refreshing match results from all courts.',
}

export default function LivePage() {
  return <LiveClient />
}
