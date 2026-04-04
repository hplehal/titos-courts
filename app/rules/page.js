'use client'

import { BookOpen, Scale, Users, Shield, AlertTriangle, Megaphone, Trophy, ArrowUpDown } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import { Accordion } from '@/components/ui/Accordion'

const sections = [
  {
    icon: ArrowUpDown, title: 'The Tier System',
    items: [
      'Teams are grouped into tiers of 3 teams each',
      'Each week, your tier plays round-robin: 3 unique matchups × 2 rounds = 6 games',
      '1st place moves UP one tier. 2nd place stays. 3rd place drops DOWN one tier.',
      'Tier 1: 3rd drops to T2, but 1st and 2nd stay (you\'re already at the top)',
      'Bottom tier: 3rd stays (can\'t drop further)',
      'Week 1 is placement — results seed your initial tier for Week 2',
    ],
  },
  {
    icon: BookOpen, title: 'Match Format & Scoring',
    items: [
      'Sets played to 25 points (rally scoring), cap at 27',
      '2 sets per match',
      'Points per week: Tier Factor (Tier 1 = 8 pts, Tier 2 = 7, down to Tier 8 = 1) + Sets Won',
      'Example: Tier 1 team wins 3 sets = 10 + 3 = 13 weekly points',
      'Ranking within a tier: (1) Sets Won, (2) Point Differential, (3) Head-to-Head',
      'Season standings: Cumulative weekly points across all weeks',
    ],
  },
  {
    icon: Users, title: 'COED-Specific Rules',
    items: [
      'Minimum 2 females and 2 males on court at all times (standard: 4M + 2F)',
      'Female libero cannot sub off leaving 5 males on court',
      'FIVB rules as baseline for all play',
      'Ceiling play allowed once on own side',
      'Jump serves allowed — one foot over the service line is permitted',
    ],
  },
  {
    icon: AlertTriangle, title: 'Lateness & Forfeit Policy',
    items: [
      '15 minutes late: 10 points awarded to the opponent',
      '20+ minutes late: Automatic forfeit — scored as 25-0, 25-0',
      'Forfeiting team receives 0 sets won for the week',
      'If you know you\'ll be short, notify the league ASAP',
    ],
  },
  {
    icon: Megaphone, title: 'Referee Duties',
    items: [
      'The team sitting out each game serves as the referee crew',
      'Required: 1 head referee, 2 line judges, 1 scorekeeper',
      'Complete the game sheet fully — both teams\' scores for Set 1 and Set 2, plus point differential',
      'Ref rotation is assigned per game within the tier schedule',
    ],
  },
  {
    icon: Trophy, title: 'Playoff Format',
    items: [
      'Final overall standings determine playoff division placement',
      '5 divisions: Diamond, Platinum, Gold, Silver, Bronze — cutoffs scale with total teams per league',
      'Division cutoffs scale with the total number of teams that season',
      'Single-elimination brackets within each division',
      'Week 11 is playoff week — every team competes for their division championship',
    ],
  },
  {
    icon: Shield, title: 'Captain Responsibilities',
    items: [
      'Ensure your team arrives on time and ready to play',
      'Submit full roster with signed waivers before Week 1',
      'Communicate schedule changes to your team members',
      'Handle score sheet duties when your team is on ref duty',
      'Contact the league via WhatsApp captains group or email with any issues',
    ],
  },
]

const faqs = [
  { title: 'What skill level are the leagues for?', content: 'We have options for all levels. The Tuesday and Sunday leagues are competitive rec — you should be comfortable with basic volleyball skills. Thursday REC COED is designed for beginners and casual players.' },
  { title: 'Where do games take place?', content: 'Tuesday COED and Sunday MENS play at Pakmen Courts, 1775 Sismet Road, Mississauga. Thursday REC COED plays at Michael Power — St. Joseph High School in Etobicoke, Toronto.' },
  { title: 'How do I pay?', content: 'Payment is via e-transfer to info@titoscourts.com with your team name as the memo. Fee details are shared upon registration confirmation.' },
  { title: 'What\'s the difference between leagues and tournaments?', content: 'Leagues are 11-week seasons with weekly games, tier movement, and playoffs. Tournaments are standalone one-day events with pool play and elimination brackets.' },
  { title: 'How does the tier system work?', content: 'Teams are grouped in tiers of 3. Each week you play round-robin within your tier. 1st place moves up a tier, 2nd stays, 3rd drops down. By season end, cumulative standings determine playoff divisions.' },
  { title: 'What if my team can\'t make a week?', content: 'Contact the organizer ASAP. If you don\'t show up, standard forfeit rules apply (25-0, 25-0). Repeated no-shows may result in removal from the league.' },
  { title: 'Can individual players (free agents) sign up?', content: 'Yes! Register as a free agent and we\'ll place you on a team that needs players.' },
  { title: 'What equipment do I need?', content: 'Indoor court shoes with non-marking soles are required.' },
]

export default function RulesPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <SectionHeading label="OFFICIAL RULES" title="League Rules & Info" description="Everything you need to know about how our leagues work." />

        <div className="mt-12 space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-titos-gold/10"><section.icon className="w-5 h-5 text-titos-gold" /></div>
                <h3 className="font-display text-lg font-bold text-titos-white">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-titos-gray-300 text-sm">
                    <span className="text-titos-gold mt-1 flex-shrink-0">&bull;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <SectionHeading label="FAQ" title="Frequently Asked Questions" />
          <div className="mt-8">
            <Accordion items={faqs} />
          </div>
        </div>
      </div>
    </div>
  )
}
