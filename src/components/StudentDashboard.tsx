import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap, Clock, CheckCircle, XCircle, LogOut,
  BookOpen, Award, Phone, User, Edit2, Save, X,
  Download, Medal
} from 'lucide-react';
import { studentApi as api } from '../admin/utils/api';

interface Enrollment {
  _id: string;
  courseTitle: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  enrollmentDate: string;
  notes: string;
  certificateUrl?: string;
  courseId: {
    title: string;
    description: string;
    duration: string;
    fee_ksh: number;
    level: string;
    image: string;
  };
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

const statusConfig = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700',   icon: Award },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700',       icon: XCircle },
};

type Tab = 'courses' | 'profile';

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [user, setUser] = useState<StudentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    const storedUser = localStorage.getItem('studentUser');
    
    console.log('Dashboard mounted - Token exists:', !!token);
    console.log('Dashboard mounted - Stored user:', storedUser);
    
    if (!token || !storedUser) {
      navigate('/student/login');
      return;
    }
    
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    setProfileForm({ name: parsed.name || '', phone: parsed.phone || '' });
    fetchDashboard(token);
  }, []);

  const fetchDashboard = async (token: string) => {
    try {
      console.log('Fetching dashboard with token...');
      
      // FIXED: Use the correct student dashboard endpoint
      const response = await api.get('/auth/student/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Dashboard response:', response.data);
      
      setEnrollments(response.data.enrollments || []);
      setUser(response.data.user);
      setProfileForm({
        name: response.data.user.name || '',
        phone: response.data.user.phone || ''
      });
      
      // Update localStorage with fresh user data
      localStorage.setItem('studentUser', JSON.stringify({
        ...response.data.user,
        id: response.data.user._id
      }));
      
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentUser');
        navigate('/student/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('studentToken');
      
      // FIXED: Use the correct student profile update endpoint
      const response = await api.put('/auth/student/profile', profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updated = response.data.user;
      setUser(updated);
      localStorage.setItem('studentUser', JSON.stringify({ ...updated, id: updated._id }));
      setEditingProfile(false);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDownloadCertificate = (enrollment: Enrollment) => {
    if (!enrollment.certificateUrl) return;
    const link = document.createElement('a');
    link.href = enrollment.certificateUrl;
    link.download = `Certificate_${enrollment.courseTitle.replace(/\s+/g, '_')}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentUser');
    navigate('/student/login');
  };

  const stats = {
    total:     enrollments.length,
    confirmed: enrollments.filter(e => e.status === 'confirmed').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    pending:   enrollments.filter(e => e.status === 'pending').length,
  };

  const completedWithCert = enrollments.filter(
    e => e.status === 'completed' && e.certificateUrl
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-500 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">SHINESTAR CYBER</p>
                <p className="text-blue-100 text-xs">Student Portal</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-white text-sm hidden sm:block">Hello, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1.5 rounded-lg text-sm transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Enrolled', value: stats.total,     color: 'from-blue-500 to-blue-600' },
            { label: 'Confirmed',      value: stats.confirmed, color: 'from-cyan-500 to-cyan-600' },
            { label: 'Completed',      value: stats.completed, color: 'from-green-500 to-green-600' },
            { label: 'Pending',        value: stats.pending,   color: 'from-yellow-500 to-yellow-600' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-xl p-4 text-white`}>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm opacity-90 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Certificate ready banner */}
        {completedWithCert.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-4 mb-6 flex items-center space-x-4">
            <Medal className="w-10 h-10 text-white flex-shrink-0" />
            <div>
              <p className="text-white font-bold">
                🎉 You have {completedWithCert.length} certificate{completedWithCert.length > 1 ? 's' : ''} ready to download!
              </p>
              <p className="text-yellow-100 text-sm">Click the Download button next to your completed course</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 rounded-xl p-1 mb-6 w-fit">
          {([
            { key: 'courses', label: 'My Courses', icon: BookOpen },
            { key: 'profile', label: 'My Profile', icon: User },
          ] as { key: Tab; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── COURSES TAB ── */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 px-6 py-5 border-b border-gray-100">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">My Courses</h2>
            </div>

            {enrollments.length === 0 ? (
              <div className="text-center py-16 px-4">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No courses yet</h3>
                <p className="text-gray-500 text-sm mb-6">You haven't enrolled in any courses yet.</p>
                <Link
                  to="/courses"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <span>Browse Courses</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {enrollments.map((enrollment) => {
                  const status = statusConfig[enrollment.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const course = enrollment.courseId;
                  const hasCertificate = enrollment.status === 'completed' && enrollment.certificateUrl;

                  return (
                    <div key={enrollment._id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start space-x-4 flex-1">
                          {course?.image ? (
                            <img
                              src={course.image}
                              alt={course.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg">
                              {course?.title || enrollment.courseTitle}
                            </h3>
                            {course?.description && (
                              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{course.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                              {course?.duration && (
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{course.duration}</span>
                                </span>
                              )}
                              {course?.fee_ksh && (
                                <span className="font-semibold text-green-600">
                                  KSH {course.fee_ksh.toLocaleString()}
                                </span>
                              )}
                              {course?.level && (
                                <span className="capitalize bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                                  {course.level}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              Enrolled:{' '}
                              {new Date(enrollment.enrollmentDate).toLocaleDateString('en-KE', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{status.label}</span>
                          </span>

                          {hasCertificate && (
                            <button
                              onClick={() => handleDownloadCertificate(enrollment)}
                              className="flex items-center space-x-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:from-yellow-500 hover:to-orange-500 transition-all shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Certificate</span>
                            </button>
                          )}

                          {enrollment.status === 'completed' && !enrollment.certificateUrl && (
                            <span className="text-xs text-gray-400 italic">Certificate pending</span>
                          )}
                        </div>
                      </div>

                      {enrollment.notes && (
                        <div className="mt-3 ml-20 bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold">Notes:</span> {enrollment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">My Profile</h2>
              </div>
              {!editingProfile ? (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-semibold"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileForm({ name: user?.name || '', phone: user?.phone || '' });
                  }}
                  className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              )}
            </div>

            <div className="p-6">
              {profileSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-green-700 text-sm font-medium">Profile updated successfully!</p>
                </div>
              )}

              {/* Avatar */}
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="max-w-md mx-auto space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  {editingProfile ? (
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                      {user?.name || '—'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-gray-400 font-normal">(cannot change)</span>
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-500">
                    {user?.email}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  {editingProfile ? (
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="07XX XXX XXX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 font-medium">
                      {user?.phone || '—'}
                    </div>
                  )}
                </div>

                {/* Course summary */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Course Summary</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-xs text-gray-500 mt-1">Enrolled</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                      <div className="text-xs text-gray-500 mt-1">Completed</div>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{completedWithCert.length}</div>
                      <div className="text-xs text-gray-500 mt-1">Certificates</div>
                    </div>
                  </div>
                </div>

                {editingProfile && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {savingProfile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact support */}
        <div className="mt-6 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-lg">Need help with your course?</h3>
            <p className="text-blue-100 text-sm">Contact us and we'll assist you right away</p>
          </div>
          <a
            href="tel:0743181585"
            className="flex items-center space-x-2 bg-white text-blue-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>0743181585</span>
          </a>
        </div>

      </main>
    </div>
  );
}