import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './admin/hooks/useAuth';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Courses from './components/Courses';
import Gallery from './components/Gallery';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AdminLayout from './admin/components/Layout';
import AdminLogin from './admin/components/Login';
import Dashboard from './admin/components/Dashboard';
import Users from './admin/components/Users';
import AdminCourses from './admin/components/Courses';
import AdminServices from './admin/components/Services';
import Settings from './admin/components/Settings';
import Enrollments from './admin/components/Enrollments';
import Bookings from './admin/components/Bookings';
import StudentLogin from './components/StudentLogin';
import StudentRegister from './components/StudentRegister';
import StudentDashboard from './components/StudentDashboard';

const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-white">
    <Header />
    {children}
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicLayout><Hero /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
          <Route path="/courses" element={<PublicLayout><Courses /></PublicLayout>} />
          <Route path="/gallery" element={<PublicLayout><Gallery /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />

          {/* Student routes */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/register" element={<StudentRegister />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="enrollments" element={<Enrollments />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="content/courses" element={<AdminCourses />} />
            <Route path="content/services" element={<AdminServices />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;