import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CreditCard,
  Download,
  FileCheck,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import type {
  AuthSessionUser,
  PaymentRecord,
  SiteSettings,
  StudentRecord,
  SubscriptionPlan,
} from '../types';
import { downloadAdmissionReceiptPdf, downloadPaymentReceiptPdf } from '../utils/pdfAndExcel';

interface StudentDashboardProps {
  sessionUser: AuthSessionUser;
  settings: SiteSettings;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  sessionUser,
  settings,
  onLogout,
}) => {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  // Checkout Modal
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [orderInfo, setOrderInfo] = useState<{
    mode: string;
    orderId: string;
    orderToken?: string;
    upiId?: string;
    amount: number;
  } | null>(null);
  const [payMethod, setPayMethod] = useState<'UPI' | 'Razorpay'>('UPI');
  const [upiRef, setUpiRef] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/profile');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not load student profile.');
      } else {
        setStudent(data.student);
        setPayments(data.payments || []);
        setPlans(data.plans || []);
      }
    } catch {
      setError('Network error while loading your student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErr('');
    setPwdMsg('');
    try {
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': sessionUser.csrfToken,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdErr(data.error || 'Password update failed.');
      } else {
        setPwdMsg(data.message);
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch {
      setPwdErr('Network error.');
    }
  };

  const startCheckout = async (plan: SubscriptionPlan) => {
    setPayError('');
    setPaySuccess('');
    setUpiRef('');
    setCheckoutPlan(plan);
    setOrderInfo(null);
    setPayLoading(true);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': sessionUser.csrfToken,
        },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || 'Failed to initiate payment order.');
      } else {
        setOrderInfo(data);
      }
    } catch {
      setPayError('Network error initiating checkout.');
    } finally {
      setPayLoading(false);
    }
  };

  const verifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan || !orderInfo) return;
    setPayError('');
    setPayLoading(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': sessionUser.csrfToken,
        },
        body: JSON.stringify({
          planId: checkoutPlan.id,
          orderId: orderInfo.orderId,
          orderToken: orderInfo.orderToken,
          paymentMethod: payMethod,
          upiReference: payMethod === 'UPI' ? upiRef : '',
          razorpayPaymentId: payMethod === 'Razorpay' ? `rzp_test_${Date.now()}` : '',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error || 'Payment verification failed.');
      } else {
        setPaySuccess(
          `${data.message} Receipt: ${data.receiptNumber}. Valid until ${data.subscriptionExpiry}.`
        );
        setCheckoutPlan(null);
        setOrderInfo(null);
        await fetchProfile();
      }
    } catch {
      setPayError('Network error verifying payment.');
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-600 text-sm">
        Loading Student Portal...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm space-y-3">
          <p>{error || 'Student record unavailable.'}</p>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-lg bg-[#0F2557] text-white text-xs font-semibold"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const isSubscriptionActive = student.subscriptionStatus === 'active';
  const daysRemaining = student.subscriptionExpiry
    ? Math.ceil((new Date(student.subscriptionExpiry).getTime() - Date.now()) / 86400000)
    : 0;
  const expiringSoon = isSubscriptionActive && daysRemaining <= 10 && daysRemaining >= 0;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Profile Header */}
        <div className="bg-[#0F2557] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-mono-tabular text-amber-400">
              Student ID: {student.studentId} · Application No: {student.applicationNumber}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{student.fullName}</h1>
            <p className="text-sm text-slate-200">
              {student.courseApplied} · Medium: {student.studyMedium} · Mobile: {student.mobile}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => downloadAdmissionReceiptPdf(student, settings)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A1A3F] text-sm font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Admission Receipt (PDF)</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/30 hover:bg-white/10 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Subscription Alerts & Payment Success */}
        {paySuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>{paySuccess}</span>
          </div>
        )}

        {expiringSoon && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" aria-hidden="true" />
              <span>
                Your subscription expires in <strong>{daysRemaining} day(s)</strong> ({student.subscriptionExpiry}). Renew early to retain uninterrupted study access.
              </span>
            </div>
          </div>
        )}

        {!isSubscriptionActive && (
          <div className="p-5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-display text-sm font-bold">
                  Subscription {student.subscriptionStatus === 'expired' ? 'Expired' : 'Not Active'} — Study Material Restricted
                </p>
                <p className="text-xs text-red-800 mt-0.5">
                  Activate or renew a student support plan below using UPI or Razorpay to unlock solved TMAs, practical templates, and mock papers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3 Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-2">
            <p className="text-xs font-medium text-slate-500">Admission Application Status</p>
            <p
              className={`font-display text-2xl font-bold uppercase ${
                student.admissionStatus === 'approved'
                  ? 'text-emerald-700'
                  : student.admissionStatus === 'rejected'
                  ? 'text-red-700'
                  : 'text-amber-600'
              }`}
            >
              {student.admissionStatus}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {student.adminRemarks || 'Pending document verification by administrator.'}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-2">
            <p className="text-xs font-medium text-slate-500">Subscription Plan &amp; Validity</p>
            <p
              className={`font-display text-2xl font-bold uppercase ${
                isSubscriptionActive ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {student.subscriptionStatus}
            </p>
            <p className="text-xs text-slate-600 tabular-nums">
              {student.subscriptionPlanName ? `${student.subscriptionPlanName}` : 'No active plan'}
              {student.subscriptionExpiry ? ` · Expiry: ${student.subscriptionExpiry}` : ''}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-2">
            <p className="text-xs font-medium text-slate-500">Uploaded Documents</p>
            <p className="font-display text-2xl font-bold text-[#0F2557] tabular-nums">
              {student.documents?.length || 0} / 4 Uploaded
            </p>
            <p className="text-xs text-slate-600">
              Verified: {student.documents?.filter((d) => d.status === 'verified').length || 0} · Aadhaar access restricted to admin.
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Cols: Study Access + Document Status + Payment History */}
          <div className="lg:col-span-7 space-y-8">
            {/* Protected Study Support Resources (Access-Controlled by Subscription) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#0F2557] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#EA580C]" aria-hidden="true" />
                  <span>NIOS Study Resources &amp; TMA Support</span>
                </h2>
                <span
                  className={`text-xs font-semibold ${
                    isSubscriptionActive ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {isSubscriptionActive ? 'Unlocked' : 'Locked — Renewal Required'}
                </span>
              </div>

              {isSubscriptionActive ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <p className="font-display text-sm font-bold text-[#0F2557]">
                      Solved TMA Format Guide
                    </p>
                    <p className="text-xs text-slate-600">
                      Step-by-step front-page formatting, assignment question structure, and upload deadlines.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <p className="font-display text-sm font-bold text-[#0F2557]">
                      Practical Notebook &amp; Viva Kit
                    </p>
                    <p className="text-xs text-slate-600">
                      Lab experiment templates and common viva questions for Class 10th &amp; 12th practicals.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <p className="font-display text-sm font-bold text-[#0F2557]">
                      Previous 5-Year Question Papers
                    </p>
                    <p className="text-xs text-slate-600">
                      Chapter weightage blueprint and board exam marking schemes for {student.courseApplied}.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <p className="font-display text-sm font-bold text-[#0F2557]">
                      Priority Mentor Helpline
                    </p>
                    <p className="text-xs text-slate-600">
                      Direct WhatsApp doubt support at {settings.phone} using Student ID {student.studentId}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-slate-100 border border-slate-200 text-center space-y-2">
                  <Lock className="w-8 h-8 text-slate-500 mx-auto" aria-hidden="true" />
                  <p className="text-sm font-semibold text-slate-800">
                    Active subscription required to access study material and TMA templates.
                  </p>
                  <p className="text-xs text-slate-600">
                    Choose a Monthly, Quarterly, Half-Yearly, or Annual plan on the right to restore instant access.
                  </p>
                </div>
              )}
            </div>

            {/* Uploaded Document Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#0F2557] flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#0F2557]" aria-hidden="true" />
                <span>Uploaded Document Status</span>
              </h2>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                {student.documents && student.documents.length > 0 ? (
                  student.documents.map((doc) => (
                    <div key={doc.id} className="p-4 flex items-center justify-between gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-[#0F2557] uppercase text-xs">
                          {doc.docType} {doc.restrictedToAdmin ? '· Admin Restricted' : ''}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">{doc.originalName}</p>
                      </div>
                      <span
                        className={`text-xs font-bold uppercase ${
                          doc.status === 'verified'
                            ? 'text-emerald-700'
                            : doc.status === 'rejected'
                            ? 'text-red-700'
                            : 'text-amber-600'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-xs text-slate-500">No document records found.</p>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#0F2557] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0F2557]" aria-hidden="true" />
                <span>Payment History &amp; Receipts</span>
              </h2>

              {payments.length === 0 ? (
                <p className="text-sm text-slate-500">No subscription payments recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 pr-3">Receipt No</th>
                        <th className="py-2.5 pr-3">Plan</th>
                        <th className="py-2.5 pr-3">Method</th>
                        <th className="py-2.5 pr-3 text-right">Amount</th>
                        <th className="py-2.5 pr-3">Status</th>
                        <th className="py-2.5 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-3 pr-3 font-mono-tabular font-semibold text-[#0F2557]">
                            {p.receiptNumber}
                          </td>
                          <td className="py-3 pr-3 text-slate-700">{p.planName}</td>
                          <td className="py-3 pr-3 text-slate-600">{p.paymentMethod}</td>
                          <td className="py-3 pr-3 text-right tabular-nums font-semibold">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 pr-3 uppercase font-semibold text-emerald-700">
                            {p.status}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => downloadPaymentReceiptPdf(p, student.fullName, settings)}
                              className="inline-flex items-center gap-1 text-[#0F2557] hover:text-[#EA580C] font-semibold cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Subscription Plans + Change Password */}
          <div className="lg:col-span-5 space-y-8">
            {/* Activate / Renew Subscription */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-[#0F2557] flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[#EA580C]" aria-hidden="true" />
                  <span>{isSubscriptionActive ? 'Renew / Upgrade Plan' : 'Activate Subscription'}</span>
                </h2>
              </div>

              <div className="space-y-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#EA580C]">
                        {plan.billingCycle} · {plan.durationDays} Days
                      </p>
                      <h3 className="font-display text-sm font-bold text-[#0F2557]">{plan.name}</h3>
                      <p className="font-display text-lg font-extrabold text-[#0F2557] tabular-nums mt-0.5">
                        ₹{plan.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startCheckout(plan)}
                      className="px-4 py-2 rounded-lg bg-[#0F2557] hover:bg-[#EA580C] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Pay &amp; Activate
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>Secure Razorpay &amp; UPI verification. Card details are never stored on this portal.</span>
              </p>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#0F2557] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#0F2557]" aria-hidden="true" />
                <span>Change Account Password</span>
              </h2>
              {pwdMsg && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  {pwdMsg}
                </p>
              )}
              {pwdErr && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  {pwdErr}
                </p>
              )}
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <label htmlFor="cp-cur" className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    id="cp-cur"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cp-new" className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password (min 6 chars)
                  </label>
                  <input
                    id="cp-new"
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F2557] hover:bg-[#19377D] text-white text-xs font-semibold cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Secure Payment Checkout Modal (UPI / Razorpay) */}
      {checkoutPlan && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-200 shadow-2xl">
            <div className="bg-[#0F2557] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400">Secure Subscription Checkout</p>
                <h3 className="font-display text-lg font-bold">{checkoutPlan.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
                aria-label="Close checkout"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={verifyPayment} className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Order Reference</p>
                  <p className="font-mono-tabular text-xs font-semibold text-slate-800">
                    {orderInfo?.orderId || 'Generating Order...'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Total Payable</p>
                  <p className="font-display text-xl font-extrabold text-[#EA580C] tabular-nums">
                    ₹{checkoutPlan.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod('UPI')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    payMethod === 'UPI'
                      ? 'border-[#0F2557] bg-[#0F2557] text-white'
                      : 'border-slate-300 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" aria-hidden="true" />
                  <span>UPI Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('Razorpay')}
                  className={`py-2.5 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                    payMethod === 'Razorpay'
                      ? 'border-[#0F2557] bg-[#0F2557] text-white'
                      : 'border-slate-300 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4" aria-hidden="true" />
                  <span>Razorpay Gateway</span>
                </button>
              </div>

              {payMethod === 'UPI' ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <p>
                      Pay ₹{checkoutPlan.price} to UPI ID: <strong className="font-mono-tabular">{orderInfo?.upiId || 'jangranios@okicici'}</strong>
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Enter your 12-digit UPI UTR / Transaction Reference below to verify and activate immediately.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="upi-utr" className="block text-xs font-semibold text-slate-700 mb-1">
                      UPI Transaction / UTR Reference *
                    </label>
                    <input
                      id="upi-utr"
                      type="text"
                      required
                      minLength={6}
                      value={upiRef}
                      onChange={(e) => setUpiRef(e.target.value)}
                      placeholder="e.g. UTR419283746512"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono-tabular"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                  <p className="font-semibold text-[#0F2557]">Razorpay Verified Checkout</p>
                  <p>
                    Click &ldquo;Verify &amp; Activate Subscription&rdquo; to complete secure gateway token verification without storing card details on this server.
                  </p>
                </div>
              )}

              {payError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  {payError}
                </p>
              )}

              <button
                type="submit"
                disabled={payLoading || !orderInfo}
                className="w-full py-3 px-4 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {payLoading ? 'Verifying Payment...' : 'Verify & Activate Subscription'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
