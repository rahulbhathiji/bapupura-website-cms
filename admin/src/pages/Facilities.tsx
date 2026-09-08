import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, Edit2, Trash2, ArrowUp, ArrowDown, 
  CheckCircle, ToggleLeft, ToggleRight, X, AlertTriangle, Upload 
} from 'lucide-react';

interface Facility {
  _id: string;
  id: string;
  icon: string;
  titleGu: string;
  titleEn: string;
  descGu: string;
  descEn: string;
  richTextContentGu: string;
  richTextContentEn: string;
  bannerImage: string;
  galleryImages: string[];
  videos: string[];
  documents: string[];
  order: number;
  isEnabled: boolean;
}

export const Facilities: React.FC = () => {
  const { token } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Upload loading states
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // File input refs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    icon: '📚',
    titleGu: '', titleEn: '',
    descGu: '', descEn: '',
    richTextContentGu: '', richTextContentEn: '',
    bannerImage: '',
    galleryImages: '', // newline separated strings
    videos: '',
    documents: '',
    isEnabled: true
  });

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/facilities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setFacilities(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [token]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      icon: '📚', titleGu: '', titleEn: '', descGu: '', descEn: '',
      richTextContentGu: '', richTextContentEn: '', bannerImage: '',
      galleryImages: '', videos: '', documents: '', isEnabled: true
    });
    setModalOpen(true);
  };

  const openEditModal = (item: Facility) => {
    setEditingId(item._id || item.id);
    setFormData({
      icon: item.icon || '📚',
      titleGu: item.titleGu || '',
      titleEn: item.titleEn || '',
      descGu: item.descGu || '',
      descEn: item.descEn || '',
      richTextContentGu: item.richTextContentGu || '',
      richTextContentEn: item.richTextContentEn || '',
      bannerImage: item.bannerImage || '',
      galleryImages: item.galleryImages ? item.galleryImages.join('\n') : '',
      videos: item.videos ? item.videos.join('\n') : '',
      documents: item.documents ? item.documents.join('\n') : '',
      isEnabled: item.isEnabled
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this facility card? This is permanent.')) return;
    
    try {
      const res = await fetch(`/api/facilities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) fetchFacilities();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'gallery' | 'video' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'banner') setUploadingBanner(true);
    else if (type === 'gallery') setUploadingGallery(true);
    else if (type === 'video') setUploadingVideo(true);
    else if (type === 'doc') setUploadingDoc(true);

    try {
      const fd = new FormData();
      fd.append('files', file);

      // Video files use the large upload endpoint (500MB limit)
      const endpoint = type === 'video' ? '/api/media/upload-large' : '/api/media/upload';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success && data.data?.[0]) {
        const uploadedUrl = data.data[0].url;
        if (type === 'banner') {
          setFormData(prev => ({ ...prev, bannerImage: uploadedUrl }));
        } else if (type === 'gallery') {
          setFormData(prev => {
            const current = prev.galleryImages.trim();
            return { ...prev, galleryImages: current ? `${current}\n${uploadedUrl}` : uploadedUrl };
          });
        } else if (type === 'video') {
          setFormData(prev => {
            const current = prev.videos.trim();
            return { ...prev, videos: current ? `${current}\n${uploadedUrl}` : uploadedUrl };
          });
        } else if (type === 'doc') {
          setFormData(prev => {
            const current = prev.documents.trim();
            return { ...prev, documents: current ? `${current}\n${uploadedUrl}` : uploadedUrl };
          });
        }
      } else {
        alert('Upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      if (type === 'banner') setUploadingBanner(false);
      else if (type === 'gallery') setUploadingGallery(false);
      else if (type === 'video') setUploadingVideo(false);
      else if (type === 'doc') setUploadingDoc(false);

      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      galleryImages: formData.galleryImages.split('\n').map(s => s.trim()).filter(Boolean),
      videos: formData.videos.split('\n').map(s => s.trim()).filter(Boolean),
      documents: formData.documents.split('\n').map(s => s.trim()).filter(Boolean),
    };
    
    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/facilities/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/facilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      
      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        fetchFacilities();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (item: Facility) => {
    const id = item._id || item.id;
    const nextStatus = !item.isEnabled;
    try {
      const res = await fetch(`/api/facilities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isEnabled: nextStatus })
      });
      const json = await res.json();
      if (json.success) fetchFacilities();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newFacilities = [...facilities];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFacilities.length) return;
    
    const temp = newFacilities[index];
    newFacilities[index] = newFacilities[targetIndex];
    newFacilities[targetIndex] = temp;

    const updatedOrders = newFacilities.map((f, i) => ({ id: f._id || f.id, order: i }));
    setFacilities(newFacilities);

    try {
      await fetch('/api/facilities/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orders: updatedOrders })
      });
    } catch (e) {
      console.error('Failed to save priority order', e);
      fetchFacilities();
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading facilities grid...</div>;
  }

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">Manage Facilities</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control the grid blocks representing community wings</p>
        </div>
        <button onClick={openAddModal} className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer">
          <Plus size={16} /> <span>Add Facility Card</span>
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {facilities.map((item, index) => (
          <div key={item._id || item.id} className={`border rounded-3xl p-5 flex flex-col justify-between bg-white dark:bg-slate-900 ${item.isEnabled ? 'border-slate-200' : 'border-slate-200 opacity-60 border-dashed'}`}>
            <div>
              <div className="flex justify-between items-start">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex gap-1 bg-slate-50 border p-1.5 rounded-xl">
                  <button disabled={index === 0} onClick={() => handleMove(index, 'up')} className="p-1 text-slate-500 hover:text-sky-600 rounded-lg disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button disabled={index === facilities.length - 1} onClick={() => handleMove(index, 'down')} className="p-1 text-slate-500 hover:text-sky-600 rounded-lg disabled:opacity-30"><ArrowDown size={14} /></button>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-bold text-sm">{item.titleEn}</h4>
                <h4 className="text-xs font-semibold text-slate-500 mt-0.5">{item.titleGu}</h4>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3">{item.descEn}</p>
              </div>
            </div>

            <div className="flex justify-between items-center border-t mt-4 pt-3.5">
              <button onClick={() => handleToggleStatus(item)} className={`flex items-center gap-1.5 text-xs font-semibold ${item.isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                {item.isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                <span>{item.isEnabled ? 'Enabled' : 'Disabled'}</span>
              </button>

              <div className="flex gap-2">
                <button onClick={() => openEditModal(item)} className="p-1.5 bg-slate-100 hover:text-sky-600 rounded-xl"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(item._id || item.id)} className="p-1.5 bg-slate-100 hover:text-rose-600 rounded-xl"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="bg-white dark:bg-slate-900 border w-full max-w-4xl rounded-3xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Facility Card' : 'Add Facility Card'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg"><X size={18} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="facilityForm" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Emoji Icon</label>
                    <input type="text" required value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} className="w-full text-center px-2 py-2 border rounded-xl text-xl bg-white dark:bg-slate-950" />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Banner Image URL</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.bannerImage} onChange={e => setFormData({...formData, bannerImage: e.target.value})} className="flex-1 px-4 py-2 border rounded-xl text-sm bg-white dark:bg-slate-950" placeholder="Paste image URL or upload..." />
                      <input type="file" accept="image/*" ref={bannerInputRef} className="hidden" onChange={e => handleFileUpload(e, 'banner')} />
                      <button type="button" onClick={() => bannerInputRef.current?.click()} className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
                        <Upload size={12} /> {uploadingBanner ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title (Gujarati)</label>
                    <input type="text" required value={formData.titleGu} onChange={e => setFormData({...formData, titleGu: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-950" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title (English)</label>
                    <input type="text" required value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-950" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Short Description (Gujarati)</label>
                    <textarea rows={2} required value={formData.descGu} onChange={e => setFormData({...formData, descGu: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-950" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Short Description (English)</label>
                    <textarea rows={2} required value={formData.descEn} onChange={e => setFormData({...formData, descEn: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-950" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rich Text Content (Gujarati)</label>
                    <textarea rows={6} value={formData.richTextContentGu} onChange={e => setFormData({...formData, richTextContentGu: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-950" placeholder="Detailed HTML/Text for Facility Page..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rich Text Content (English)</label>
                    <textarea rows={6} value={formData.richTextContentEn} onChange={e => setFormData({...formData, richTextContentEn: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm dark:bg-slate-950" placeholder="Detailed HTML/Text for Facility Page..." />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gallery Images (One URL per line)</label>
                    <textarea rows={4} value={formData.galleryImages} onChange={e => setFormData({...formData, galleryImages: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm text-nowrap dark:bg-slate-950 font-mono mb-2" placeholder="URLs list..." />
                    <input type="file" accept="image/*" ref={galleryInputRef} className="hidden" onChange={e => handleFileUpload(e, 'gallery')} />
                    <button type="button" onClick={() => galleryInputRef.current?.click()} className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                      <Upload size={14} /> {uploadingGallery ? 'Uploading image...' : 'Upload Gallery Image'}
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Videos (One URL/File per line)</label>
                    <textarea rows={4} value={formData.videos} onChange={e => setFormData({...formData, videos: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm text-nowrap dark:bg-slate-950 font-mono mb-2" placeholder="YouTube or direct video URLs..." />
                    <input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={e => handleFileUpload(e, 'video')} />
                    <button type="button" onClick={() => videoInputRef.current?.click()} className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                      <Upload size={14} /> {uploadingVideo ? 'Uploading video...' : 'Upload Video File (Max 500MB)'}
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Documents (One URL per line)</label>
                    <textarea rows={4} value={formData.documents} onChange={e => setFormData({...formData, documents: e.target.value})} className="w-full px-4 py-2 border rounded-xl text-sm text-nowrap dark:bg-slate-950 font-mono mb-2" placeholder="PDF/doc URLs..." />
                    <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" ref={docInputRef} className="hidden" onChange={e => handleFileUpload(e, 'doc')} />
                    <button type="button" onClick={() => docInputRef.current?.click()} className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                      <Upload size={14} /> {uploadingDoc ? 'Uploading document...' : 'Upload Document File'}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input type="checkbox" checked={formData.isEnabled} onChange={e => setFormData({...formData, isEnabled: e.target.checked})} className="text-sky-600 w-4 h-4" />
                  <span className="text-sm font-semibold">Active (Show)</span>
                </label>

              </form>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-100 font-bold rounded-xl text-sm">Cancel</button>
              <button type="submit" form="facilityForm" className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default Facilities;
