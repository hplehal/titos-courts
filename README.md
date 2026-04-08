# Tito's Courts

Mississauga's premier recreational volleyball league platform. Three weekly leagues, tier-based competition, and championship playoffs.

**Live site:** [titoscourts.com](https://titoscourts.com)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL via Prisma ORM
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel
- **Icons:** Lucide React

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data
node prisma/seed.js

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env` file:

```
DATABASE_URL="your-postgres-connection-string"
ADMIN_PASSWORD="your-admin-password"
```

## Project Structure

```
app/
  page.js                    # Home
  leagues/                   # League hub + individual league pages
  standings/                 # Season standings with division bands
  schedule/                  # Weekly schedule with team filter
  champions/                 # Hall of Champions
  tournaments/               # Tournament listings + brackets
  register/                  # Team & free agent registration
  waiver/                    # Digital player waiver (e-signature)
  rules/                     # League rules & FAQ
  contact/                   # Contact form + venue info
  about/                     # Story, founders, venue
  admin/                     # Admin dashboard (password protected)
    seasons/                 # Season, team, week management
    registrations/           # Registration viewer
    waivers/                 # Signed waivers viewer
    tournaments/             # Tournament management
  api/                       # API routes
components/
  layout/                    # Navbar, Footer
  league/                    # LeagueCard, StandingsTable, TierBlock
  match/                     # MatchCard
  home/                      # LatestResults
  ui/                        # SectionHeading, StatusBadge, Accordion, etc.
lib/
  prisma.js                  # Prisma client singleton
  utils.js                   # Utility functions
  hooks/useMyTeam.js         # Session-persisted team filter
prisma/
  schema.prisma              # Database schema
  seed.js                    # Seed data script
```

## Leagues

| League | Day | Teams | Tiers | Time |
|--------|-----|-------|-------|------|
| Tuesday COED | Tuesday | 24 | 8 | 8 PM - 12 AM |
| Sunday MENS | Sunday | 15 | 5 | 9 PM - 12 AM |
| Thursday REC COED | Thursday | 12 | 4 | 8 PM - 12 AM |

### How It Works

- Teams are grouped into **tiers of 3**
- Each week: round-robin within your tier
- **1st place moves up** a tier, **2nd stays**, **3rd drops down**
- 11-week seasons: Week 1 placement, Weeks 2-10 regular season, Week 11 playoffs
- Points: **Tier Factor** (Tier 1 = 8 pts, down to Tier 8 = 1 pt) + **Sets Won**
- Playoff divisions: Diamond, Platinum, Gold, Silver, Bronze

## Admin

Access at `/admin` (password protected).

**Single-page dashboard** with 4 workflow tabs:
1. **Scores** — Enter match scores inline
2. **Results** — View tier standings
3. **Tiers** — Confirm movements + swap teams between tiers
4. **Next Week** — Generate next week's schedule

### Team Swap

Click any team in the Tiers tab to select it, then click another team in a different tier to swap them. Matches are automatically regenerated.

## Venues

- **Pakmen Courts** — 1775 Sismet Road, Mississauga, ON (Tue COED, Sun MENS)
- **Michael Power - St. Joseph HS** — Etobicoke, Toronto, ON (Thu REC COED)

## Contact

- **Email:** info@titoscourts.com
- **Instagram:** [@titoscourts](https://instagram.com/titoscourts)
- **YouTube:** [@titoscourts](https://youtube.com/@titoscourts)
