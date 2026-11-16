import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'secure_docs');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'jangra_nios.db');
export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuffer = Buffer.from(keyHex, 'hex');
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_name TEXT NOT NULL,
      hero_heading TEXT NOT NULL,
      hero_subheading TEXT NOT NULL,
      hero_image_url TEXT NOT NULL,
      about_intro TEXT NOT NULL,
      mission TEXT NOT NULL,
      vision TEXT NOT NULL,
      objectives TEXT NOT NULL,
      nios_guidance TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      working_hours TEXT NOT NULL,
      map_lat REAL NOT NULL,
      map_lng REAL NOT NULL,
      require_photo INTEGER NOT NULL DEFAULT 1,
      require_signature INTEGER NOT NULL DEFAULT 1,
      require_aadhaar INTEGER NOT NULL DEFAULT 1,
      require_qualification INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      price REAL NOT NULL,
      description TEXT NOT NULL,
      features_json TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      details TEXT NOT NULL,
      fee REAL NOT NULL,
      duration TEXT NOT NULL,
      subscription_note TEXT NOT NULL,
      image_url TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL UNIQUE,
      application_number TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      mobile TEXT NOT NULL,
      father_name TEXT NOT NULL,
      mother_name TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      category TEXT NOT NULL,
      previous_qualification TEXT NOT NULL,
      course_applied TEXT NOT NULL,
      study_medium TEXT NOT NULL,
      previous_school_board TEXT NOT NULL,
      admission_status TEXT NOT NULL DEFAULT 'pending',
      admin_remarks TEXT NOT NULL DEFAULT '',
      account_active INTEGER NOT NULL DEFAULT 1,
      subscription_status TEXT NOT NULL DEFAULT 'none',
      subscription_plan_id INTEGER NULL,
      subscription_plan_name TEXT NULL,
      subscription_expiry TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS student_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      original_name TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      restricted_to_admin INTEGER NOT NULL DEFAULT 0,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS public_exam_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_number TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      enrollment_number TEXT NOT NULL,
      exam_session TEXT NOT NULL,
      subjects TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_number TEXT NOT NULL UNIQUE,
      student_id TEXT NOT NULL,
      plan_id INTEGER NOT NULL,
      plan_name TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      razorpay_order_id TEXT NOT NULL DEFAULT '',
      razorpay_payment_id TEXT NOT NULL DEFAULT '',
      upi_reference TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'verified',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      category TEXT NOT NULL,
      is_urgent INTEGER NOT NULL DEFAULT 0,
      published_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      caption TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
}

