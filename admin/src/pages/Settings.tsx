import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Save, Upload, CheckCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { token } = useAuth();
  
  // Settings state
  const [websiteName, setWebsiteName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [copyrightGu, setCopyrightGu] = useState('');
  const [copyrightEn, setCopyrightEn] = useState('');
  const [footerSubtextGu, setFooterSubtextGu] = useState('');
  const [footerSubtextEn, setFooterSubtextEn] = useState('');
  
  const [primaryColor, setPrimaryColor] = useState('#0284c7');
  const [secondaryColor, setSecondaryColor] = useState('#f59e0b');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setWebsiteName(d.websiteName || '');
        setLogoUrl(d.logoUrl || '');
        setFaviconUrl(d.faviconUrl || '');
        setCopyrightGu(d.copyrightGu || '');
        setCopyrightEn(d.copyrightEn || '');
        setFooterSubtextGu(d.footerSubtextGu || '');
        setFooterSubtextEn(d.footerSubtextEn || '');
        if (d.themeColors) {
          setPrimaryColor(d.themeColors.primary || '#0284c7');
          setSecondaryColor(d.themeColors.secondary || '#f59e0b');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'logoUrl' | 'faviconUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('files', file);
    formData.append('album', 'SETTINGS');

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const url = json.data[0].url;
        if (fieldName === 'logoUrl') setLogoUrl(url);
        else setFaviconUrl(url);
        
        setToast('Global asset uploaded successfully!');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast('');

    const payload = {
      websiteName,
      logoUrl,
      faviconUrl,
      copyrightGu,
      copyrightEn,
      footerSubtextGu,
      footerSubtextEn,
      themeColors: {
        primary: primaryColor,
        secondary: secondaryColor
      }
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setToast('Global settings updated successfully!');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading website configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 animate-slideUp text-sm">
          <CheckCircle className="text-emerald-500" size={18} />
          <span>{toast}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b pb-3 border-slate-100 dark:border-slate-800/80">Website Settings</h3>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Website Brand Name</label>
            <input 
              type="text" 
              required 
              value={websiteName} 
              onChange={(e) => setWebsiteName(e.target.value)} 
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:bg-white" 
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Brand Logo URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)} 
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" 
                  placeholder="/uploads/logo.png"
                />
                <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <Upload size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Website Favicon URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={faviconUrl} 
                  onChange={(e) => setFaviconUrl(e.target.value)} 
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" 
                  placeholder="/favicon.ico"
                />
                <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <Upload size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'faviconUrl')} />
                </label>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Copyright (Gujarati)</label>
              <input 
                type="text" 
                required 
                value={copyrightGu} 
                onChange={(e) => setCopyrightGu(e.target.value)} 
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Copyright (English)</label>
              <input 
                type="text" 
                required 
                value={copyrightEn} 
                onChange={(e) => setCopyrightEn(e.target.value)} 
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Footer Description (Gujarati)</label>
              <textarea 
                rows={2} 
                required 
                value={footerSubtextGu} 
                onChange={(e) => setFooterSubtextGu(e.target.value)} 
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Footer Description (English)</label>
              <textarea 
                rows={2} 
                required 
                value={footerSubtextEn} 
                onChange={(e) => setFooterSubtextEn(e.target.value)} 
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Theme Palette Colors</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Color (Nav links, Buttons)</label>
                <div className="flex gap-2">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" />
                  <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Secondary Color (Accents, Donate Button)</label>
                <div className="flex gap-2">
                  <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" />
                  <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Settings;
