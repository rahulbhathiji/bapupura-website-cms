import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token or link has expired.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Your password has been reset successfully.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-600 via-sky-800 to-slate-900 px-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Create New Password</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Please enter your new strong password below</p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-2xl text-rose-800 dark:text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-2xl text-emerald-800 dark:text-emerald-400 text-sm flex flex-col items-center text-center gap-3">
            <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-semibold">{success}</p>
              <p className="text-xs text-slate-500 mt-2">Redirecting you to the login screen in 3 seconds...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type password"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-500 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
