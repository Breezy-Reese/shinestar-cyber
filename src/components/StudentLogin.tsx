import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, GraduationCap, ShieldCheck, User, Phone, CheckCircle } from 'lucide-react';
import { studentApi as api } from '../admin/utils/api';
type View = 'login' | 'register' | 'pending';

export default function StudentLogin() {
  const [view, setView] = useState<View>('login');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Register state
  const [regForm, setRegForm] = useState({ username: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Password change state
  const [mustChange, setMustChange] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [changing, setChanging] = useState(false);

  const navigate = useNavigate();

  // ── LOGIN ──────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/student/login', { email, password });
      const { token, user } = response.data;

      if (user.mustChangePassword) {
        setTempToken(token);
        setMustChange(true);
        return;
      }

      localStorage.setItem('studentToken', token);
      localStorage.setItem('studentUser', JSON.stringify(user));
      navigate('/student/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      if (msg.includes('Invalid credentials')) {
        setError('Invalid email or password. If you just registered, wait for admin to approve and send your login credentials.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER ───────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regForm.password !== regForm.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (regForm.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        username: regForm.username,
        email: regForm.email,
        password: regForm.password,
        phone: regForm.phone,
      });
      setRegisteredEmail(regForm.email);
      setView('pending');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── CHANGE PASSWORD ────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setChanging(true);
    try {
      // Step 1: Change password — backend returns a fresh token
      const response = await api.post('/auth/student/change-password', { newPassword }, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });

      // Step 2: Use the fresh token and user returned by the backend
      const { token, user } = response.data;
      localStorage.setItem('studentToken', token);
      localStorage.setItem('studentUser', JSON.stringify(user));

      // Step 3: Go to dashboard
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  // ── FORCE PASSWORD CHANGE SCREEN ───────────────────────────────────
  if (mustChange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-2xl mb-4">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Set New Password</h1>
              <p className="text-blue-100 text-sm mt-1">You must change your temporary password</p>
            </div>
            <div className="px-8 py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ For your security, please set a new password before continuing.
                </p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input type={showNew ? 'text' : 'password'} required value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters"
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                      {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input type={showNew ? 'text' : 'password'} required value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <button type="submit" disabled={changing}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 flex items-center justify-center space-x-2">
                  {changing ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Saving...</span></> : <span>Set Password & Continue</span>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PENDING APPROVAL SCREEN ────────────────────────────────────────
  if (view === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-2xl mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Registration Submitted!</h1>
              <p className="text-green-100 text-sm mt-1">SHINESTAR CYBER & TECH SOLUTIONS</p>
            </div>
            <div className="px-8 py-8 text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 text-left space-y-3">
                <p className="text-blue-800 text-sm font-semibold">What happens next:</p>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>✅ Your account has been created</p>
                  <p>🔍 Admin will review your enrollment</p>
                  <p>📱 You'll receive your login credentials via SMS & Email to <strong>{registeredEmail}</strong></p>
                  <p>🔐 Log in with the temporary password and reset it</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6">
                <p className="text-yellow-800 text-sm">
                  ⏰ Admin will send your credentials within <strong>2 hours</strong> during business hours.
                </p>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Already received your credentials?
              </p>
              <button onClick={() => setView('login')}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600">
                Go to Login
              </button>
              <Link to="/" className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-4">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-2xl mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Student Portal</h1>
            <p className="text-blue-100 text-sm mt-1">SHINESTAR CYBER & TECH SOLUTIONS</p>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-gray-200">
            <button onClick={() => { setView('login'); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${view === 'login' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
              Sign In
            </button>
            <button onClick={() => { setView('register'); setError(''); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${view === 'register' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
              Create Account
            </button>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 flex items-start space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* ── LOGIN FORM ─────────────────────────────────────────── */}
            {view === 'login' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
                <p className="text-gray-500 text-sm mb-6">Sign in with the credentials sent by admin</p>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} required value={password}
                        onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 flex items-center justify-center space-x-2">
                    {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Signing in...</span></> : <span>Sign In</span>}
                  </button>
                </form>
                <div className="mt-6 space-y-2 text-center text-sm text-gray-500">
                  <p>No account yet? <button onClick={() => { setView('register'); setError(''); }} className="text-blue-600 font-semibold hover:underline">Register here</button></p>
                  <p><Link to="/courses" className="text-blue-600 font-semibold hover:underline">Browse Courses →</Link></p>
                  <p><Link to="/" className="text-gray-400 hover:text-gray-600">← Back to Home</Link></p>
                </div>
              </>
            )}

            {/* ── REGISTER FORM ──────────────────────────────────────── */}
            {view === 'register' && (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Create your account</h2>
                <p className="text-gray-500 text-sm mb-6">Register and wait for admin to approve your enrollment</p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-5">
                  <p className="text-blue-800 text-xs">
                    ℹ️ After registering, admin will review your enrollment and send you a temporary password via SMS & Email to activate your account.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input type="text" required value={regForm.username}
                        onChange={e => setRegForm({ ...regForm, username: e.target.value })}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input type="email" required value={regForm.email}
                        onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input type="tel" required value={regForm.phone}
                        onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                        placeholder="07XXXXXXXX"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input type={showRegPassword ? 'text' : 'password'} required value={regForm.password}
                        onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="Min. 6 characters"
                        className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                        {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input type={showRegPassword ? 'text' : 'password'} required value={regForm.confirmPassword}
                        onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        placeholder="Repeat password"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 flex items-center justify-center space-x-2 mt-2">
                    {loading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>Creating account...</span></> : <span>Create Account</span>}
                  </button>
                </form>
                <div className="mt-5 text-center text-sm text-gray-500">
                  <p>Already have credentials? <button onClick={() => { setView('login'); setError(''); }} className="text-blue-600 font-semibold hover:underline">Sign in</button></p>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          © {new Date().getFullYear()} Shinestar Cyber & Tech Solutions Kenya
        </p>
      </div>
    </div>
  );
}
