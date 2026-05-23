import React, { useState, useEffect, useRef } from 'react';
import { Upload, Award, CheckCircle, X, Send, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

interface Enrollment {
  _id: string;
  courseTitle: string;
  studentName: string;
  email: string;
  phone: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  enrollmentDate: string;
  notes?: string;
  certificateUrl?: string;
}

const Enrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [sendingCredId, setSendingCredId] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState<{ id: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetEnrollment, setTargetEnrollment] = useState<string | null>(null);

  useEffect(() => { fetchEnrollments(); }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await api.get('/enrollments');
      setEnrollments(response.data);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/enrollments/${id}`, { status });
      fetchEnrollments();
    } catch (error) {
      console.error('Error updating enrollment:', error);
    }
  };

  // ── Send credentials to student ──────────────────────────────────
  const handleSendCredentials = async (enrollment: Enrollment) => {
    if (!window.confirm(`Send login credentials to ${enrollment.studentName} (${enrollment.email})?`)) return;

    setSendingCredId(enrollment._id);
    setError(null);
    setCredSuccess(null);

    try {
      const response = await api.post(`/auth/send-credentials/${enrollment._id}`);
      setCredSuccess({ id: enrollment._id, password: response.data.tempPassword });
      setTimeout(() => setCredSuccess(null), 10000); // show for 10s
      fetchEnrollments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send credentials');
    } finally {
      setSendingCredId(null);
    }
  };

  // ── Upload certificate ────────────────────────────────────────────
  const handleUploadClick = (enrollmentId: string) => {
    setTargetEnrollment(enrollmentId);
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetEnrollment) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setError('Only PDF, JPG, or PNG files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB');
      return;
    }

    setUploadingId(targetEnrollment);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('certificate', file);

      await api.post(`/certificates/${targetEnrollment}/certificate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadSuccess(targetEnrollment);
      setTimeout(() => setUploadSuccess(null), 4000);
      fetchEnrollments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingId(null);
      setTargetEnrollment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredEnrollments = filter === 'all'
    ? enrollments
    : enrollments.filter(e => e.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':   return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default:          return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center py-8">Loading enrollments...</div>;

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Course Enrollments</h1>
        <div className="flex space-x-2 flex-wrap gap-y-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}

      {/* Credential success banner */}
      {credSuccess && (
        <div className="bg-green-50 border border-green-300 rounded-lg px-4 py-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-800 font-semibold">Credentials sent successfully!</p>
            </div>
            <button onClick={() => setCredSuccess(null)}><X className="w-4 h-4 text-green-400" /></button>
          </div>
          <p className="text-green-700 text-sm">
            Temporary password: <strong className="bg-yellow-100 px-2 py-1 rounded font-mono text-base">{credSuccess.password}</strong>
            <span className="ml-2 text-green-600">(Student will be required to change this on first login)</span>
          </p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEnrollments.map((enrollment) => (
              <tr key={enrollment._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{enrollment.studentName}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">{enrollment.courseTitle}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{enrollment.email}</div>
                  <div className="text-sm text-gray-500">{enrollment.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">{enrollment.notes || '—'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(enrollment.status)}`}>
                    {enrollment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-2 flex-wrap gap-y-1">

                    {/* PENDING: Send credentials + reject */}
                    {enrollment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleSendCredentials(enrollment)}
                          disabled={sendingCredId === enrollment._id}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {sendingCredId === enrollment._id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span>Send Credentials</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => updateStatus(enrollment._id, 'cancelled')}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* CONFIRMED: Mark complete + send credentials again */}
                    {enrollment.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateStatus(enrollment._id, 'completed')}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleSendCredentials(enrollment)}
                          disabled={sendingCredId === enrollment._id}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>Resend</span>
                        </button>
                      </>
                    )}

                    {/* COMPLETED: Upload certificate */}
                    {enrollment.status === 'completed' && (
                      <div className="flex items-center space-x-2">
                        {uploadSuccess === enrollment._id ? (
                          <span className="flex items-center space-x-1 text-green-600 text-xs font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            <span>Uploaded!</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleUploadClick(enrollment._id)}
                            disabled={uploadingId === enrollment._id}
                            className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50"
                          >
                            {uploadingId === enrollment._id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3" />
                                <span>{enrollment.certificateUrl ? 'Re-upload Cert' : 'Upload Cert'}</span>
                              </>
                            )}
                          </button>
                        )}

                        {enrollment.certificateUrl && (
                          <a
                            href={enrollment.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
                          >
                            <Award className="w-3 h-3" />
                            <span>View</span>
                          </a>
                        )}
                      </div>
                    )}

                    {enrollment.status === 'cancelled' && (
                      <span className="text-red-600 font-semibold text-xs">Rejected</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEnrollments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {filter === 'all' ? 'No enrollments found.' : `No ${filter} enrollments.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Enrollments;
