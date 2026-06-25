import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password, rememberMe);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-600 via-sky-800 to-slate-900 px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="bg-sky-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-sky-500/30 mx-auto mb-4">SR</div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Shri Raghuveer Chaudhary Sanskar Bhavan CMS</p>
        </div>

        {error && (
          <div className="mb-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-2xl text-rose-800 dark:text-rose-400 text-sm flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User size={18} />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-sky-600 border-slate-300 focus:ring-sky-500 w-4 h-4"
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-500 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
