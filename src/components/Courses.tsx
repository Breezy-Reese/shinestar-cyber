import { useState, useEffect } from 'react';
import { Clock, Award, DollarSign, X, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    console.log('Modal state changed:', { showModal, selectedCourse: selectedCourse?.title });
  }, [showModal, selectedCourse]);

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses...');
      const response = await api.get('/courses');
      console.log('Courses fetched:', response.data);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollClick = (course: Course) => {
    console.log('Enroll button clicked for course:', course.title);
    setSelectedCourse(course);
    setShowModal(true);
    console.log('Modal should now be open');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    setSubmitting(true);
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
      }, 2000);
    } catch (error) {
      console.error('Error submitting enrollment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCourse(null);
    setSuccess(false);
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
              <p className="text-gray-500 text-lg">No courses available at the moment.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {(() => { console.log('Rendering courses:', courses.length); return null; })()}
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {course.title}
                    </h3>

                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
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
                      className="mt-6 w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold"
                    >
                      Enroll Now - KSH {course.fee_ksh?.toLocaleString()}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '3px solid red',
            padding: '20px'
          }}>
            {/* Debug: Add visible text */}
            <div style={{
              backgroundColor: 'yellow',
              padding: '15px',
              marginBottom: '20px',
              border: '2px solid orange',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              🎉 SHINESTAR GRAPHIC! Course: {selectedCourse.title}
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Enroll in Course</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Enrollment Submitted!</h4>
                  <p className="text-gray-600">
                    Thank you for your interest in {selectedCourse.title}. We'll contact you soon with next steps.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold text-gray-900">{selectedCourse.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{selectedCourse.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">Duration: {selectedCourse.duration}</span>
                      <span className="font-bold text-green-600">KSH {selectedCourse.fee_ksh?.toLocaleString()}</span>
                    </div>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={enrollmentForm.studentName}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, studentName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={enrollmentForm.email}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={enrollmentForm.phone}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        value={enrollmentForm.notes}
                        onChange={(e) => setEnrollmentForm({...enrollmentForm, notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Any special requirements or questions..."
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting...' : 'Submit Enrollment'}
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
