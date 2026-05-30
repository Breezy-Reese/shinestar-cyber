import React, { useState, useEffect, useRef } from 'react';
import { Upload, Award, CheckCircle, X, Send, RefreshCw, Sparkles, Mail } from 'lucide-react';
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
  const [generatingCertId, setGeneratingCertId] = useState<string | null>(null);
  const [issuingCertId, setIssuingCertId] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState<{ id: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetEnrollment, setTargetEnrollment] = useState<string | null>(null);

  useEffect(() => { fetchEnrollments(); }, []);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/enrollments');
      setEnrollments(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/enrollments/${id}`, { status });
      fetchEnrollments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleSendCredentials = async (enrollment: Enrollment) => {
    if (!window.confirm(`Send login credentials to ${enrollment.studentName} (${enrollment.email})?`)) return;
    setSendingCredId(enrollment._id);
    setError(null);
    setCredSuccess(null);
    try {
      const response = await api.post(`/auth/send-credentials/${enrollment._id}`);
      setCredSuccess({ id: enrollment._id, password: response.data.tempPassword });
      setTimeout(() => setCredSuccess(null), 15000);
      fetchEnrollments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send credentials');
    } finally {
      setSendingCredId(null);
    }
  };

  const handleGenerateCertificate = async (enrollment: Enrollment) => {
    if (!window.confirm(`Generate certificate for ${enrollment.studentName} — ${enrollment.courseTitle}?`)) return;
    setGeneratingCertId(enrollment._id);
    setError(null);
    try {
      const response = await api.post(`/certificates/generate/${enrollment._id}`);
      setSuccessMsg(`Certificate generated for ${enrollment.studentName}! Click "Issue Cert" to send it to the student.`);
      setTimeout(() => setSuccessMsg(null), 8000);
      fetchEnrollments();
      if (response.data.certificateUrl) window.open(response.data.certificateUrl, '_blank');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGeneratingCertId(null);
    }
  };

  const handleIssueCertificate = async (enrollment: Enrollment) => {
    if (!enrollment.certificateUrl) {
      setError('Generate the certificate first before issuing.');
      return;
    }
    if (!window.confirm(`Issue certificate to ${enrollment.studentName} via email & SMS?`)) return;
    setIssuingCertId(enrollment._id);
    setError(null);
    try {
      await api.post(`/certificates/issue/${enrollment._id}`);
      setSuccessMsg(`Certificate issued to ${enrollment.studentName} via email & SMS!`);
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setIssuingCertId(null);
    }
  };

  const handleUploadClick = (enrollmentId: string) => {
    setTargetEnrollment(enrollmentId);
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetEnrollment) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) { setError('Only PDF, JPG, or PNG files are allowed'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File size must be under 10MB'); return; }
    setUploadingId(targetEnrollment);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('certificate', file);
      await api.post(`/enrollments/${targetEnrollment}/certificate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess(targetEnrollment);
      setSuccessMsg('Certificate uploaded successfully!');
      setTimeout(() => { setUploadSuccess(null); setSuccessMsg(null); }, 4000);
      fetchEnrollments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploadingId(null);
      setTargetEnrollment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredEnrollments = filter === 'all' ? enrollments : enrollments.filter(e => e.status === filter);
  const counts = {
    all: enrollments.length,
    pending: enrollments.filter(e => e.status === 'pending').length,
    confirmed: enrollments.filter(e => e.status === 'confirmed').length,
    completed: enrollments.filter(e => e.status === 'completed').length,
    cancelled: enrollments.filter(e => e.status === 'cancelled').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />

      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Enrollments</h1>
          <p className="text-gray-500 mt-1">{enrollments.length} total enrollments</p>
        </div>
        <button onClick={fetchEnrollments} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
          <RefreshCw className="w-4 h-4" /><span>Refresh</span>
        </button>
      </div>

      <div className="flex space-x-2 flex-wrap gap-y-2 mb-6">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(status => (
          <button key={status} onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 ${filter === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === status ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-600'}`}>{counts[status]}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-green-700 text-sm font-medium">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4 text-green-400" /></button>
        </div>
      )}

      {credSuccess && (
        <div className="bg-green-50 border border-green-300 rounded-xl px-5 py-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-800 font-semibold">Credentials sent!</p>
            </div>
            <button onClick={() => setCredSuccess(null)}><X className="w-4 h-4 text-green-400" /></button>
          </div>
          <p className="text-green-700 text-sm">Temp password: <strong className="bg-yellow-100 px-3 py-1 rounded font-mono text-base tracking-widest">{credSuccess.password}</strong></p>
        </div>
      )}

      <div className="bg-white shadow rounded-xl overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Course</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEnrollments.map((enrollment) => (
              <tr key={enrollment._id} className="hover:bg-gray-50">
                <td className="px-6 py-4"><div className="text-sm font-semibold text-gray-900">{enrollment.studentName}</div></td>
                <td className="px-6 py-4"><div className="text-sm text-gray-900 max-w-xs truncate">{enrollment.courseTitle}</div></td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">{enrollment.email}</div>
                  <div className="text-sm text-gray-400">{enrollment.phone}</div>
                </td>
                <td className="px-6 py-4"><div className="text-sm text-gray-500 max-w-xs truncate">{enrollment.notes || '—'}</div></td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(enrollment.status)}`}>
                    {enrollment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(enrollment.enrollmentDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end items-center gap-2 flex-wrap">

                    {/* PENDING */}
                    {enrollment.status === 'pending' && (
                      <>
                        <button onClick={() => handleSendCredentials(enrollment)} disabled={sendingCredId === enrollment._id}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          {sendingCredId === enrollment._id
                            ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div><span>Sending...</span></>
                            : <><Send className="w-3 h-3" /><span>Send Credentials</span></>}
                        </button>
                        <button onClick={() => updateStatus(enrollment._id, 'cancelled')}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">
                          Reject
                        </button>
                      </>
                    )}

                    {/* CONFIRMED */}
                    {enrollment.status === 'confirmed' && (
                      <>
                        <button onClick={() => updateStatus(enrollment._id, 'completed')}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                          Mark Complete
                        </button>
                        <button onClick={() => handleSendCredentials(enrollment)} disabled={sendingCredId === enrollment._id}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 disabled:opacity-50">
                          <Send className="w-3 h-3" /><span>Resend</span>
                        </button>
                      </>
                    )}

                    {/* COMPLETED */}
                    {enrollment.status === 'completed' && (
                      <>
                        {/* 1. Generate */}
                        <button onClick={() => handleGenerateCertificate(enrollment)} disabled={generatingCertId === enrollment._id}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50">
                          {generatingCertId === enrollment._id
                            ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div><span>Generating...</span></>
                            : <><Sparkles className="w-3 h-3" /><span>{enrollment.certificateUrl ? 'Regenerate' : 'Generate Cert'}</span></>}
                        </button>

                        {/* 2. Issue — only visible once cert is generated */}
                        {enrollment.certificateUrl && (
                          <button onClick={() => handleIssueCertificate(enrollment)} disabled={issuingCertId === enrollment._id}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50">
                            {issuingCertId === enrollment._id
                              ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div><span>Issuing...</span></>
                              : <><Mail className="w-3 h-3" /><span>Issue Cert</span></>}
                          </button>
                        )}

                        {/* 3. Upload manual */}
                        {uploadSuccess === enrollment._id ? (
                          <span className="flex items-center space-x-1 text-green-600 text-xs font-semibold">
                            <CheckCircle className="w-4 h-4" /><span>Uploaded!</span>
                          </span>
                        ) : (
                          <button onClick={() => handleUploadClick(enrollment._id)} disabled={uploadingId === enrollment._id}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs rounded-lg hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50">
                            {uploadingId === enrollment._id
                              ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div><span>Uploading...</span></>
                              : <><Upload className="w-3 h-3" /><span>Upload</span></>}
                          </button>
                        )}

                        {/* 4. View */}
                        {enrollment.certificateUrl && (
                          <a href={enrollment.certificateUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs rounded-lg hover:bg-green-200">
                            <Award className="w-3 h-3" /><span>View</span>
                          </a>
                        )}
                      </>
                    )}

                    {enrollment.status === 'cancelled' && (
                      <span className="text-red-500 font-semibold text-xs">Rejected</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEnrollments.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            {filter === 'all' ? 'No enrollments found.' : `No ${filter} enrollments.`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Enrollments;
