import { useState, useEffect } from 'react';
import { Clock, DollarSign, X, CheckCircle, GraduationCap, LogIn, Phone } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { studentApi } from '../admin/utils/api';

interface Course {
  _id: string;
  title: string;
  description: string;
  image: string;
  fee_ksh: number;
  duration: string;
  level: string;
  createdAt: string;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState(''); // ← optional phone for SMS
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
    const token = localStorage.getItem('studentToken');
    const user = localStorage.getItem('studentUser');
    if (token && user) {
      setIsLoggedIn(true);
      const parsed = JSON.parse(user);
      setStudentName(parsed.name || parsed.username || '');
      // Pre-fill phone if already saved on profile
      setPhone(parsed.phone && parsed.phone !== 'N/A' ? parsed.phone : '');
    }
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await studentApi.get('/courses');
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollClick = (course: Course) => {
    const studentToken = localStorage.getItem('studentToken');
    if (!studentToken) {
      navigate('/student/login');
      return;
    }
    setSelectedCourse(course);
    setShowModal(true);
    setError('');
    setSuccess(false);
  };

  const handleConfirmEnroll = async () => {
    if (!selectedCourse) return;
    setSubmitting(true);
    setError('');
    try {
      await studentApi.post('/enrollments', {
        courseId: selectedCourse._id,
        courseTitle: selectedCourse.title,
        // ✅ Send phone if provided, otherwise omit (backend defaults to 'N/A')
        ...(phone.trim() && { phone: phone.trim() }),
      });

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setSelectedCourse(null);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit enrollment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCourse(null);
    setSuccess(false);
    setError('');
  };

  if (loading) {
    return (
      <section id="courses" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="courses" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Professional Training Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Elevate your skills with our comprehensive, industry-focused training programs
            </p>
          </div>

          {/* Login notice for guests */}
          {!isLoggedIn && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <LogIn className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-blue-800 text-sm">
                  Already have an account? Login to enroll. New student?{' '}
                  <Link to="/student/login" className="font-semibold underline">Register here</Link>.
                </p>
              </div>
              <Link to="/student/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline whitespace-nowrap">
                Student Login →
              </Link>
            </div>
          )}

          {/* Logged in banner */}
          {isLoggedIn && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-green-800 text-sm">
                  Logged in as <strong>{studentName}</strong>. Click Enroll Now on any course.
                </p>
              </div>
              <Link to="/student/dashboard" className="text-sm font-semibold text-green-600 hover:text-green-700 underline whitespace-nowrap">
                My Dashboard →
              </Link>
            </div>
          )}

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No courses available at the moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {courses.map((course) => (
                <div key={course._id} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
                  {course.image && (
                    <div className="h-48 overflow-hidden">
                      <img src={course.image} alt={course.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                      {course.level && (
                        <span className="text-xs capitalize bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {course.level}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed text-sm line-clamp-3">{course.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-green-600">KSH {course.fee_ksh?.toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEnrollClick(course)}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                    >
                      {isLoggedIn ? `Enroll Now — KSH ${course.fee_ksh?.toLocaleString()}` : 'Login to Enroll'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Banner */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div><div className="text-4xl font-bold mb-2">500+</div><div className="text-gray-300">Students Trained</div></div>
              <div><div className="text-4xl font-bold mb-2">95%</div><div className="text-gray-300">Success Rate</div></div>
              <div><div className="text-4xl font-bold mb-2">100%</div><div className="text-gray-300">Job Ready Skills</div></div>
            </div>
            <div className="mt-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Why Choose Our Training?</h3>
              <p className="text-gray-300 max-w-2xl mx-auto">Expert instructors, hands-on projects, flexible schedules, and industry-recognized certifications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment Modal */}
      {showModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Enrollment</h3>
                <p className="text-blue-100 text-sm">{selectedCourse.title}</p>
              </div>
              <button onClick={closeModal} className="text-white hover:text-blue-100"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Enrollment Submitted!</h4>
                  <p className="text-gray-600 text-sm">
                    Your enrollment for <strong>{selectedCourse.title}</strong> has been received. We'll confirm and send you details shortly.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    {selectedCourse.image && (
                      <img src={selectedCourse.image} alt={selectedCourse.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                    )}
                    <h4 className="font-bold text-gray-900 text-lg">{selectedCourse.title}</h4>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="flex items-center space-x-1 text-gray-500">
                        <Clock className="w-3.5 h-3.5" /><span>{selectedCourse.duration}</span>
                      </span>
                      <span className="font-bold text-green-600 text-lg">KSH {selectedCourse.fee_ksh?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-blue-800">Enrolling as: <strong>{studentName}</strong></p>
                    <p className="text-xs text-blue-600 mt-1">Admin will review and contact you with next steps.</p>
                  </div>

                  {/* ✅ Optional phone number field */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone Number <span className="text-gray-400 font-normal">(optional — for SMS updates)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="07XXXXXXXX"
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Add your number to receive SMS confirmation when your enrollment is approved.
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button onClick={closeModal} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                      Cancel
                    </button>
                    <button onClick={handleConfirmEnroll} disabled={submitting}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 font-semibold disabled:opacity-50 flex items-center justify-center space-x-2">
                      {submitting ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>Enrolling...</span></>
                      ) : (
                        <span>Confirm Enrollment</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
