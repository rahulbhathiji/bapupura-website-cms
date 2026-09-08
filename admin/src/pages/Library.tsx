import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const fixAdminUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  // Derive backend origin dynamically so it works across the LAN
  const base = (window.location.port === '3000')
    ? window.location.protocol + '//' + window.location.hostname + ':5000'
    : window.location.origin;
  return base + (url.startsWith('/') ? '' : '/') + url;
};
import { 
  Plus, Edit2, Trash2, Search, Download, Star, 
  Upload, FileText, ImageIcon, X, CheckCircle 
} from 'lucide-react';

interface Book {
  _id: string;
  id: string;
  title: string;
  author: string;
  category: string;
  pdfUrl: string;
  coverUrl: string;
  isFeatured: boolean;
  downloadCount: number;
}

export const Library: React.FC = () => {
  const { token } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('General');
  const [pdfUrl, setPdfUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = `/api/library?search=${search}&category=${categoryFilter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setBooks(json.data);
      }
      
      const catRes = await fetch('/api/library/categories');
      const catJson = await catRes.json();
      if (catJson.success) {
        setCategories(catJson.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setAuthor('');
    setCategory('General');
    setPdfUrl('');
    setCoverUrl('');
    setIsFeatured(false);
    setModalOpen(true);
  };

  const openEditModal = (item: Book) => {
    setEditingId(item._id || item.id);
    setTitle(item.title);
    setAuthor(item.author);
    setCategory(item.category);
    setPdfUrl(item.pdfUrl);
    setCoverUrl(item.coverUrl);
    setIsFeatured(item.isFeatured);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this book catalog entry? Old physical files on disk will remain unless cleared.')) return;
    try {
      const res = await fetch(`/api/library/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setBooks(prev => prev.filter(b => b._id !== id && b.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'pdf') setUploadingPdf(true);
    else setUploadingCover(true);

    const formData = new FormData();
    formData.append('files', file);
    formData.append('album', 'LIBRARY');

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const url = json.data[0].url;
        if (type === 'pdf') setPdfUrl(url);
        else setCoverUrl(url);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingPdf(false);
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfUrl) return alert('Please upload a PDF document first!');

    const payload = { title, author, category, pdfUrl, coverUrl, isFeatured };

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/library/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/library', {
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
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">Library Catalogue</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage digital PDF textbooks and study resources</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add PDF Book</span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xs flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by book title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:bg-white"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Books Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Title & Author</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Featured</th>
                <th className="px-6 py-4 text-center">Downloads</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 text-xs">Fetching library entries...</td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 text-xs">No books matching search queries</td>
                </tr>
              ) : (
                books.map(book => (
                  <tr key={book._id || book.id} className="text-slate-750 dark:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-12 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                          {book.coverUrl ? (
                            <img src={fixAdminUrl(book.coverUrl)} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <FileText size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold leading-tight text-slate-900 dark:text-white">{book.title}</p>
                          <span className="text-[11px] text-slate-500 dark:text-slate-450 mt-0.5 block">{book.author || 'Unknown Author'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {book.isFeatured ? (
                        <Star size={18} className="text-amber-500 fill-amber-500 inline" />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
                        <Download size={14} className="text-slate-400" />
                        {book.downloadCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(book)}
                          className="p-2 bg-slate-100 dark:bg-slate-850 hover:bg-sky-50 dark:hover:bg-sky-950/20 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl cursor-pointer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(book._id || book.id)}
                          className="p-2 bg-slate-100 dark:bg-slate-850 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Add/Edit Modal */}
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
              {editingId ? 'Edit Book Catalogue' : 'Add Book Entry'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Book Title</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Author</label>
                  <input 
                    type="text" 
                    value={author} 
                    onChange={(e) => setAuthor(e.target.value)} 
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                  <input 
                    type="text" 
                    required 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
                    placeholder="General"
                  />
                </div>
              </div>

              {/* FILE UPLOADERS */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PDF File Document</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      required 
                      value={pdfUrl} 
                      onChange={(e) => setPdfUrl(e.target.value)} 
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" 
                      placeholder="/uploads/file.pdf"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                      {uploadingPdf ? '...' : <Upload size={14} />}
                      <input 
                        type="file" 
                        accept="application/pdf"
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'pdf')}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cover Image (Optional)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={coverUrl} 
                      onChange={(e) => setCoverUrl(e.target.value)} 
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" 
                      placeholder="/uploads/cover.jpg"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                      {uploadingCover ? '...' : <Upload size={14} />}
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'cover')}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input 
                    type="checkbox" 
                    checked={isFeatured} 
                    onChange={(e) => setIsFeatured(e.target.checked)} 
                    className="text-sky-600 w-4 h-4 rounded"
                  />
                  <span className="text-sm font-semibold">Mark as Featured Book (Home slider / alert)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-850 font-bold rounded-xl text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Library;
