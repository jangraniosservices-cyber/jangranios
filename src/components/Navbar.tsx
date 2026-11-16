import React, { useState } from 'react';
import { GraduationCap, Menu, X } from 'lucide-react';
import type { AuthSessionUser, PageView } from '../types';

interface NavbarProps {
  businessName: string;
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  sessionUser: AuthSessionUser | null;
  onOpenPortalLogin: (tab?: 'student' | 'admin') => void;
}

const NAV_LINKS: Array<{ id: PageView; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'courses', label: 'Courses & Services' },
  { id: 'admission', label: 'Online Admission' },
  { id: 'contact', label: 'Contact Us' },
];

export const Navbar: React.FC<NavbarProps> = ({
  businessName,
  currentPage,
  onNavigate,
  sessionUser,
  onOpenPortalLogin,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (page: PageView) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const handlePrimaryAction = () => {
    setMobileOpen(false);
    if (sessionUser?.role === 'admin') {
      onNavigate('admin-dashboard');
    } else if (sessionUser?.role === 'student') {
      onNavigate('student-dashboard');
    } else {
      onOpenPortalLogin('student');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Clean single-line brand wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500 rounded-md"
        >
          <span className="w-9 h-9 rounded-lg bg-[#0F2557] text-amber-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-[#0F2557] whitespace-nowrap shrink-0">
            {businessName}
          </span>
        </button>

        {/* Zone 2: 5 concise single-line text links */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Primary Navigation">
          {NAV_LINKS.map((link) => {
            const active = currentPage === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleLinkClick(link.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  active
                    ? 'text-[#0F2557] border-amber-500 font-semibold'
                    : 'text-slate-600 border-transparent hover:text-[#0F2557] hover:border-slate-300'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="hidden lg:flex items-center shrink-0">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#0F2557] hover:bg-[#19377D] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {sessionUser
              ? sessionUser.role === 'admin'
                ? 'Admin Dashboard'
                : 'Student Dashboard'
              : 'Portal Login'}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => handleLinkClick(link.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                currentPage === link.id
                  ? 'bg-[#0F2557] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {sessionUser ? (
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="w-full py-2.5 px-4 rounded-lg bg-[#EA580C] text-white text-sm font-semibold"
              >
                {sessionUser.role === 'admin' ? 'Open Admin Dashboard' : 'Open Student Dashboard'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenPortalLogin('student');
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0F2557] text-white text-sm font-semibold"
                >
                  Student Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenPortalLogin('admin');
                  }}
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-slate-800 text-sm font-semibold"
                >
                  Admin Login
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
