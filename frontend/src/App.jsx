import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/AnimatedSection';
import { useAuth } from './contexts/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import AboutMinistry from './pages/AboutMinistry';
import AboutEvangelist from './pages/AboutEvangelist';
import ContactMinistry from './pages/ContactMinistry';
import ContactEvangelist from './pages/ContactEvangelist';
import Media from './pages/Media';
import Gallery from './pages/Gallery';
import Projects from './pages/Projects';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LessonView from './pages/LessonView';
import Dashboard from './pages/Dashboard';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminMedia from './pages/admin/AdminMedia';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProjects from './pages/admin/AdminProjects';
import AdminMessages from './pages/admin/AdminMessages';
import AdminSiteContent from './pages/admin/AdminSiteContent';
import AdminSons from './pages/admin/AdminSons';
import AdminEvents from './pages/admin/AdminEvents';
import Events from './pages/Events';

function PublicLayout({ children }) {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main style={{ flex: 1 }}>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="spinner-border" style={{ color: 'var(--gold)' }} />
    </div>
  );

  return (
    <AnimatePresence mode="wait">
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/about/ministry" element={<PublicLayout><AboutMinistry /></PublicLayout>} />
      <Route path="/about/evangelist" element={<PublicLayout><AboutEvangelist /></PublicLayout>} />
      <Route path="/contact/ministry" element={<PublicLayout><ContactMinistry /></PublicLayout>} />
      <Route path="/contact/evangelist" element={<PublicLayout><ContactEvangelist /></PublicLayout>} />
      <Route path="/media" element={<PublicLayout><Media /></PublicLayout>} />
      <Route path="/gallery" element={<PublicLayout><Gallery /></PublicLayout>} />
      <Route path="/projects" element={<PublicLayout><Projects /></PublicLayout>} />
      <Route path="/events" element={<PublicLayout><Events /></PublicLayout>} />
      <Route path="/courses" element={<PublicLayout><Courses /></PublicLayout>} />
      <Route path="/courses/:id" element={<PublicLayout><CourseDetail /></PublicLayout>} />

      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <PublicLayout><Login /></PublicLayout>} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <PublicLayout><Register /></PublicLayout>} />

      <Route path="/courses/:courseId/lessons/:lessonId" element={
        <ProtectedRoute><LessonView /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute adminOnly><AdminCourses /></ProtectedRoute>} />
      <Route path="/admin/media" element={<ProtectedRoute adminOnly><AdminMedia /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute adminOnly><AdminProjects /></ProtectedRoute>} />
      <Route path="/admin/messages" element={<ProtectedRoute adminOnly><AdminMessages /></ProtectedRoute>} />
      <Route path="/admin/content" element={<ProtectedRoute adminOnly><AdminSiteContent /></ProtectedRoute>} />
      <Route path="/admin/sons" element={<ProtectedRoute adminOnly><AdminSons /></ProtectedRoute>} />
      <Route path="/admin/events" element={<ProtectedRoute adminOnly><AdminEvents /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AnimatePresence>
  );
}
