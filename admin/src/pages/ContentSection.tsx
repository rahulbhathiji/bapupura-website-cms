import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Save, Sparkles, RefreshCw, Upload, Image as ImageIcon, 
  CheckCircle, History, RotateCcw, AlertTriangle
} from 'lucide-react';

const fixAdminUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  // Derive backend origin dynamically so it works across the LAN
  const base = (window.location.port === '3000')
    ? window.location.protocol + '//' + window.location.hostname + ':5000'
    : window.location.origin;
  return base + (url.startsWith('/') ? '' : '/') + url;
};

type SectionKey = 'hero' | 'about' | 'founder' | 'donation' | 'contact';

interface HistoryItem {
  _id: string;
  id: string;
  collectionName: string;
  recordId: string;
  snapshot: any;
  updatedBy: string;
  timestamp: string;
}

export const ContentSection: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<SectionKey>('hero');
  
  // Section states
  const [hero, setHero] = useState<any>(null);
  const [about, setAbout] = useState<any>(null);
  const [founder, setFounder] = useState<any>(null);
  const [donation, setDonation] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const fetchSection = async (section: SectionKey) => {
    try {
      const res = await fetch(`/api/content/${section}`);
      const json = await res.json();
      if (json.success) {
        if (section === 'hero') setHero(json.data);
        if (section === 'about') setAbout(json.data);
        if (section === 'founder') setFounder(json.data);
        if (section === 'donation') setDonation(json.data);
        if (section === 'contact') setContact(json.data);
      }
    } catch (e) {
      console.error(`Failed to load ${section}`, e);
    }
  };

  const fetchHistory = async (section: SectionKey) => {
    try {
      const res = await fetch(`/api/content/history/${section}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setHistoryList(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSection('hero'),
      fetchSection('about'),
      fetchSection('founder'),
      fetchSection('donation'),
      fetchSection('contact')
    ]);
    await fetchHistory(activeTab);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [token]);

  useEffect(() => {
    if (!loading) {
      fetchHistory(activeTab);
    }
  }, [activeTab, loading]);

  const handleSave = async (section: SectionKey, payload: any) => {
    setSaving(true);
    setToast('');
    try {
      const res = await fetch(`/api/content/${section}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setToast('Content saved and updated successfully!');
        if (section === 'hero') setHero(json.data);
        if (section === 'about') setAbout(json.data);
        if (section === 'founder') setFounder(json.data);
        if (section === 'donation') setDonation(json.data);
        if (section === 'contact') setContact(json.data);
        
        await fetchHistory(section);
        
        setTimeout(() => setToast(''), 3000);
      }
    } catch (e) {
      console.error('Save failed', e);
      alert('Save operation failed. Please check network connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: SectionKey, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(fieldName);
    const formData = new FormData();
    formData.append('files', file);
    formData.append('album', section.toUpperCase());

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const uploadedUrl = json.data[0].url;
        
        // Update specific states
        if (section === 'hero') {
          setHero((prev: any) => ({ ...prev, [fieldName]: uploadedUrl }));
        } else if (section === 'about') {
          setAbout((prev: any) => ({ ...prev, [fieldName]: uploadedUrl }));
        } else if (section === 'founder') {
          setFounder((prev: any) => ({ ...prev, [fieldName]: uploadedUrl }));
        } else if (section === 'donation') {
          setDonation((prev: any) => ({ ...prev, [fieldName]: uploadedUrl }));
        }
        
        setToast('Asset uploaded successfully!');
        setTimeout(() => setToast(''), 3000);
      } else {
        alert(json.message || 'File upload failed');
      }
    } catch (err) {
      console.error('File upload error', err);
      alert('File upload failed. Ensure server is online.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleRevert = async (historyId: string) => {
    if (!window.confirm('Are you sure you want to revert to this historical version? Current unsaved edits will be replaced.')) {
      return;
    }

    try {
      const res = await fetch('/api/content/history/revert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ historyId })
      });
      const json = await res.json();
      if (json.success) {
        setToast('Content successfully reverted to snapshot!');
        setTimeout(() => setToast(''), 3000);
        await loadData();
      }
    } catch (e) {
      console.error('Revert error:', e);
      alert('Revert failed');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading website contents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 animate-slideUp text-sm">
          <CheckCircle className="text-emerald-500" size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Tabs selectors */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-1 mb-6">
        {(['hero', 'about', 'founder', 'donation', 'contact'] as SectionKey[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3.5 font-semibold text-sm capitalize border-b-2 transition-all cursor-pointer ${
              activeTab === tab 
                ? 'border-sky-600 text-sky-600 dark:text-sky-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab} Section
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Editor Form Columns */}
        <div className="lg:col-span-2 space-y-6 bg-white dark:bg-slate-900 p-6 md:p-8 border border-slate-200 dark:border-slate-800 rounded-3xl">
          
          {/* TAB: HERO EDITOR */}
          {activeTab === 'hero' && hero && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-2.5 border-slate-100 dark:border-slate-800">Edit Hero Section</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tagline (Gujarati)</label>
                  <input type="text" value={hero.tagGu} onChange={(e) => setHero({ ...hero, tagGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tagline (English)</label>
                  <input type="text" value={hero.tagEn} onChange={(e) => setHero({ ...hero, tagEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Main Heading (Gujarati)</label>
                <input type="text" value={hero.headingGu} onChange={(e) => setHero({ ...hero, headingGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Main Heading (English)</label>
                <input type="text" value={hero.headingEn} onChange={(e) => setHero({ ...hero, headingEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:bg-white" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Hero Description (Gujarati)</label>
                <textarea rows={3} value={hero.descGu} onChange={(e) => setHero({ ...hero, descGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Hero Description (English)</label>
                <textarea rows={3} value={hero.descEn} onChange={(e) => setHero({ ...hero, descEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm focus:bg-white" />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Announcement Banner Alert</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Marquee Notice (Gujarati)</label>
                    <input type="text" value={hero.announcementGu} onChange={(e) => setHero({ ...hero, announcementGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Marquee Notice (English)</label>
                    <input type="text" value={hero.announcementEn} onChange={(e) => setHero({ ...hero, announcementEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={() => handleSave('hero', hero)} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer">
                  {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </div>
          )}

          {/* TAB: ABOUT EDITOR */}
          {activeTab === 'about' && about && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-2.5 border-slate-100 dark:border-slate-800">Edit About Section</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Vision Title (Gujarati)</label>
                  <input type="text" value={about.visionHeadingGu} onChange={(e) => setAbout({ ...about, visionHeadingGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Vision Title (English)</label>
                  <input type="text" value={about.visionHeadingEn} onChange={(e) => setAbout({ ...about, visionHeadingEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Vision Text (Gujarati)</label>
                <textarea rows={3} value={about.visionGu} onChange={(e) => setAbout({ ...about, visionGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Vision Text (English)</label>
                <textarea rows={3} value={about.visionEn} onChange={(e) => setAbout({ ...about, visionEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Vision Quote Block (Gujarati)</label>
                  <input type="text" value={about.quoteGu} onChange={(e) => setAbout({ ...about, quoteGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Vision Quote Block (English)</label>
                  <input type="text" value={about.quoteEn} onChange={(e) => setAbout({ ...about, quoteEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={() => handleSave('about', about)} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer">
                  {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </div>
          )}

          {/* TAB: FOUNDER EDITOR */}
          {activeTab === 'founder' && founder && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-2.5 border-slate-100 dark:border-slate-800">Edit Founder/Trustee Section</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                  {founder.photoUrl ? (
                    <img src={fixAdminUrl(founder.photoUrl)} alt="Founder" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon size={32} className="mb-2 opacity-50" />
                    </div>
                  )}
                  {uploadingField === 'photoUrl' && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Founder Photo URL</label>
                  <div className="flex gap-2">
                    <input type="text" value={founder.photoUrl} onChange={(e) => setFounder({ ...founder, photoUrl: e.target.value })} className="flex-1 px-4 py-2 bg-slate-50 border rounded-xl text-sm" placeholder="URL or upload..." />
                    <label className="bg-sky-50 text-sky-600 px-4 py-2 rounded-xl border border-sky-100 flex items-center gap-2 cursor-pointer hover:bg-sky-100 transition-colors">
                      <Upload size={16} /> Upload
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'founder', 'photoUrl')} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name (Gujarati)</label>
                  <input type="text" value={founder.nameGu} onChange={(e) => setFounder({ ...founder, nameGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name (English)</label>
                  <input type="text" value={founder.nameEn} onChange={(e) => setFounder({ ...founder, nameEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio/Message (Gujarati)</label>
                  <textarea rows={4} value={founder.bioGu} onChange={(e) => setFounder({ ...founder, bioGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio/Message (English)</label>
                  <textarea rows={4} value={founder.bioEn} onChange={(e) => setFounder({ ...founder, bioEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Achievements (Gujarati - Rich Text)</label>
                  <textarea rows={4} value={founder.achievementsGu} onChange={(e) => setFounder({ ...founder, achievementsGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Achievements (English - Rich Text)</label>
                  <textarea rows={4} value={founder.achievementsEn} onChange={(e) => setFounder({ ...founder, achievementsEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border rounded-xl text-sm" />
                </div>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Social Links</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-slate-500">Facebook URL</label><input type="text" value={founder.facebookUrl} onChange={(e) => setFounder({...founder, facebookUrl: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm" /></div>
                  <div><label className="text-xs font-bold text-slate-500">Twitter URL</label><input type="text" value={founder.twitterUrl} onChange={(e) => setFounder({...founder, twitterUrl: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm" /></div>
                  <div><label className="text-xs font-bold text-slate-500">Instagram URL</label><input type="text" value={founder.instagramUrl} onChange={(e) => setFounder({...founder, instagramUrl: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm" /></div>
                  <div><label className="text-xs font-bold text-slate-500">LinkedIn URL</label><input type="text" value={founder.linkedinUrl} onChange={(e) => setFounder({...founder, linkedinUrl: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm" /></div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={() => handleSave('founder', founder)} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer">
                  {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </div>
          )}

          {/* TAB: DONATION EDITOR */}
          {activeTab === 'donation' && donation && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-2.5 border-slate-100 dark:border-slate-800">Edit Donation Section</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Title (Gujarati)</label>
                  <input type="text" value={donation.headingGu} onChange={(e) => setDonation({ ...donation, headingGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Title (English)</label>
                  <input type="text" value={donation.headingEn} onChange={(e) => setDonation({ ...donation, headingEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Description (Gujarati)</label>
                <textarea rows={2} value={donation.descGu} onChange={(e) => setDonation({ ...donation, descGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Description (English)</label>
                <textarea rows={2} value={donation.descEn} onChange={(e) => setDonation({ ...donation, descEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Bank Details & QR Codes</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Bank Name</label>
                    <input type="text" value={donation.bankName} onChange={(e) => setDonation({ ...donation, bankName: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">A/C Holder Name</label>
                    <input type="text" value={donation.acName} onChange={(e) => setDonation({ ...donation, acName: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Account Number</label>
                    <input type="text" value={donation.acNumber} onChange={(e) => setDonation({ ...donation, acNumber: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">IFSC Code</label>
                    <input type="text" value={donation.ifsc} onChange={(e) => setDonation({ ...donation, ifsc: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">UPI ID</label>
                    <input type="text" value={donation.upiId} onChange={(e) => setDonation({ ...donation, upiId: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                  </div>
                  
                  {/* QR CODE UPLOADER */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Donation QR Code Image</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        value={donation.qrCodeUrl} 
                        onChange={(e) => setDonation({ ...donation, qrCodeUrl: e.target.value })} 
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" 
                        placeholder="/uploads/qr.png"
                      />
                      <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm">
                        <Upload size={16} />
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, 'donation', 'qrCodeUrl')}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={() => handleSave('donation', donation)} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer">
                  {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </div>
          )}

          {/* TAB: CONTACT EDITOR */}
          {activeTab === 'contact' && contact && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-2.5 border-slate-100 dark:border-slate-800">Edit Contact & Social Channels</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Phone (Gujarati Label)</label>
                  <input type="text" value={contact.phoneGu} onChange={(e) => setContact({ ...contact, phoneGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Phone (English Label)</label>
                  <input type="text" value={contact.phoneEn} onChange={(e) => setContact({ ...contact, phoneEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
                <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Address Location (Gujarati)</label>
                <textarea rows={2} value={contact.addressGu} onChange={(e) => setContact({ ...contact, addressGu: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Address Location (English)</label>
                <textarea rows={2} value={contact.addressEn} onChange={(e) => setContact({ ...contact, addressEn: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Google Maps Embed Src Link (Optional)</label>
                <input type="text" value={contact.mapsUrl} onChange={(e) => setContact({ ...contact, mapsUrl: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" placeholder="https://www.google.com/maps/embed?..." />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">WhatsApp Chat Link / Number</label>
                  <input type="text" value={contact.whatsappUrl} onChange={(e) => setContact({ ...contact, whatsappUrl: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" placeholder="+919876543210" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={() => handleSave('contact', contact)} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer">
                  {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Version History Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-800 dark:text-white text-md flex items-center gap-2 mb-4">
              <History size={18} className="text-slate-500" />
              <span>Version History</span>
            </h3>
            
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {historyList.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No snapshot backups found for this section</p>
              ) : (
                historyList.map((item) => (
                  <div key={item._id || item.id} className="border border-slate-100 dark:border-slate-850 p-3 rounded-2xl flex flex-col justify-between gap-2.5 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-800/20">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{item.updatedBy}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {item.snapshot.headingGu || item.snapshot.visionHeadingGu || item.snapshot.bankName || 'Site settings properties'}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRevert(item._id || item.id)}
                      className="w-full text-center text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 bg-sky-50 dark:bg-sky-950/20 py-1.5 rounded-xl border border-sky-100 dark:border-sky-900/50 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>Revert to this version</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-sky-500/5 border border-sky-500/10 text-sky-800 dark:text-sky-400 p-5 rounded-3xl text-xs space-y-2">
            <h4 className="font-bold flex items-center gap-1.5"><Sparkles size={14} /> Drafting Helper</h4>
            <p className="leading-relaxed">All changes written to input fields are staged locally. Clicking <strong>Save Changes</strong> triggers the version control system, creating a backup node automatically.</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ContentSection;
