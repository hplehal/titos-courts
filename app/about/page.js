'use client'

import Image from 'next/image'
import { Heart, Target, Users, Trophy, MapPin, User } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import StatCounter from '@/components/ui/StatCounter'

const values = [
  { icon: Users, title: 'Community', description: 'Building lasting friendships through volleyball. Every player is part of the Tito\'s family.' },
  { icon: Heart, title: 'Inclusivity', description: 'All skill levels welcome. From beginners to competitive players — there\'s a tier for everyone.' },
  { icon: Target, title: 'Competition', description: 'The tier system ensures every game is competitive. You\'re always matched against teams at your level.' },
]

export default function AboutPage() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Story */}
        <section className="mb-20">
          <SectionHeading label="OUR STORY" title="About Tito's Courts" description="How a passion for volleyball became Mississauga's favourite rec league." />

          <div className="mt-10 card rounded-xl p-8 lg:p-10">
            <div className="grid lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-3">
                <p className="text-titos-gray-200 leading-relaxed mb-4">
                  Tito&apos;s Courts started the way all great things do — with a group of friends who just wanted to play volleyball.
                  In 2023, Hartej gathered a handful of people, booked a court at Pakmen, and set up what was supposed to be a one-time thing.
                </p>
                <p className="text-titos-gray-200 leading-relaxed mb-4">
                  It wasn&apos;t. That first game turned into a weekly session, which turned into a proper league with teams,
                  standings, tiers, and playoffs. Word spread fast across the GTA — turns out a lot of people were looking for
                  exactly this kind of community.
                </p>
                <p className="text-titos-gray-200 leading-relaxed">
                  Today, Tito&apos;s Courts runs three weekly leagues with 50+ teams, multiple tournaments per month, and a growing
                  community of volleyball lovers who show up every week to compete, socialize, and have fun.
                </p>
              </div>
              <div className="lg:col-span-2">
                <div className="aspect-[3/4] rounded-xl bg-titos-charcoal border border-titos-border flex items-center justify-center overflow-hidden">
                  <Image src="/images/titosHero.jpg" alt="Tito's Courts community" width={400} height={500} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mb-20">
          <SectionHeading label="WHAT WE STAND FOR" title="Mission & Values" />
          <div className="mt-10 grid sm:grid-cols-3 gap-4">
            {values.map(v => (
              <div key={v.title} className="card rounded-xl p-6">
                <div className="p-2.5 rounded-lg bg-titos-gold/10 w-fit mb-4"><v.icon className="w-5 h-5 text-titos-gold" /></div>
                <h3 className="font-display font-bold text-titos-white mb-2">{v.title}</h3>
                <p className="text-titos-gray-400 text-sm leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Venue */}
        <section className="mb-20">
          <SectionHeading label="THE VENUE" title="Pakmen Courts" />
          <div className="mt-10 card rounded-xl p-8">
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 text-titos-gold flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display text-lg font-bold text-titos-white mb-2">1775 Sismet Road, Mississauga, ON</h3>
                <p className="text-titos-gray-300 leading-relaxed mb-4">
                  Pakmen is one of the premier volleyball facilities in the GTA. We use Courts 6, 7, 8, and 9 —
                  four full-size indoor courts running simultaneously on game nights from 8 PM to midnight.
                  Professional nets, hardwood floors, and a great atmosphere.
                </p>
                <p className="text-titos-gray-400 text-sm">
                  Tip: The parking lot gets busy for the 8 PM slot. Arrive a few minutes early to grab a spot.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* By the Numbers */}
        <section className="mb-20">
          <SectionHeading label="BY THE NUMBERS" title="The League at a Glance" />
          <div className="mt-10 card rounded-xl p-6 sm:p-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCounter value="9" label="Seasons" icon={Trophy} />
              <StatCounter value="150" suffix="+" label="Players" icon={Users} />
              <StatCounter value="3" label="Leagues Weekly" icon={Target} />
              <StatCounter value="4" label="Courts" icon={MapPin} />
            </div>
          </div>
        </section>

        {/* Founder */}
        <section>
          <SectionHeading label="THE FOUNDER" title="Meet Hartej" />
          <div className="mt-10 card rounded-xl p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-titos-charcoal flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-titos-gold/50" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-titos-white mb-2">Hartej</h3>
                <p className="text-titos-gold text-sm font-semibold mb-3">Founder & League Organizer</p>
                <p className="text-titos-gray-300 leading-relaxed">
                  Volleyball lover, community builder, and the engine behind Tito&apos;s Courts. Hartej handles everything from
                  scheduling and venue booking to live score tracking and making sure the vibes stay immaculate.
                  When he&apos;s not organizing the league, you&apos;ll find him on the court trying to land a jump serve.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
