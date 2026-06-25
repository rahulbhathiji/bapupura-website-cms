import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, Edit2, Trash2, Pin, AlertCircle, 
  FileText, Upload, Calendar, X 
} from 'lucide-react';

interface Notice {
  _id: string;
  id: string;
  titleGu: string;
  titleEn: string;
  categoryGu: string;
  categoryEn: string;
  pdfUrl: string;
  fileSize: string;
  expiryDate: string;
  isPinned: boolean;
  isUrgent: boolean;
  createdAt: string;
}

export const Notices: React.FC = () => {
  const { token } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [titleGu, setTitleGu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [categoryGu, setCategoryGu] = useState('જાહેરાત');
  const [categoryEn, setCategoryEn] = useState('Notice');
  const [pdfUrl, setPdfUrl] = useState('');
  const [fileSize, setFileSize] = useState('1.0 MB');
  const [expiryDate, setExpiryDate] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  
  const [uploading, setUploading] = useState(false);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setNotices(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [token]);

  const openAddModal = () => {
    setEditingId(null);
    setTitleGu('');
    setTitleEn('');
    setCategoryGu('જાહેરાત');
    setCategoryEn('Notice');
    setPdfUrl('');
    setFileSize('1.0 MB');
    setExpiryDate('');
    setIsPinned(false);
    setIsUrgent(false);
    setModalOpen(true);
  };

  const openEditModal = (item: Notice) => {
    setEditingId(item._id || item.id);
    setTitleGu(item.titleGu);
    setTitleEn(item.titleEn);
    setCategoryGu(item.categoryGu);
    setCategoryEn(item.categoryEn);
    setPdfUrl(item.pdfUrl);
    setFileSize(item.fileSize);
    setExpiryDate(item.expiryDate || '');
    setIsPinned(item.isPinned);
    setIsUrgent(item.isUrgent);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notice circular?')) return;
    try {
      const res = await fetch(`/api/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setNotices(prev => prev.filter(n => n._id !== id && n.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('files', file);
    formData.append('album', 'NOTICES');

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setPdfUrl(json.data[0].url);
        // Convert bytes to formatted MB
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setFileSize(`${sizeMb} MB`);
      }
    } catch (err) {
      console.error(err);
      alert('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfUrl) return alert('PDF file link/upload is required!');

    const payload = { 
      titleGu, titleEn, categoryGu, categoryEn, 
      pdfUrl, fileSize, expiryDate, isPinned, isUrgent 
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/notices/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/notices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }
      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        fetchNotices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Trigger */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">Announcements Board</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Publish circular PDFs, marquee updates, and critical deadlines</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Publish Notice circular</span>
        </button>
      </div>

      {/* Notices List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading ? (
            <div className="text-center py-10 text-slate-500 text-xs">Loading notice archives...</div>
          ) : notices.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">No active notices published yet.</div>
          ) : (
            notices.map(item => (
              <div 
                key={item._id || item.id} 
                className={`p-5 flex flex-wrap justify-between items-center gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-850/10 ${
                  item.isPinned ? 'bg-amber-50/15 dark:bg-amber-950/5' : ''
                }`}
              >
                <div className="flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <span className="bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                      {item.categoryEn}
                    </span>
                    {item.isPinned && (
                      <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                        <Pin size={10} className="fill-amber-500 text-amber-500" /> Pinned
                      </span>
                    )}
                    {item.isUrgent && (
                      <span className="bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/50 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 uppercase tracking-wider animate-pulse">
                        <AlertCircle size={10} /> Urgent
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-bold text-slate-850 dark:text-white mt-2 leading-snug">{item.titleEn}</h4>
                  <h4 className="text-xs font-semibold text-slate-500 mt-0.5">{item.titleGu}</h4>
                  
                  <div className="flex gap-4 mt-3.5 text-xs text-slate-500 font-medium">
                    <span>File size: <strong className="text-slate-700 dark:text-slate-350">{item.fileSize}</strong></span>
                    {item.expiryDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Expires: {new Date(item.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a 
                    href={item.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/20 text-slate-650 dark:text-slate-355 hover:text-sky-650 dark:hover:text-sky-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <FileText size={14} />
                    <span>View PDF</span>
                  </a>
                  
                  <button 
                    onClick={() => openEditModal(item)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/20 text-slate-650 dark:text-slate-355 hover:text-sky-600 dark:hover:text-sky-450 rounded-xl cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(item._id || item.id)}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-655 dark:text-slate-355 hover:text-rose-600 dark:hover:text-rose-455 rounded-xl cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notice Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
              {editingId ? 'Edit Announcement circular' : 'Publish Notice circular'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notice Heading (English)</label>
                <input type="text" required value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notice Heading (Gujarati)</label>
                <input type="text" required value={titleGu} onChange={(e) => setTitleGu(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category (English)</label>
                  <input type="text" required value={categoryEn} onChange={(e) => setCategoryEn(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category (Gujarati)</label>
                  <input type="text" required value={categoryGu} onChange={(e) => setCategoryGu(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* PDF UPLOADER */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Attach PDF Document</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      required 
                      value={pdfUrl} 
                      onChange={(e) => setPdfUrl(e.target.value)} 
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" 
                      placeholder="/uploads/circular.pdf"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                      {uploading ? '...' : <Upload size={14} />}
                      <input 
                        type="file" 
                        accept="application/pdf"
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date (Optional)</label>
                  <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
              </div>

              <div className="flex gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="text-sky-600 w-4 h-4 rounded" />
                  <span className="text-sm font-semibold">Pin Notice (Stick to top)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="text-sky-600 w-4 h-4 rounded" />
                  <span className="text-sm font-semibold">Urgent Warning (Blinking Badge)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-850 font-bold rounded-xl text-sm cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer">Save Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Notices;
