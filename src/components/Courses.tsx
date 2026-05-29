import { useState, useEffect } from 'react';
import { Clock, DollarSign, X, CheckCircle, GraduationCap, Phone, Mail, User } from 'lucide-react';
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

  // Guest apply form fields
  const [applyForm, setApplyForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchCourses();
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

  const handleApplyClick = (course: Course) => {
    setSelectedCourse(course);
    setApplyForm({ name: '', email: '', phone: '' });
    setShowModal(true);
    setError('');
    setSuccess(false);
  };

  const handleSubmitApplication = async () => {
    if (!selectedCourse) return;
    const { name, email, phone } = applyForm;
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await studentApi.post('/enrollments/apply', {
        fullName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        courseId: selectedCourse._id,
        courseTitle: selectedCourse.title,
      });
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setSelectedCourse(null);
      }, 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application. Please try again.');
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
                      onClick={() => handleApplyClick(course)}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                    >
                      Apply for Course
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

      {/* Apply Modal */}
      {showModal && selectedCourse && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Apply for Course</h3>
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
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h4>
                  <p className="text-gray-600 text-sm">
                    Your application for <strong>{selectedCourse.title}</strong> has been received.
                    Admin will review and send your login credentials via <strong>SMS & Email</strong> within 2 hours.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-5">
                    <p className="text-blue-800 text-xs">
                      Fill in your details below. After admin reviews your application, you'll receive login credentials via SMS & Email to access your course.
                    </p>
                  </div>

                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={applyForm.name}
                          onChange={e => setApplyForm({ ...applyForm, name: e.target.value })}
                          placeholder="Your full name"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={applyForm.email}
                          onChange={e => setApplyForm({ ...applyForm, email: e.target.value })}
                          placeholder="your@email.com"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={applyForm.phone}
                          onChange={e => setApplyForm({ ...applyForm, phone: e.target.value })}
                          placeholder="07XXXXXXXX"
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
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
                    <button
                      onClick={handleSubmitApplication}
                      disabled={submitting}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {submitting ? (
                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>Submitting...</span></>
                      ) : (
                        <span>Submit Application</span>
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
