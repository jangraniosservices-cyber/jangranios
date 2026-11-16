import { useCallback, useEffect, useState } from 'react';
import { AboutPage } from './components/AboutPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AdmissionPage } from './components/AdmissionPage';
import { AuthModals } from './components/AuthModals';
import { ContactPage } from './components/ContactPage';
import { CoursesPage } from './components/CoursesPage';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { testFirestoreConnection } from './lib/firebase';
import type {
  AnnouncementItem,
  AuthSessionUser,
  CourseItem,
  GalleryItem,
  PageView,
  SiteSettings,
  SubscriptionPlan,
} from './types';

const DEFAULT_SETTINGS: SiteSettings = {
  businessName: 'Jangra NIOS Services',
  heroHeading: 'Your Education, Your Future',
  heroSubheading: 'Learn Today, Succeed Tomorrow',
  heroImageUrl: '/src/assets/images/hero_students_campus_1794807151551.jpg',
  aboutIntro:
    'Jangra NIOS Services is an academic guidance and admission support centre for Class 10th and Class 12th NIOS learners.',
  mission: 'To make flexible, government-recognised secondary and senior secondary education accessible to every learner.',
  vision: 'To empower students with structured counselling, digital tracking, and reliable examination guidance.',
  objectives: 'Error-free online admissions, balanced subject selection, and timely practical and TMA support.',
  niosGuidance: 'Complete assistance for Stream 1, Stream 2, On-Demand Exams, and Transfer of Credit.',
  phone: '+91-9968834276',
  whatsapp: '919968834276',
  email: 'jangraeducationalservices@gmail.com',
  address: 'Office No. 204, 2nd Floor, Institutional Plaza, Sector 14, Gurugram, Haryana 122001',
  workingHours: 'Monday – Saturday: 9:00 AM – 6:30 PM (Sunday Closed)',
  mapLat: 28.4704,
  mapLng: 77.0437,
  requirePhoto: true,
  requireSignature: true,
  requireAadhaar: true,
  requireQualification: true,
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [preselectedCourse, setPreselectedCourse] = useState<string | undefined>(undefined);

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mapsApiKey, setMapsApiKey] = useState('');
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  const [sessionUser, setSessionUser] = useState<AuthSessionUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'student' | 'admin'>('student');
  const [prefillStudentId, setPrefillStudentId] = useState<string | undefined>(undefined);

  const loadBootstrap = useCallback(async () => {
    try {
      const [pubRes, meRes] = await Promise.all([
        fetch('/api/public/bootstrap'),
        fetch('/api/auth/me'),
      ]);
      if (pubRes.ok) {
        const data = await pubRes.json();
        setSettings(data.settings);
        setCourses(data.courses || []);
        setAnnouncements(data.announcements || []);
        setGallery(data.gallery || []);
        setPlans(data.plans || []);
        setMapsApiKey(data.mapsApiKey || '');
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        setSessionUser(meData.user || null);
      }
    } catch (err) {
      console.error('Failed to bootstrap portal data:', err);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
    testFirestoreConnection();

    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, [loadBootstrap]);

  const handleNavigate = (page: PageView, courseTitle?: string) => {
    setPreselectedCourse(courseTitle);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPortalLogin = (tab: 'student' | 'admin' = 'student', studentId?: string) => {
    setAuthModalTab(tab);
    setPrefillStudentId(studentId);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user: AuthSessionUser) => {
    setSessionUser(user);
    setAuthModalOpen(false);
    setCurrentPage(user.role === 'admin' ? 'admin-dashboard' : 'student-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSessionUser(null);
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {currentPage !== 'admin-dashboard' && (
        <Navbar
          businessName={settings.businessName}
          currentPage={currentPage}
          onNavigate={(p) => handleNavigate(p)}
          sessionUser={sessionUser}
          onOpenPortalLogin={(tab) => handleOpenPortalLogin(tab)}
        />
      )}

      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            settings={settings}
            courses={courses}
            announcements={announcements}
            gallery={gallery}
            onNavigate={handleNavigate}
            onOpenPortalLogin={(tab) => handleOpenPortalLogin(tab)}
          />
        )}

        {currentPage === 'about' && (
          <AboutPage settings={settings} onNavigate={(p) => handleNavigate(p)} />
        )}

        {currentPage === 'courses' && (
          <CoursesPage courses={courses} plans={plans} onNavigate={handleNavigate} />
        )}

        {currentPage === 'admission' && (
          <AdmissionPage
            settings={settings}
            preselectedCourse={preselectedCourse}
            onOpenStudentLogin={(sid) => handleOpenPortalLogin('student', sid)}
          />
        )}

        {currentPage === 'contact' && (
          <ContactPage settings={settings} mapsApiKey={mapsApiKey} />
        )}

        {currentPage === 'student-dashboard' && sessionUser?.role === 'student' && (
          <StudentDashboard
            sessionUser={sessionUser}
            settings={settings}
            onLogout={handleLogout}
          />
        )}

        {currentPage === 'admin-dashboard' && sessionUser?.role === 'admin' && (
          <AdminDashboard
            sessionUser={sessionUser}
            onRefreshPublicData={loadBootstrap}
            onLogout={handleLogout}
          />
        )}
      </main>

      {currentPage !== 'admin-dashboard' && (
        <Footer
          settings={settings}
          onNavigate={(p) => handleNavigate(p)}
          onOpenPortalLogin={(tab) => handleOpenPortalLogin(tab)}
        />
      )}

      <AuthModals
        isOpen={authModalOpen}
        initialTab={authModalTab}
        prefillStudentId={prefillStudentId}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
