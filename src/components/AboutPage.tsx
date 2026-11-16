import React from 'react';
import { Clock, Compass, Mail, MapPin, MessageCircle, Phone, Target, Users } from 'lucide-react';
import type { PageView, SiteSettings } from '../types';

interface AboutPageProps {
  settings: SiteSettings;
  onNavigate: (page: PageView) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings, onNavigate }) => {
  return (
    <div className="bg-white">
      {/* Page Header */}
      <section className="bg-[#0F2557] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="text-sm font-semibold text-amber-400">About {settings.businessName}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight [text-wrap:balance]">
            Guiding Learners Toward Recognised Academic Success
          </h1>
          <p className="text-base text-slate-200 max-w-2xl leading-relaxed">
            Transparent NIOS admission support, structured counselling, and complete student assistance from registration to certification.
          </p>
        </div>
      </section>

      {/* Introduction & Counseling Image */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 space-y-5 flex flex-col justify-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2557]">
                Business Introduction
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                {settings.aboutIntro}
              </p>
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-display text-base font-bold text-[#0F2557]">
                  NIOS Admission Guidance
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {settings.niosGuidance}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('admission')}
                  className="px-5 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Apply for Admission
                </button>
                <a
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>WhatsApp Us</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[300px]">
              <img
                src="/src/assets/images/about_counseling_center_1794807151721.jpg"
                alt="Academic advisor assisting student at Jangra NIOS Services"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Objectives */}
      <section className="py-14 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#0F2557] text-amber-400 flex items-center justify-center">
                <Target className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#0F2557]">Our Mission</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{settings.mission}</p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-400 text-[#0F2557] flex items-center justify-center">
                <Compass className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#0F2557]">Our Vision</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{settings.vision}</p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#EA580C] text-white flex items-center justify-center">
                <Users className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-display text-lg font-bold text-[#0F2557]">Educational Objectives</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{settings.objectives}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Office Details & Working Hours */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-[#0F2557] mb-8">
            Office Contact &amp; Business Working Hours
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <Phone className="w-5 h-5 text-[#EA580C]" aria-hidden="true" />
              <p className="text-xs font-medium text-slate-500">Contact Number</p>
              <a
                href={`tel:${settings.phone}`}
                className="block font-display text-base font-bold text-[#0F2557] hover:text-[#EA580C] tabular-nums"
              >
                {settings.phone}
              </a>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <Mail className="w-5 h-5 text-[#EA580C]" aria-hidden="true" />
              <p className="text-xs font-medium text-slate-500">Email Address</p>
              <a
                href={`mailto:${settings.email}`}
                className="block font-display text-sm font-bold text-[#0F2557] hover:text-[#EA580C] break-all"
              >
                {settings.email}
              </a>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <MapPin className="w-5 h-5 text-[#EA580C]" aria-hidden="true" />
              <p className="text-xs font-medium text-slate-500">Office Address</p>
              <p className="text-sm font-medium text-slate-800">{settings.address}</p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <Clock className="w-5 h-5 text-[#EA580C]" aria-hidden="true" />
              <p className="text-xs font-medium text-slate-500">Working Hours</p>
              <p className="text-sm font-medium text-slate-800">{settings.workingHours}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
