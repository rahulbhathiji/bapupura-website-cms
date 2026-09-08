import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Globe, Upload, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = '/api';

const fixAdminUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  // Derive backend origin dynamically so it works across the LAN
  const base = (window.location.port === '3000')
    ? window.location.protocol + '//' + window.location.hostname + ':5000'
    : window.location.origin;
  return base + (url.startsWith('/') ? '' : '/') + url;
};

export const PagesManager: React.FC = () => {
  const { token } = useAuth();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    titleGu: '', titleEn: '', slug: '', contentGu: '', contentEn: '',
    status: 'draft', isEnabled: true, showInNav: true, bannerImage: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pages`);
      const data = await res.json();
      if (data.success) {
        setPages(data.data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openModal = (page: any = null) => {
    if (page) {
      setFormData(page);
      setEditingId(page._id || page.id);
    } else {
      setFormData({
        titleGu: '', titleEn: '', slug: '', contentGu: '', contentEn: '',
        status: 'draft', isEnabled: true, showInNav: true, bannerImage: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success && data.data && data.data[0]) {
        setFormData((prev: any) => ({ ...prev, bannerImage: data.data[0].url }));
      } else {
        alert('Upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    }
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('You are not logged in. Please log in again.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/pages${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchPages();
      } else {
        alert(data.message || 'Failed to save page.');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    if (!token) { alert('Not logged in.'); return; }
    try {
      const res = await fetch(`${API_BASE}/pages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) fetchPages();
      else alert(data.message || 'Delete failed.');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const autoSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Globe className="text-sky-600" /> Custom Pages
        </h1>
        <button onClick={() => openModal()} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 cursor-pointer transition-colors">
          <Plus size={18} /> Add New Page
        </button>
      </div>

      {!token && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-medium">
          ⚠️ Session may have expired. Please log out and log in again to make changes.
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Title (Gu)</th>
                <th className="p-4">Title (En)</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Status</th>
                <th className="p-4">Nav</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {pages.map((p: any) => (
                <tr key={p._id || p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{p.titleGu}</td>
                  <td className="p-4">{p.titleEn}</td>
                  <td className="p-4 text-sky-600 font-mono text-xs">{p.slug}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4">{p.showInNav ? '✅' : '—'}</td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => openModal(p)} className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p._id || p.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No pages yet. Click "Add New Page" to create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingId ? '✏️ Edit Page' : '➕ New Page'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={22} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="pageForm" onSubmit={handleSave} className="space-y-5">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Title (Gujarati)</label>
                    <input type="text" required value={formData.titleGu}
                      onChange={e => setFormData({ ...formData, titleGu: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Title (English)</label>
                    <input type="text" required value={formData.titleEn}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({ ...formData, titleEn: val, slug: editingId ? formData.slug : autoSlug(val) });
                      }}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">URL Slug</label>
                  <input type="text" required value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. our-history, library-rules"
                    className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm font-mono" />
                  <p className="text-xs text-slate-400 mt-1">Will be accessible at: <code className="text-sky-600">http://localhost:8080/#/page/{formData.slug || '...'}</code></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Content (Gujarati)</label>
                    <textarea rows={6} value={formData.contentGu}
                      onChange={e => setFormData({ ...formData, contentGu: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Content (English)</label>
                    <textarea rows={6} value={formData.contentEn}
                      onChange={e => setFormData({ ...formData, contentEn: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Banner Image</label>
                  <div className="flex gap-2 items-center">
                    <input type="text" value={formData.bannerImage}
                      onChange={e => setFormData({ ...formData, bannerImage: e.target.value })}
                      placeholder="Paste image URL or upload below"
                      className="flex-1 border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                    <input type="file" accept="image/*" ref={bannerInputRef} onChange={handleBannerUpload} className="hidden" />
                    <button type="button" onClick={() => bannerInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-lg text-sm font-medium text-slate-600 hover:text-sky-700 transition-colors cursor-pointer disabled:opacity-50">
                      <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                  {formData.bannerImage && (
                    <img src={fixAdminUrl(formData.bannerImage)} alt="Preview" className="mt-2 h-24 w-full object-cover rounded-lg border" />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 outline-none text-sm">
                      <option value="draft">📝 Draft</option>
                      <option value="published">✅ Published</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <input type="checkbox" id="navShow" checked={formData.showInNav}
                      onChange={e => setFormData({ ...formData, showInNav: e.target.checked })}
                      className="w-4 h-4 accent-sky-600" />
                    <label htmlFor="navShow" className="font-semibold text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Show in Navigation</label>
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <input type="checkbox" id="enablePage" checked={formData.isEnabled}
                      onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                      className="w-4 h-4 accent-sky-600" />
                    <label htmlFor="enablePage" className="font-semibold text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Enabled</label>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer transition-colors">Cancel</button>
              <button type="submit" form="pageForm" className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium shadow cursor-pointer transition-colors">
                {editingId ? 'Save Changes' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