function seedInitialData(): void {
  const settingsCount = db.prepare('SELECT COUNT(*) as cnt FROM site_settings').get() as { cnt: number };
  if (settingsCount.cnt === 0) {
    db.prepare(`
      INSERT INTO site_settings (
        id, business_name, hero_heading, hero_subheading, hero_image_url,
        about_intro, mission, vision, objectives, nios_guidance,
        phone, whatsapp, email, address, working_hours,
        map_lat, map_lng, require_photo, require_signature, require_aadhaar, require_qualification
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      1,
      'Jangra NIOS Services',
      'Your Education, Your Future',
      'Learn Today, Succeed Tomorrow',
      '/src/assets/images/hero_students_campus_1794807151551.jpg',
      'Jangra NIOS Services is a dedicated academic guidance, admission facilitation, and learner support centre helping students complete Class 10th (Secondary) and Class 12th (Senior Secondary) through the National Institute of Open Schooling (NIOS), an autonomous institution under the Ministry of Education, Government of India.',
      'To make flexible, government-recognised secondary and senior secondary education accessible, transparent, and stress-free for every learner—whether continuing school, working part-time, preparing for competitive exams, or restarting education.',
      'To empower learners across India with reliable academic counselling, structured study resources, timely exam and practical guidance, and modern digital student services.',
      'Provide error-free online admission and document verification; guide students in choosing balanced subjects for career and higher-education eligibility; offer structured TMA, practical file, and board exam preparation support.',
      'We assist candidates with Stream 1 (Block 1 & Block 2), Stream 2 (Failed/Compartment learners), On-Demand Examination (ODE), Transfer of Credit (TOC), Public Exam form submission, Hall Ticket downloads, and Study Centre coordination.',
      '+91-9968834276',
      '919968834276',
      'jangraeducationalservices@gmail.com',
      'Office No. 204, 2nd Floor, Institutional Plaza, Sector 14, Gurugram, Haryana 122001',
      'Monday – Saturday: 9:00 AM – 6:30 PM (Sunday Closed)',
      28.4704,
      77.0437,
      1,
      1,
      1,
      1
    );
  }

  const adminCount = db.prepare('SELECT COUNT(*) as cnt FROM admins').get() as { cnt: number };
  if (adminCount.cnt === 0) {
    db.prepare('INSERT INTO admins (email, full_name, password_hash) VALUES (?, ?, ?)').run(
      'admin@jangranios.com',
      'Jangra Chief Administrator',
      hashPassword('Admin@Jangra2026')
    );
  }

  const planCount = db.prepare('SELECT COUNT(*) as cnt FROM subscription_plans').get() as { cnt: number };
  if (planCount.cnt === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO subscription_plans (name, billing_cycle, duration_days, price, description, features_json, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    insertPlan.run(
      'Monthly Student Support',
      'Monthly',
      30,
      499,
      'Ideal for short-term exam preparation, TMA guidance, and portal tracking.',
      JSON.stringify(['NIOS Portal & Status Alerts', 'Solved TMA Guidance', 'Previous Year Question Bank', 'WhatsApp Academic Desk'])
    );
    insertPlan.run(
      'Quarterly Exam Booster',
      'Quarterly',
      90,
      1299,
      'Three months of complete study material, practical file templates, and exam updates.',
      JSON.stringify(['All Monthly Features', 'Practical File & Viva Support', 'Subject Doubt Sessions', 'Hall Ticket & Date Sheet Alerts'])
    );
    insertPlan.run(
      'Half-Yearly Academic Pack',
      'Half-Yearly',
      180,
      2299,
      'Full single-block support covering admission to public board examination.',
      JSON.stringify(['Full Block Syllabus Notes', 'PCP & Practical Scheduling', 'Priority Document Verification', 'Mock Test Papers'])
    );
    insertPlan.run(
      'Annual Complete NIOS Pass',
      'Annual',
      365,
      3999,
      'Comprehensive 12-month mentorship for Class 10th or Class 12th learners.',
      JSON.stringify(['365 Days Full Access', 'Dedicated Academic Mentor', 'TMA + Practical + Theory Prep', 'Re-evaluation & TOC Guidance'])
    );
    insertPlan.run(
      'Custom Practical & TMA Express',
      'Custom',
      45,
      899,
      'Focused 45-day support specifically for TMA uploads and Practical Examinations.',
      JSON.stringify(['Practical Lab File Templates', 'TMA Submission Verification', 'Exam Centre Assistance'])
    );
  }

  const courseCount = db.prepare('SELECT COUNT(*) as cnt FROM courses').get() as { cnt: number };
  if (courseCount.cnt === 0) {
    const insertCourse = db.prepare(`
      INSERT INTO courses (title, category, description, details, fee, duration, subscription_note, image_url, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);
    insertCourse.run(
      'NIOS Secondary Course (Class 10th)',
      'Board Course',
      'Government-recognised Class 10th Secondary certification equivalent to CBSE/ICSE/State Boards for higher study and employment.',
      'Minimum 5 subjects (1 or 2 languages + 3/4 core subjects including Mathematics, Science, Social Science, Economics, Business Studies, Data Entry Operations). Minimum age 14 years.',
      3500,
      '1 Year (Flexible up to 5 Years)',
      'Eligible for Monthly, Quarterly, Half-Yearly & Annual Student Support plans.',
      '/src/assets/images/course_secondary_study_1794807152895.jpg'
    );
    insertCourse.run(
      'NIOS Senior Secondary Course (Class 12th)',
      'Board Course',
      'Recognised Class 12th Senior Secondary qualification across Science, Commerce, and Humanities streams for university & competitive exams.',
      'Requires Class 10th pass certificate from a recognised board. Choose 5–7 subjects including Physics, Chemistry, Biology, Mathematics, Accountancy, Economics, Political Science, or Computer Science.',
      4200,
      '1 Year (Flexible up to 5 Years)',
      'Includes stream counselling & Annual/Half-Yearly subscription compatibility.',
      '/src/assets/images/course_senior_secondary_1794807152943.jpg'
    );
    insertCourse.run(
      'NIOS Admission Assistance',
      'Admission Service',
      'End-to-end online registration for Stream 1, Stream 2, On-Demand (ODE), and Transfer of Credit (TOC) without form rejection.',
      'Complete form filling, document resizing & verification, regional centre mapping, and application tracking until ID Card issuance.',
      1200,
      'One-Time Registration',
      'Pairs with any active Student Portal Subscription for status alerts.',
      '/src/assets/images/about_counseling_center_1794807151721.jpg'
    );
    insertCourse.run(
      'Subject Selection Guidance',
      'Academic Counselling',
      'Personalised counselling to pick high-scoring, career-aligned subjects accepted by NEET, JEE, CUET, and government recruitment boards.',
      'Detailed eligibility audit of previous marksheets, language requirements, and practical vs theory weightage analysis.',
      800,
      'Counselling Session + Plan',
      'Complimentary review included in Half-Yearly & Annual subscriptions.',
      '/src/assets/images/about_counseling_center_1794807151721.jpg'
    );
    insertCourse.run(
      'Examination Guidance',
      'Exam Preparation',
      'Public Exam form submission, On-Demand seat booking, date sheet planning, and chapter-wise scoring blueprint.',
      'Covers blueprint analysis, important question banks, solved previous 5-year papers, and hall ticket readiness checks.',
      1500,
      'Per Exam Session',
      'Active subscription unlocks downloadable exam mock sets.',
      '/src/assets/images/course_secondary_study_1794807152895.jpg'
    );
    insertCourse.run(
      'Practical Examination Guidance',
      'Practical Support',
      'Step-by-step coaching for NIOS lab practicals, practical file preparation, viva voce readiness, and PCP classes.',
      'Guidance for Science, Home Science, Painting, Data Entry Operations, and Geography practical record notebooks and evaluation rubrics.',
      1200,
      'Practical Cycle',
      'Included in Quarterly, Annual & Custom Practical Express plans.',
      '/src/assets/images/course_senior_secondary_1794807152943.jpg'
    );
    insertCourse.run(
      'Study Material and Student Support',
      'Learning Resources',
      'Structured Hindi & English medium study notes, solved Tutor Marked Assignments (TMA), and dedicated WhatsApp mentor helpdesk.',
      'Digital chapter summaries, TMA submission checklist, and continuous portal notifications from admission to final marksheet delivery.',
      1800,
      'Annual Access',
      'Requires active Monthly, Quarterly, Half-Yearly, or Annual subscription.',
      '/src/assets/images/gallery_exam_success_1794807152254.jpg'
    );
  }

  const annCount = db.prepare('SELECT COUNT(*) as cnt FROM announcements').get() as { cnt: number };
  if (annCount.cnt === 0) {
    const insertAnn = db.prepare('INSERT INTO announcements (title, summary, category, is_urgent, published_at) VALUES (?, ?, ?, ?, ?)');
    insertAnn.run(
      'NIOS Stream 1 Block 1 Admissions Open (2026–27 Session)',
      'Fresh registrations for Class 10th (Secondary) and Class 12th (Senior Secondary) are now open. Submit all four mandatory documents online for priority verification.',
      'Admissions',
      1,
      '2026-11-10'
    );
    insertAnn.run(
      'Public Examination Form Window — April/May Session',
      'Enrolled learners appearing in the upcoming Public Examination can submit their online Public Exam Form directly through our portal with their Enrollment Number.',
      'Examinations',
      1,
      '2026-11-08'
    );
    insertAnn.run(
      'Tutor Marked Assignment (TMA) & Practical File Workshop',
      'Students with active Quarterly or Annual subscriptions can access verified TMA formats and practical notebook guidelines via the Student Dashboard.',
      'Academics',
      0,
      '2026-11-04'
    );
    insertAnn.run(
      'Transfer of Credit (TOC) Document Verification Notice',
      'Stream 2 candidates opting for TOC from CBSE/State Boards must upload clear previous qualification marksheets under Box 4 for regional centre verification.',
      'Notice',
      0,
      '2026-10-28'
    );
  }

  const galleryCount = db.prepare('SELECT COUNT(*) as cnt FROM gallery').get() as { cnt: number };
  if (galleryCount.cnt === 0) {
    const insertGal = db.prepare('INSERT INTO gallery (title, caption, image_url) VALUES (?, ?, ?)');
    insertGal.run(
      'Campus & Student Orientation',
      'NIOS Secondary and Senior Secondary learners at our morning orientation walk.',
      '/src/assets/images/hero_students_campus_1794807151551.jpg'
    );
    insertGal.run(
      'One-on-One Admission Counselling',
      'Academic advisor guiding students through subject selection and admission forms.',
      '/src/assets/images/about_counseling_center_1794807151721.jpg'
    );
    insertGal.run(
      'Class 10th Focused Study Session',
      'Structured mathematics and science preparation for NIOS Secondary board exams.',
      '/src/assets/images/course_secondary_study_1794807152895.jpg'
    );
    insertGal.run(
      'Senior Secondary Peer Learning',
      'Class 12th Commerce and Science students collaborating on practical assignments.',
      '/src/assets/images/course_senior_secondary_1794807152943.jpg'
    );
    insertGal.run(
      'Board Result Celebration',
      'Proud Jangra NIOS Services graduates holding their verified board marksheets.',
      '/src/assets/images/gallery_exam_success_1794807152254.jpg'
    );
  }

  const studentCount = db.prepare('SELECT COUNT(*) as cnt FROM students').get() as { cnt: number };
  if (studentCount.cnt === 0) {
    const insertStudent = db.prepare(`
      INSERT INTO students (
        student_id, application_number, password_hash, full_name, dob, mobile,
        father_name, mother_name, email, address, category, previous_qualification,
        course_applied, study_medium, previous_school_board, admission_status,
        admin_remarks, account_active, subscription_status, subscription_plan_id,
        subscription_plan_name, subscription_expiry
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const nextYear = new Date(Date.now() + 300 * 86400000).toISOString().slice(0, 10);
    insertStudent.run(
      'JNS-2026-1001',
      'APP-2026-8410',
      hashPassword('Student@123'),
      'Aarav Sharma',
      '2008-05-14',
      '9811223344',
      'Rajesh Sharma',
      'Sunita Sharma',
      'aarav.sharma@example.com',
      'House No. 42, DLF Phase 3, Gurugram, Haryana',
      'General',
      'Class 10th Passed',
      'NIOS Senior Secondary (12th)',
      'English',
      'CBSE Board',
      'approved',
      'All four documents verified. Admission approved for Stream 1 Block 1.',
      1,
      'active',
      4,
      'Annual Complete NIOS Pass',
      nextYear
    );

    insertStudent.run(
      'JNS-2026-1002',
      'APP-2026-8411',
      hashPassword('Student@123'),
      'Priya Verma',
      '2009-09-22',
      '9876543210',
      'Mahesh Verma',
      'Kavita Verma',
      'priya.verma@example.com',
      'Pocket B, Vikaspuri, New Delhi',
      'OBC',
      'Class 9th Completed',
      'NIOS Secondary (10th)',
      'Hindi',
      'Delhi Govt School',
      'pending',
      'Documents queued for verification.',
      1,
      'none',
      null,
      null,
      null
    );

    const insertDoc = db.prepare(`
      INSERT INTO student_documents (student_id, doc_type, original_name, stored_filename, mime_type, file_size, status, restricted_to_admin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertDoc.run('JNS-2026-1001', 'photo', 'aarav_passport.jpg', 'sample_photo.jpg', 'image/jpeg', 184320, 'verified', 0);
    insertDoc.run('JNS-2026-1001', 'signature', 'aarav_sign.png', 'sample_sign.png', 'image/png', 45120, 'verified', 0);
    insertDoc.run('JNS-2026-1001', 'aadhaar', 'aarav_aadhaar_masked.pdf', 'sample_aadhaar.pdf', 'application/pdf', 312000, 'verified', 1);
    insertDoc.run('JNS-2026-1001', 'qualification', 'class10_marksheet.pdf', 'sample_marksheet.pdf', 'application/pdf', 428000, 'verified', 0);

    db.prepare(`
      INSERT INTO payments (receipt_number, student_id, plan_id, plan_name, amount, payment_method, razorpay_order_id, razorpay_payment_id, upi_reference, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'RCPT-2026-5001',
      'JNS-2026-1001',
      4,
      'Annual Complete NIOS Pass',
      3999,
      'UPI',
      'order_JNS20265001',
      'pay_JNS20265001',
      'UPI-631984720112',
      'verified'
    );

    db.prepare(`
      INSERT INTO public_exam_forms (reference_number, full_name, dob, mobile, email, enrollment_number, exam_session, subjects, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'EXM-2026-3001',
      'Aarav Sharma',
      '2008-05-14',
      '9811223344',
      'aarav.sharma@example.com',
      '270145261001',
      'April / May 2027 Public Exam',
      'English (302), Mathematics (311), Physics (312), Chemistry (313), Data Entry Operations (336)',
      'verified'
    );

    db.prepare(`
      INSERT INTO contact_enquiries (name, mobile, email, subject, message, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'Rohit Kumar',
      '9911002233',
      'rohit.k@example.com',
      'NIOS Class 12th Stream 2 TOC Enquiry',
      'I appeared in Class 12th CBSE last year and want to transfer credit for 2 passed subjects under NIOS Stream 2.',
      'new'
    );
  }
}

export function syncSubscriptionExpiries(): void {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(`
    UPDATE students
    SET subscription_status = 'expired'
    WHERE subscription_status = 'active'
      AND subscription_expiry IS NOT NULL
      AND subscription_expiry < ?
  `).run(today);
}
