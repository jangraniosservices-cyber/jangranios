export type PageView = 'home' | 'about' | 'courses' | 'admission' | 'contact' | 'student-dashboard' | 'admin-dashboard';

export type AdmissionStatus = 'pending' | 'approved' | 'rejected';
export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected';
export type SubscriptionStatus = 'none' | 'active' | 'expired' | 'deactivated';

export interface SiteSettings {
  businessName: string;
  heroHeading: string;
  heroSubheading: string;
  heroImageUrl: string;
  aboutIntro: string;
  mission: string;
  vision: string;
  objectives: string;
  niosGuidance: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  workingHours: string;
  mapLat: number;
  mapLng: number;
  requirePhoto: boolean;
  requireSignature: boolean;
  requireAadhaar: boolean;
  requireQualification: boolean;
}

export interface CourseItem {
  id: number;
  title: string;
  category: string;
  description: string;
  details: string;
  fee: number;
  duration: string;
  subscriptionNote: string;
  imageUrl: string;
  active: boolean;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  isUrgent: boolean;
}

export interface GalleryItem {
  id: number;
  title: string;
  caption: string;
  imageUrl: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  billingCycle: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual' | 'Custom';
  durationDays: number;
  price: number;
  description: string;
  features: string[];
  active: boolean;
}

export interface StudentDocument {
  id: number;
  studentId: string;
  docType: 'photo' | 'signature' | 'aadhaar' | 'qualification';
  originalName: string;
  mimeType: string;
  fileSize: number;
  status: DocumentVerificationStatus;
  uploadedAt: string;
  restrictedToAdmin: boolean;
}

export interface StudentRecord {
  id: number;
  studentId: string;
  applicationNumber: string;
  fullName: string;
  dob: string;
  mobile: string;
  fatherName: string;
  motherName: string;
  email: string;
  address: string;
  category: string;
  previousQualification: string;
  courseApplied: string;
  studyMedium: string;
  previousSchoolBoard: string;
  admissionStatus: AdmissionStatus;
  adminRemarks: string;
  accountActive: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlanId: number | null;
  subscriptionPlanName: string | null;
  subscriptionExpiry: string | null;
  createdAt: string;
  documents?: StudentDocument[];
}

export interface PublicExamSubmission {
  id: number;
  referenceNumber: string;
  fullName: string;
  dob: string;
  mobile: string;
  email: string;
  enrollmentNumber: string;
  examSession: string;
  subjects: string;
  status: 'submitted' | 'verified' | 'hall_ticket_ready';
  createdAt: string;
}

export interface PaymentRecord {
  id: number;
  receiptNumber: string;
  studentId: string;
  studentName?: string;
  planId: number;
  planName: string;
  amount: number;
  paymentMethod: 'Razorpay' | 'UPI' | 'Admin Manual';
  razorpayOrderId: string;
  razorpayPaymentId: string;
  upiReference: string;
  status: 'verified' | 'pending' | 'refunded' | 'failed';
  createdAt: string;
}

export interface ContactEnquiry {
  id: number;
  name: string;
  mobile: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'replied' | 'closed';
  createdAt: string;
}

export interface AuthSessionUser {
  role: 'student' | 'admin';
  studentId?: string;
  email?: string;
  fullName: string;
  csrfToken: string;
}
