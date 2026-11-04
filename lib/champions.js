// Diamond Division champions, newest season first.
//
// Single source of truth: both the homepage's "Defending Champions" cards and
// the /champions hall of fame read from here. They used to keep their own
// copies in opposite orders, so a new champion could be added to one and
// missed on the other.
//
// `image: null` renders the trophy placeholder card until a photo exists.
//
// `focus` is the object-position used when a photo is taller than the card it
// sits in. It defaults to DEFAULT_FOCUS, which suits a typical team photo;
// set it per photo when a team sits unusually high or low in frame.

export const coedChampions = [
  // Back row stands right at the top edge, so this one anchors to the top.
  { season: 9, team: "O'Fosho", image: '/images/champions/oFosho.jpg', year: '2026', focus: '50% 0%' },
  { season: 8, team: 'Net Losses', image: '/images/champions/netLosses2.jpg', year: '2026' },
  { season: 7, team: 'Net Losses', image: '/images/champions/netLosses.jpg', year: '2025' },
  { season: 6, team: 'BounceTown', image: '/images/champions/bounceTown.jpg', year: '2025' },
  { season: 5, team: 'Sauce Walkas', image: '/images/champions/sauceWalkas.jpg', year: '2025' },
  { season: 4, team: 'Setsy & We Know It', image: '/images/champions/sawki.jpg', year: '2024' },
  { season: 3, team: 'Despicable Pookies', image: '/images/champions/dPookies.jpg', year: '2024' },
  { season: 2, team: 'Tip Pics', image: '/images/champions/tipPics.jpg', year: '2024' },
  { season: 1, team: 'Safe Sets', image: '/images/champions/safeSets.jpg', year: '2023' },
]

export const mensChampions = [
  { season: 7, team: 'Tsunami Riptide', image: '/images/champions/tsunamiRiptide.jpg', year: '2026' },
  { season: 6, team: 'Spartans', image: '/images/champions/spartans.jpg', year: '2026' },
  { season: 5, team: "Brandy's Angels", image: '/images/champions/bAngels.jpg', year: '2025' },
  { season: 4, team: "David's Dictatorship", image: '/images/champions/davidDictatorship.jpg', year: '2025' },
  { season: 3, team: 'Sari Sari Squad', image: '/images/champions/sarisari.jpg', year: '2025' },
  { season: 2, team: 'High & Holy', image: '/images/champions/High&Holy.jpg', year: '2024' },
  { season: 1, team: 'Sets With Jerhomies', image: '/images/champions/jerhomies.jpg', year: '2024' },
]

// Thursday REC COED — a newer league, so this list starts at Season 1.
export const recChampions = [
  { season: 1, team: "Tomo's Lizards", image: '/images/champions/tomosLizards.jpg', year: '2026' },
]

// Team photos put people in the upper-middle and the floor at the bottom, so
// spend the crop on the floor rather than on faces.
export const DEFAULT_FOCUS = '50% 25%'

/** Where to anchor a champion photo's crop. */
export function championFocus(champ) {
  return champ?.focus || DEFAULT_FOCUS
}

/** The current title holder for a league, or null before its first season. */
export function defendingChampion(champions) {
  return champions[0] || null
}

/**
 * True when the same team won the two most recent seasons. The homepage used
 * to state this as fixed copy, which would have been wrong the moment a new
 * team took the title.
 */
export function isBackToBack(champions) {
  return champions.length > 1 && champions[0].team === champions[1].team
}
