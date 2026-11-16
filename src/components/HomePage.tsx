import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  FileCheck,
  GraduationCap,
  Lock,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import type {
  AnnouncementItem,
  CourseItem,
  GalleryItem,
  PageView,
  SiteSettings,
} from '../types';

interface HomePageProps {
  settings: SiteSettings;
  courses: CourseItem[];
  announcements: AnnouncementItem[];
  gallery: GalleryItem[];
  onNavigate: (page: PageView, preselectedCourse?: string) => void;
  onOpenPortalLogin: (tab: 'student' | 'admin') => void;
}

const TESTIMONIALS = [
  {
    name: 'Ritik Chauhan',
    program: 'NIOS Senior Secondary (Class 12th) · 84% Aggregate',
    outcome: 'Cleared Class 12th Science in Stream 1 and secured B.Sc. Computer Science admission.',
    quote:
      'Jangra NIOS Services handled my subject selection, TMA submissions, and practical file preparation cleanly. Every date sheet and hall ticket update arrived on time.',
  },
  {
    name: 'Neha Kaushik',
    program: 'NIOS Secondary (Class 10th) · 81% Aggregate',
    outcome: 'Completed Class 10th after a two-year gap with Hindi & English medium support.',
    quote:
      'I was unsure how to upload documents and pick subjects after leaving regular school. Their counsellor verified my papers in one sitting and guided me through every board exam.',
  },
  {
    name: 'Deepak Yadav',
    program: 'NIOS Stream 2 Transfer of Credit · Delhi NCR',
    outcome: 'Transferred two passed subjects and cleared remaining Class 12th Commerce papers in one attempt.',
    quote:
      'Having my Student ID, payment receipts, and exam schedule in one portal saved multiple visits. Practical guidance made viva preparation effortless.',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  settings,
  courses,
  announcements,
  gallery,
  onNavigate,
  onOpenPortalLogin,
}) => {
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const featuredCourses = courses.slice(0, 4);

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-[#0A1A3F] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            {/* Left Copy & CTAs */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-amber-400">
                NIOS Class 10th Secondary &amp; Class 12th Senior Secondary Support
              </p>

              <h1 className="font-display text-[clamp(2.25rem,4.2vw,3.75rem)] font-extrabold leading-[1.1] tracking-tight text-white [text-wrap:balance]">
                {settings.heroHeading}
              </h1>

              <p className="font-display text-xl sm:text-2xl font-semibold text-amber-300">
                {settings.heroSubheading}
              </p>

              <p className="text-base text-slate-200 max-w-xl leading-relaxed">
                Complete NIOS online admission assistance, Transfer of Credit (TOC), Public Exam registration, practical preparation, and digital student portal tracking with {settings.businessName}.
              </p>

              {/* Primary + Portal CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('admission')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Apply for Admission</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenPortalLogin('student')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A1A3F] font-semibold text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4" aria-hidden="true" />
                  <span>Student Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenPortalLogin('admin')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-400/50 hover:border-amber-400 text-white font-medium text-sm sm:text-base transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Admin Login</span>
                </button>
              </div>
            </div>

            {/* Right Hero Photography */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/15 bg-[#0F2557] min-h-[300px] lg:min-h-[420px]">
              {!brokenImages['hero'] ? (
                <img
                  src={settings.heroImageUrl}
                  alt="Students at Jangra NIOS Services campus holding textbooks"
                  referrerPolicy="no-referrer"
                  onError={() => setBrokenImages((p) => ({ ...p, hero: true }))}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#0F2557] to-[#1E3A8A]">
                  <GraduationCap className="w-14 h-14 text-amber-400 mb-3" />
                  <p className="font-display text-lg font-bold text-white">{settings.businessName}</p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A1A3F]/95 via-[#0A1A3F]/60 to-transparent p-6">
                <p className="text-sm font-semibold text-amber-300">
                  Stream 1 · Stream 2 · On-Demand Examination
                </p>
                <p className="text-xs text-slate-200 mt-1">
                  Ministry of Education, Government of India recognised open schooling guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Institutional Key Metrics Strip */}
      <section className="bg-amber-400 text-[#0A1A3F] border-b border-amber-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-display text-xl sm:text-2xl font-extrabold tabular-nums">10th &amp; 12th</p>
              <p className="text-xs sm:text-sm font-medium text-[#0A1A3F]/85">Secondary &amp; Senior Secondary</p>
            </div>
            <div>
              <p className="font-display text-xl sm:text-2xl font-extrabold tabular-nums">4-Step</p>
              <p className="text-xs sm:text-sm font-medium text-[#0A1A3F]/85">Verified Online Document Upload</p>
            </div>
            <div>
              <p className="font-display text-xl sm:text-2xl font-extrabold tabular-nums">100% Valid</p>
              <p className="text-xs sm:text-sm font-medium text-[#0A1A3F]/85">Govt., NEET, JEE &amp; University Eligible</p>
            </div>
            <div>
              <p className="font-display text-xl sm:text-2xl font-extrabold tabular-nums">{settings.phone}</p>
              <p className="text-xs sm:text-sm font-medium text-[#0A1A3F]/85">Direct Admission Helpline</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Our Services & NIOS Admission Information */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-sm font-semibold text-[#EA580C]">About Our Services</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0F2557] tracking-tight [text-wrap:balance]">
                Trusted Academic Guidance for NIOS Learners
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                {settings.aboutIntro}
              </p>
              <div className="pt-2 space-y-3 border-t border-slate-200">
                <h3 className="font-display text-lg font-bold text-[#0F2557]">
                  NIOS Admission Information
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {settings.niosGuidance}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="px-5 py-2.5 rounded-lg bg-[#0F2557] hover:bg-[#19377D] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Read About Us
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('admission')}
                  className="px-5 py-2.5 rounded-lg border border-slate-300 hover:border-[#0F2557] text-[#0F2557] text-sm font-semibold transition-colors cursor-pointer"
                >
                  Check Application Status
                </button>
              </div>
            </div>

            {/* Structured Guidance Pillars */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <BookOpen className="w-6 h-6 text-[#EA580C]" aria-hidden="true" />
                <h3 className="font-display text-base font-bold text-[#0F2557]">
                  01. Stream 1 &amp; 2 Admissions
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Fresh Class 10th/12th enrolments and Stream 2 Transfer of Credit (TOC) for compartment or failed board students.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <FileCheck className="w-6 h-6 text-[#0F2557]" aria-hidden="true" />
                <h3 className="font-display text-base font-bold text-[#0F2557]">
                  02. Four-Document Verification
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Guided upload of Photo, Signature, Aadhaar Card, and Qualification Proof with admin pre-check before submission.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <Award className="w-6 h-6 text-amber-600" aria-hidden="true" />
                <h3 className="font-display text-base font-bold text-[#0F2557]">
                  03. TMA &amp; Practical Coaching
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Structured guidance for Tutor Marked Assignments, PCP sessions, lab practical notebooks, and viva voce.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-700" aria-hidden="true" />
                <h3 className="font-display text-base font-bold text-[#0F2557]">
                  04. Dedicated Student Portal
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Automatic Student ID, receipt PDFs, verified UPI/Razorpay subscriptions, and live application tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary & Senior Secondary Featured Courses */}
      <section className="py-16 lg:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#EA580C]">Courses &amp; Academic Services</p>
              <h2 className="font-display text-3xl font-bold text-[#0F2557] tracking-tight">
                Secondary (10th) &amp; Senior Secondary (12th) Programs
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('courses')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F2557] hover:text-[#EA580C] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View All 7 Courses &amp; Services</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCourses.map((course) => (
              <article
                key={course.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  {!brokenImages[`course-${course.id}`] ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      onError={() => setBrokenImages((p) => ({ ...p, [`course-${course.id}`]: true }))}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0F2557]/10 text-[#0F2557]">
                      <BookOpen className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{course.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums font-semibold text-[#0F2557]">
                        ₹{course.fee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#0F2557] leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('admission', course.title)}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#0F2557] hover:bg-[#EA580C] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Apply for Admission
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Announcements & Student Success Stories */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Announcements Column */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#EA580C]">Updates</p>
                  <h2 className="font-display text-2xl font-bold text-[#0F2557]">
                    Latest Announcements
                  </h2>
                </div>
                <Bell className="w-5 h-5 text-[#0F2557]" aria-hidden="true" />
              </div>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-slate-50">
                {announcements.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500">No active announcements at the moment.</p>
                ) : (
                  announcements.slice(0, 5).map((ann) => (
                    <div key={ann.id} className="p-5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-medium text-[#0F2557]">
                          {ann.category}
                          {ann.isUrgent ? ' · Priority Notice' : ''}
                        </span>
                        <span className="tabular-nums">{ann.publishedAt}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-slate-900">
                        {ann.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{ann.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Student Success Stories & Testimonials */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#EA580C]">Student Outcomes</p>
                  <h2 className="font-display text-2xl font-bold text-[#0F2557]">
                    Success Stories &amp; Testimonials
                  </h2>
                </div>
                <Users className="w-5 h-5 text-[#0F2557]" aria-hidden="true" />
              </div>

              <div className="space-y-4">
                {TESTIMONIALS.map((item) => (
                  <blockquote
                    key={item.name}
                    className="p-6 rounded-xl border border-slate-200 bg-white space-y-3"
                  >
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                      “{item.quote}”
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-display text-sm font-bold text-[#0F2557]">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.program}</p>
                      </div>
                      <p className="text-xs font-medium text-emerald-700 inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{item.outcome}</span>
                      </p>
                    </div>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery (Controlled via Admin Dashboard) */}
      <section className="py-16 lg:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10 space-y-2">
            <p className="text-sm font-semibold text-[#EA580C]">Campus &amp; Achievements</p>
            <h2 className="font-display text-3xl font-bold text-[#0F2557] tracking-tight">
              Student Photo Gallery
            </h2>
            <p className="text-sm text-slate-600">
              Snapshots from orientation sessions, academic counselling, study halls, and board results.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxImage(item)}
                className="group text-left bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-[#0F2557] transition-colors cursor-pointer"
              >
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-base font-bold text-[#0F2557]">{item.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.caption}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Helpline & Quick Enquiry CTA Banner */}
      <section className="bg-[#0F2557] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Need Guidance with NIOS Admission or Public Exam Forms?
            </h2>
            <p className="text-sm sm:text-base text-slate-200">
              Speak directly with our admission desk or message us on WhatsApp for instant subject and document guidance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>WhatsApp {settings.phone}</span>
            </a>
            <a
              href={`tel:${settings.phone}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A1A3F] text-sm font-semibold transition-colors"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>Call Now</span>
            </a>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-400 hover:border-white text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>Contact Form &amp; Map</span>
            </button>
          </div>
        </div>
      </section>

      {/* Gallery Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
              <h3 className="font-display text-base font-bold text-[#0F2557]">{lightboxImage.title}</h3>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close image preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.imageUrl}
              alt={lightboxImage.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[70vh] object-contain bg-slate-900"
            />
            <p className="p-4 text-sm text-slate-600">{lightboxImage.caption}</p>
          </div>
        </div>
      )}
    </div>
  );
};
