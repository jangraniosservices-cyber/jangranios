import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock } from 'lucide-react';
import type { CourseItem, PageView, SubscriptionPlan } from '../types';

interface CoursesPageProps {
  courses: CourseItem[];
  plans: SubscriptionPlan[];
  onNavigate: (page: PageView, preselectedCourse?: string) => void;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({ courses, plans, onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const unique = Array.from(new Set(courses.map((c) => c.category)));
    return ['All', ...unique];
  }, [courses]);

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return courses;
    return courses.filter((c) => c.category === selectedCategory);
  }, [courses, selectedCategory]);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <section className="bg-[#0F2557] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="text-sm font-semibold text-amber-400">Programs &amp; Guidance</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight [text-wrap:balance]">
            NIOS Courses &amp; Student Support Services
          </h1>
          <p className="text-base text-slate-200 max-w-2xl leading-relaxed">
            Explore our Secondary (Class 10th), Senior Secondary (Class 12th), admission assistance, practical guidance, and study material packages.
          </p>
        </div>
      </section>

      {/* Interactive Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0F2557] text-white'
                  : 'text-slate-600 hover:text-[#0F2557] hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Course Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => (
            <article
              key={course.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src={course.imageUrl}
                  alt={course.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-[#EA580C]">{course.category}</span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {course.duration}
                    </span>
                  </div>

                  <h2 className="font-display text-xl font-bold text-[#0F2557] leading-snug">
                    {course.title}
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed">{course.description}</p>

                  {course.details && (
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-[#0F2557]">Course Details: </strong>
                      {course.details}
                    </div>
                  )}

                  {course.subscriptionNote && (
                    <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <strong>Subscription Info:</strong> {course.subscriptionNote}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Service / Course Fee</p>
                    <p className="font-display text-xl font-extrabold text-[#0F2557] tabular-nums">
                      ₹{course.fee.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('admission', course.title)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Subscription Plans Overview */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10 space-y-2">
            <p className="text-sm font-semibold text-[#EA580C]">Student Portal Subscriptions</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F2557]">
              Flexible Support &amp; Study Access Plans
            </h2>
            <p className="text-sm text-slate-600">
              After submitting your admission form, log in to your Student Dashboard to activate or renew any plan via Razorpay or UPI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="p-6 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-[#0F2557]">{plan.billingCycle}</span>
                    <span className="tabular-nums">{plan.durationDays} Days Validity</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0F2557]">{plan.name}</h3>
                  <p className="font-display text-2xl font-extrabold text-[#EA580C] tabular-nums">
                    ₹{plan.price.toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-slate-600">{plan.description}</p>
                  <ul className="space-y-2 pt-2">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('admission')}
                  className="w-full py-2.5 px-4 rounded-lg border border-[#0F2557] text-[#0F2557] hover:bg-[#0F2557] hover:text-white text-sm font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  <span>Enroll &amp; Subscribe</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
