-- ============================================================================
-- JANGRA NIOS SERVICES - MySQL 8.0 Database Schema & Seed File
-- Run: mysql -u root -p < database/jangra_nios_services.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS jangra_nios_services
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE jangra_nios_services;

-- 1. Site Settings & CMS Configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  business_name VARCHAR(120) NOT NULL,
  hero_heading VARCHAR(160) NOT NULL,
  hero_subheading VARCHAR(240) NOT NULL,
  hero_image_url VARCHAR(500) NOT NULL,
  about_intro TEXT NOT NULL,
  mission TEXT NOT NULL,
  vision TEXT NOT NULL,
  objectives TEXT NOT NULL,
  nios_guidance TEXT NOT NULL,
  phone VARCHAR(30) NOT NULL,
  whatsapp VARCHAR(30) NOT NULL,
  email VARCHAR(120) NOT NULL,
  address VARCHAR(400) NOT NULL,
  working_hours VARCHAR(200) NOT NULL,
  map_lat DECIMAL(10,7) NOT NULL DEFAULT 28.6139000,
  map_lng DECIMAL(10,7) NOT NULL DEFAULT 77.2090000,
  require_photo TINYINT(1) NOT NULL DEFAULT 1,
  require_signature TINYINT(1) NOT NULL DEFAULT 1,
  require_aadhaar TINYINT(1) NOT NULL DEFAULT 1,
  require_qualification TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Administrator Accounts
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  billing_cycle ENUM('Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'Custom') NOT NULL,
  duration_days INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  features_json JSON NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Courses & Services
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  details TEXT NOT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duration VARCHAR(80) NOT NULL,
  subscription_note VARCHAR(200) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Students & Online Admissions
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(32) NOT NULL UNIQUE,
  application_number VARCHAR(32) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  dob DATE NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  father_name VARCHAR(150) NOT NULL,
  mother_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  address TEXT NOT NULL,
  category ENUM('General', 'OBC', 'SC', 'ST', 'Other') NOT NULL,
  previous_qualification VARCHAR(150) NOT NULL,
  course_applied VARCHAR(120) NOT NULL,
  study_medium ENUM('Hindi', 'English', 'Urdu', 'Other') NOT NULL,
  previous_school_board VARCHAR(200) NOT NULL,
  admission_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  admin_remarks TEXT,
  account_active TINYINT(1) NOT NULL DEFAULT 1,
  subscription_status ENUM('none', 'active', 'expired', 'deactivated') NOT NULL DEFAULT 'none',
  subscription_plan_id INT NULL,
  subscription_expiry DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_plan FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
);

-- 6. Secure Uploaded Student Documents (Aadhaar restricted to Admins)
CREATE TABLE IF NOT EXISTS student_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(32) NOT NULL,
  doc_type ENUM('photo', 'signature', 'aadhaar', 'qualification') NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size INT NOT NULL,
  status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  restricted_to_admin TINYINT(1) NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- 7. Online Public Exam Forms
CREATE TABLE IF NOT EXISTS public_exam_forms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(32) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  dob DATE NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL,
  enrollment_number VARCHAR(64) NOT NULL,
  exam_session VARCHAR(80) NOT NULL,
  subjects TEXT NOT NULL,
  status ENUM('submitted', 'verified', 'hall_ticket_ready') NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Payments & Subscription Ledger (Zero card data stored)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_number VARCHAR(40) NOT NULL UNIQUE,
  student_id VARCHAR(32) NOT NULL,
  plan_id INT NOT NULL,
  plan_name VARCHAR(120) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('Razorpay', 'UPI', 'Admin Manual') NOT NULL,
  razorpay_order_id VARCHAR(120) DEFAULT '',
  razorpay_payment_id VARCHAR(120) DEFAULT '',
  upi_reference VARCHAR(120) DEFAULT '',
  status ENUM('verified', 'pending', 'refunded', 'failed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- 9. Announcements & Notifications
CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  summary TEXT NOT NULL,
  category VARCHAR(60) NOT NULL,
  is_urgent TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Photo Gallery
CREATE TABLE IF NOT EXISTS gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  caption VARCHAR(400) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Contact Enquiries
CREATE TABLE IF NOT EXISTS contact_enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(150) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'replied', 'closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
