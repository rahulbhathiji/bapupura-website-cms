import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(data.message);
        if (data.token) {
          setDevToken(data.token);
        }
      } else {
        setError(data.message || 'Error requesting reset link');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-600 via-sky-800 to-slate-900 px-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800">
        
        <div className="mb-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider hover:underline">
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Reset Password</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">We will generate a secure reset link to recover your account</p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-2xl text-rose-800 dark:text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-2xl text-emerald-800 dark:text-emerald-400 text-sm flex items-start gap-3">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Reset Request Successful</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{success}</p>
              </div>
            </div>

            {devToken && (
              <div className="bg-sky-50 dark:bg-sky-950/25 border border-sky-200 dark:border-sky-900/50 p-4 rounded-2xl">
                <p className="text-xs font-bold text-sky-800 dark:text-sky-400 uppercase tracking-widest">Local Dev Recovery Utility</p>
                <p className="text-[11px] text-slate-500 mt-1">Since SMTP is bypassed locally, click below to reset password directly:</p>
                <Link 
                  to={`/reset-password?token=${devToken}`}
                  className="inline-block mt-3 w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded-xl text-center text-xs shadow-md transition-all"
                >
                  Reset Password Now
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Registered Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bapupurasanskarbhavan.org"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-500 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? 'Processing...' : 'Send Reset Instructions'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
