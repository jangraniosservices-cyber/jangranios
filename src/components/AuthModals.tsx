import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Lock, Shield, UserCheck, X } from 'lucide-react';
import type { AuthSessionUser } from '../types';

interface AuthModalsProps {
  isOpen: boolean;
  initialTab: 'student' | 'admin';
  prefillStudentId?: string;
  onClose: () => void;
  onSuccess: (user: AuthSessionUser) => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  isOpen,
  initialTab,
  prefillStudentId,
  onClose,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'student' | 'admin'>(initialTab);
  const [forgotMode, setForgotMode] = useState(false);

  // Student Login
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Forgot Password
  const [fpStudentId, setFpStudentId] = useState('');
  const [fpMobile, setFpMobile] = useState('');
  const [fpDob, setFpDob] = useState('');
  const [fpTempPass, setFpTempPass] = useState('');

  // Admin Login
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTab(initialTab);
    setForgotMode(false);
    setError('');
    setFpTempPass('');
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (prefillStudentId) {
      setStudentId(prefillStudentId);
    }
  }, [prefillStudentId]);

  if (!isOpen) return null;

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password: studentPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
      } else {
        onSuccess(data.user);
      }
    } catch {
      setError('Network error while logging in.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFpTempPass('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/student/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: fpStudentId, mobile: fpMobile, dob: fpDob }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not reset password.');
      } else {
        setFpTempPass(data.temporaryPassword);
      }
    } catch {
      setError('Network error while resetting password.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Admin authentication failed.');
      } else {
        onSuccess(data.user);
      }
    } catch {
      setError('Network error while logging in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl">
        {/* Top Navy Header */}
        <div className="bg-[#0F2557] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tab === 'student' ? (
              <UserCheck className="w-5 h-5 text-amber-400" aria-hidden="true" />
            ) : (
              <Shield className="w-5 h-5 text-amber-400" aria-hidden="true" />
            )}
            <h2 className="font-display text-lg font-bold">
              {tab === 'student'
                ? forgotMode
                  ? 'Reset Student Password'
                  : 'Student Portal Login'
                : 'Administrator Login'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Close login modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Switcher */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setTab('student');
                setForgotMode(false);
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'student' ? 'bg-white text-[#0F2557] shadow-xs' : 'text-slate-600'
              }`}
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('admin');
                setForgotMode(false);
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'admin' ? 'bg-white text-[#0F2557] shadow-xs' : 'text-slate-600'
              }`}
            >
              Admin Login
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'student' && !forgotMode && (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label htmlFor="login-sid" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Student ID
                </label>
                <input
                  id="login-sid"
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="JNS-2026-1001"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono-tabular focus:outline-none focus:border-[#0F2557]"
                />
              </div>
              <div>
                <label htmlFor="login-spass" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <input
                  id="login-spass"
                  type="password"
                  required
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setError('');
                  }}
                  className="text-[#0F2557] hover:text-[#EA580C] font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentId('JNS-2026-1001');
                    setStudentPassword('Student@123');
                  }}
                  className="text-slate-500 hover:text-[#0F2557] underline cursor-pointer"
                >
                  Use Demo Student
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {loading ? 'Signing In...' : 'Log In to Student Dashboard'}
              </button>
            </form>
          )}

          {tab === 'student' && forgotMode && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-600">
                Verify your Student ID, registered mobile number, and Date of Birth to generate a fresh temporary password.
              </p>

              {fpTempPass && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    Temporary Password Generated
                  </p>
                  <p>
                    New Password: <strong className="font-mono-tabular text-sm">{fpTempPass}</strong>
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="fp-sid" className="block text-xs font-semibold text-slate-700 mb-1">
                  Student ID
                </label>
                <input
                  id="fp-sid"
                  type="text"
                  required
                  value={fpStudentId}
                  onChange={(e) => setFpStudentId(e.target.value)}
                  placeholder="JNS-2026-1001"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono-tabular"
                />
              </div>
              <div>
                <label htmlFor="fp-mobile" className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Mobile Number
                </label>
                <input
                  id="fp-mobile"
                  type="tel"
                  required
                  value={fpMobile}
                  onChange={(e) => setFpMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="fp-dob" className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <input
                  id="fp-dob"
                  type="date"
                  required
                  value={fpDob}
                  onChange={(e) => setFpDob(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setForgotMode(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-[#0F2557] cursor-pointer"
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-[#0F2557] hover:bg-[#19377D] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{loading ? 'Verifying...' : 'Reset Password'}</span>
                </button>
              </div>
            </form>
          )}

          {tab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label htmlFor="adm-email-in" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Administrator Email
                </label>
                <input
                  id="adm-email-in"
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@jangranios.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                />
              </div>
              <div>
                <label htmlFor="adm-pass-in" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Administrator Password
                </label>
                <input
                  id="adm-pass-in"
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                />
              </div>

              <div className="flex items-center justify-end text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('admin@jangranios.com');
                    setAdminPassword('Admin@Jangra2026');
                  }}
                  className="text-slate-500 hover:text-[#0F2557] underline cursor-pointer"
                >
                  Use Demo Admin
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0F2557] hover:bg-[#19377D] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>{loading ? 'Authenticating...' : 'Open Admin Dashboard'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
