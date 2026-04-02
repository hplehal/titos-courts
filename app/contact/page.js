'use client'

import { useState } from 'react'
import { Mail, MapPin, Send, Check } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import FormField from '@/components/ui/FormField'

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { setSuccess(true); setForm({ name: '', email: '', subject: '', message: '' }) }
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <SectionHeading label="GET IN TOUCH" title="Contact Us" description="Questions about leagues, tournaments, or registration? We'd love to hear from you." />

        <div className="grid lg:grid-cols-3 gap-8 mt-10">
          <div className="lg:col-span-2">
            {success ? (
              <div className="card rounded-xl p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-status-success/15 flex items-center justify-center mx-auto mb-4"><Check className="w-7 h-7 text-status-success" /></div>
                <h3 className="font-display text-xl font-bold text-titos-white mb-2">Message Sent!</h3>
                <p className="text-titos-gray-300 mb-6">We&apos;ll get back to you as soon as possible.</p>
                <button onClick={() => setSuccess(false)} className="px-6 py-2.5 bg-titos-gold hover:bg-titos-gold-light text-titos-surface font-bold rounded-lg transition-colors">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Name" name="name" required placeholder="Your name" value={form.name} onChange={handleChange} />
                  <FormField label="Email" name="email" type="email" required placeholder="you@example.com" value={form.email} onChange={handleChange} />
                </div>
                <FormField label="Subject" name="subject" required placeholder="What's this about?" value={form.subject} onChange={handleChange} />
                <FormField label="Message" name="message" type="textarea" required placeholder="Tell us more..." rows={6} value={form.message} onChange={handleChange} />
                <button type="submit" disabled={submitting}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-titos-gold hover:bg-titos-gold-light disabled:opacity-50 text-titos-surface font-bold text-lg rounded-xl transition-all">
                  <Send className="w-5 h-5" />{submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <div className="card rounded-xl p-6">
              <h3 className="font-display font-bold text-titos-white mb-4">Quick Contact</h3>
              <div className="space-y-4">
                <a href="mailto:info@titoscourts.com" className="flex items-center gap-3 text-titos-gray-300 hover:text-titos-gold transition-colors">
                  <Mail className="w-5 h-5" /><span className="text-sm">info@titoscourts.com</span>
                </a>
                <div className="flex items-start gap-3 text-titos-gray-300">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Pakmen Courts<br />1775 Sismet Road<br />Mississauga, ON</span>
                </div>
              </div>
            </div>
            <div className="card rounded-xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2889.7!2d-79.6394!3d43.6167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b40!2sPakmen+Volleyball!5e0!3m2!1sen!2sca"
                className="w-full h-48 border-0"
                allowFullScreen
                loading="lazy"
                title="Pakmen Courts Location"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
