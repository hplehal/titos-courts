'use client'

import { useState } from 'react'
import { Users, UserPlus, Trophy, X, Plus, Check, DollarSign, Calendar, Info } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import FormField from '@/components/ui/FormField'

export default function RegisterPage() {
  const [tab, setTab] = useState('league')
  const [players, setPlayers] = useState([''])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    leagueSlug: 'tuesday-coed', teamName: '', captainName: '', captainEmail: '', captainPhone: '',
    skillLevel: '', preferredDay: '', hearAbout: '', waiverAccepted: false, playerCount: '',
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tab === 'freeagent' ? 'free_agent' : tab,
          leagueSlug: tab === 'league' ? form.leagueSlug : null,
          teamName: form.teamName || null,
          captainName: form.captainName,
          captainEmail: form.captainEmail,
          captainPhone: form.captainPhone || null,
          playerCount: players.filter(Boolean).length || parseInt(form.playerCount) || null,
          playerNames: JSON.stringify(players.filter(Boolean)),
          skillLevel: form.skillLevel || null,
          preferredDay: form.preferredDay || null,
          heardAboutUs: form.hearAbout || null,
        }),
      })
      if (res.ok) setSuccess(true)
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  if (success) {
    return (
      <div className="py-20 px-4 min-h-screen flex items-center justify-center">
        <div className="card rounded-xl p-10 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-status-success/15 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-status-success" />
          </div>
          <h2 className="font-display text-2xl font-bold text-titos-white mb-3">Registration Submitted!</h2>
          <p className="text-titos-gray-300 mb-6">We&apos;ll review your submission and get back to you with next steps.</p>
          <button onClick={() => { setSuccess(false); setForm({ leagueSlug: 'tuesday-coed', teamName: '', captainName: '', captainEmail: '', captainPhone: '', skillLevel: '', preferredDay: '', hearAbout: '', waiverAccepted: false, playerCount: '' }); setPlayers(['']) }}
            className="px-6 py-3 bg-titos-gold hover:bg-titos-gold-light text-titos-surface font-bold rounded-lg transition-colors">
            Register Another
          </button>
        </div>
      </div>
    )
  }

  const leagueFees = { 'tuesday-coed': 230, 'sunday-mens': 220, 'thursday-rec-coed': 200 }

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionHeading label="SIGN UP" title="Join the League" description="Register your team, sign up for a tournament, or join as a free agent." />

        <div className="grid lg:grid-cols-3 gap-8 mt-10">
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-8">
              {[{ id: 'league', label: 'League', icon: Users }, { id: 'tournament', label: 'Tournament', icon: Trophy }, { id: 'freeagent', label: 'Free Agent', icon: UserPlus }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    tab === t.id ? 'bg-titos-gold/15 text-titos-gold border border-titos-gold/30' : 'card text-titos-gray-300 hover:text-titos-white'
                  }`}>
                  <t.icon className="w-4 h-4" />{t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {tab === 'league' && (
                <FormField label="League" name="leagueSlug" type="select" required value={form.leagueSlug} onChange={handleChange}
                  options={[{ value: 'tuesday-coed', label: 'Tuesday COED' }, { value: 'sunday-mens', label: 'Sunday MENS' }, { value: 'thursday-rec-coed', label: 'Thursday REC COED' }]} />
              )}
              {(tab === 'league' || tab === 'tournament') && (
                <FormField label="Team Name" name="teamName" required placeholder="e.g., Block Party" value={form.teamName} onChange={handleChange} />
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label={tab === 'freeagent' ? 'Your Name' : 'Captain Name'} name="captainName" required placeholder="Full name" value={form.captainName} onChange={handleChange} />
                <FormField label="Email" name="captainEmail" type="email" required placeholder="you@example.com" value={form.captainEmail} onChange={handleChange} />
              </div>
              <FormField label="Phone" name="captainPhone" type="tel" placeholder="(416) 555-1234" value={form.captainPhone} onChange={handleChange} />

              {tab === 'freeagent' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Skill Level" name="skillLevel" type="select" options={['Beginner', 'Intermediate', 'Advanced']} value={form.skillLevel} onChange={handleChange} />
                  <FormField label="Preferred League Day" name="preferredDay" type="select" options={['Tuesday (COED)', 'Sunday (MENS)', 'Thursday (REC COED)', 'Any']} value={form.preferredDay} onChange={handleChange} />
                </div>
              )}

              {tab === 'league' && (
                <div>
                  <label className="block text-sm font-medium text-titos-gray-200 mb-3">Player Names</label>
                  <div className="space-y-2">
                    {players.map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="text" placeholder={`Player ${i + 1}`} value={p} onChange={(e) => { const u = [...players]; u[i] = e.target.value; setPlayers(u) }}
                          className="flex-1 px-4 py-3 bg-titos-card border border-titos-border rounded-lg text-titos-white placeholder-titos-gray-400 focus:outline-none focus:border-titos-gold/50 transition-colors" />
                        {players.length > 1 && <button type="button" onClick={() => setPlayers(players.filter((_, j) => j !== i))} className="p-3 text-titos-gray-500 hover:text-status-live"><X className="w-4 h-4" /></button>}
                      </div>
                    ))}
                    <button type="button" onClick={() => setPlayers([...players, ''])} className="flex items-center gap-2 text-titos-gold text-sm font-medium"><Plus className="w-4 h-4" /> Add Player</button>
                  </div>
                </div>
              )}

              <FormField label="How did you hear about us?" name="hearAbout" type="select" options={['Instagram', 'Friend/Referral', 'Returning Team', 'Google', 'Other']} value={form.hearAbout} onChange={handleChange} />

              <button type="submit" disabled={submitting}
                className="w-full py-4 bg-titos-gold hover:bg-titos-gold-light disabled:opacity-50 text-titos-surface font-bold text-lg rounded-xl transition-all">
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4"><DollarSign className="w-5 h-5 text-titos-gold" /><h3 className="font-display font-bold text-titos-white">Payment</h3></div>
              <div className="space-y-3 text-sm">
                <p className="text-titos-gray-300">Payment via e-transfer to:</p>
                <p className="text-titos-white font-semibold">info@titoscourts.com</p>
                <p className="text-titos-gray-400 text-xs">Include your team name as the memo. Fee details will be shared upon registration confirmation.</p>
              </div>
            </div>
            <div className="card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4"><Calendar className="w-5 h-5 text-titos-gold" /><h3 className="font-display font-bold text-titos-white">Season Info</h3></div>
              <ul className="space-y-2 text-sm text-titos-gray-300">
                <li>11-week seasons (placement + 9 regular + playoffs)</li>
                <li>Games: 8 PM – 12 AM on league night</li>
                <li>Tue/Sun: Pakmen Courts, Mississauga</li>
                <li>Thu: Michael Power HS, Etobicoke</li>
                <li>Courts 6, 7, 8, 9</li>
              </ul>
            </div>
            <div className="card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4"><Info className="w-5 h-5 text-titos-gold" /><h3 className="font-display font-bold text-titos-white">What&apos;s Included</h3></div>
              <ul className="space-y-2 text-sm text-titos-gray-300">
                <li>&bull; 10+ matches per season</li>
                <li>&bull; Tier-based competition</li>
                <li>&bull; Championship playoffs</li>
                <li>&bull; Live score tracking</li>
                <li>&bull; Community events</li>
              </ul>
            </div>
            <a href="/waiver" className="card rounded-xl p-6 block group hover:border-titos-gold/40 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">📋</span>
                <h3 className="font-display font-bold text-titos-white group-hover:text-titos-gold transition-colors">Player Waiver</h3>
              </div>
              <p className="text-titos-gray-400 text-xs">All players must sign the waiver before playing. Sign it online — takes 2 minutes.</p>
              <span className="text-titos-gold text-xs font-bold uppercase tracking-wider mt-2 block">Sign Waiver →</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
