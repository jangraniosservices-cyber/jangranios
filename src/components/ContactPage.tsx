import React, { useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import type { SiteSettings } from '../types';
import { GoogleMapsLocation } from './GoogleMapsLocation';

interface ContactPageProps {
  settings: SiteSettings;
  mapsApiKey: string;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings, mapsApiKey }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('NIOS Admission Enquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit enquiry.');
      } else {
        setSuccessMsg(data.message || 'Enquiry submitted successfully!');
        setName('');
        setMobile('');
        setEmail('');
        setMessage('');
      }
    } catch {
      setErrorMsg('Network error. Please try again or reach us on WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <section className="bg-[#0F2557] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="text-sm font-semibold text-amber-400">Contact &amp; Support Desk</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Connect With {settings.businessName}
          </h1>
          <p className="text-base text-slate-200 max-w-2xl">
            Reach us instantly via WhatsApp, click-to-call, email, or submit an enquiry directly to our academic administration team.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        {/* Direct Action Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <a
            href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
              'Hello Jangra NIOS Services, I would like information about NIOS Admission.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition-colors space-y-2"
          >
            <MessageCircle className="w-6 h-6" aria-hidden="true" />
            <p className="font-display text-base font-bold">Direct WhatsApp Enquiry</p>
            <p className="text-sm text-emerald-100 tabular-nums">{settings.phone}</p>
          </a>

          <a
            href={`tel:${settings.phone}`}
            className="p-6 rounded-xl bg-[#0F2557] hover:bg-[#19377D] text-white transition-colors space-y-2"
          >
            <Phone className="w-6 h-6 text-amber-400" aria-hidden="true" />
            <p className="font-display text-base font-bold">Click-to-Call Helpline</p>
            <p className="text-sm text-slate-200 tabular-nums">{settings.phone}</p>
          </a>

          <a
            href={`mailto:${settings.email}`}
            className="p-6 rounded-xl bg-white border border-slate-200 hover:border-[#0F2557] transition-colors space-y-2"
          >
            <Mail className="w-6 h-6 text-[#EA580C]" aria-hidden="true" />
            <p className="font-display text-base font-bold text-[#0F2557]">Gmail Enquiry</p>
            <p className="text-xs sm:text-sm text-slate-600 break-all">{settings.email}</p>
          </a>

          <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-2">
            <Clock className="w-6 h-6 text-[#EA580C]" aria-hidden="true" />
            <p className="font-display text-base font-bold text-[#0F2557]">Working Hours</p>
            <p className="text-xs sm:text-sm text-slate-600">{settings.workingHours}</p>
          </div>
        </div>

        {/* Contact Form + Google Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Form connected to Admin Dashboard */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0F2557]">Send an Enquiry</h2>
              <p className="text-sm text-slate-600 mt-1">
                All enquiries are logged directly in our Administrator Dashboard for prompt follow-up.
              </p>
            </div>

            {successMsg && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-mobile" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Number *
                  </label>
                  <input
                    id="contact-mobile"
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Enquiry Subject
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Message / Question *
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your query regarding Class 10th, Class 12th, Public Exam, or documents..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{submitting ? 'Sending Enquiry...' : 'Submit Enquiry'}</span>
              </button>
            </form>
          </div>

          {/* Office Address & Google Maps Location */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-2">
              <div className="flex items-center gap-2 text-[#0F2557]">
                <MapPin className="w-5 h-5 text-[#EA580C]" aria-hidden="true" />
                <h2 className="font-display text-xl font-bold">Office Location Map</h2>
              </div>
              <p className="text-sm text-slate-600">{settings.address}</p>
            </div>

            <GoogleMapsLocation
              apiKey={mapsApiKey}
              businessName={settings.businessName}
              address={settings.address}
              phone={settings.phone}
              lat={settings.mapLat}
              lng={settings.mapLng}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
