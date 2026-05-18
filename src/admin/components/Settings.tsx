import React, { useState, useEffect } from 'react';
import { User, Receipt, Users, Database, Save, Download, Upload, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Toast { type: 'success' | 'error'; message: string; }

// ─── Toast component ──────────────────────────────────────────────────────────
const ToastAlert: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => (
  <div className={`fixed top-6 right-6 z-50 flex items-center space-x-3 px-5 py-4 rounded-xl shadow-lg text-white transition-all ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
    <span className="font-medium">{toast.message}</span>
    <button onClick={onClose} className="ml-2 text-white opacity-70 hover:opacity-100">✕</button>
  </div>
);

// ─── Tab button ───────────────────────────────────────────────────────────────
const Tab: React.FC<{ label: string; icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-5 py-3 rounded-lg font-medium transition-all text-sm ${active ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// ─── Main Settings Component ──────────────────────────────────────────────────
const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'receipt' | 'userprofile' | 'backup'>('profile');
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Profile state ────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({ username: user?.username || '', email: user?.email || '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // ── Receipt state ────────────────────────────────────────────────────────────
  const [receipt, setReceipt] = useState({
    business_name: '', business_address: '', business_phone: '', business_email: '',
    business_hours: '', receipt_footer: 'Thank you for choosing Shinestar Cyber!',
    receipt_prefix: 'REC', tax_rate: '0', whatsapp_number: '',
  });
  const [receiptLoading, setReceiptLoading] = useState(true);

  // ── User Profile state ───────────────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({ username: '', email: '', role: 'user', active: true });

  // ── Backup state ─────────────────────────────────────────────────────────────
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(localStorage.getItem('lastBackup'));

  // ── Load receipt settings ────────────────────────────────────────────────────
  useEffect(() => {
    const loadReceipt = async () => {
      try {
        const res = await api.get('/settings');
        const data = res.data;
        setReceipt({
          business_name: data.business_name?.value || '',
          business_address: data.business_address?.value || '',
          business_phone: data.business_phone?.value || '',
          business_email: data.business_email?.value || '',
          business_hours: data.business_hours?.value || '',
          receipt_footer: data.receipt_footer?.value || 'Thank you for choosing Shinestar Cyber!',
          receipt_prefix: data.receipt_prefix?.value || 'REC',
          tax_rate: data.tax_rate?.value || '0',
          whatsapp_number: data.whatsapp_number?.value || '',
        });
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setReceiptLoading(false);
      }
    };
    loadReceipt();
  }, []);

  // ── Load users ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'userprofile') {
      setUsersLoading(true);
      api.get('/users')
        .then(res => setUsers(res.data))
        .catch(err => console.error('Error loading users:', err))
        .finally(() => setUsersLoading(false));
    }
  }, [activeTab]);

  // ── Save admin profile ───────────────────────────────────────────────────────
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      return showToast('error', 'New passwords do not match');
    }
    setLoading(true);
    try {
      await api.put(`/users/${user?.id}`, {
        username: profile.username,
        email: profile.email,
        ...(profile.newPassword && { password: profile.newPassword }),
      });
      showToast('success', 'Profile updated successfully!');
      setProfile(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // ── Save receipt settings ────────────────────────────────────────────────────
  const saveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Promise.all(
        Object.entries(receipt).map(([key, value]) =>
          api.put(`/settings/${key}`, { value, type: 'string' })
        )
      );
      showToast('success', 'Receipt settings saved successfully!');
    } catch (err) {
      showToast('error', 'Failed to save receipt settings');
    } finally {
      setLoading(false);
    }
  };

  // ── Save user ────────────────────────────────────────────────────────────────
  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/users/${editingUser._id}`, userForm);
      const res = await api.get('/users');
      setUsers(res.data);
      setEditingUser(null);
      showToast('success', 'User updated successfully!');
    } catch (err) {
      showToast('error', 'Failed to update user');
    }
  };

  const toggleUserActive = async (userId: string, active: boolean) => {
    try {
      await api.put(`/users/${userId}`, { active: !active });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, active: !active } : u));
      showToast('success', `User ${!active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      showToast('error', 'Failed to update user status');
    }
  };

  // ── Data backup ──────────────────────────────────────────────────────────────
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const [usersRes, servicesRes, coursesRes, bookingsRes, enrollmentsRes, settingsRes] = await Promise.all([
        api.get('/users'),
        api.get('/services'),
        api.get('/courses'),
        api.get('/bookings'),
        api.get('/enrollments'),
        api.get('/settings'),
      ]);
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        data: {
          users: usersRes.data,
          services: servicesRes.data,
          courses: coursesRes.data,
          bookings: bookingsRes.data,
          enrollments: enrollmentsRes.data,
          settings: settingsRes.data,
        },
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shinestar-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const now = new Date().toLocaleString();
      setLastBackup(now);
      localStorage.setItem('lastBackup', now);
      showToast('success', 'Backup downloaded successfully!');
    } catch (err) {
      showToast('error', 'Backup failed. Please try again.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.version || !data.data) {
          showToast('error', 'Invalid backup file format');
          return;
        }
        showToast('success', `Backup verified (exported ${new Date(data.exportedAt).toLocaleDateString()}). Contact your developer to restore data.`);
      } catch {
        showToast('error', 'Failed to read backup file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {toast && <ToastAlert toast={toast} onClose={() => setToast(null)} />}

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-500 mb-8">Manage your admin profile, business settings, users, and data</p>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 mb-8 bg-gray-50 p-2 rounded-xl">
        <Tab label="Profile" icon={<User className="w-4 h-4" />} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        <Tab label="Receipt" icon={<Receipt className="w-4 h-4" />} active={activeTab === 'receipt'} onClick={() => setActiveTab('receipt')} />
        <Tab label="User Profiles" icon={<Users className="w-4 h-4" />} active={activeTab === 'userprofile'} onClick={() => setActiveTab('userprofile')} />
        <Tab label="Data Backup" icon={<Database className="w-4 h-4" />} active={activeTab === 'backup'} onClick={() => setActiveTab('backup')} />
      </div>

      {/* ── PROFILE TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.username}</h2>
              <p className="text-gray-500 text-sm">{profile.email} · Admin</p>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                  <input type="text" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                  <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b">Change Password</h3>
              <p className="text-sm text-gray-500 mb-4">Leave blank to keep your current password</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { label: 'Current Password', field: 'currentPassword', key: 'current' },
                  { label: 'New Password', field: 'newPassword', key: 'new' },
                  { label: 'Confirm Password', field: 'confirmPassword', key: 'confirm' },
                ] as const).map(({ label, field, key }) => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                    <div className="relative">
                      <input
                        type={showPasswords[key] ? 'text' : 'password'}
                        value={profile[field]}
                        onChange={e => setProfile({ ...profile, [field]: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                        {showPasswords[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                <Save className="w-4 h-4" /><span>{loading ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── RECEIPT TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'receipt' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Receipt & Business Settings</h2>
          {receiptLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
          ) : (
            <form onSubmit={saveReceipt} className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Business Name</label>
                    <input type="text" value={receipt.business_name} onChange={e => setReceipt({ ...receipt, business_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="SHINESTAR CYBER & TECH SOLUTIONS" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input type="text" value={receipt.business_phone} onChange={e => setReceipt({ ...receipt, business_phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0717379145" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number</label>
                    <input type="text" value={receipt.whatsapp_number} onChange={e => setReceipt({ ...receipt, whatsapp_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="254717379145" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" value={receipt.business_email} onChange={e => setReceipt({ ...receipt, business_email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="info@shinestar.co.ke" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Business Hours</label>
                    <input type="text" value={receipt.business_hours} onChange={e => setReceipt({ ...receipt, business_hours: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Mon–Sat: 8:00–18:00" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                    <input type="text" value={receipt.business_address} onChange={e => setReceipt({ ...receipt, business_address: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="California next to Oasis Korumba shop" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b">Receipt Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Receipt Number Prefix</label>
                    <input type="text" value={receipt.receipt_prefix} onChange={e => setReceipt({ ...receipt, receipt_prefix: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="REC" />
                    <p className="text-xs text-gray-400 mt-1">e.g. REC-0001, INV-0001</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tax Rate (%)</label>
                    <input type="number" value={receipt.tax_rate} onChange={e => setReceipt({ ...receipt, tax_rate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="0" min="0" max="100" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Receipt Footer Message</label>
                    <textarea value={receipt.receipt_footer} onChange={e => setReceipt({ ...receipt, receipt_footer: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={2} placeholder="Thank you for choosing Shinestar Cyber!" />
                  </div>
                </div>
              </div>
              {/* Receipt Preview */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b">Receipt Preview</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 bg-gray-50 max-w-sm mx-auto text-center font-mono text-sm">
                  <p className="font-bold text-base uppercase">{receipt.business_name || 'Business Name'}</p>
                  <p className="text-gray-500 text-xs mt-1">{receipt.business_address || 'Address'}</p>
                  <p className="text-gray-500 text-xs">{receipt.business_phone || 'Phone'}</p>
                  <div className="border-t border-dashed border-gray-300 my-3"></div>
                  <p className="text-xs text-gray-400">{receipt.receipt_prefix || 'REC'}-0001 · {new Date().toLocaleDateString()}</p>
                  <div className="border-t border-dashed border-gray-300 my-3"></div>
                  <p className="text-xs italic text-gray-500">{receipt.receipt_footer || 'Footer message'}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                  <Save className="w-4 h-4" /><span>{loading ? 'Saving...' : 'Save Receipt Settings'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── USER PROFILES TAB ────────────────────────────────────────────────── */}
      {activeTab === 'userprofile' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">User Profiles</h2>
          {editingUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="text-base font-bold text-blue-900 mb-4">Editing: {editingUser.username}</h3>
              <form onSubmit={saveUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                    <input type="text" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                    <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center mt-6">
                    <input type="checkbox" id="active" checked={userForm.active} onChange={e => setUserForm({ ...userForm, active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                    <label htmlFor="active" className="ml-2 text-sm font-semibold text-gray-700">Active Account</label>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium">Save Changes</button>
                  <button type="button" onClick={() => setEditingUser(null)} className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-300 font-medium">Cancel</button>
                </div>
              </form>
            </div>
          )}
          {usersLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
          ) : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${u.role === 'admin' ? 'bg-blue-600' : 'bg-gray-400'}`}>
                      {u.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{u.username}</p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${u.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.active !== false ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => { setEditingUser(u); setUserForm({ username: u.username, email: u.email, role: u.role, active: u.active !== false }); }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                    <button onClick={() => toggleUserActive(u._id, u.active !== false)}
                      className={`text-sm font-medium ${u.active !== false ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                      {u.active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-center text-gray-400 py-8">No users found.</p>}
            </div>
          )}
        </div>
      )}

      {/* ── DATA BACKUP TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
          <h2 className="text-xl font-bold text-gray-900">Data Backup & Restore</h2>
          <div className="border border-gray-100 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-50 rounded-xl"><Download className="w-6 h-6 text-blue-600" /></div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">Export Backup</h3>
                <p className="text-sm text-gray-500 mt-1">Download a full backup of all your data including users, services, courses, bookings, enrollments, and settings as a JSON file.</p>
                {lastBackup && <p className="text-xs text-green-600 mt-2 font-medium">✅ Last backup: {lastBackup}</p>}
                <button onClick={handleBackup} disabled={backupLoading}
                  className="mt-4 flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                  <Download className="w-4 h-4" /><span>{backupLoading ? 'Preparing backup...' : 'Download Backup'}</span>
                </button>
              </div>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-orange-50 rounded-xl"><Upload className="w-6 h-6 text-orange-500" /></div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">Restore from Backup</h3>
                <p className="text-sm text-gray-500 mt-1">Upload a previously exported backup file to verify its contents. Contact your developer to fully restore data to the database.</p>
                <div className="mt-4">
                  <label className="flex items-center space-x-2 bg-orange-50 border-2 border-dashed border-orange-200 text-orange-700 px-5 py-3 rounded-lg cursor-pointer hover:bg-orange-100 font-medium w-fit">
                    <Upload className="w-4 h-4" /><span>Choose Backup File</span>
                    <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl p-6 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 mb-3">What's included in the backup:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['Users', 'Services', 'Courses', 'Bookings', 'Enrollments', 'Settings'].map(item => (
                <div key={item} className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" /><span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
