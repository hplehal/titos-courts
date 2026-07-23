'use client'

import { useState, useEffect } from 'react'
import { Shield, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const waiverSections = [
  {
    title: 'Assumption of Risk',
    content: `I acknowledge that participation in recreational volleyball leagues and tournaments organized by Tito's Courts involves inherent risks, including but not limited to: physical contact with other players, falls, sprains, strains, fractures, and other injuries. I understand that volleyball is a physical sport and that injuries can occur even with proper precautions. I voluntarily assume all risks associated with my participation.`,
  },
  {
    title: 'Release of Liability',
    content: `I hereby release, waive, and discharge Tito's Courts, its organizers, co-founders, volunteers, venue operators (including Pakmen Courts and Michael Power — St. Joseph High School), and all affiliated parties from any and all liability, claims, demands, or causes of action arising out of or related to any injury, illness, damage, or loss sustained during my participation in any Tito's Courts league, tournament, or event. This release applies regardless of whether such injury is caused by negligence or otherwise.`,
  },
  {
    title: 'Medical Acknowledgement',
    content: `I confirm that I am physically fit and have no medical conditions that would prevent my safe participation in recreational volleyball. I understand that Tito's Courts does not provide medical personnel on-site. In the event of an injury, I authorize the organizers to seek emergency medical treatment on my behalf if I am unable to do so. I accept full responsibility for any medical costs incurred.`,
  },
  {
    title: 'Rules & Conduct',
    content: `I agree to abide by all rules and regulations of Tito's Courts, including the league rules, sportsmanship expectations, and referee decisions. I understand that unsportsmanlike conduct, aggressive behavior, or violations of league rules may result in ejection from a game, suspension, or removal from the league without refund. I will treat all players, referees, organizers, and venue staff with respect.`,
  },
  {
    title: 'Photo & Video Consent',
    content: `I grant Tito's Courts permission to use photographs, video recordings, and other media taken during league play and events for promotional purposes, including but not limited to: social media (Instagram, YouTube), the Tito's Courts website, and marketing materials. I understand I will not receive compensation for such use.`,
  },
  {
    title: 'Refund Policy',
    content: `I understand that league registration fees are non-refundable once the season has started. If I or my team withdraws before the season begins, a partial refund may be issued at the discretion of the organizers. No refunds will be given for missed games, forfeits, or individual absences.`,
  },
]

export default function WaiverPage() {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', dateOfBirth: '',
    emergencyName: '', emergencyPhone: '',
    leagueDay: '', tournamentName: '', teamName: '',
    agreedToTerms: false, agreedToLiability: false, agreedToMedia: false,
    signatureName: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  // Active/upcoming tournaments for the dropdown. Fetched once on mount from
  // the public /api/tournaments endpoint. Quietly falls back to empty on
  // failure — the field becomes a freeform text input as a graceful degrade.
  const [tournaments, setTournaments] = useState([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/tournaments')
      .then(r => r.ok ? r.json() : [])
      .then(list => {
        if (cancelled) return
        // Show tournaments that are not yet completed, most recent first —
        // someone signing a waiver is almost always registering for an
        // upcoming or in-progress event, not a past one.
        const relevant = (Array.isArray(list) ? list : [])
          .filter(t => t.status !== 'completed')
          .sort((a, b) => new Date(b.date) - new Date(a.date))
        setTournaments(relevant)
      })
      .catch(() => { /* endpoint down — leave list empty, UI handles it */ })
    return () => { cancelled = true }
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const allAgreed = form.agreedToTerms && form.agreedToLiability
  const canSubmit = form.fullName && form.email && form.signatureName && allAgreed

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Failed to submit. Check your connection.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="py-20 px-4 min-h-screen flex items-center justify-center">
        <div className="card rounded-xl p-10 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-status-success/15 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-status-success" />
          </div>
          <h2 className="font-display text-2xl font-black text-titos-white mb-3">Waiver Signed!</h2>
          <p className="text-titos-gray-300 mb-2">
            Thank you, <strong className="text-titos-white">{form.fullName}</strong>. Your waiver has been recorded.
          </p>
          <p className="text-titos-gray-500 text-sm">
            Signed on {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Shield className="w-10 h-10 text-titos-gold mx-auto mb-4" />
          <h1 className="font-display text-3xl sm:text-4xl font-black text-titos-white mb-3">
            Player Waiver & Release
          </h1>
          <p className="text-titos-gray-300 text-sm max-w-lg mx-auto">
            All players must sign this waiver before participating in any Tito&apos;s Courts league or tournament.
            Please read each section carefully.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Player Info */}
          <div className="card-flat rounded-xl p-6 mb-6">
            <h2 className="font-display text-lg font-black text-titos-white mb-4">Player Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-titos-gray-400 uppercase tracking-wider mb-1">Full Name *</label>
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-titos-gray-400 uppercase tracking-wider mb-1">Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-titos-gray-400 uppercase tracking-wider mb-1">Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-titos-gray-400 uppercase tracking-wider mb-1">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange}
                  className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50 [color-scheme:dark]" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-titos-gray-400 uppercase tracking-wider mb-1">Emergency Contact Name</label>
                <input type="text" name="emergencyName" value={form.emergencyName} onChange={handleChange}
                  className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-titos-gray-400 uppercase tracking-wider mb-1">Emergency Contact Phone</label>
                <input type="tel" name="emergencyPhone" value={form.emergencyPhone} onChange={handleChange}
                  className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-titos-gray-400 uppercase tracking-wider mb-1">League</label>
                <select name="leagueDay" value={form.leagueDay} onChange={handleChange}
                  className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50">
                  <option value="">Select league...</option>
                  <option value="Tuesday COED">Tuesday COED</option>
                  <option value="Sunday MENS">Sunday MENS</option>
                  <option value="Thursday REC COED">Thursday REC COED</option>
                  <option value="Tournament">Tournament Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-titos-gray-400 uppercase tracking-wider mb-1">
                  Tournament <span className="text-titos-gray-500 font-medium normal-case tracking-normal">(if applicable)</span>
                </label>
                {tournaments.length > 0 ? (
                  <select
                    name="tournamentName"
                    value={form.tournamentName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm focus:outline-none focus:border-titos-gold/50"
                  >
                    <option value="">None — league only</option>
                    {tournaments.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  // Fallback: /api/tournaments failed or no active tournaments.
                  // Freeform text keeps the field usable — admin can still
                  // capture which event someone signed up for.
                  <input
                    type="text"
                    name="tournamentName"
                    value={form.tournamentName}
                    onChange={handleChange}
                    placeholder="Tournament name (if any)"
                    className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm placeholder-titos-gray-600 focus:outline-none focus:border-titos-gold/50"
                  />
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-titos-gray-400 uppercase tracking-wider mb-1">Team Name</label>
              <input type="text" name="teamName" value={form.teamName} onChange={handleChange} placeholder="If known"
                className="w-full px-4 py-3 bg-titos-elevated border border-titos-border rounded-lg text-titos-white text-sm placeholder-titos-gray-600 focus:outline-none focus:border-titos-gold/50" />
            </div>
          </div>

          {/* Waiver Sections */}
          <div className="space-y-4 mb-6">
            {waiverSections.map((section, i) => (
              <div key={i} className="card-flat rounded-xl p-5">
                <h3 className="font-display text-sm font-black text-titos-white mb-2 uppercase tracking-wide">
                  {i + 1}. {section.title}
                </h3>
                <p className="text-titos-gray-400 text-xs leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Agreements */}
          <div className="card-flat rounded-xl p-6 mb-6 space-y-4">
            <h2 className="font-display text-lg font-black text-titos-white mb-2">Agreement</h2>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" name="agreedToTerms" checked={form.agreedToTerms} onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-titos-border bg-titos-elevated text-titos-gold focus:ring-titos-gold/25" />
              <span className="text-titos-gray-300 text-sm leading-relaxed group-hover:text-titos-white transition-colors">
                I have read and agree to all the terms, conditions, and rules outlined above. I understand the risks of participation and voluntarily choose to participate. <strong className="text-titos-gold">*</strong>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" name="agreedToLiability" checked={form.agreedToLiability} onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-titos-border bg-titos-elevated text-titos-gold focus:ring-titos-gold/25" />
              <span className="text-titos-gray-300 text-sm leading-relaxed group-hover:text-titos-white transition-colors">
                I release Tito&apos;s Courts and all affiliated parties from any and all liability for injuries or damages sustained during participation. <strong className="text-titos-gold">*</strong>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" name="agreedToMedia" checked={form.agreedToMedia} onChange={handleChange}
                className="mt-1 w-4 h-4 rounded border-titos-border bg-titos-elevated text-titos-gold focus:ring-titos-gold/25" />
              <span className="text-titos-gray-300 text-sm leading-relaxed group-hover:text-titos-white transition-colors">
                I consent to the use of my image in photos and videos for Tito&apos;s Courts promotional purposes.
              </span>
            </label>
          </div>

          {/* Signature */}
          <div className="card-flat rounded-xl p-6 mb-6">
            <h2 className="font-display text-lg font-black text-titos-white mb-4">Electronic Signature</h2>
            <p className="text-titos-gray-400 text-xs mb-4">
              By typing your full legal name below, you acknowledge that this constitutes your electronic signature
              and is legally equivalent to a handwritten signature.
            </p>
            <div>
              <label className="block text-xs font-bold text-titos-gray-400 uppercase tracking-wider mb-1">Type Your Full Name *</label>
              <input
                type="text"
                name="signatureName"
                value={form.signatureName}
                onChange={handleChange}
                required
                placeholder="Your full legal name"
                className="w-full px-4 py-4 bg-titos-elevated border-2 border-titos-border rounded-lg text-titos-white text-lg font-display italic focus:outline-none focus:border-titos-gold/50"
              />
            </div>
            <p className="text-titos-gray-500 text-[11px] mt-2">
              Date: {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Submit */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-status-live/10 border border-status-live/30 text-status-live text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={cn('w-full py-4 rounded-xl text-lg font-black uppercase tracking-wider transition-all',
              canSubmit
                ? 'bg-titos-gold text-black hover:bg-titos-gold-light hover:shadow-lg hover:shadow-titos-gold/20'
                : 'bg-titos-charcoal text-titos-gray-500 cursor-not-allowed'
            )}
          >
            {submitting ? 'Submitting...' : canSubmit ? 'Sign Waiver' : 'Complete all required fields to sign'}
          </button>
        </form>
      </div>
    </div>
  )
}
