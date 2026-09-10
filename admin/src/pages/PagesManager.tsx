import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Globe, Upload, X, Image as ImageIcon, Video, FileText, Link as LinkIcon, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = '/api';

const fixAdminUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const base = (window.location.port === '3000')
    ? window.location.protocol + '//' + window.location.hostname + ':5000'
    : window.location.origin;
  return base + (url.startsWith('/') ? '' : '/') + url;
};

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const PagesManager: React.FC = () => {
  const { token } = useAuth();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'gallery' | 'videos' | 'documents' | 'links'>('content');

  const [formData, setFormData] = useState<any>({
    titleGu: '', titleEn: '', slug: '', contentGu: '', contentEn: '',
    status: 'draft', isEnabled: true, showInNav: true, bannerImage: '',
    enabledSections: {
      enableContent: true,
      enableGallery: true,
      enableVideos: true,
      enableDocuments: true,
      enableLinks: true
    },
    galleryImages: [],
    videos: [],
    documents: [],
    links: []
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

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
      setFormData({
        ...page,
        enabledSections: page.enabledSections || {
          enableContent: true,
          enableGallery: true,
          enableVideos: true,
          enableDocuments: true,
          enableLinks: true
        },
        galleryImages: page.galleryImages || [],
        videos: page.videos || [],
        documents: page.documents || [],
        links: page.links || []
      });
      setEditingId(page._id || page.id);
    } else {
      setFormData({
        titleGu: '', titleEn: '', slug: '', contentGu: '', contentEn: '',
        status: 'draft', isEnabled: true, showInNav: true, bannerImage: '',
        enabledSections: {
          enableContent: true,
          enableGallery: true,
          enableVideos: true,
          enableDocuments: true,
          enableLinks: true
        },
        galleryImages: [],
        videos: [],
        documents: [],
        links: []
      });
      setEditingId(null);
    }
    setActiveTab('content');
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

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        fd.append('files', files[i]);
      }
      const res = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success && data.data) {
        const newImgs = data.data.map((item: any) => ({
          url: item.url,
          captionGu: '',
          captionEn: ''
        }));
        setFormData((prev: any) => ({
          ...prev,
          galleryImages: [...(prev.galleryImages || []), ...newImgs]
        }));
      }
    } catch (err: any) {
      alert('Gallery upload error: ' + err.message);
    }
    setUploading(false);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        fd.append('files', files[i]);
      }
      const res = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success && data.data) {
        const newDocs = data.data.map((item: any) => ({
          titleGu: item.originalName || 'દસ્તાવેજ',
          titleEn: item.originalName || 'Document',
          url: item.url,
          fileSize: (item.size ? (item.size / (1024 * 1024)).toFixed(1) + ' MB' : '')
        }));
        setFormData((prev: any) => ({
          ...prev,
          documents: [...(prev.documents || []), ...newDocs]
        }));
      }
    } catch (err: any) {
      alert('Document upload error: ' + err.message);
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

  // Item management helpers
  const addVideo = () => {
    setFormData((prev: any) => ({
      ...prev,
      videos: [...(prev.videos || []), { url: '', titleGu: '', titleEn: '', type: 'youtube' }]
    }));
  };

  const updateVideo = (index: number, field: string, val: string) => {
    setFormData((prev: any) => {
      const vids = [...prev.videos];
      vids[index] = { ...vids[index], [field]: val };
      return { ...prev, videos: vids };
    });
  };

  const removeVideo = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      videos: prev.videos.filter((_: any, i: number) => i !== index)
    }));
  };

  const addLink = () => {
    setFormData((prev: any) => ({
      ...prev,
      links: [...(prev.links || []), { titleGu: '', titleEn: '', url: '' }]
    }));
  };

  const updateLink = (index: number, field: string, val: string) => {
    setFormData((prev: any) => {
      const lnks = [...prev.links];
      lnks[index] = { ...lnks[index], [field]: val };
      return { ...prev, links: lnks };
    });
  };

  const removeLink = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      links: prev.links.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateGalleryCaption = (index: number, field: 'captionGu' | 'captionEn', val: string) => {
    setFormData((prev: any) => {
      const imgs = [...prev.galleryImages];
      imgs[index] = { ...imgs[index], [field]: val };
      return { ...prev, galleryImages: imgs };
    });
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateDocumentTitle = (index: number, field: 'titleGu' | 'titleEn', val: string) => {
    setFormData((prev: any) => {
      const docs = [...prev.documents];
      docs[index] = { ...docs[index], [field]: val };
      return { ...prev, documents: docs };
    });
  };

  const removeDocument = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      documents: prev.documents.filter((_: any, i: number) => i !== index)
    }));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Globe className="text-sky-600" /> Custom Pages Builder
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
        <div className="text-center py-10 text-slate-500">Loading pages...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4">Title (Gu)</th>
                <th className="p-4">Title (En)</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Active Modules</th>
                <th className="p-4">Status</th>
                <th className="p-4">Nav</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {pages.map((p: any) => {
                const sec = p.enabledSections || {};
                return (
                  <tr key={p._id || p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{p.titleGu}</td>
                    <td className="p-4">{p.titleEn}</td>
                    <td className="p-4 text-sky-600 font-mono text-xs">{p.slug}</td>
                    <td className="p-4">
                      <div className="flex gap-1 text-xs">
                        {sec.enableContent !== false && <span title="Info / Text" className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">📝</span>}
                        {sec.enableGallery !== false && (p.galleryImages?.length > 0) && <span title="Photos" className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">📷 {p.galleryImages.length}</span>}
                        {sec.enableVideos !== false && (p.videos?.length > 0) && <span title="Videos" className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">🎬 {p.videos.length}</span>}
                        {sec.enableDocuments !== false && (p.documents?.length > 0) && <span title="Documents" className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">📄 {p.documents.length}</span>}
                        {sec.enableLinks !== false && (p.links?.length > 0) && <span title="Links" className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">🔗 {p.links.length}</span>}
                      </div>
                    </td>
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
                );
              })}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">No custom pages built yet. Click "Add New Page" to start.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingId ? '✏️ Edit Custom Page' : '➕ Create Custom Page'}</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure page metadata, rich content, media galleries, downloads & external links.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={22} /></button>
            </div>

            {/* Section Enable/Disable Toggles bar */}
            <div className="bg-sky-50 dark:bg-slate-800/80 px-6 py-3 border-b border-sky-100 dark:border-slate-700 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="text-sky-900 font-bold uppercase tracking-wider">Enable Page Sections:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={formData.enabledSections?.enableContent !== false}
                  onChange={e => setFormData({ ...formData, enabledSections: { ...formData.enabledSections, enableContent: e.target.checked } })}
                  className="w-4 h-4 accent-sky-600" />
                <span>📝 Information Text</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={formData.enabledSections?.enableGallery !== false}
                  onChange={e => setFormData({ ...formData, enabledSections: { ...formData.enabledSections, enableGallery: e.target.checked } })}
                  className="w-4 h-4 accent-sky-600" />
                <span>📷 Photo Gallery</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={formData.enabledSections?.enableVideos !== false}
                  onChange={e => setFormData({ ...formData, enabledSections: { ...formData.enabledSections, enableVideos: e.target.checked } })}
                  className="w-4 h-4 accent-sky-600" />
                <span>🎬 Video Gallery</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={formData.enabledSections?.enableDocuments !== false}
                  onChange={e => setFormData({ ...formData, enabledSections: { ...formData.enabledSections, enableDocuments: e.target.checked } })}
                  className="w-4 h-4 accent-sky-600" />
                <span>📄 Documents</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={formData.enabledSections?.enableLinks !== false}
                  onChange={e => setFormData({ ...formData, enabledSections: { ...formData.enabledSections, enableLinks: e.target.checked } })}
                  className="w-4 h-4 accent-sky-600" />
                <span>🔗 Useful Links</span>
              </label>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-800/40 text-xs font-bold text-slate-600 dark:text-slate-400">
              <button type="button" onClick={() => setActiveTab('content')} className={`py-3 px-4 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors ${activeTab === 'content' ? 'border-sky-600 text-sky-600' : 'border-transparent hover:text-slate-900'}`}>
                <FileText size={15} /> Page Info
              </button>
              <button type="button" onClick={() => setActiveTab('gallery')} className={`py-3 px-4 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors ${activeTab === 'gallery' ? 'border-sky-600 text-sky-600' : 'border-transparent hover:text-slate-900'}`}>
                <ImageIcon size={15} /> Photo Gallery ({formData.galleryImages?.length || 0})
              </button>
              <button type="button" onClick={() => setActiveTab('videos')} className={`py-3 px-4 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors ${activeTab === 'videos' ? 'border-sky-600 text-sky-600' : 'border-transparent hover:text-slate-900'}`}>
                <Video size={15} /> Video Gallery ({formData.videos?.length || 0})
              </button>
              <button type="button" onClick={() => setActiveTab('documents')} className={`py-3 px-4 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors ${activeTab === 'documents' ? 'border-sky-600 text-sky-600' : 'border-transparent hover:text-slate-900'}`}>
                <FileText size={15} /> Documents ({formData.documents?.length || 0})
              </button>
              <button type="button" onClick={() => setActiveTab('links')} className={`py-3 px-4 flex items-center gap-1.5 border-b-2 cursor-pointer transition-colors ${activeTab === 'links' ? 'border-sky-600 text-sky-600' : 'border-transparent hover:text-slate-900'}`}>
                <LinkIcon size={15} /> Links ({formData.links?.length || 0})
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="pageForm" onSubmit={handleSave} className="space-y-5">

                {/* TAB 1: Page Info & Content */}
                {activeTab === 'content' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Page Title (Gujarati)</label>
                        <input type="text" required value={formData.titleGu}
                          onChange={e => setFormData({ ...formData, titleGu: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Page Title (English)</label>
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
                        placeholder="e.g. digital-library, youth-activities"
                        className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm font-mono" />
                      <p className="text-xs text-slate-400 mt-1">Page URL: <code className="text-sky-600">#/page/{formData.slug || '...'}</code></p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Information / Rich Text (Gujarati)</label>
                        <textarea rows={6} value={formData.contentGu}
                          onChange={e => setFormData({ ...formData, contentGu: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Information / Rich Text (English)</label>
                        <textarea rows={6} value={formData.contentEn}
                          onChange={e => setFormData({ ...formData, contentEn: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Banner Image Header</label>
                      <div className="flex gap-2 items-center">
                        <input type="text" value={formData.bannerImage}
                          onChange={e => setFormData({ ...formData, bannerImage: e.target.value })}
                          placeholder="Paste image URL or upload file"
                          className="flex-1 border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                        <input type="file" accept="image/*" ref={bannerInputRef} onChange={handleBannerUpload} className="hidden" />
                        <button type="button" onClick={() => bannerInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-sky-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 cursor-pointer">
                          <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Banner'}
                        </button>
                      </div>
                      {formData.bannerImage && (
                        <img src={fixAdminUrl(formData.bannerImage)} alt="Banner Preview" className="mt-2 h-24 w-full object-cover rounded-lg border" />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 items-end pt-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Publish Status</label>
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
                        <label htmlFor="navShow" className="font-semibold text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Show in Main Nav</label>
                      </div>
                      <div className="flex items-center gap-2 pb-1">
                        <input type="checkbox" id="enablePage" checked={formData.isEnabled}
                          onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                          className="w-4 h-4 accent-sky-600" />
                        <label htmlFor="enablePage" className="font-semibold text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Enabled</label>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Photo Gallery */}
                {activeTab === 'gallery' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Page Photo Gallery</h3>
                        <p className="text-xs text-slate-400">Upload multiple photos and add captions in Gujarati & English.</p>
                      </div>
                      <input type="file" multiple accept="image/*" ref={galleryInputRef} onChange={handleGalleryUpload} className="hidden" />
                      <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer">
                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Add Photos'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formData.galleryImages?.map((img: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-3">
                          <img src={fixAdminUrl(img.url)} alt="Gallery" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                          <div className="flex-1 space-y-2">
                            <input type="text" value={img.captionGu || ''} onChange={e => updateGalleryCaption(idx, 'captionGu', e.target.value)} placeholder="કેપ્શન (ગુજરાતી)" className="w-full text-xs p-1.5 border rounded outline-none dark:bg-slate-700 dark:border-slate-600" />
                            <input type="text" value={img.captionEn || ''} onChange={e => updateGalleryCaption(idx, 'captionEn', e.target.value)} placeholder="Caption (English)" className="w-full text-xs p-1.5 border rounded outline-none dark:bg-slate-700 dark:border-slate-600" />
                          </div>
                          <button type="button" onClick={() => removeGalleryImage(idx)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      {(!formData.galleryImages || formData.galleryImages.length === 0) && (
                        <div className="col-span-2 text-center py-10 text-slate-400 text-xs">No gallery photos added to this page yet.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: Video Gallery */}
                {activeTab === 'videos' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Page Video Gallery</h3>
                        <p className="text-xs text-slate-400">Add YouTube or video URLs. YouTube video thumbnails will be automatically rendered.</p>
                      </div>
                      <button type="button" onClick={addVideo} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer">
                        <Plus size={14} /> Add Video
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.videos?.map((vid: any, idx: number) => {
                        const ytId = getYouTubeId(vid.url);
                        const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
                        return (
                          <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex gap-4 items-start">
                            {ytThumb ? (
                              <div className="relative w-28 h-20 bg-black rounded-lg overflow-hidden border border-slate-300">
                                <img src={ytThumb} alt="YouTube Thumbnail" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold text-lg">▶</div>
                              </div>
                            ) : (
                              <div className="w-28 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 text-xs font-bold">
                                {vid.url ? 'Direct Video' : 'No Thumbnail'}
                              </div>
                            )}

                            <div className="flex-1 space-y-2">
                              <input type="text" value={vid.url || ''} onChange={e => updateVideo(idx, 'url', e.target.value)} placeholder="YouTube or Video File URL (e.g. https://www.youtube.com/watch?v=...)" className="w-full text-xs p-2 border rounded-lg outline-none font-mono dark:bg-slate-700 dark:border-slate-600" />
                              <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={vid.titleGu || ''} onChange={e => updateVideo(idx, 'titleGu', e.target.value)} placeholder="વિડિઓ શીર્ષક (ગુજરાતી)" className="w-full text-xs p-1.5 border rounded outline-none dark:bg-slate-700 dark:border-slate-600" />
                                <input type="text" value={vid.titleEn || ''} onChange={e => updateVideo(idx, 'titleEn', e.target.value)} placeholder="Video Title (English)" className="w-full text-xs p-1.5 border rounded outline-none dark:bg-slate-700 dark:border-slate-600" />
                              </div>
                            </div>
                            <button type="button" onClick={() => removeVideo(idx)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer"><Trash2 size={16} /></button>
                          </div>
                        );
                      })}
                      {(!formData.videos || formData.videos.length === 0) && (
                        <div className="text-center py-10 text-slate-400 text-xs">No videos added to this page yet. Click "Add Video" above.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: Documents */}
                {activeTab === 'documents' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Downloadable Documents</h3>
                        <p className="text-xs text-slate-400">Upload PDF/Docs for visitors to view and download.</p>
                      </div>
                      <input type="file" multiple ref={documentInputRef} onChange={handleDocumentUpload} className="hidden" />
                      <button type="button" onClick={() => documentInputRef.current?.click()} disabled={uploading} className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer">
                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Document'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.documents?.map((doc: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                          <div className="text-2xl">📄</div>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <input type="text" value={doc.titleGu || ''} onChange={e => updateDocumentTitle(idx, 'titleGu', e.target.value)} placeholder="દસ્તાવેજ શીર્ષક (ગુજરાતી)" className="text-xs p-1.5 border rounded outline-none dark:bg-slate-700 dark:border-slate-600" />
                            <input type="text" value={doc.titleEn || ''} onChange={e => updateDocumentTitle(idx, 'titleEn', e.target.value)} placeholder="Document Title (English)" className="text-xs p-1.5 border rounded outline-none dark:bg-slate-700 dark:border-slate-600" />
                          </div>
                          <button type="button" onClick={() => removeDocument(idx)} className="text-red-500 hover:text-red-700 p-1 cursor-pointer"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      {(!formData.documents || formData.documents.length === 0) && (
                        <div className="text-center py-10 text-slate-400 text-xs">No documents attached to this page yet.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: Links */}
                {activeTab === 'links' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Useful External Links</h3>
                        <p className="text-xs text-slate-400">Add useful web resources and external link buttons.</p>
                      </div>
                      <button type="button" onClick={addLink} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer">
                        <Plus size={14} /> Add Link
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.links?.map((lnk: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                          <input type="text" value={lnk.url || ''} onChange={e => updateLink(idx, 'url', e.target.value)} placeholder="Target URL (e.g. https://digitalindia.gov.in)" className="w-full text-xs p-2 border rounded-lg outline-none font-mono dark:bg-slate-700 dark:border-slate-600" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="text" value={lnk.titleGu || ''} onChange={e => updateLink(idx, 'titleGu', e.target.value)} placeholder="લિંક શીર્ષક (ગુજરાતી)" className="w-full text-xs p-1.5 border rounded outline-none dark:bg-slate-700 dark:border-slate-600" />
                            <input type="text" value={lnk.titleEn || ''} onChange={e => updateLink(idx, 'titleEn', e.target.value)} placeholder="Link Title (English)" className="w-full text-xs p-1.5 border rounded outline-none dark:bg-slate-700 dark:border-slate-600" />
                          </div>
                          <div className="text-right">
                            <button type="button" onClick={() => removeLink(idx)} className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer">Remove Link</button>
                          </div>
                        </div>
                      ))}
                      {(!formData.links || formData.links.length === 0) && (
                        <div className="text-center py-10 text-slate-400 text-xs">No external links added yet. Click "Add Link" above.</div>
                      )}
                    </div>
                  </div>
                )}

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
