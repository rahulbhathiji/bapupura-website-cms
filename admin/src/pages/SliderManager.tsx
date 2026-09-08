import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, Upload, X } from 'lucide-react';
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

export const SliderManager: React.FC = () => {
  const { token } = useAuth();
  const [sliders, setSliders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState('hero');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    section: 'hero', imageUrl: '', titleGu: '', titleEn: '',
    subtitleGu: '', subtitleEn: '', isEnabled: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchSliders(); }, [currentSection]);

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sliders?section=${currentSection}`);
      const data = await res.json();
      if (data.success) setSliders(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openModal = (slider: any = null) => {
    if (slider) {
      setFormData(slider);
      setEditingId(slider._id || slider.id);
    } else {
      setFormData({ section: currentSection, imageUrl: '', titleGu: '', titleEn: '', subtitleGu: '', subtitleEn: '', isEnabled: true });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (data.success && data.data?.[0]) {
        setFormData((prev: any) => ({ ...prev, imageUrl: data.data[0].url }));
      } else {
        alert('Upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    }
    setUploading(false);
    if (imgInputRef.current) imgInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/sliders${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) { setIsModalOpen(false); fetchSliders(); }
      else alert(data.message);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this slide?')) return;
    try {
      const res = await fetch(`${API_BASE}/sliders/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) fetchSliders();
    } catch (e) { console.error(e); }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newSliders = [...sliders];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSliders.length) return;
    [newSliders[index], newSliders[targetIndex]] = [newSliders[targetIndex], newSliders[index]];
    const updatedOrders = newSliders.map((s, i) => ({ id: s._id || s.id, order: i }));
    setSliders(newSliders);
    try {
      await fetch(`${API_BASE}/sliders/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orders: updatedOrders })
      });
    } catch (e) { fetchSliders(); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ImageIcon className="text-sky-600" /> Background Sliders
        </h1>
        <div className="flex gap-2">
          <select value={currentSection} onChange={e => setCurrentSection(e.target.value)}
            className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 outline-none text-sm">
            <option value="hero">Hero Section</option>
            <option value="about">About Section</option>
          </select>
          <button onClick={() => openModal()} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 cursor-pointer transition-colors">
            <Plus size={18} /> Add Slide
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sliders.map((s: any, index: number) => (
            <div key={s._id || s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                {s.imageUrl ? (
                  <img src={fixAdminUrl(s.imageUrl)} className="w-full h-full object-cover" alt="slide" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 flex-col gap-2">
                    <ImageIcon size={32} />
                    <span className="text-sm">No Image</span>
                  </div>
                )}
                {!s.isEnabled && (
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white font-bold tracking-widest backdrop-blur-sm">DISABLED</div>
                )}
              </div>
              <div className="p-4 flex-1">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{s.titleEn || '(No English Title)'}</h4>
                <h4 className="font-semibold text-slate-500 text-xs mb-2">{s.titleGu || '(No Gujarati Title)'}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{s.subtitleEn}</p>
              </div>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div className="flex gap-1">
                  <button disabled={index === 0} onClick={() => handleMove(index, 'up')} className="p-1 text-slate-500 hover:text-sky-600 disabled:opacity-30 cursor-pointer"><ArrowUp size={16} /></button>
                  <button disabled={index === sliders.length - 1} onClick={() => handleMove(index, 'down')} className="p-1 text-slate-500 hover:text-sky-600 disabled:opacity-30 cursor-pointer"><ArrowDown size={16} /></button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(s)} className="p-1.5 text-sky-600 bg-sky-50 dark:bg-slate-800 rounded hover:bg-sky-100 cursor-pointer"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(s._id || s.id)} className="p-1.5 text-red-600 bg-red-50 dark:bg-slate-800 rounded hover:bg-red-100 cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          {sliders.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              No slider images for {currentSection} section. Click "Add Slide" to create one.
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingId ? '✏️ Edit Slide' : '➕ New Slide'} — {currentSection}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={22} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="sliderForm" onSubmit={handleSave} className="space-y-5">

                {/* Image Preview + Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Slide Background Image</label>
                  <div className="w-full h-48 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden relative bg-slate-50 dark:bg-slate-800 mb-2">
                    {formData.imageUrl ? (
                      <img src={fixAdminUrl(formData.imageUrl)} className="w-full h-full object-cover" alt="Slide preview" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                        <ImageIcon size={36} />
                        <span className="text-sm">No image selected</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={formData.imageUrl}
                      onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Paste image URL..."
                      className="flex-1 border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                    <input type="file" accept="image/*" ref={imgInputRef} onChange={handleImageUpload} className="hidden" />
                    <button type="button" onClick={() => imgInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 transition-colors whitespace-nowrap">
                      <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Title (Gujarati)</label>
                    <input type="text" value={formData.titleGu} onChange={e => setFormData({ ...formData, titleGu: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Title (English)</label>
                    <input type="text" value={formData.titleEn} onChange={e => setFormData({ ...formData, titleEn: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Subtitle (Gujarati)</label>
                    <textarea rows={2} value={formData.subtitleGu} onChange={e => setFormData({ ...formData, subtitleGu: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Subtitle (English)</label>
                    <textarea rows={2} value={formData.subtitleEn} onChange={e => setFormData({ ...formData, subtitleEn: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isEnabled" checked={formData.isEnabled}
                    onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                    className="w-4 h-4 accent-sky-600 cursor-pointer" />
                  <label htmlFor="isEnabled" className="font-semibold text-sm cursor-pointer">Slide is Active (visible on website)</label>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer transition-colors">Cancel</button>
              <button type="submit" form="sliderForm" className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium shadow cursor-pointer transition-colors">
                {editingId ? 'Save Changes' : 'Add Slide'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
