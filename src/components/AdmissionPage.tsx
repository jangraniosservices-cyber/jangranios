import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Lock,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import type { SiteSettings } from '../types';

interface AdmissionPageProps {
  settings: SiteSettings;
  preselectedCourse?: string;
  onOpenStudentLogin: (prefillStudentId?: string) => void;
}

type DocKey = 'photo' | 'signature' | 'aadhaar' | 'qualification';
type AdmissionTab = 'admission' | 'public-exam' | 'status';

interface DocState {
  file: File | null;
  error: string;
  success: string;
}

const MAX_SIZE_BYTES = 1024 * 1024; // 1 MB
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];

export const AdmissionPage: React.FC<AdmissionPageProps> = ({
  settings,
  preselectedCourse,
  onOpenStudentLogin,
}) => {
  const [activeTab, setActiveTab] = useState<AdmissionTab>('admission');

  // Admission Form State
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('General');
  const [previousQualification, setPreviousQualification] = useState('');
  const [courseApplied, setCourseApplied] = useState('NIOS Secondary (10th)');
  const [studyMedium, setStudyMedium] = useState('English');
  const [previousSchoolBoard, setPreviousSchoolBoard] = useState('');
  const [declaration, setDeclaration] = useState(false);

  useEffect(() => {
    if (preselectedCourse) {
      if (preselectedCourse.toLowerCase().includes('12')) {
        setCourseApplied('NIOS Senior Secondary (12th)');
      } else {
        setCourseApplied('NIOS Secondary (10th)');
      }
    }
  }, [preselectedCourse]);

  const [docs, setDocs] = useState<Record<DocKey, DocState>>({
    photo: { file: null, error: '', success: '' },
    signature: { file: null, error: '', success: '' },
    aadhaar: { file: null, error: '', success: '' },
    qualification: { file: null, error: '', success: '' },
  });

  const fileInputRefs = useRef<Record<DocKey, HTMLInputElement | null>>({
    photo: null,
    signature: null,
    aadhaar: null,
    qualification: null,
  });

  const [admissionSubmitting, setAdmissionSubmitting] = useState(false);
  const [admissionError, setAdmissionError] = useState('');
  const [admissionReceipt, setAdmissionReceipt] = useState<{
    applicationNumber: string;
    studentId: string;
    temporaryPassword: string;
    fullName: string;
    courseApplied: string;
  } | null>(null);

  // Public Exam Form State
  const [examName, setExamName] = useState('');
  const [examDob, setExamDob] = useState('');
  const [examMobile, setExamMobile] = useState('');
  const [examEmail, setExamEmail] = useState('');
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [examSession, setExamSession] = useState('April / May Public Examination');
  const [examSubjects, setExamSubjects] = useState('');
  const [examSubmitting, setExamSubmitting] = useState(false);
  const [examError, setExamError] = useState('');
  const [examRef, setExamRef] = useState('');

  // Status Checker State
  const [statusAppNo, setStatusAppNo] = useState('');
  const [statusMobile, setStatusMobile] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [statusResult, setStatusResult] = useState<{
    applicationNumber: string;
    studentId: string;
    fullName: string;
    courseApplied: string;
    admissionStatus: string;
    adminRemarks: string;
    createdAt: string;
    documents: Array<{
      docType: string;
      originalName: string;
      status: string;
      restrictedToAdmin: boolean;
    }>;
  } | null>(null);

  const handleFileChange = (key: DocKey, file: File | undefined) => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTS.includes(ext)) {
      setDocs((prev) => ({
        ...prev,
        [key]: {
          file: null,
          error: 'Invalid format. Accepted: JPG, JPEG, PNG, PDF, DOC, DOCX.',
          success: '',
        },
      }));
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setDocs((prev) => ({
        ...prev,
        [key]: {
          file: null,
          error: `File size (${(file.size / 1024).toFixed(0)} KB) exceeds the 1 MB (1024 KB) maximum.`,
          success: '',
        },
      }));
      return;
    }

    setDocs((prev) => ({
      ...prev,
      [key]: {
        file,
        error: '',
        success: `Ready to upload (${(file.size / 1024).toFixed(1)} KB)`,
      },
    }));
  };

  const handleRemoveDoc = (key: DocKey) => {
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = '';
    }
    setDocs((prev) => ({
      ...prev,
      [key]: { file: null, error: '', success: '' },
    }));
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdmissionError('');

    if (!/^[0-9]{10}$/.test(mobile.trim())) {
      setAdmissionError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const requiredMap: Array<{ key: DocKey; required: boolean; label: string }> = [
      { key: 'photo', required: settings.requirePhoto, label: 'Box 1 – Student Photograph' },
      { key: 'signature', required: settings.requireSignature, label: 'Box 2 – Student Signature' },
      { key: 'aadhaar', required: settings.requireAadhaar, label: 'Box 3 – Aadhaar Card' },
      {
        key: 'qualification',
        required: settings.requireQualification,
        label: 'Box 4 – Previous Qualification Proof',
      },
    ];

    for (const item of requiredMap) {
      if (item.required && !docs[item.key].file) {
        setAdmissionError(`${item.label} is compulsory. Please upload a valid file (max 1 MB).`);
        return;
      }
    }

    if (!declaration) {
      setAdmissionError('Please check the student declaration box before submitting.');
      return;
    }

    setAdmissionSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('dob', dob);
      formData.append('mobile', mobile);
      formData.append('fatherName', fatherName);
      formData.append('motherName', motherName);
      formData.append('email', email);
      formData.append('address', address);
      formData.append('category', category);
      formData.append('previousQualification', previousQualification);
      formData.append('courseApplied', courseApplied);
      formData.append('studyMedium', studyMedium);
      formData.append('previousSchoolBoard', previousSchoolBoard);
      formData.append('declaration', 'true');

      if (docs.photo.file) formData.append('photo', docs.photo.file);
      if (docs.signature.file) formData.append('signature', docs.signature.file);
      if (docs.aadhaar.file) formData.append('aadhaar', docs.aadhaar.file);
      if (docs.qualification.file) formData.append('qualification', docs.qualification.file);

      const res = await fetch('/api/admissions/submit', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setAdmissionError(data.error || 'Submission failed. Please verify all inputs.');
      } else {
        setAdmissionReceipt(data);
      }
    } catch {
      setAdmissionError('Network error while submitting admission form. Please try again.');
    } finally {
      setAdmissionSubmitting(false);
    }
  };

  const handlePublicExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamError('');
    setExamRef('');
    setExamSubmitting(true);
    try {
      const res = await fetch('/api/public-exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: examName,
          dob: examDob,
          mobile: examMobile,
          email: examEmail,
          enrollmentNumber,
          examSession,
          subjects: examSubjects,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExamError(data.error || 'Unable to submit Public Exam form.');
      } else {
        setExamRef(data.referenceNumber);
        setExamName('');
        setExamDob('');
        setExamMobile('');
        setExamEmail('');
        setEnrollmentNumber('');
        setExamSubjects('');
      }
    } catch {
      setExamError('Network error. Please retry.');
    } finally {
      setExamSubmitting(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError('');
    setStatusResult(null);
    setStatusLoading(true);
    try {
      const res = await fetch('/api/admissions/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationNumber: statusAppNo, mobile: statusMobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusError(data.error || 'Record not found.');
      } else {
        setStatusResult(data);
      }
    } catch {
      setStatusError('Network error while checking status.');
    } finally {
      setStatusLoading(false);
    }
  };

  const docBoxes: Array<{
    key: DocKey;
    title: string;
    subtitle: string;
    required: boolean;
    restricted?: boolean;
  }> = [
    {
      key: 'photo',
      title: 'Box 1 – Student Photograph',
      subtitle: 'Upload recent passport-size colour photograph (Max 1 MB).',
      required: settings.requirePhoto,
    },
    {
      key: 'signature',
      title: 'Box 2 – Student Signature',
      subtitle: 'Upload clear signature on plain white paper (Max 1 MB).',
      required: settings.requireSignature,
    },
    {
      key: 'aadhaar',
      title: 'Box 3 – Aadhaar Card',
      subtitle: 'Upload front/back Aadhaar Card document (Max 1 MB).',
      required: settings.requireAadhaar,
      restricted: true,
    },
    {
      key: 'qualification',
      title: 'Box 4 – Previous Qualification Proof',
      subtitle: 'Upload previous class marksheet, TC, or board certificate (Max 1 MB).',
      required: settings.requireQualification,
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <section className="bg-[#0F2557] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <p className="text-sm font-semibold text-amber-400">Online Registration &amp; Verification</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Online Admission &amp; Public Exam Portal
          </h1>
          <p className="text-base text-slate-200 max-w-2xl">
            Complete your NIOS Secondary (10th) or Senior Secondary (12th) admission form, submit Public Exam forms, or track your existing application.
          </p>
        </div>
      </section>

      {/* Segmented Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="inline-flex flex-wrap gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('admission')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'admission'
                ? 'bg-[#0F2557] text-white'
                : 'text-slate-600 hover:text-[#0F2557] hover:bg-slate-100'
            }`}
          >
            New Admission Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('public-exam')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'public-exam'
                ? 'bg-[#0F2557] text-white'
                : 'text-slate-600 hover:text-[#0F2557] hover:bg-slate-100'
            }`}
          >
            Online Public Exam Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'status'
                ? 'bg-[#0F2557] text-white'
                : 'text-slate-600 hover:text-[#0F2557] hover:bg-slate-100'
            }`}
          >
            Check Application Status
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {/* TAB 1: NEW ADMISSION FORM */}
        {activeTab === 'admission' && (
          <>
            {admissionReceipt ? (
              <div className="bg-white rounded-xl border border-emerald-300 p-6 sm:p-8 space-y-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" aria-hidden="true" />
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#0F2557]">
                      Admission Application Submitted Successfully
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Your application and documents have been securely transmitted to the Administrator Dashboard. Save your login credentials below.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500">Application Number</p>
                    <p className="font-mono-tabular text-lg font-bold text-[#0F2557]">
                      {admissionReceipt.applicationNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Generated Student ID</p>
                    <p className="font-mono-tabular text-lg font-bold text-[#EA580C]">
                      {admissionReceipt.studentId}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Temporary Password</p>
                    <p className="font-mono-tabular text-lg font-bold text-emerald-700">
                      {admissionReceipt.temporaryPassword}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenStudentLogin(admissionReceipt.studentId)}
                    className="px-5 py-2.5 rounded-lg bg-[#0F2557] hover:bg-[#19377D] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Log In to Student Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusAppNo(admissionReceipt.applicationNumber);
                      setStatusMobile(mobile);
                      setAdmissionReceipt(null);
                      setActiveTab('status');
                    }}
                    className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:border-[#0F2557] cursor-pointer"
                  >
                    Track Application Status
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAdmissionSubmit} className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <h2 className="font-display text-xl font-bold text-[#0F2557]">
                      01. Personal Information
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter details accurately as per your Aadhaar Card and previous school records.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="adm-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        1. Student Full Name *
                      </label>
                      <input
                        id="adm-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Aarav Sharma"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                      />
                    </div>

                    <div>
                      <label htmlFor="adm-dob" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        2. Date of Birth *
                      </label>
                      <input
                        id="adm-dob"
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                      />
                    </div>

                    <div>
                      <label htmlFor="adm-mobile" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        3. Mobile Number (10 digits) *
                      </label>
                      <input
                        id="adm-mobile"
                        type="tel"
                        required
                        maxLength={10}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="9968834276"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm tabular-nums focus:outline-none focus:border-[#0F2557]"
                      />
                    </div>

                    <div>
                      <label htmlFor="adm-father" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        4. Father&apos;s Name *
                      </label>
                      <input
                        id="adm-father"
                        type="text"
                        required
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="Father's full name"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                      />
                    </div>

                    <div>
                      <label htmlFor="adm-mother" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        5. Mother&apos;s Name *
                      </label>
                      <input
                        id="adm-mother"
                        type="text"
                        required
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="Mother's full name"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                      />
                    </div>

                    <div>
                      <label htmlFor="adm-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        6. Email Address *
                      </label>
                      <input
                        id="adm-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="adm-address" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        7. Full Residential Address *
                      </label>
                      <textarea
                        id="adm-address"
                        rows={2}
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House No., Street, Locality, City, State, PIN Code"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                      />
                    </div>

                    <div>
                      <label htmlFor="adm-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        8. Category *
                      </label>
                      <select
                        id="adm-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#0F2557]"
                      >
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Educational Information Section */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <h2 className="font-display text-xl font-bold text-[#0F2557]">
                      02. Educational Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="adm-prev-qual" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        9. Previous Qualification *
                      </label>
                      <input
                        id="adm-prev-qual"
                        type="text"
                        required
                        value={previousQualification}
                        onChange={(e) => setPreviousQualification(e.target.value)}
                        placeholder="e.g. Class 8th / 9th / 10th Passed"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                      />
                    </div>

                    <div>
                      <label htmlFor="adm-course" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        10. Course Applied For *
                      </label>
                      <select
                        id="adm-course"
                        value={courseApplied}
                        onChange={(e) => setCourseApplied(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#0F2557]"
                      >
                        <option value="NIOS Secondary (10th)">NIOS Secondary (10th)</option>
                        <option value="NIOS Senior Secondary (12th)">NIOS Senior Secondary (12th)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="adm-medium" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        11. Study Medium *
                      </label>
                      <select
                        id="adm-medium"
                        value={studyMedium}
                        onChange={(e) => setStudyMedium(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#0F2557]"
                      >
                        <option value="Hindi">Hindi</option>
                        <option value="English">English</option>
                        <option value="Urdu">Urdu</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="adm-board" className="block text-xs font-semibold text-slate-700 mb-1.5">
                        12. Previous School / Board Name *
                      </label>
                      <input
                        id="adm-board"
                        type="text"
                        required
                        value={previousSchoolBoard}
                        onChange={(e) => setPreviousSchoolBoard(e.target.value)}
                        placeholder="e.g. CBSE / HBSE / State Board / Private"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                      />
                    </div>
                  </div>
                </div>

                {/* Four Document Upload Boxes */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div className="border-b border-slate-200 pb-4">
                    <h2 className="font-display text-xl font-bold text-[#0F2557]">
                      03. Document Upload (Four Separate Boxes)
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Accepted formats: JPG, JPEG, PNG, PDF, DOC, DOCX · Maximum size: 1 MB per document.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {docBoxes.map((box) => {
                      const state = docs[box.key];
                      return (
                        <div
                          key={box.key}
                          className={`rounded-xl border p-5 space-y-3 ${
                            state.error
                              ? 'border-red-300 bg-red-50/40'
                              : state.file
                              ? 'border-emerald-300 bg-emerald-50/30'
                              : 'border-slate-300 bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-display text-sm font-bold text-[#0F2557]">
                                {box.title} {box.required ? '*' : '(Optional)'}
                              </h3>
                              <p className="text-xs text-slate-600 mt-0.5">{box.subtitle}</p>
                            </div>
                          </div>

                          {box.restricted && (
                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#0F2557]/5 border border-[#0F2557]/15 text-[11px] text-[#0F2557]">
                              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                              <span>
                                Access restricted strictly to authorised administrators via protected server controls.
                              </span>
                            </div>
                          )}

                          <input
                            ref={(el) => {
                              fileInputRefs.current[box.key] = el;
                            }}
                            id={`upload-${box.key}`}
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                            className="sr-only"
                            onChange={(e) => handleFileChange(box.key, e.target.files?.[0])}
                          />

                          {!state.file ? (
                            <label
                              htmlFor={`upload-${box.key}`}
                              className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-dashed border-slate-400 hover:border-[#0F2557] bg-white text-xs font-semibold text-[#0F2557] cursor-pointer transition-colors"
                            >
                              <Upload className="w-4 h-4" aria-hidden="true" />
                              <span>Select File (Max 1 MB)</span>
                            </label>
                          ) : (
                            <div className="bg-white rounded-lg border border-emerald-200 p-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs text-slate-800">
                                <FileText className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                                <span className="font-medium truncate flex-1">{state.file.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[box.key]?.click()}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                                  <span>Re-upload</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(box.key)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 text-[11px] font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {state.error && (
                            <p className="text-xs text-red-700 flex items-start gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                              <span>{state.error}</span>
                            </p>
                          )}
                          {state.success && !state.error && (
                            <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>{state.success}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Declaration & Submit */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={declaration}
                      onChange={(e) => setDeclaration(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0F2557] focus:ring-[#0F2557]"
                    />
                    <span className="text-sm text-slate-700 leading-relaxed">
                      I hereby declare that all personal, educational, and uploaded document information submitted in this online admission form is true and authentic to the best of my knowledge.
                    </span>
                  </label>

                  {admissionError && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{admissionError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={admissionSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-white text-base font-semibold transition-colors cursor-pointer"
                  >
                    {admissionSubmitting ? 'Submitting & Encrypting Documents...' : 'Submit Admission Form'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* TAB 2: ONLINE PUBLIC EXAM FORM */}
        {activeTab === 'public-exam' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="font-display text-2xl font-bold text-[#0F2557]">
                Online Public Exam Form
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                For enrolled NIOS learners submitting Public Examination subject registration.
              </p>
            </div>

            {examRef && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                  Public Exam Form Submitted!
                </p>
                <p className="text-xs">
                  Reference Number: <strong className="font-mono-tabular">{examRef}</strong>. Our exam desk has received your request.
                </p>
              </div>
            )}

            {examError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {examError}
              </div>
            )}

            <form onSubmit={handlePublicExamSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="exm-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    1. Student Full Name *
                  </label>
                  <input
                    id="exm-name"
                    type="text"
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="Full name as on NIOS ID card"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                  />
                </div>
                <div>
                  <label htmlFor="exm-dob" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    2. Date of Birth *
                  </label>
                  <input
                    id="exm-dob"
                    type="date"
                    required
                    value={examDob}
                    onChange={(e) => setExamDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                  />
                </div>
                <div>
                  <label htmlFor="exm-mobile" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    3. Mobile Number *
                  </label>
                  <input
                    id="exm-mobile"
                    type="tel"
                    required
                    maxLength={10}
                    value={examMobile}
                    onChange={(e) => setExamMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm tabular-nums focus:outline-none focus:border-[#0F2557]"
                  />
                </div>
                <div>
                  <label htmlFor="exm-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    4. Email Address *
                  </label>
                  <input
                    id="exm-email"
                    type="email"
                    required
                    value={examEmail}
                    onChange={(e) => setExamEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                  />
                </div>
                <div>
                  <label htmlFor="exm-enroll" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    5. Enrollment Number *
                  </label>
                  <input
                    id="exm-enroll"
                    type="text"
                    required
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                    placeholder="e.g. 270145261001"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono-tabular focus:outline-none focus:border-[#0F2557]"
                  />
                </div>
                <div>
                  <label htmlFor="exm-session" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Exam Session
                  </label>
                  <select
                    id="exm-session"
                    value={examSession}
                    onChange={(e) => setExamSession(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-[#0F2557]"
                  >
                    <option value="April / May Public Examination">April / May Public Examination</option>
                    <option value="October / November Public Examination">October / November Public Examination</option>
                    <option value="On-Demand Examination (ODE)">On-Demand Examination (ODE)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="exm-subjects" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subjects &amp; Subject Codes (Optional)
                  </label>
                  <input
                    id="exm-subjects"
                    type="text"
                    value={examSubjects}
                    onChange={(e) => setExamSubjects(e.target.value)}
                    placeholder="e.g. English (302), Mathematics (311), Physics (312)"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0F2557]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={examSubmitting}
                className="px-6 py-3 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {examSubmitting ? 'Submitting...' : 'Submit Public Exam Form'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: CHECK APPLICATION STATUS */}
        {activeTab === 'status' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0F2557]">
                Check Admission Application Status
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Enter your Application Number and registered Mobile Number to view current verification progress.
              </p>
            </div>

            <form onSubmit={handleCheckStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label htmlFor="st-appno" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Application Number
                </label>
                <input
                  id="st-appno"
                  type="text"
                  required
                  value={statusAppNo}
                  onChange={(e) => setStatusAppNo(e.target.value)}
                  placeholder="APP-2026-8410"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono-tabular focus:outline-none focus:border-[#0F2557]"
                />
              </div>
              <div>
                <label htmlFor="st-mobile" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Mobile
                </label>
                <input
                  id="st-mobile"
                  type="tel"
                  required
                  value={statusMobile}
                  onChange={(e) => setStatusMobile(e.target.value)}
                  placeholder="9811223344"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm tabular-nums focus:outline-none focus:border-[#0F2557]"
                />
              </div>
              <button
                type="submit"
                disabled={statusLoading}
                className="py-2.5 px-5 rounded-lg bg-[#0F2557] hover:bg-[#19377D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                <span>{statusLoading ? 'Checking...' : 'Check Status'}</span>
              </button>
            </form>

            {statusError && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {statusError}
              </div>
            )}

            {statusResult && (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs text-slate-500 font-mono-tabular">
                      {statusResult.applicationNumber} · Student ID: {statusResult.studentId}
                    </p>
                    <h3 className="font-display text-lg font-bold text-[#0F2557]">
                      {statusResult.fullName}
                    </h3>
                    <p className="text-xs text-slate-600">{statusResult.courseApplied}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Admission Status</p>
                    <p
                      className={`font-display text-base font-bold uppercase ${
                        statusResult.admissionStatus === 'approved'
                          ? 'text-emerald-700'
                          : statusResult.admissionStatus === 'rejected'
                          ? 'text-red-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {statusResult.admissionStatus}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-700">
                  <strong>Administrator Remarks:</strong> {statusResult.adminRemarks || 'Pending review.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {statusResult.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[#0F2557] uppercase">{doc.docType}</p>
                        <p className="text-slate-500 truncate max-w-[180px]">{doc.originalName}</p>
                      </div>
                      <span
                        className={`font-semibold uppercase ${
                          doc.status === 'verified'
                            ? 'text-emerald-700'
                            : doc.status === 'rejected'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
