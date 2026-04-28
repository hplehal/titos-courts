// Slug → Google Drive folder URL for photos. Edit this map when a new
// league season or tournament gets a Drive folder. Keys match the
// `slug` field on League/Tournament records.
//
// Why a static map (and not a DB column): photos are an external
// dependency (Drive), the URL almost never changes within a season,
// and we want zero migration overhead to add the link.

const LEAGUE_PHOTOS = {
  // 'tuesday-coed': 'https://drive.google.com/drive/folders/...',
  // 'sunday-mens': 'https://drive.google.com/drive/folders/...',
  // 'thursday-rec-coed': 'https://drive.google.com/drive/folders/...',
}

const TOURNAMENT_PHOTOS = {
  // 'spring-showdown': 'https://drive.google.com/drive/folders/...',
}

export function getLeaguePhotosUrl(slug) {
  return LEAGUE_PHOTOS[slug] || null
}

export function getTournamentPhotosUrl(slug) {
  return TOURNAMENT_PHOTOS[slug] || null
}
