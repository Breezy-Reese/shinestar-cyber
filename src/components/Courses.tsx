import { useState, useEffect } from 'react';
import { Clock, DollarSign, X, CheckCircle, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../admin/utils/api';

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
  const [enrollmentForm, setEnrollmentForm] = useState({
    studentName: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
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

    // Pre-fill form with logged-in student info
    const studentUser = JSON.parse(localStorage.getItem('studentUser') || '{}');
    setEnrollmentForm({
      studentName: studentUser.name || '',
      email: studentUser.email || '',
      phone: '',
      notes: ''
    });

    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    setSubmitting(true);
    setError('');

    try {
      await api.post('/enrollments', {
        courseId: selectedCourse._id,
        ...enrollmentForm
      });

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setSelectedCourse(null);
        setEnrollmentForm({ studentName: '', email: '', phone: '', notes: '' });
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
    setEnrollmentForm({ studentName: '', email: '', phone: '', notes: '' });
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

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No courses available at the moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
                >
                  {course.image && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
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

                    <p className="text-gray-600 mb-4 leading-relaxed text-sm line-clamp-3">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-green-600">
                          KSH {course.fee_ksh?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEnrollClick(course)}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                    >
                      Enroll Now — KSH {course.fee_ksh?.toLocaleString()}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats Banner */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">500+</div>
                <div className="text-gray-300">Students Trained</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">95%</div>
                <div className="text-gray-300">Success Rate</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">100%</div>
                <div className="text-gray-300">Job Ready Skills</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Why Choose Our Training?</h3>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Expert instructors, hands-on projects, flexible schedules, and industry-recognized certifications to boost your career.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment Modal */}
      {showModal && selectedCourse && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Enroll in Course</h3>
                <p className="text-blue-100 text-sm">{selectedCourse.title}</p>
              </div>
              <button onClick={closeModal} className="text-white hover:text-blue-100 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {success ? (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Enrollment Submitted!</h4>
                  <p className="text-gray-600 text-sm">
                    Thank you for enrolling in <strong>{selectedCourse.title}</strong>. We'll contact you soon with next steps.
                  </p>
                </div>
              ) : (
                <>
                  {/* Course Summary */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{selectedCourse.title}</h4>
                        <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{selectedCourse.duration}</span>
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-green-600 text-lg">
                        KSH {selectedCourse.fee_ksh?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={enrollmentForm.studentName}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, studentName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={enrollmentForm.email}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={enrollmentForm.phone}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="07XX XXX XXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Notes</label>
                      <textarea
                        value={enrollmentForm.notes}
                        onChange={(e) => setEnrollmentForm({ ...enrollmentForm, notes: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        rows={3}
                        placeholder="Any special requirements or questions..."
                      />
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <span>Submit Enrollment</span>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
