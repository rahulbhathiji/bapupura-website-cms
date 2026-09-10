import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Mail } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-600 via-sky-800 to-slate-900 px-4">
      <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 text-center">
        
        <div className="mb-6 text-left">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider hover:underline">
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </Link>
        </div>

        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
          <ShieldAlert size={32} />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mb-2">Forgot Password?</h2>
        
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 p-5 rounded-2xl text-slate-800 dark:text-slate-200 text-sm space-y-3 my-6 text-left">
          <p className="font-bold text-amber-900 dark:text-amber-400 text-center text-base border-b border-amber-200 dark:border-amber-900/50 pb-2">
            🔑 Reset via Super Admin
          </p>
          <p className="text-sm leading-relaxed">
            Please contact the <strong>Super Admin of the website</strong> to reset your site admin account password.
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic border-t border-amber-100 dark:border-amber-900/30 pt-2">
            "તમારો પાસવર્ડ ફરીથી સેટ કરાવવા માટે કૃપા કરીને વેબસાઇટના સુપર એડમિનનો સંપર્ક કરો."
          </p>
          <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-900/50 flex items-center gap-2 text-xs font-mono text-sky-800 dark:text-sky-300">
            <Mail size={16} className="shrink-0 text-sky-600" />
            <span>admin@bapupurasanskarbhavan.org</span>
          </div>
        </div>

        <Link
          to="/login"
          className="inline-block w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
