'use client'

import Image from 'next/image'
import { Heart, Target, Users, MapPin, User } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'

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
                  In 2023, Tej and Christian gathered a handful of people, booked a court at Pakmen, and set up what was supposed to be a one-time thing.
                </p>
                <p className="text-titos-gray-200 leading-relaxed mb-4">
                  It wasn&apos;t. That first game turned into a weekly session, which turned into a proper league with teams,
                  standings, tiers, and playoffs. Word spread fast across the GTA,turns out a lot of people were looking for
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

        {/* Venues */}
        <section className="mb-20">
          <SectionHeading label="OUR VENUES" title="Where We Play" />
          <div className="mt-10 grid md:grid-cols-2 gap-4">
            <div className="card rounded-xl p-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-titos-gold flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-display text-base font-bold text-titos-white mb-1">Pakmen Courts</h3>
                  <p className="text-titos-gray-400 text-sm mb-3">1775 Sismet Road, Mississauga, ON</p>
                  <p className="text-titos-gray-300 text-sm leading-relaxed mb-2">
                    Our primary home. Four full-size indoor courts (Courts 6–9) with professional nets and hardwood floors.
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-titos-gray-400 text-xs">
                    <span className="px-2 py-0.5 bg-titos-card rounded border border-titos-border/30">Tue COED</span>
                    <span className="px-2 py-0.5 bg-titos-card rounded border border-titos-border/30">Sun MENS</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="card rounded-xl p-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-titos-gold flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-display text-base font-bold text-titos-white mb-1">Michael Power — St. Joseph High School</h3>
                  <p className="text-titos-gray-400 text-sm mb-3">Etobicoke, Toronto, ON</p>
                  <p className="text-titos-gray-300 text-sm leading-relaxed mb-2">
                    Our second location for the Thursday REC COED league. A great gym space in the heart of Etobicoke.
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-titos-gray-400 text-xs">
                    <span className="px-2 py-0.5 bg-titos-card rounded border border-titos-border/30">Thu REC COED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founders */}
        <section>
          <SectionHeading label="THE FOUNDERS" title="Meet Tej & Christian" />
          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            <div className="card rounded-xl p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-titos-charcoal flex items-center justify-center flex-shrink-0">
                  <User className="w-9 h-9 text-titos-gold/50" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-titos-white mb-1">Tej</h3>
                  <p className="text-titos-gold text-sm font-semibold mb-3">Co-Founder · Operations</p>
                  <p className="text-titos-gray-300 text-sm leading-relaxed">
                    The behind-the-scenes engine of Tito&apos;s Courts. Tej handles all the operations — from building the scoring system and managing league logistics to venue coordination and making sure everything runs seamlessly every game night.
                  </p>
                </div>
              </div>
            </div>
            <div className="card rounded-xl p-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-titos-charcoal flex items-center justify-center flex-shrink-0">
                  <User className="w-9 h-9 text-titos-gold/50" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-titos-white mb-1">Christian</h3>
                  <p className="text-titos-gold text-sm font-semibold mb-3">Co-Founder · Community & Media</p>
                  <p className="text-titos-gray-300 text-sm leading-relaxed">
                    The face and voice of Tito&apos;s Courts. Christian runs the social media, captures all the photos and videos, and keeps the lines open with players and captains. If you&apos;ve seen it on the gram, Christian made it happen.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
