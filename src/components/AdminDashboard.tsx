import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type {
  AnnouncementItem,
  AuthSessionUser,
  ContactEnquiry,
  CourseItem,
  GalleryItem,
  PaymentRecord,
  PublicExamSubmission,
  SiteSettings,
  StudentRecord,
  SubscriptionPlan,
} from '../types';
import {
  downloadAdmissionReceiptPdf,
  exportExcelReport,
  exportPdfReport,
} from '../utils/pdfAndExcel';

interface AdminDashboardProps {
  sessionUser: AuthSessionUser;
  onRefreshPublicData: () => void;
  onLogout: () => void;
}

type AdminSection = 'overview' | 'students' | 'exams-enquiries' | 'courses-plans' | 'website-cms' | 'payments-reports';

interface AdminStats {
  totalStudents: number;
  newApplications: number;
  approvedApplications: number;
  pendingApplications: number;
  rejectedApplications: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalVerifiedPaymentsCount: number;
  totalVerifiedPaymentsAmount: number;
  publicExamCount: number;
  newEnquiriesCount: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  sessionUser,
  onRefreshPublicData,
  onLogout,
}) => {
  const [section, setSection] = useState<AdminSection>('overview');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [publicExams, setPublicExams] = useState<PublicExamSubmission[]>([]);
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Selected Student Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [editRemarks, setEditRemarks] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [editCourse, setEditCourse] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [tempResetPwd, setTempResetPwd] = useState('');

  // New Course State
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCat, setNewCourseCat] = useState('Board Course');
  const [newCourseFee, setNewCourseFee] = useState('2500');
  const [newCourseDur, setNewCourseDur] = useState('1 Year');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  // New Plan State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCycle, setNewPlanCycle] = useState<'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Custom'>('Custom');
  const [newPlanDays, setNewPlanDays] = useState('60');
  const [newPlanPrice, setNewPlanPrice] = useState('999');
  const [newPlanDesc, setNewPlanDesc] = useState('');

  // New Announcement
  const [annTitle, setAnnTitle] = useState('');
  const [annCat, setAnnCat] = useState('Notice');
  const [annSummary, setAnnSummary] = useState('');
  const [annUrgent, setAnnUrgent] = useState(false);

  // New Gallery Image
  const [galTitle, setGalTitle] = useState('');
  const [galCaption, setGalCaption] = useState('');
  const [galUrl, setGalUrl] = useState('');
  const [galFile, setGalFile] = useState<File | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const fetchOverview = async (searchQuery = search) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/overview?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setStudents(data.students);
        setPayments(data.payments);
        setPublicExams(data.publicExams);
        setEnquiries(data.enquiries);
        setCourses(data.courses);
        setPlans(data.plans);
        setAnnouncements(data.announcements);
        setGallery(data.gallery);
        setSettings(data.settings);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview('');
  }, []);

  const openStudentModal = (st: StudentRecord) => {
    setSelectedStudent(st);
    setEditRemarks(st.adminRemarks);
    setEditStatus(st.admissionStatus);
    setEditCourse(st.courseApplied);
    setEditMobile(st.mobile);
    setEditEmail(st.email);
    setTempResetPwd('');
  };

  const updateStudent = async (studentId: string, payload: Record<string, unknown>, msg: string) => {
    const res = await fetch(`/api/admin/students/${studentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': sessionUser.csrfToken,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.temporaryPassword) setTempResetPwd(data.temporaryPassword);
      notify(msg);
      await fetchOverview();
      if (selectedStudent && selectedStudent.studentId === studentId && !payload.resetPassword) {
        setSelectedStudent(null);
      }
    } else {
      notify(data.error || 'Update failed.');
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': sessionUser.csrfToken },
      body: JSON.stringify({
        title: newCourseTitle,
        category: newCourseCat,
        fee: Number(newCourseFee),
        duration: newCourseDur,
        description: newCourseDesc,
      }),
    });
    if (res.ok) {
      setNewCourseTitle('');
      setNewCourseDesc('');
      notify('Course added and live on Courses & Services.');
      await fetchOverview();
      onRefreshPublicData();
    }
  };

  const handleUpdateCourseFee = async (course: CourseItem, nextFee: number) => {
    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': sessionUser.csrfToken },
      body: JSON.stringify({ ...course, fee: nextFee }),
    });
    if (res.ok) {
      notify(`Updated fee for ${course.title} to ₹${nextFee}`);
      await fetchOverview();
      onRefreshPublicData();
    }
  };

  const handleDeleteCourse = async (id: number) => {
    await fetch(`/api/admin/courses/${id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': sessionUser.csrfToken },
    });
    notify('Course removed.');
    await fetchOverview();
    onRefreshPublicData();
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': sessionUser.csrfToken },
      body: JSON.stringify({
        name: newPlanName,
        billingCycle: newPlanCycle,
        durationDays: Number(newPlanDays),
        price: Number(newPlanPrice),
        description: newPlanDesc,
        features: ['Full Student Portal Access', 'Study Support & TMA Alerts'],
      }),
    });
    if (res.ok) {
      setNewPlanName('');
      setNewPlanDesc('');
      notify('Subscription plan added.');
      await fetchOverview();
      onRefreshPublicData();
    }
  };

  const handleUpdatePlanPrice = async (plan: SubscriptionPlan, price: number) => {
    await fetch(`/api/admin/plans/${plan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': sessionUser.csrfToken },
      body: JSON.stringify({ ...plan, price }),
    });
    notify(`Updated ${plan.name} price to ₹${price}`);
    await fetchOverview();
    onRefreshPublicData();
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': sessionUser.csrfToken },
      body: JSON.stringify({ title: annTitle, category: annCat, summary: annSummary, isUrgent: annUrgent }),
    });
    if (res.ok) {
      setAnnTitle('');
      setAnnSummary('');
      setAnnUrgent(false);
      notify('Announcement published on Home page.');
      await fetchOverview();
      onRefreshPublicData();
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', galTitle);
    fd.append('caption', galCaption);
    if (galFile) {
      fd.append('image', galFile);
    } else {
      fd.append('imageUrl', galUrl || '/src/assets/images/gallery_exam_success_1794807152254.jpg');
    }
    const res = await fetch('/api/admin/gallery', {
      method: 'POST',
      headers: { 'X-CSRF-Token': sessionUser.csrfToken },
      body: fd,
    });
    if (res.ok) {
      setGalTitle('');
      setGalCaption('');
      setGalUrl('');
      setGalFile(null);
      notify('Gallery photograph added.');
      await fetchOverview();
      onRefreshPublicData();
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': sessionUser.csrfToken },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      notify('Website CMS & Contact settings saved.');
      onRefreshPublicData();
    }
  };

  const navItems: Array<{ id: AdminSection; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Students & Docs', icon: <Users className="w-4 h-4" /> },
    { id: 'exams-enquiries', label: 'Public Exams & Queries', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'courses-plans', label: 'Courses & Plans', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'website-cms', label: 'Website & Gallery', icon: <Globe className="w-4 h-4" /> },
    { id: 'payments-reports', label: 'Payments & Reports', icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Admin Sidebar */}
      <aside className="lg:w-64 bg-[#0A1A3F] text-white shrink-0 flex flex-col justify-between p-5">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-amber-400">Administrator Console</p>
            <p className="font-display text-base font-bold mt-0.5 truncate">{sessionUser.fullName}</p>
            <p className="text-[11px] text-slate-400 truncate">{sessionUser.email}</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  section === item.id
                    ? 'bg-amber-400 text-[#0A1A3F]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-6 w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-white/25 hover:bg-white/10 text-xs font-semibold cursor-pointer"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Logout Admin</span>
        </button>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-5 sm:p-8 space-y-6 overflow-x-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs text-slate-500">Jangra NIOS Services / Admin</p>
            <h1 className="font-display text-2xl font-bold text-[#0F2557]">
              {navItems.find((n) => n.id === section)?.label}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => fetchOverview()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:border-[#0F2557] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Refresh Data</span>
          </button>
        </div>

        {toast && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>{toast}</span>
          </div>
        )}

        {loading && !stats ? (
          <p className="text-sm text-slate-600">Loading administrator telemetry...</p>
        ) : null}

        {/* SECTION 1: OVERVIEW */}
        {section === 'overview' && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">Total Registered Students</p>
                <p className="font-display text-2xl font-extrabold text-[#0F2557] tabular-nums mt-1">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">New / Pending Applications</p>
                <p className="font-display text-2xl font-extrabold text-amber-600 tabular-nums mt-1">
                  {stats.pendingApplications}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">Approved Applications</p>
                <p className="font-display text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">
                  {stats.approvedApplications}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">Rejected Applications</p>
                <p className="font-display text-2xl font-extrabold text-red-700 tabular-nums mt-1">
                  {stats.rejectedApplications}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">Active Subscriptions</p>
                <p className="font-display text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">
                  {stats.activeSubscriptions}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">Expired Subscriptions</p>
                <p className="font-display text-2xl font-extrabold text-red-700 tabular-nums mt-1">
                  {stats.expiredSubscriptions}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">Total Verified Payments</p>
                <p className="font-display text-2xl font-extrabold text-[#0F2557] tabular-nums mt-1">
                  ₹{stats.totalVerifiedPaymentsAmount.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500 tabular-nums">{stats.totalVerifiedPaymentsCount} transactions</p>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">Public Exams &amp; New Queries</p>
                <p className="font-display text-2xl font-extrabold text-[#EA580C] tabular-nums mt-1">
                  {stats.publicExamCount} / {stats.newEnquiriesCount}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-bold text-[#0F2557]">Recent Student Applications</h2>
                <button
                  type="button"
                  onClick={() => setSection('students')}
                  className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                >
                  Manage All Students
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3">Student ID</th>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Course</th>
                      <th className="py-2 pr-3">Admission</th>
                      <th className="py-2 pr-3">Subscription</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.slice(0, 6).map((st) => (
                      <tr key={st.studentId}>
                        <td className="py-2.5 pr-3 font-mono-tabular font-semibold text-[#0F2557]">
                          {st.studentId}
                        </td>
                        <td className="py-2.5 pr-3 font-medium">{st.fullName}</td>
                        <td className="py-2.5 pr-3 text-slate-600">{st.courseApplied}</td>
                        <td className="py-2.5 pr-3 uppercase font-semibold">{st.admissionStatus}</td>
                        <td className="py-2.5 pr-3 uppercase">{st.subscriptionStatus}</td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => openStudentModal(st)}
                            className="text-[#0F2557] hover:text-[#EA580C] font-semibold cursor-pointer"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: STUDENTS & DOCUMENTS */}
        {section === 'students' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    fetchOverview(e.target.value);
                  }}
                  placeholder="Search by Student ID, Name, Mobile, or App No..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                />
              </div>
              <p className="text-xs text-slate-500 tabular-nums">Showing {students.length} student(s)</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 pr-3">Student ID</th>
                    <th className="py-2.5 pr-3">App No</th>
                    <th className="py-2.5 pr-3">Full Name</th>
                    <th className="py-2.5 pr-3">Mobile</th>
                    <th className="py-2.5 pr-3">Course</th>
                    <th className="py-2.5 pr-3">Admission</th>
                    <th className="py-2.5 pr-3">Subscription</th>
                    <th className="py-2.5 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.studentId} className="hover:bg-slate-50">
                      <td className="py-3 pr-3 font-mono-tabular font-semibold text-[#0F2557]">
                        {st.studentId}
                      </td>
                      <td className="py-3 pr-3 font-mono-tabular text-slate-600">
                        {st.applicationNumber}
                      </td>
                      <td className="py-3 pr-3 font-medium text-slate-900">
                        {st.fullName} {!st.accountActive ? '(Deactivated)' : ''}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{st.mobile}</td>
                      <td className="py-3 pr-3 text-slate-600">{st.courseApplied}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`font-bold uppercase ${
                            st.admissionStatus === 'approved'
                              ? 'text-emerald-700'
                              : st.admissionStatus === 'rejected'
                              ? 'text-red-700'
                              : 'text-amber-600'
                          }`}
                        >
                          {st.admissionStatus}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="uppercase font-semibold">{st.subscriptionStatus}</span>
                        {st.subscriptionExpiry ? ` (${st.subscriptionExpiry})` : ''}
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openStudentModal(st)}
                          className="px-2.5 py-1 rounded bg-[#0F2557] text-white font-semibold hover:bg-[#EA580C] cursor-pointer"
                        >
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: PUBLIC EXAMS & CONTACT ENQUIRIES */}
        {section === 'exams-enquiries' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#0F2557]">
                Online Public Exam Submissions ({publicExams.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3">Ref No</th>
                      <th className="py-2 pr-3">Enrollment No</th>
                      <th className="py-2 pr-3">Student</th>
                      <th className="py-2 pr-3">Mobile</th>
                      <th className="py-2 pr-3">Session &amp; Subjects</th>
                      <th className="py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {publicExams.map((ex) => (
                      <tr key={ex.id}>
                        <td className="py-3 pr-3 font-mono-tabular font-semibold">{ex.referenceNumber}</td>
                        <td className="py-3 pr-3 font-mono-tabular">{ex.enrollmentNumber}</td>
                        <td className="py-3 pr-3">{ex.fullName}</td>
                        <td className="py-3 pr-3 tabular-nums">{ex.mobile}</td>
                        <td className="py-3 pr-3 text-slate-600">
                          {ex.examSession} · {ex.subjects}
                        </td>
                        <td className="py-3 text-right">
                          <select
                            value={ex.status}
                            onChange={async (e) => {
                              await fetch(`/api/admin/public-exam/${ex.id}`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'X-CSRF-Token': sessionUser.csrfToken,
                                },
                                body: JSON.stringify({ status: e.target.value }),
                              });
                              notify('Public Exam status updated.');
                              fetchOverview();
                            }}
                            className="px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="verified">Verified</option>
                            <option value="hall_ticket_ready">Hall Ticket Ready</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#0F2557]">
                Contact Enquiries ({enquiries.length})
              </h2>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                {enquiries.map((enq) => (
                  <div key={enq.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-[#0F2557]">
                        {enq.name} · <span className="tabular-nums">{enq.mobile}</span> · {enq.email}
                      </p>
                      <p className="font-semibold text-slate-700">{enq.subject}</p>
                      <p className="text-slate-600">{enq.message}</p>
                    </div>
                    <select
                      value={enq.status}
                      onChange={async (e) => {
                        await fetch(`/api/admin/enquiries/${enq.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': sessionUser.csrfToken,
                          },
                          body: JSON.stringify({ status: e.target.value }),
                        });
                        notify('Enquiry status updated.');
                        fetchOverview();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs shrink-0"
                    >
                      <option value="new">New</option>
                      <option value="replied">Replied</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: COURSES & SUBSCRIPTION PLANS */}
        {section === 'courses-plans' && (
          <div className="space-y-8">
            {/* Courses Management */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#0F2557]">
                Manage Courses &amp; Fees ({courses.length})
              </h2>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                {courses.map((c) => (
                  <div key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="max-w-lg">
                      <p className="font-bold text-sm text-[#0F2557]">{c.title}</p>
                      <p className="text-slate-600">{c.category} · {c.duration}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-slate-500">Fee ₹:</label>
                      <input
                        type="number"
                        defaultValue={c.fee}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (!Number.isNaN(val) && val !== c.fee) {
                            handleUpdateCourseFee(c, val);
                          }
                        }}
                        className="w-24 px-2.5 py-1.5 rounded border border-slate-300 tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(c.id)}
                        className="p-1.5 rounded text-red-700 hover:bg-red-50 cursor-pointer"
                        aria-label={`Delete ${c.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSaveCourse} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  required
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="New Course / Service Title"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:col-span-2"
                />
                <input
                  type="number"
                  required
                  value={newCourseFee}
                  onChange={(e) => setNewCourseFee(e.target.value)}
                  placeholder="Fee ₹"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                />
                <input
                  type="text"
                  value={newCourseDur}
                  onChange={(e) => setNewCourseDur(e.target.value)}
                  placeholder="Duration"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  required
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  placeholder="Course description"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:col-span-3"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F2557] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Course</span>
                </button>
              </form>
            </div>

            {/* Subscription Plans Management */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#0F2557]">
                Subscription Plans Management ({plans.length})
              </h2>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                {plans.map((p) => (
                  <div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-sm text-[#0F2557]">{p.name}</p>
                      <p className="text-slate-600">{p.billingCycle} · {p.durationDays} Days</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-slate-500">Price ₹:</label>
                      <input
                        type="number"
                        defaultValue={p.price}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (!Number.isNaN(val) && val !== p.price) {
                            handleUpdatePlanPrice(p, val);
                          }
                        }}
                        className="w-24 px-2.5 py-1.5 rounded border border-slate-300 tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/plans/${p.id}`, {
                            method: 'DELETE',
                            headers: { 'X-CSRF-Token': sessionUser.csrfToken },
                          });
                          notify('Plan deleted.');
                          fetchOverview();
                          onRefreshPublicData();
                        }}
                        className="p-1.5 rounded text-red-700 hover:bg-red-50 cursor-pointer"
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSavePlan} className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-200">
                <input
                  type="text"
                  required
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="Plan Name"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:col-span-2"
                />
                <select
                  value={newPlanCycle}
                  onChange={(e) => setNewPlanCycle(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Annual">Annual</option>
                  <option value="Custom">Custom</option>
                </select>
                <input
                  type="number"
                  required
                  value={newPlanDays}
                  onChange={(e) => setNewPlanDays(e.target.value)}
                  placeholder="Days"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                />
                <input
                  type="number"
                  required
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(e.target.value)}
                  placeholder="Price ₹"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs tabular-nums"
                />
                <input
                  type="text"
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  placeholder="Plan description"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:col-span-4"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#EA580C] text-white text-xs font-semibold cursor-pointer"
                >
                  Create Plan
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SECTION 5: WEBSITE CMS, ANNOUNCEMENTS & GALLERY */}
        {section === 'website-cms' && settings && (
          <div className="space-y-8">
            <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <h2 className="font-display text-lg font-bold text-[#0F2557]">
                Edit Homepage, About Us, Contact &amp; Upload Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    value={settings.businessName}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hero Banner Image URL</label>
                  <input
                    type="text"
                    value={settings.heroImageUrl}
                    onChange={(e) => setSettings({ ...settings, heroImageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hero Main Heading</label>
                  <input
                    type="text"
                    value={settings.heroHeading}
                    onChange={(e) => setSettings({ ...settings, heroHeading: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hero Subheading</label>
                  <input
                    type="text"
                    value={settings.heroSubheading}
                    onChange={(e) => setSettings({ ...settings, heroSubheading: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">About Us Introduction</label>
                  <textarea
                    rows={2}
                    value={settings.aboutIntro}
                    onChange={(e) => setSettings({ ...settings, aboutIntro: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mission</label>
                  <textarea
                    rows={2}
                    value={settings.mission}
                    onChange={(e) => setSettings({ ...settings, mission: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vision</label>
                  <textarea
                    rows={2}
                    value={settings.vision}
                    onChange={(e) => setSettings({ ...settings, vision: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="text"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Office Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Working Hours</label>
                  <input
                    type="text"
                    value={settings.workingHours}
                    onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <p className="text-xs font-bold text-[#0F2557]">
                  Admission Document Compulsory Controls
                </p>
                <div className="flex flex-wrap gap-5 text-xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requirePhoto}
                      onChange={(e) => setSettings({ ...settings, requirePhoto: e.target.checked })}
                    />
                    <span>Box 1: Student Photo Mandatory</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireSignature}
                      onChange={(e) => setSettings({ ...settings, requireSignature: e.target.checked })}
                    />
                    <span>Box 2: Signature Mandatory</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireAadhaar}
                      onChange={(e) => setSettings({ ...settings, requireAadhaar: e.target.checked })}
                    />
                    <span>Box 3: Aadhaar Card Mandatory</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireQualification}
                      onChange={(e) => setSettings({ ...settings, requireQualification: e.target.checked })}
                    />
                    <span>Box 4: Qualification Proof Mandatory</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-[#0F2557] hover:bg-[#19377D] text-white text-xs font-semibold cursor-pointer"
              >
                Save Website Settings
              </button>
            </form>

            {/* Announcements Publisher */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#0F2557]">
                Publish Announcements &amp; Notices
              </h2>
              <form onSubmit={handleAddAnnouncement} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Announcement headline"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:col-span-2"
                />
                <input
                  type="text"
                  value={annCat}
                  onChange={(e) => setAnnCat(e.target.value)}
                  placeholder="Category (Admissions, Exams)"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <label className="inline-flex items-center gap-2 text-xs font-medium px-2">
                  <input
                    type="checkbox"
                    checked={annUrgent}
                    onChange={(e) => setAnnUrgent(e.target.checked)}
                  />
                  <span>Priority Notice</span>
                </label>
                <input
                  type="text"
                  required
                  value={annSummary}
                  onChange={(e) => setAnnSummary(e.target.value)}
                  placeholder="Full announcement details..."
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs sm:col-span-3"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#EA580C] text-white text-xs font-semibold cursor-pointer"
                >
                  Publish Notice
                </button>
              </form>

              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-[#0F2557]">{a.title}</p>
                      <p className="text-slate-600">{a.publishedAt} · {a.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/admin/announcements/${a.id}`, {
                          method: 'DELETE',
                          headers: { 'X-CSRF-Token': sessionUser.csrfToken },
                        });
                        notify('Announcement deleted.');
                        fetchOverview();
                        onRefreshPublicData();
                      }}
                      className="p-1.5 text-red-700 hover:bg-red-50 rounded cursor-pointer"
                      aria-label="Delete announcement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery Manager */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#0F2557] flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0F2557]" aria-hidden="true" />
                <span>Photo Gallery Manager</span>
              </h2>
              <form onSubmit={handleAddGallery} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  placeholder="Photo title"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  value={galCaption}
                  onChange={(e) => setGalCaption(e.target.value)}
                  placeholder="Caption"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGalFile(e.target.files?.[0] || null)}
                  className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F2557] text-white text-xs font-semibold cursor-pointer"
                >
                  Upload to Gallery
                </button>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {gallery.map((g) => (
                  <div key={g.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    <img src={g.imageUrl} alt={g.title} className="w-full h-28 object-cover" />
                    <div className="p-2.5 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold truncate">{g.title}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/gallery/${g.id}`, {
                            method: 'DELETE',
                            headers: { 'X-CSRF-Token': sessionUser.csrfToken },
                          });
                          notify('Gallery photo deleted.');
                          fetchOverview();
                          onRefreshPublicData();
                        }}
                        className="text-red-700 hover:bg-red-100 p-1 rounded cursor-pointer"
                        aria-label="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: PAYMENTS, REPORTS (EXCEL & PDF) & BACKUP */}
        {section === 'payments-reports' && (
          <div className="space-y-8">
            {/* Export Reports & Backup */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0F2557]">
                  Download Excel, PDF Reports &amp; Database Backup
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Generate live spreadsheet (.xlsx) and formatted PDF reports for admissions, students, payments, and subscriptions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    exportExcelReport(
                      'Jangra_Students_Report',
                      'Students',
                      students.map((s) => ({
                        StudentID: s.studentId,
                        ApplicationNo: s.applicationNumber,
                        Name: s.fullName,
                        Mobile: s.mobile,
                        Email: s.email,
                        Course: s.courseApplied,
                        Medium: s.studyMedium,
                        AdmissionStatus: s.admissionStatus,
                        Subscription: s.subscriptionStatus,
                        Expiry: s.subscriptionExpiry || '-',
                      }))
                    )
                  }
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0F2557] bg-slate-50 flex items-center gap-2.5 text-xs font-semibold text-[#0F2557] cursor-pointer"
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>Students Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    exportPdfReport(
                      'Admission & Student Report',
                      ['Student ID', 'App No', 'Name', 'Mobile', 'Course', 'Admission', 'Subscription'],
                      students.map((s) => [
                        s.studentId,
                        s.applicationNumber,
                        s.fullName,
                        s.mobile,
                        s.courseApplied,
                        s.admissionStatus.toUpperCase(),
                        s.subscriptionStatus.toUpperCase(),
                      ]),
                      'Jangra_Admission_Report'
                    )
                  }
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0F2557] bg-slate-50 flex items-center gap-2.5 text-xs font-semibold text-[#0F2557] cursor-pointer"
                >
                  <FileText className="w-5 h-5 text-[#EA580C] shrink-0" />
                  <span>Admission Report (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    exportExcelReport(
                      'Jangra_Payments_Report',
                      'Payments',
                      payments.map((p) => ({
                        ReceiptNo: p.receiptNumber,
                        StudentID: p.studentId,
                        StudentName: p.studentName || '',
                        Plan: p.planName,
                        AmountINR: p.amount,
                        Method: p.paymentMethod,
                        Status: p.status,
                        Date: p.createdAt,
                      }))
                    )
                  }
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0F2557] bg-slate-50 flex items-center gap-2.5 text-xs font-semibold text-[#0F2557] cursor-pointer"
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>Payments Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    exportPdfReport(
                      'Subscription & Revenue Report',
                      ['Receipt', 'Student ID', 'Name', 'Plan', 'Amount (INR)', 'Method', 'Status'],
                      payments.map((p) => [
                        p.receiptNumber,
                        p.studentId,
                        p.studentName || '',
                        p.planName,
                        p.amount,
                        p.paymentMethod,
                        p.status.toUpperCase(),
                      ]),
                      'Jangra_Payments_PDF'
                    )
                  }
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-[#0F2557] bg-slate-50 flex items-center gap-2.5 text-xs font-semibold text-[#0F2557] cursor-pointer"
                >
                  <FileText className="w-5 h-5 text-[#EA580C] shrink-0" />
                  <span>Payment Report (PDF)</span>
                </button>
              </div>

              <div className="pt-2">
                <a
                  href="/api/admin/backup"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F2557] text-white text-xs font-semibold hover:bg-[#19377D]"
                >
                  <Database className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Download Full Database Backup (JSON)</span>
                </a>
              </div>
            </div>

            {/* Payment Records & Refund Control */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#0F2557]">
                Payment Ledger &amp; Refunds ({payments.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-3">Receipt</th>
                      <th className="py-2 pr-3">Student ID</th>
                      <th className="py-2 pr-3">Plan</th>
                      <th className="py-2 pr-3">Method &amp; Ref</th>
                      <th className="py-2 pr-3 text-right">Amount</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 pr-3 font-mono-tabular font-semibold">{p.receiptNumber}</td>
                        <td className="py-3 pr-3 font-mono-tabular">{p.studentId}</td>
                        <td className="py-3 pr-3">{p.planName}</td>
                        <td className="py-3 pr-3 text-slate-600">
                          {p.paymentMethod} · {p.upiReference || p.razorpayPaymentId || '-'}
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums font-bold">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 pr-3 uppercase font-semibold">{p.status}</td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              const nextStatus = p.status === 'verified' ? 'refunded' : 'verified';
                              await fetch(`/api/admin/payments/${p.id}`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'X-CSRF-Token': sessionUser.csrfToken,
                                },
                                body: JSON.stringify({ status: nextStatus }),
                              });
                              notify(`Payment marked as ${nextStatus}.`);
                              fetchOverview();
                            }}
                            className="text-[#0F2557] hover:text-[#EA580C] font-semibold cursor-pointer"
                          >
                            {p.status === 'verified' ? 'Mark Refunded' : 'Mark Verified'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* STUDENT REVIEW & DOCUMENT VERIFICATION MODAL */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
            <div className="bg-[#0F2557] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div>
                <p className="text-xs font-mono-tabular text-amber-400">
                  {selectedStudent.studentId} · {selectedStudent.applicationNumber}
                </p>
                <h3 className="font-display text-lg font-bold">{selectedStudent.fullName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white"
                aria-label="Close student modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Profile Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p><strong>Father:</strong> {selectedStudent.fatherName}</p>
                <p><strong>Mother:</strong> {selectedStudent.motherName}</p>
                <p><strong>DOB:</strong> {selectedStudent.dob}</p>
                <p><strong>Category:</strong> {selectedStudent.category}</p>
                <p><strong>Previous Qual:</strong> {selectedStudent.previousQualification}</p>
                <p><strong>Prev School/Board:</strong> {selectedStudent.previousSchoolBoard}</p>
                <p className="sm:col-span-2"><strong>Address:</strong> {selectedStudent.address}</p>
              </div>

              {/* Uploaded Documents (Admin-Only Aadhaar Access) */}
              <div className="space-y-3">
                <h4 className="font-display text-sm font-bold text-[#0F2557]">
                  Uploaded Documents (Authorised Admin Access)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedStudent.documents?.map((doc) => (
                    <div key={doc.id} className="p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase text-[#0F2557]">
                          {doc.docType} {doc.restrictedToAdmin ? '(Restricted)' : ''}
                        </span>
                        <a
                          href={`/api/admin/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#EA580C] font-semibold hover:underline"
                        >
                          <span>View File</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-slate-600 truncate">{doc.originalName}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateStudent(
                              selectedStudent.studentId,
                              { docId: doc.id, docStatus: 'verified' },
                              'Document verified.'
                            )
                          }
                          className="px-2.5 py-1 rounded bg-emerald-700 text-white font-semibold cursor-pointer"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateStudent(
                              selectedStudent.studentId,
                              { docId: doc.id, docStatus: 'rejected' },
                              'Document marked rejected.'
                            )
                          }
                          className="px-2.5 py-1 rounded bg-red-700 text-white font-semibold cursor-pointer"
                        >
                          Reject
                        </button>
                        <span className="ml-auto uppercase font-bold">{doc.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edit Student & Admission Decision */}
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <h4 className="font-display text-sm font-bold text-[#0F2557]">
                  Admission Approval &amp; Profile Edit
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Admission Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Course Applied</label>
                    <input
                      type="text"
                      value={editCourse}
                      onChange={(e) => setEditCourse(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
                    <input
                      type="text"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="text"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Administrator Remarks</label>
                    <input
                      type="text"
                      value={editRemarks}
                      onChange={(e) => setEditRemarks(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>
                </div>

                {tempResetPwd && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 font-semibold">
                    New Temporary Password for {selectedStudent.studentId}:{' '}
                    <span className="font-mono-tabular">{tempResetPwd}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateStudent(
                        selectedStudent.studentId,
                        {
                          admissionStatus: editStatus,
                          adminRemarks: editRemarks,
                          courseApplied: editCourse,
                          mobile: editMobile,
                          email: editEmail,
                        },
                        'Student details and admission status saved.'
                      )
                    }
                    className="px-4 py-2 rounded-lg bg-[#EA580C] text-white font-semibold cursor-pointer"
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateStudent(
                        selectedStudent.studentId,
                        { extendDays: 30 },
                        'Extended subscription by 30 days.'
                      )
                    }
                    className="px-3.5 py-2 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    +30 Days Subscription
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateStudent(
                        selectedStudent.studentId,
                        { accountActive: !selectedStudent.accountActive },
                        selectedStudent.accountActive ? 'Account deactivated.' : 'Account activated.'
                      )
                    }
                    className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                  >
                    {selectedStudent.accountActive ? 'Deactivate Account' : 'Activate Account'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateStudent(
                        selectedStudent.studentId,
                        { resetPassword: true },
                        'Temporary password reset.'
                      )
                    }
                    className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                  >
                    Reset Password
                  </button>

                  {settings && (
                    <button
                      type="button"
                      onClick={() => downloadAdmissionReceiptPdf(selectedStudent, settings)}
                      className="px-3.5 py-2 rounded-lg border border-[#0F2557] text-[#0F2557] font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
