import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Save, Globe, CheckCircle } from 'lucide-react';

export const SEO: React.FC = () => {
  const { token } = useAuth();
  
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [twitterCard, setTwitterCard] = useState('summary_large_image');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fetchSEO = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data.seo || {};
        setMetaTitle(d.metaTitle || '');
        setMetaDescription(d.metaDescription || '');
        setKeywords(d.keywords || '');
        setOgImage(d.ogImage || '');
        setTwitterCard(d.twitterCard || 'summary_large_image');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSEO();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast('');

    // Fetch existing settings first to merge SEO
    try {
      const getRes = await fetch('/api/settings');
      const getJson = await getRes.json();
      const existingSettings = getJson.success ? getJson.data : {};

      const payload = {
        ...existingSettings,
        seo: {
          metaTitle,
          metaDescription,
          keywords,
          ogImage,
          twitterCard
        }
      };

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
        setToast('SEO properties updated successfully!');
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
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading search configurations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 animate-slideUp text-sm">
          <CheckCircle className="text-emerald-500" size={18} />
          <span>{toast}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b pb-3 border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
          <Globe size={20} className="text-slate-400" />
          <span>SEO & Metadata Manager</span>
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Search Engine Meta Title</label>
            <input 
              type="text" 
              required 
              value={metaTitle} 
              onChange={(e) => setMetaTitle(e.target.value)} 
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:bg-white" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Search Engine Meta Description</label>
            <textarea 
              rows={3} 
              required 
              value={metaDescription} 
              onChange={(e) => setMetaDescription(e.target.value)} 
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:bg-white" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keywords (Comma Separated)</label>
            <input 
              type="text" 
              value={keywords} 
              onChange={(e) => setKeywords(e.target.value)} 
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:bg-white" 
              placeholder="bapupura, sanskar bhavan, library, events, gujarat"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Open Graph Image Link (Share Thumbnail)</label>
              <input 
                type="text" 
                value={ogImage} 
                onChange={(e) => setOgImage(e.target.value)} 
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" 
                placeholder="https://example.com/share.jpg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Twitter Card Style</label>
              <select 
                value={twitterCard} 
                onChange={(e) => setTwitterCard(e.target.value)} 
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm cursor-pointer"
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
                <option value="app">App Card</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="submit" 
              disabled={saving}
              className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Apply SEO Settings'}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default SEO;
