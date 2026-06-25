import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

export const ChangePassword: React.FC = () => {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match');
    }

    if (newPassword.length < 6) {
      return setError('New password must be at least 6 characters long');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(data.message || 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Connection failure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Update Account Password</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">Ensure your account uses a long, random password to stay secure.</p>

        {error && (
          <div className="mb-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-2xl text-rose-800 dark:text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-3.5 rounded-2xl text-emerald-800 dark:text-emerald-400 text-sm flex items-start gap-2.5">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-500 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all cursor-pointer mt-2"
          >
            {loading ? 'Saving Changes...' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
