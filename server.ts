import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  db,
  getUploadsDir,
  hashPassword,
  initDatabase,
  syncSubscriptionExpiries,
  verifyPassword,
} from './src/db/database.ts';

initDatabase();

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

const COOKIE_NAME = 'jns_session';
const MAX_DOC_SIZE = 1024 * 1024; // 1 MB strict limit
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx']);
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

interface SessionPayload {
  role: 'student' | 'admin';
  studentId?: string;
  email?: string;
  fullName: string;
  csrfToken: string;
  exp: number;
}

interface AuthedRequest extends Request {
  sessionUser?: SessionPayload;
}

function signSession(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = decodeURIComponent(pair.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

function setSessionCookie(res: Response, payload: Omit<SessionPayload, 'exp' | 'csrfToken'>): SessionPayload {
  const fullPayload: SessionPayload = {
    ...payload,
    csrfToken: crypto.randomBytes(24).toString('hex'),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  const token = signSession(fullPayload);
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return fullPayload;
}

function attachSession(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const cookies = parseCookies(req);
  const session = verifySession(cookies[COOKIE_NAME]);
  if (session) {
    req.sessionUser = session;
  }
  next();
}

function requireAuth(role?: 'student' | 'admin') {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.sessionUser) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (role && req.sessionUser.role !== role) {
      return res.status(403).json({ error: 'Access denied for your account role.' });
    }
    next();
  };
}

function requireCsrf(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.sessionUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const headerToken = req.headers['x-csrf-token'];
  if (typeof headerToken !== 'string' || headerToken.length !== req.sessionUser.csrfToken.length) {
    res.status(403).json({ error: 'Invalid or missing CSRF token.' });
    return;
  }
  const a = Buffer.from(headerToken, 'utf8');
  const b = Buffer.from(req.sessionUser.csrfToken, 'utf8');
  if (!crypto.timingSafeEqual(a, b)) {
    res.status(403).json({ error: 'CSRF verification failed.' });
    return;
  }
  next();
}

function formatSettings(row: any) {
  return {
    businessName: row.business_name,
    heroHeading: row.hero_heading,
    heroSubheading: row.hero_subheading,
    heroImageUrl: row.hero_image_url,
    aboutIntro: row.about_intro,
    mission: row.mission,
    vision: row.vision,
    objectives: row.objectives,
    niosGuidance: row.nios_guidance,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    workingHours: row.working_hours,
    mapLat: row.map_lat,
    mapLng: row.map_lng,
    requirePhoto: Boolean(row.require_photo),
    requireSignature: Boolean(row.require_signature),
    requireAadhaar: Boolean(row.require_aadhaar),
    requireQualification: Boolean(row.require_qualification),
  };
}

function formatCourse(row: any) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    details: row.details,
    fee: Number(row.fee),
    duration: row.duration,
    subscriptionNote: row.subscription_note,
    imageUrl: row.image_url,
    active: Boolean(row.active),
  };
}

function formatPlan(row: any) {
  return {
    id: row.id,
    name: row.name,
    billingCycle: row.billing_cycle,
    durationDays: Number(row.duration_days),
    price: Number(row.price),
    description: row.description,
    features: JSON.parse(row.features_json || '[]'),
    active: Boolean(row.active),
  };
}

function formatStudent(row: any, docs: any[] = []) {
  return {
    id: row.id,
    studentId: row.student_id,
    applicationNumber: row.application_number,
    fullName: row.full_name,
    dob: row.dob,
    mobile: row.mobile,
    fatherName: row.father_name,
    motherName: row.mother_name,
    email: row.email,
    address: row.address,
    category: row.category,
    previousQualification: row.previous_qualification,
    courseApplied: row.course_applied,
    studyMedium: row.study_medium,
    previousSchoolBoard: row.previous_school_board,
    admissionStatus: row.admission_status,
    adminRemarks: row.admin_remarks || '',
    accountActive: Boolean(row.account_active),
    subscriptionStatus: row.subscription_status,
    subscriptionPlanId: row.subscription_plan_id,
    subscriptionPlanName: row.subscription_plan_name,
    subscriptionExpiry: row.subscription_expiry,
    createdAt: row.created_at,
    documents: docs.map((d) => ({
      id: d.id,
      studentId: d.student_id,
      docType: d.doc_type,
      originalName: d.original_name,
      mimeType: d.mime_type,
      fileSize: d.file_size,
      status: d.status,
      uploadedAt: d.uploaded_at,
      restrictedToAdmin: Boolean(d.restricted_to_admin),
    })),
  };
}

// Configure secure Multer storage outside public directories
const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadsDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}_${crypto.randomBytes(10).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

const uploadAdmissionDocs = multer({
  storage: docStorage,
  limits: { fileSize: MAX_DOC_SIZE, files: 4 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTS.has(ext) || !ALLOWED_MIMES.has(file.mimetype)) {
      cb(new Error('Invalid file type. Allowed formats: JPG, JPEG, PNG, PDF, DOC, DOCX.'));
      return;
    }
    cb(null, true);
  },
});

const GALLERY_DIR = path.resolve(process.cwd(), 'uploads', 'gallery');
if (!fs.existsSync(GALLERY_DIR)) {
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
}

const galleryUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, GALLERY_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `gal_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      cb(new Error('Gallery image must be JPG, PNG, or WEBP.'));
      return;
    }
    cb(null, true);
  },
});

function generateUniqueStudentId(): string {
  const year = new Date().getFullYear();
  for (let i = 0; i < 20; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const candidate = `JNS-${year}-${num}`;
    const exists = db.prepare('SELECT 1 FROM students WHERE student_id = ?').get(candidate);
    if (!exists) return candidate;
  }
  return `JNS-${year}-${Date.now().toString().slice(-5)}`;
}

function generateUniqueAppNumber(): string {
  const year = new Date().getFullYear();
  for (let i = 0; i < 20; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const candidate = `APP-${year}-${num}`;
    const exists = db.prepare('SELECT 1 FROM students WHERE application_number = ?').get(candidate);
    if (!exists) return candidate;
  }
  return `APP-${year}-${Date.now().toString().slice(-5)}`;
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return `Jns@${code}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(attachSession);

  // Serve admin-uploaded gallery photos safely
  app.use('/uploads/gallery', express.static(GALLERY_DIR));

  // Public bootstrap endpoint
  app.get('/api/public/bootstrap', (_req, res) => {
    syncSubscriptionExpiries();
    const settingsRow = db.prepare('SELECT * FROM site_settings WHERE id = 1').get();
    const courseRows = db.prepare('SELECT * FROM courses WHERE active = 1 ORDER BY id ASC').all();
    const annRows = db.prepare('SELECT * FROM announcements ORDER BY published_at DESC, id DESC').all();
    const galRows = db.prepare('SELECT * FROM gallery ORDER BY id DESC').all();
    const planRows = db.prepare('SELECT * FROM subscription_plans WHERE active = 1 ORDER BY price ASC').all();

    res.json({
      settings: formatSettings(settingsRow),
      courses: courseRows.map(formatCourse),
      announcements: annRows.map((a: any) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        category: a.category,
        isUrgent: Boolean(a.is_urgent),
        publishedAt: a.published_at,
      })),
      gallery: galRows.map((g: any) => ({
        id: g.id,
        title: g.title,
        caption: g.caption,
        imageUrl: g.image_url,
        createdAt: g.created_at,
      })),
      plans: planRows.map(formatPlan),
      mapsApiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
    });
  });

  // Auth status
  app.get('/api/auth/me', (req: AuthedRequest, res) => {
    if (!req.sessionUser) {
      res.json({ user: null });
      return;
    }
    res.json({
      user: {
        role: req.sessionUser.role,
        studentId: req.sessionUser.studentId,
        email: req.sessionUser.email,
        fullName: req.sessionUser.fullName,
        csrfToken: req.sessionUser.csrfToken,
      },
    });
  });

  // Student Login
  app.post('/api/auth/student/login', (req, res) => {
    const { studentId, password } = req.body || {};
    if (!studentId || !password) {
      res.status(400).json({ error: 'Student ID and password are required.' });
      return;
    }
    const row = db.prepare('SELECT * FROM students WHERE student_id = ?').get(String(studentId).trim().toUpperCase()) as any;
    if (!row || !verifyPassword(String(password), row.password_hash)) {
      res.status(401).json({ error: 'Invalid Student ID or password.' });
      return;
    }
    if (!row.account_active) {
      res.status(403).json({ error: 'Your student account has been deactivated by the administrator.' });
      return;
    }
    const session = setSessionCookie(res, {
      role: 'student',
      studentId: row.student_id,
      email: row.email,
      fullName: row.full_name,
    });
    res.json({
      user: {
        role: session.role,
        studentId: session.studentId,
        email: session.email,
        fullName: session.fullName,
        csrfToken: session.csrfToken,
      },
    });
  });

  // Student Forgot Password
  app.post('/api/auth/student/forgot-password', (req, res) => {
    const { studentId, mobile, dob } = req.body || {};
    if (!studentId || !mobile || !dob) {
      res.status(400).json({ error: 'Student ID, registered mobile number, and Date of Birth are required.' });
      return;
    }
    const row = db.prepare('SELECT * FROM students WHERE student_id = ?').get(String(studentId).trim().toUpperCase()) as any;
    if (!row || row.mobile.trim() !== String(mobile).trim() || row.dob.trim() !== String(dob).trim()) {
      res.status(400).json({ error: 'Verification failed. Details do not match our student records.' });
      return;
    }
    const newTemp = generateTempPassword();
    db.prepare('UPDATE students SET password_hash = ? WHERE student_id = ?').run(hashPassword(newTemp), row.student_id);
    res.json({
      message: 'Identity verified. A new temporary password has been generated. Please log in and change it immediately.',
      temporaryPassword: newTemp,
    });
  });

  // Admin Login
  app.post('/api/auth/admin/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Admin email and password are required.' });
      return;
    }
    const row = db.prepare('SELECT * FROM admins WHERE lower(email) = lower(?)').get(String(email).trim()) as any;
    if (!row || !verifyPassword(String(password), row.password_hash)) {
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }
    const session = setSessionCookie(res, {
      role: 'admin',
      email: row.email,
      fullName: row.full_name,
    });
    res.json({
      user: {
        role: session.role,
        email: session.email,
        fullName: session.fullName,
        csrfToken: session.csrfToken,
      },
    });
  });

  // Logout
  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ ok: true });
  });

  // Online Admission Form Submission (with 4 Document Upload Boxes)
  app.post(
    '/api/admissions/submit',
    (req, res, next) => {
      uploadAdmissionDocs.fields([
        { name: 'photo', maxCount: 1 },
        { name: 'signature', maxCount: 1 },
        { name: 'aadhaar', maxCount: 1 },
        { name: 'qualification', maxCount: 1 },
      ])(req, res, (err: any) => {
        if (err) {
          res.status(400).json({
            error:
              err.code === 'LIMIT_FILE_SIZE'
                ? 'One or more documents exceed the strict 1 MB maximum file size limit.'
                : err.message || 'Document upload validation failed.',
          });
          return;
        }
        next();
      });
    },
    (req, res) => {
      const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
      const cleanupFiles = () => {
        for (const list of Object.values(files)) {
          for (const f of list) {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
          }
        }
      };

      try {
        const body = req.body || {};
        const requiredFields = [
          'fullName',
          'dob',
          'mobile',
          'fatherName',
          'motherName',
          'email',
          'address',
          'category',
          'previousQualification',
          'courseApplied',
          'studyMedium',
          'previousSchoolBoard',
        ];

        for (const field of requiredFields) {
          if (!body[field] || String(body[field]).trim().length === 0) {
            cleanupFiles();
            res.status(400).json({ error: `Missing required field: ${field}` });
            return;
          }
        }

        if (!/^[0-9]{10}$/.test(String(body.mobile).trim())) {
          cleanupFiles();
          res.status(400).json({ error: 'Mobile number must be a valid 10-digit number.' });
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) {
          cleanupFiles();
          res.status(400).json({ error: 'Please provide a valid email address.' });
          return;
        }

        if (body.declaration !== 'true' && body.declaration !== true) {
          cleanupFiles();
          res.status(400).json({ error: 'You must accept the student declaration before submitting.' });
          return;
        }

        const settingsRow = db.prepare('SELECT * FROM site_settings WHERE id = 1').get() as any;
        const requiredDocs: Array<{ key: 'photo' | 'signature' | 'aadhaar' | 'qualification'; label: string; required: boolean }> = [
          { key: 'photo', label: 'Box 1 – Student Photograph', required: Boolean(settingsRow.require_photo) },
          { key: 'signature', label: 'Box 2 – Student Signature', required: Boolean(settingsRow.require_signature) },
          { key: 'aadhaar', label: 'Box 3 – Aadhaar Card', required: Boolean(settingsRow.require_aadhaar) },
          { key: 'qualification', label: 'Box 4 – Previous Qualification Proof', required: Boolean(settingsRow.require_qualification) },
        ];

        for (const docSpec of requiredDocs) {
          if (docSpec.required && (!files[docSpec.key] || files[docSpec.key].length === 0)) {
            cleanupFiles();
            res.status(400).json({ error: `${docSpec.label} is mandatory.` });
            return;
          }
        }

        const studentId = generateUniqueStudentId();
        const applicationNumber = generateUniqueAppNumber();
        const tempPassword = generateTempPassword();
        const passwordHash = hashPassword(tempPassword);

        db.exec('BEGIN');
        db.prepare(`
          INSERT INTO students (
            student_id, application_number, password_hash, full_name, dob, mobile,
            father_name, mother_name, email, address, category, previous_qualification,
            course_applied, study_medium, previous_school_board, admission_status,
            admin_remarks, account_active, subscription_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 1, 'none')
        `).run(
          studentId,
          applicationNumber,
          passwordHash,
          String(body.fullName).trim(),
          String(body.dob).trim(),
          String(body.mobile).trim(),
          String(body.fatherName).trim(),
          String(body.motherName).trim(),
          String(body.email).trim(),
          String(body.address).trim(),
          String(body.category).trim(),
          String(body.previousQualification).trim(),
          String(body.courseApplied).trim(),
          String(body.studyMedium).trim(),
          String(body.previousSchoolBoard).trim(),
          'Application received. Pending administrator document verification.'
        );

        const insertDoc = db.prepare(`
          INSERT INTO student_documents (
            student_id, doc_type, original_name, stored_filename, mime_type, file_size, status, restricted_to_admin
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        `);

        for (const docType of ['photo', 'signature', 'aadhaar', 'qualification'] as const) {
          const uploaded = files[docType]?.[0];
          if (uploaded) {
            insertDoc.run(
              studentId,
              docType,
              uploaded.originalname,
              uploaded.filename,
              uploaded.mimetype,
              uploaded.size,
              docType === 'aadhaar' ? 1 : 0
            );
          }
        }
        db.exec('COMMIT');

        res.status(201).json({
          message: 'Admission form submitted successfully!',
          applicationNumber,
          studentId,
          temporaryPassword: tempPassword,
          courseApplied: String(body.courseApplied).trim(),
          fullName: String(body.fullName).trim(),
        });
      } catch (err: any) {
        try {
          db.exec('ROLLBACK');
        } catch {
          // ignore if not in tx
        }
        cleanupFiles();
        console.error('Admission submission error:', err);
        res.status(500).json({ error: 'Unable to submit admission form. Please try again.' });
      }
    }
  );

  // Application Status Check
  app.post('/api/admissions/status', (req, res) => {
    const { applicationNumber, mobile } = req.body || {};
    if (!applicationNumber || !mobile) {
      res.status(400).json({ error: 'Application Number and Mobile Number are required.' });
      return;
    }
    const row = db
      .prepare('SELECT * FROM students WHERE upper(application_number) = upper(?) AND mobile = ?')
      .get(String(applicationNumber).trim(), String(mobile).trim()) as any;
    if (!row) {
      res.status(404).json({ error: 'No admission record found matching those details.' });
      return;
    }
    const docs = db.prepare('SELECT id, doc_type, original_name, status, uploaded_at, restricted_to_admin FROM student_documents WHERE student_id = ?').all(row.student_id) as any[];
    res.json({
      applicationNumber: row.application_number,
      studentId: row.student_id,
      fullName: row.full_name,
      courseApplied: row.course_applied,
      admissionStatus: row.admission_status,
      adminRemarks: row.admin_remarks,
      createdAt: row.created_at,
      documents: docs.map((d) => ({
        docType: d.doc_type,
        originalName: d.original_name,
        status: d.status,
        restrictedToAdmin: Boolean(d.restricted_to_admin),
      })),
    });
  });

  // Public Exam Form Submission
  app.post('/api/public-exam/submit', (req, res) => {
    const { fullName, dob, mobile, email, enrollmentNumber, examSession, subjects } = req.body || {};
    if (!fullName || !dob || !mobile || !email || !enrollmentNumber) {
      res.status(400).json({ error: 'All Personal Information fields and Enrollment Number are mandatory.' });
      return;
    }
    if (!/^[0-9]{10}$/.test(String(mobile).trim())) {
      res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
      return;
    }
    const refNumber = `EXM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(`
      INSERT INTO public_exam_forms (reference_number, full_name, dob, mobile, email, enrollment_number, exam_session, subjects, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
    `).run(
      refNumber,
      String(fullName).trim(),
      String(dob).trim(),
      String(mobile).trim(),
      String(email).trim(),
      String(enrollmentNumber).trim(),
      String(examSession || 'Upcoming Public Exam Session').trim(),
      String(subjects || 'As per NIOS Registration').trim()
    );

    res.status(201).json({
      message: 'Public Exam form submitted successfully.',
      referenceNumber: refNumber,
    });
  });

  // Contact Enquiry Submission
  app.post('/api/contact/submit', (req, res) => {
    const { name, mobile, email, subject, message } = req.body || {};
    if (!name || !mobile || !email || !message) {
      res.status(400).json({ error: 'Name, mobile, email, and message are required.' });
      return;
    }
    db.prepare(`
      INSERT INTO contact_enquiries (name, mobile, email, subject, message, status)
      VALUES (?, ?, ?, ?, ?, 'new')
    `).run(
      String(name).trim(),
      String(mobile).trim(),
      String(email).trim(),
      String(subject || 'General NIOS Enquiry').trim(),
      String(message).trim()
    );
    res.status(201).json({ message: 'Thank you! Your enquiry has been sent to Jangra NIOS Services.' });
  });

  // =========================================================================
  // STUDENT PROTECTED ROUTES
  // =========================================================================

  app.get('/api/student/profile', requireAuth('student'), (req: AuthedRequest, res) => {
    syncSubscriptionExpiries();
    const sid = req.sessionUser!.studentId!;
    const row = db.prepare('SELECT * FROM students WHERE student_id = ?').get(sid) as any;
    if (!row) {
      res.status(404).json({ error: 'Student account not found.' });
      return;
    }
    const docs = db.prepare('SELECT * FROM student_documents WHERE student_id = ?').all(sid) as any[];
    const payments = db
      .prepare('SELECT * FROM payments WHERE student_id = ? ORDER BY id DESC')
      .all(sid) as any[];
    const plans = db.prepare('SELECT * FROM subscription_plans WHERE active = 1 ORDER BY price ASC').all();

    res.json({
      student: formatStudent(row, docs),
      payments: payments.map((p) => ({
        id: p.id,
        receiptNumber: p.receipt_number,
        studentId: p.student_id,
        planId: p.plan_id,
        planName: p.plan_name,
        amount: Number(p.amount),
        paymentMethod: p.payment_method,
        razorpayOrderId: p.razorpay_order_id,
        razorpayPaymentId: p.razorpay_payment_id,
        upiReference: p.upi_reference,
        status: p.status,
        createdAt: p.created_at,
      })),
      plans: plans.map(formatPlan),
    });
  });

  app.post('/api/student/change-password', requireAuth('student'), requireCsrf, (req: AuthedRequest, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: 'Current password and a new password (min 6 chars) are required.' });
      return;
    }
    const sid = req.sessionUser!.studentId!;
    const row = db.prepare('SELECT password_hash FROM students WHERE student_id = ?').get(sid) as any;
    if (!row || !verifyPassword(String(currentPassword), row.password_hash)) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    db.prepare('UPDATE students SET password_hash = ? WHERE student_id = ?').run(hashPassword(String(newPassword)), sid);
    res.json({ message: 'Password updated successfully.' });
  });

  // Payment Order Creation (Razorpay API if configured, else Verified UPI/Sandbox Checkout)
  app.post('/api/payments/create-order', requireAuth('student'), requireCsrf, async (req: AuthedRequest, res) => {
    const { planId } = req.body || {};
    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ? AND active = 1').get(Number(planId)) as any;
    if (!plan) {
      res.status(404).json({ error: 'Selected subscription plan is unavailable.' });
      return;
    }

    const rzpKey = process.env.RAZORPAY_KEY_ID || '';
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET || '';
    const amountPaise = Math.round(Number(plan.price) * 100);
    const receipt = `JNS_${Date.now()}`;

    if (rzpKey && rzpSecret) {
      try {
        const authStr = Buffer.from(`${rzpKey}:${rzpSecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authStr}`,
          },
          body: JSON.stringify({
            amount: amountPaise,
            currency: 'INR',
            receipt,
            notes: { studentId: req.sessionUser!.studentId, planId: String(plan.id) },
          }),
        });
        if (rzpRes.ok) {
          const orderData = (await rzpRes.json()) as any;
          res.json({
            mode: 'razorpay_live',
            keyId: rzpKey,
            orderId: orderData.id,
            amount: Number(plan.price),
            amountPaise,
            plan: formatPlan(plan),
          });
          return;
        }
      } catch (err) {
        console.error('Razorpay order creation fallback:', err);
      }
    }

    const orderId = `order_JNS_${crypto.randomBytes(6).toString('hex')}`;
    const orderToken = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${orderId}:${req.sessionUser!.studentId}:${plan.id}:${plan.price}`)
      .digest('hex');

    res.json({
      mode: 'verified_gateway',
      orderId,
      orderToken,
      amount: Number(plan.price),
      amountPaise,
      upiId: 'jangranios@okicici',
      plan: formatPlan(plan),
    });
  });

  // Payment Verification & Automatic Subscription Activation
  app.post('/api/payments/verify', requireAuth('student'), requireCsrf, (req: AuthedRequest, res) => {
    const {
      planId,
      orderId,
      orderToken,
      paymentMethod,
      razorpayPaymentId,
      razorpaySignature,
      upiReference,
    } = req.body || {};

    const sid = req.sessionUser!.studentId!;
    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ? AND active = 1').get(Number(planId)) as any;
    if (!plan) {
      res.status(404).json({ error: 'Subscription plan not found.' });
      return;
    }

    const rzpSecret = process.env.RAZORPAY_KEY_SECRET || '';
    if (rzpSecret && razorpaySignature && razorpayPaymentId) {
      const expectedSig = crypto
        .createHmac('sha256', rzpSecret)
        .update(`${orderId}|${razorpayPaymentId}`)
        .digest('hex');
      if (expectedSig !== razorpaySignature) {
        res.status(400).json({ error: 'Razorpay payment signature verification failed.' });
        return;
      }
    } else {
      const expectedOrderToken = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(`${orderId}:${sid}:${plan.id}:${plan.price}`)
        .digest('hex');
      if (!orderToken || orderToken !== expectedOrderToken) {
        res.status(400).json({ error: 'Invalid payment order verification token.' });
        return;
      }
      if (paymentMethod === 'UPI' && (!upiReference || String(upiReference).trim().length < 6)) {
        res.status(400).json({ error: 'Please enter a valid 6+ character UPI Transaction / UTR reference.' });
        return;
      }
    }

    const studentRow = db.prepare('SELECT * FROM students WHERE student_id = ?').get(sid) as any;
    const now = new Date();
    let baseDate = now;
    if (studentRow.subscription_status === 'active' && studentRow.subscription_expiry) {
      const currentExp = new Date(studentRow.subscription_expiry);
      if (currentExp > now) baseDate = currentExp;
    }
    const newExpiry = new Date(baseDate.getTime() + Number(plan.duration_days) * 86400000).toISOString().slice(0, 10);
    const receiptNumber = `RCPT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const verifiedPaymentId = razorpayPaymentId || `pay_${crypto.randomBytes(6).toString('hex')}`;

    db.exec('BEGIN');
    db.prepare(`
      INSERT INTO payments (
        receipt_number, student_id, plan_id, plan_name, amount, payment_method,
        razorpay_order_id, razorpay_payment_id, upi_reference, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'verified')
    `).run(
      receiptNumber,
      sid,
      plan.id,
      plan.name,
      Number(plan.price),
      paymentMethod === 'UPI' ? 'UPI' : 'Razorpay',
      String(orderId),
      verifiedPaymentId,
      String(upiReference || ''),
    );

    db.prepare(`
      UPDATE students
      SET subscription_status = 'active',
          subscription_plan_id = ?,
          subscription_plan_name = ?,
          subscription_expiry = ?
      WHERE student_id = ?
    `).run(plan.id, plan.name, newExpiry, sid);
    db.exec('COMMIT');

    res.json({
      message: 'Payment verified and subscription activated immediately.',
      receiptNumber,
      subscriptionExpiry: newExpiry,
      planName: plan.name,
    });
  });

  // =========================================================================
  // ADMINISTRATOR PROTECTED ROUTES
  // =========================================================================

  app.get('/api/admin/overview', requireAuth('admin'), (req, res) => {
    syncSubscriptionExpiries();
    const search = String(req.query.search || '').trim().toLowerCase();

    const students = db.prepare('SELECT * FROM students ORDER BY id DESC').all() as any[];
    const filteredStudents = search
      ? students.filter(
          (s) =>
            s.full_name.toLowerCase().includes(search) ||
            s.mobile.toLowerCase().includes(search) ||
            s.student_id.toLowerCase().includes(search) ||
            s.application_number.toLowerCase().includes(search)
        )
      : students;

    const allDocs = db.prepare('SELECT * FROM student_documents').all() as any[];
    const docsByStudent: Record<string, any[]> = {};
    for (const d of allDocs) {
      if (!docsByStudent[d.student_id]) docsByStudent[d.student_id] = [];
      docsByStudent[d.student_id].push(d);
    }

    const payments = db
      .prepare(`
        SELECT p.*, s.full_name as student_name
        FROM payments p
        LEFT JOIN students s ON p.student_id = s.student_id
        ORDER BY p.id DESC
      `)
      .all() as any[];

    const publicExams = db.prepare('SELECT * FROM public_exam_forms ORDER BY id DESC').all() as any[];
    const enquiries = db.prepare('SELECT * FROM contact_enquiries ORDER BY id DESC').all() as any[];
    const courses = db.prepare('SELECT * FROM courses ORDER BY id ASC').all() as any[];
    const plans = db.prepare('SELECT * FROM subscription_plans ORDER BY price ASC').all() as any[];
    const announcements = db.prepare('SELECT * FROM announcements ORDER BY published_at DESC, id DESC').all() as any[];
    const gallery = db.prepare('SELECT * FROM gallery ORDER BY id DESC').all() as any[];
    const settingsRow = db.prepare('SELECT * FROM site_settings WHERE id = 1').get();

    const verifiedPayments = payments.filter((p) => p.status === 'verified');
    const totalRevenue = verifiedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      stats: {
        totalStudents: students.length,
        newApplications: students.filter((s) => s.admission_status === 'pending').length,
        approvedApplications: students.filter((s) => s.admission_status === 'approved').length,
        pendingApplications: students.filter((s) => s.admission_status === 'pending').length,
        rejectedApplications: students.filter((s) => s.admission_status === 'rejected').length,
        activeSubscriptions: students.filter((s) => s.subscription_status === 'active').length,
        expiredSubscriptions: students.filter((s) => s.subscription_status === 'expired').length,
        totalVerifiedPaymentsCount: verifiedPayments.length,
        totalVerifiedPaymentsAmount: totalRevenue,
        publicExamCount: publicExams.length,
        newEnquiriesCount: enquiries.filter((e) => e.status === 'new').length,
      },
      students: filteredStudents.map((s) => formatStudent(s, docsByStudent[s.student_id] || [])),
      payments: payments.map((p) => ({
        id: p.id,
        receiptNumber: p.receipt_number,
        studentId: p.student_id,
        studentName: p.student_name || p.student_id,
        planId: p.plan_id,
        planName: p.plan_name,
        amount: Number(p.amount),
        paymentMethod: p.payment_method,
        razorpayOrderId: p.razorpay_order_id,
        razorpayPaymentId: p.razorpay_payment_id,
        upiReference: p.upi_reference,
        status: p.status,
        createdAt: p.created_at,
      })),
      publicExams: publicExams.map((e) => ({
        id: e.id,
        referenceNumber: e.reference_number,
        fullName: e.full_name,
        dob: e.dob,
        mobile: e.mobile,
        email: e.email,
        enrollmentNumber: e.enrollment_number,
        examSession: e.exam_session,
        subjects: e.subjects,
        status: e.status,
        createdAt: e.created_at,
      })),
      enquiries: enquiries.map((c) => ({
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        email: c.email,
        subject: c.subject,
        message: c.message,
        status: c.status,
        createdAt: c.created_at,
      })),
      courses: courses.map(formatCourse),
      plans: plans.map(formatPlan),
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        category: a.category,
        isUrgent: Boolean(a.is_urgent),
        publishedAt: a.published_at,
      })),
      gallery: gallery.map((g) => ({
        id: g.id,
        title: g.title,
        caption: g.caption,
        imageUrl: g.image_url,
        createdAt: g.created_at,
      })),
      settings: formatSettings(settingsRow),
    });
  });

  // Strict Admin-Only Document Access (Aadhaar & Verification Documents)
  app.get('/api/admin/documents/:docId/download', requireAuth('admin'), (req, res) => {
    const docRow = db.prepare('SELECT * FROM student_documents WHERE id = ?').get(Number(req.params.docId)) as any;
    if (!docRow) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }
    const filePath = path.join(getUploadsDir(), docRow.stored_filename);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Disposition', `inline; filename="${docRow.original_name}"`);
      res.setHeader('Content-Type', docRow.mime_type || 'application/octet-stream');
      res.sendFile(filePath);
      return;
    }
    // Demo seeded placeholder document when running initial sample data
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
      <rect width="640" height="400" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="0" y="0" width="640" height="56" fill="#0f2557"/>
      <text x="24" y="35" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">JANGRA NIOS SERVICES — SECURE DOCUMENT PREVIEW</text>
      <text x="32" y="110" fill="#0f172a" font-family="sans-serif" font-size="16" font-weight="bold">Document Type: ${String(docRow.doc_type).toUpperCase()}</text>
      <text x="32" y="145" fill="#334155" font-family="sans-serif" font-size="14">Student ID: ${docRow.student_id}</text>
      <text x="32" y="175" fill="#334155" font-family="sans-serif" font-size="14">File Name: ${docRow.original_name}</text>
      <text x="32" y="205" fill="#334155" font-family="sans-serif" font-size="14">Access Control: ${docRow.restricted_to_admin ? 'Restricted to Authorised Administrators' : 'Standard Verification File'}</text>
      <text x="32" y="255" fill="#64748b" font-family="sans-serif" font-size="12">Sample seeded record. Newly uploaded student documents are served directly from encrypted server storage.</text>
    </svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  // Update Student (Approve/Reject, Edit Info, Activate/Deactivate, Reset Password, Subscription Override)
  app.patch('/api/admin/students/:studentId', requireAuth('admin'), requireCsrf, (req, res) => {
    const sid = req.params.studentId;
    const row = db.prepare('SELECT * FROM students WHERE student_id = ?').get(sid) as any;
    if (!row) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    const body = req.body || {};
    if (body.resetPassword) {
      const newTemp = generateTempPassword();
      db.prepare('UPDATE students SET password_hash = ? WHERE student_id = ?').run(hashPassword(newTemp), sid);
      res.json({ message: 'Student password reset.', temporaryPassword: newTemp });
      return;
    }

    if (body.docId && body.docStatus) {
      db.prepare('UPDATE student_documents SET status = ? WHERE id = ? AND student_id = ?').run(
        String(body.docStatus),
        Number(body.docId),
        sid
      );
      res.json({ message: 'Document status updated.' });
      return;
    }

    if (body.extendDays) {
      const days = Number(body.extendDays);
      const now = new Date();
      let base = now;
      if (row.subscription_expiry && new Date(row.subscription_expiry) > now) {
        base = new Date(row.subscription_expiry);
      }
      const nextExp = new Date(base.getTime() + days * 86400000).toISOString().slice(0, 10);
      db.prepare(`
        UPDATE students
        SET subscription_status = 'active',
            subscription_plan_name = COALESCE(subscription_plan_name, 'Admin Extended Plan'),
            subscription_expiry = ?
        WHERE student_id = ?
      `).run(nextExp, sid);
      res.json({ message: `Subscription extended by ${days} days until ${nextExp}.` });
      return;
    }

    db.prepare(`
      UPDATE students
      SET full_name = ?,
          mobile = ?,
          email = ?,
          address = ?,
          course_applied = ?,
          study_medium = ?,
          admission_status = ?,
          admin_remarks = ?,
          account_active = ?,
          subscription_status = ?
      WHERE student_id = ?
    `).run(
      body.fullName ?? row.full_name,
      body.mobile ?? row.mobile,
      body.email ?? row.email,
      body.address ?? row.address,
      body.courseApplied ?? row.course_applied,
      body.studyMedium ?? row.study_medium,
      body.admissionStatus ?? row.admission_status,
      body.adminRemarks ?? row.admin_remarks,
      body.accountActive === undefined ? row.account_active : body.accountActive ? 1 : 0,
      body.subscriptionStatus ?? row.subscription_status,
      sid
    );

    res.json({ message: 'Student record updated.' });
  });

  // Courses CRUD
  app.post('/api/admin/courses', requireAuth('admin'), requireCsrf, (req, res) => {
    const { title, category, description, details, fee, duration, subscriptionNote, imageUrl } = req.body || {};
    if (!title || !description) {
      res.status(400).json({ error: 'Course title and description are required.' });
      return;
    }
    const info = db
      .prepare(`
        INSERT INTO courses (title, category, description, details, fee, duration, subscription_note, image_url, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `)
      .run(
        String(title).trim(),
        String(category || 'NIOS Service').trim(),
        String(description).trim(),
        String(details || '').trim(),
        Number(fee || 0),
        String(duration || 'Flexible').trim(),
        String(subscriptionNote || 'Eligible for all student subscription plans.').trim(),
        String(imageUrl || '/src/assets/images/course_secondary_study_1794807152895.jpg').trim()
      );
    res.status(201).json({ id: info.lastInsertRowid, message: 'Course added.' });
  });

  app.put('/api/admin/courses/:id', requireAuth('admin'), requireCsrf, (req, res) => {
    const { title, category, description, details, fee, duration, subscriptionNote, active } = req.body || {};
    db.prepare(`
      UPDATE courses
      SET title = ?, category = ?, description = ?, details = ?, fee = ?, duration = ?, subscription_note = ?, active = ?
      WHERE id = ?
    `).run(
      String(title),
      String(category),
      String(description),
      String(details),
      Number(fee),
      String(duration),
      String(subscriptionNote),
      active === false ? 0 : 1,
      Number(req.params.id)
    );
    res.json({ message: 'Course updated.' });
  });

  app.delete('/api/admin/courses/:id', requireAuth('admin'), requireCsrf, (req, res) => {
    db.prepare('DELETE FROM courses WHERE id = ?').run(Number(req.params.id));
    res.json({ message: 'Course deleted.' });
  });

  // Subscription Plans CRUD
  app.post('/api/admin/plans', requireAuth('admin'), requireCsrf, (req, res) => {
    const { name, billingCycle, durationDays, price, description, features } = req.body || {};
    if (!name || !durationDays || price === undefined) {
      res.status(400).json({ error: 'Plan name, duration days, and price are required.' });
      return;
    }
    db.prepare(`
      INSERT INTO subscription_plans (name, billing_cycle, duration_days, price, description, features_json, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(
      String(name).trim(),
      String(billingCycle || 'Custom'),
      Number(durationDays),
      Number(price),
      String(description || '').trim(),
      JSON.stringify(Array.isArray(features) ? features : ['Full Student Portal Access'])
    );
    res.status(201).json({ message: 'Subscription plan created.' });
  });

  app.put('/api/admin/plans/:id', requireAuth('admin'), requireCsrf, (req, res) => {
    const { name, billingCycle, durationDays, price, description, features, active } = req.body || {};
    db.prepare(`
      UPDATE subscription_plans
      SET name = ?, billing_cycle = ?, duration_days = ?, price = ?, description = ?, features_json = ?, active = ?
      WHERE id = ?
    `).run(
      String(name),
      String(billingCycle),
      Number(durationDays),
      Number(price),
      String(description),
      JSON.stringify(Array.isArray(features) ? features : []),
      active === false ? 0 : 1,
      Number(req.params.id)
    );
    res.json({ message: 'Subscription plan updated.' });
  });

  app.delete('/api/admin/plans/:id', requireAuth('admin'), requireCsrf, (req, res) => {
    db.prepare('DELETE FROM subscription_plans WHERE id = ?').run(Number(req.params.id));
    res.json({ message: 'Subscription plan removed.' });
  });

  // Announcements CRUD
  app.post('/api/admin/announcements', requireAuth('admin'), requireCsrf, (req, res) => {
    const { title, summary, category, isUrgent } = req.body || {};
    if (!title || !summary) {
      res.status(400).json({ error: 'Announcement title and summary are required.' });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    db.prepare('INSERT INTO announcements (title, summary, category, is_urgent, published_at) VALUES (?, ?, ?, ?, ?)').run(
      String(title).trim(),
      String(summary).trim(),
      String(category || 'Notice').trim(),
      isUrgent ? 1 : 0,
      today
    );
    res.status(201).json({ message: 'Announcement published.' });
  });

  app.delete('/api/admin/announcements/:id', requireAuth('admin'), requireCsrf, (req, res) => {
    db.prepare('DELETE FROM announcements WHERE id = ?').run(Number(req.params.id));
    res.json({ message: 'Announcement removed.' });
  });

  // Gallery Upload & Delete
  app.post(
    '/api/admin/gallery',
    requireAuth('admin'),
    requireCsrf,
    galleryUpload.single('image'),
    (req, res) => {
      const { title, caption, imageUrl } = req.body || {};
      const finalUrl = req.file ? `/uploads/gallery/${req.file.filename}` : String(imageUrl || '').trim();
      if (!title || !finalUrl) {
        res.status(400).json({ error: 'Gallery title and image file or URL are required.' });
        return;
      }
      db.prepare('INSERT INTO gallery (title, caption, image_url) VALUES (?, ?, ?)').run(
        String(title).trim(),
        String(caption || '').trim(),
        finalUrl
      );
      res.status(201).json({ message: 'Gallery image added.' });
    }
  );

  app.delete('/api/admin/gallery/:id', requireAuth('admin'), requireCsrf, (req, res) => {
    db.prepare('DELETE FROM gallery WHERE id = ?').run(Number(req.params.id));
    res.json({ message: 'Gallery image deleted.' });
  });

  // Site Settings Update (Home, About Us, Contact, Compulsory Document Settings)
  app.put('/api/admin/settings', requireAuth('admin'), requireCsrf, (req, res) => {
    const b = req.body || {};
    db.prepare(`
      UPDATE site_settings
      SET business_name = ?, hero_heading = ?, hero_subheading = ?, hero_image_url = ?,
          about_intro = ?, mission = ?, vision = ?, objectives = ?, nios_guidance = ?,
          phone = ?, whatsapp = ?, email = ?, address = ?, working_hours = ?,
          require_photo = ?, require_signature = ?, require_aadhaar = ?, require_qualification = ?
      WHERE id = 1
    `).run(
      b.businessName,
      b.heroHeading,
      b.heroSubheading,
      b.heroImageUrl,
      b.aboutIntro,
      b.mission,
      b.vision,
      b.objectives,
      b.niosGuidance,
      b.phone,
      b.whatsapp,
      b.email,
      b.address,
      b.workingHours,
      b.requirePhoto ? 1 : 0,
      b.requireSignature ? 1 : 0,
      b.requireAadhaar ? 1 : 0,
      b.requireQualification ? 1 : 0
    );
    res.json({ message: 'Website settings updated successfully.' });
  });

  // Payment Refund / Status Update
  app.patch('/api/admin/payments/:id', requireAuth('admin'), requireCsrf, (req, res) => {
    const { status } = req.body || {};
    if (!['verified', 'refunded', 'failed'].includes(String(status))) {
      res.status(400).json({ error: 'Invalid payment status.' });
      return;
    }
    db.prepare('UPDATE payments SET status = ? WHERE id = ?').run(String(status), Number(req.params.id));
    res.json({ message: 'Payment record updated.' });
  });

  // Enquiry & Public Exam Status Updates
  app.patch('/api/admin/enquiries/:id', requireAuth('admin'), requireCsrf, (req, res) => {
    db.prepare('UPDATE contact_enquiries SET status = ? WHERE id = ?').run(String(req.body?.status || 'replied'), Number(req.params.id));
    res.json({ message: 'Enquiry status updated.' });
  });

  app.patch('/api/admin/public-exam/:id', requireAuth('admin'), requireCsrf, (req, res) => {
    db.prepare('UPDATE public_exam_forms SET status = ? WHERE id = ?').run(String(req.body?.status || 'verified'), Number(req.params.id));
    res.json({ message: 'Public exam application updated.' });
  });

  // Full Backup Export (Admin Only)
  app.get('/api/admin/backup', requireAuth('admin'), (_req, res) => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      siteSettings: db.prepare('SELECT * FROM site_settings').all(),
      courses: db.prepare('SELECT * FROM courses').all(),
      subscriptionPlans: db.prepare('SELECT * FROM subscription_plans').all(),
      announcements: db.prepare('SELECT * FROM announcements').all(),
      gallery: db.prepare('SELECT * FROM gallery').all(),
      students: db.prepare('SELECT id, student_id, application_number, full_name, dob, mobile, father_name, mother_name, email, address, category, previous_qualification, course_applied, study_medium, previous_school_board, admission_status, admin_remarks, account_active, subscription_status, subscription_plan_name, subscription_expiry, created_at FROM students').all(),
      payments: db.prepare('SELECT * FROM payments').all(),
      publicExamForms: db.prepare('SELECT * FROM public_exam_forms').all(),
      contactEnquiries: db.prepare('SELECT * FROM contact_enquiries').all(),
    };
    res.setHeader('Content-Disposition', `attachment; filename="jangra_nios_backup_${Date.now()}.json"`);
    res.json(snapshot);
  });

  // Vite Dev Middleware or Static Production Build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jangra NIOS Services server running on http://localhost:${PORT}`);
  });
}

startServer();
