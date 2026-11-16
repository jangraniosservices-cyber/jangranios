import React, { useState } from 'react';
import { GraduationCap, Mail, MapPin, Phone, X } from 'lucide-react';
import type { PageView, SiteSettings } from '../types';

interface FooterProps {
  settings: SiteSettings;
  onNavigate: (page: PageView) => void;
  onOpenPortalLogin: (tab: 'student' | 'admin') => void;
}

type PolicyKey = 'privacy' | 'terms' | 'refund' | null;

export const Footer: React.FC<FooterProps> = ({ settings, onNavigate, onOpenPortalLogin }) => {
  const [activePolicy, setActivePolicy] = useState<PolicyKey>(null);

  return (
    <footer className="bg-[#0A1A3F] text-slate-200 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand & About */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-lg bg-amber-400 text-[#0A1A3F] flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold text-white tracking-tight">
                {settings.businessName}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Dedicated NIOS admission counselling, Class 10th &amp; Class 12th academic support, practical guidance, and student portal services.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                WhatsApp Desk
              </a>
              <a
                href={`tel:${settings.phone}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-600 hover:border-amber-400 text-slate-200 transition-colors"
              >
                Call Helpline
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links & Portals */}
          <div>
            <h3 className="font-display text-sm font-semibold text-amber-400 mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => onNavigate('home')} className="hover:text-amber-300 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('about')} className="hover:text-amber-300 transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('courses')} className="hover:text-amber-300 transition-colors">
                  Courses &amp; Services
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('admission')} className="hover:text-amber-300 transition-colors">
                  Online Admission
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onOpenPortalLogin('student')} className="hover:text-amber-300 transition-colors">
                  Student Login
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onOpenPortalLogin('admin')} className="hover:text-amber-300 transition-colors">
                  Admin Login
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Policies */}
          <div>
            <h3 className="font-display text-sm font-semibold text-amber-400 mb-4">Policies &amp; Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button type="button" onClick={() => setActivePolicy('privacy')} className="hover:text-amber-300 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePolicy('terms')} className="hover:text-amber-300 transition-colors">
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActivePolicy('refund')} className="hover:text-amber-300 transition-colors">
                  Refund Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('contact')} className="hover:text-amber-300 transition-colors">
                  Contact &amp; Grievance Desk
                </button>
              </li>
            </ul>
            <div className="mt-5">
              <p className="text-xs text-slate-400 mb-2">Connect With Us</p>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">
                  WhatsApp
                </a>
                <span aria-hidden="true">·</span>
                <a href={`mailto:${settings.email}`} className="hover:text-amber-400">
                  Gmail
                </a>
                <span aria-hidden="true">·</span>
                <button type="button" onClick={() => onNavigate('contact')} className="hover:text-amber-400">
                  Campus Map
                </button>
              </div>
            </div>
          </div>

          {/* Column 4: Contact Information */}
          <div className="space-y-3 text-sm">
            <h3 className="font-display text-sm font-semibold text-amber-400 mb-4">Contact Information</h3>
            <div className="flex items-start gap-2.5 text-slate-300">
              <Phone className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
              <a href={`tel:${settings.phone}`} className="hover:text-white tabular-nums">
                {settings.phone}
              </a>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <Mail className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
              <a href={`mailto:${settings.email}`} className="hover:text-white break-all">
                {settings.email}
              </a>
            </div>
            <div className="flex items-start gap-2.5 text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{settings.address}</span>
            </div>
            <p className="text-xs text-slate-400 pt-1">{settings.workingHours}</p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} {settings.businessName}. All rights reserved.</p>
          <p>Independent NIOS Admission Guidance &amp; Student Support Portal</p>
        </div>
      </div>

      {/* Policy Modal */}
      {activePolicy && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white text-slate-900 rounded-xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-display text-lg font-bold text-[#0F2557]">
                {activePolicy === 'privacy' && 'Privacy Policy'}
                {activePolicy === 'terms' && 'Terms and Conditions'}
                {activePolicy === 'refund' && 'Refund Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close policy dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 text-sm text-slate-700 space-y-3 leading-relaxed">
              {activePolicy === 'privacy' && (
                <>
                  <p>
                    <strong>{settings.businessName}</strong> respects student privacy and protects all personal and educational records collected during admission and exam registration.
                  </p>
                  <p>
                    Sensitive identity documents such as Aadhaar Cards are stored in access-controlled server directories restricted strictly to authorised administrators for NIOS verification purposes only.
                  </p>
                  <p>
                    We never store student debit/credit card numbers or banking credentials. Online payments are processed via verified UPI / Razorpay gateway references. This website integrates Google Maps features subject to the Google Maps End User Additional Terms of Service and Google Privacy Policy.
                  </p>
                </>
              )}
              {activePolicy === 'terms' && (
                <>
                  <p>
                    By submitting an online admission or public exam form on {settings.businessName}, applicants confirm that all personal information, previous board marksheets, photographs, and identity records are genuine and accurate.
                  </p>
                  <p>
                    Student accounts and study support subscriptions are non-transferable and automatically expire at the end of the selected validity period unless renewed.
                  </p>
                  <p>
                    Official board examinations, hall tickets, and mark sheets are governed by the rules and schedule of the National Institute of Open Schooling (NIOS).
                  </p>
                </>
              )}
              {activePolicy === 'refund' && (
                <>
                  <p>
                    Subscription fees and admission assistance fees are eligible for review within 48 hours of payment only if duplicate payment occurred or portal access was not activated due to a verified technical error.
                  </p>
                  <p>
                    Once board registration, TMA processing, or document submission has been initiated with NIOS, government/board examination fees are non-refundable.
                  </p>
                  <p>
                    To request a billing review, contact {settings.email} or {settings.phone} with your Receipt Number.
                  </p>
                </>
              )}
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="px-4 py-2 rounded-lg bg-[#0F2557] text-white text-sm font-semibold hover:bg-[#19377D]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
