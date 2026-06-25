import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Upload, Search, Folder, Trash2, Edit2, 
  Copy, Check, RefreshCw, Grid, List, X, FileText 
} from 'lucide-react';

interface MediaItem {
  _id: string;
  id: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  album: string;
  createdAt: string;
}

export const MediaLibrary: React.FC = () => {
  const { token } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [albumFilter, setAlbumFilter] = useState('');

  // Actions states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Rename modal states
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newAlbum, setNewAlbum] = useState('');

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const url = `/api/media?album=${albumFilter}&search=${search}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setMedia(json.data);
      }

      const albRes = await fetch('/api/media/albums', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const albJson = await albRes.json();
      if (albJson.success) {
        setAlbums(albJson.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [albumFilter, search, token]);

  const handleCopyLink = (item: MediaItem) => {
    // Generate full URL
    const fullUrl = window.location.origin + item.url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item._id || item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUploadFiles = async (files: FileList) => {
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('album', albumFilter || 'General');

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        fetchMedia();
      } else {
        alert(json.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this file permanently from disk? References in pages will break.')) return;
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setMedia(prev => prev.filter(m => m._id !== id && m.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Replace the active file asset on the server? Current URL remains identical.')) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/media/replace/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        fetchMedia();
      }
    } catch (err) {
      console.error(err);
      alert('Replacement failed');
    }
  };

  const openRenameModal = (item: MediaItem) => {
    setRenameId(item._id || item.id);
    setNewName(item.originalName);
    setNewAlbum(item.album);
    setRenameModalOpen(true);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/media/${renameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ originalName: newName, album: newAlbum })
      });
      const json = await res.json();
      if (json.success) {
        setRenameModalOpen(false);
        fetchMedia();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Media Library</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upload images, icons, and PDF document files. Reusable across sections.</p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <form 
        onDragEnter={handleDrag} 
        onDragOver={handleDrag} 
        onDragLeave={handleDrag} 
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-10 text-center flex flex-col justify-center items-center gap-3 transition-all ${
          dragActive 
            ? 'border-sky-600 bg-sky-500/5' 
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        <div className="bg-sky-50 dark:bg-sky-950/20 p-4 rounded-full text-sky-600 dark:text-sky-400">
          <Upload size={32} />
        </div>
        <div>
          <p className="font-bold text-slate-800 dark:text-white">Drag & Drop files here, or click to upload</p>
          <p className="text-xs text-slate-500 mt-1">Accepts images and PDF files up to 10MB</p>
        </div>
        <label className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer">
          {uploading ? 'Uploading...' : 'Browse Local Files'}
          <input 
            type="file" 
            multiple 
            className="hidden" 
            onChange={(e) => e.target.files && handleUploadFiles(e.target.files)} 
          />
        </label>
      </form>

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search files by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
          />
        </div>
        <div className="flex gap-3">
          <select
            value={albumFilter}
            onChange={(e) => setAlbumFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none cursor-pointer"
          >
            <option value="">All Albums</option>
            {albums.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Media Grid Cards */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Fetching media database...</div>
      ) : media.length === 0 ? (
        <div className="text-center py-20 text-slate-500 text-xs">No media files found in this collection.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map(item => {
            const isPdf = item.filename.endsWith('.pdf');
            return (
              <div 
                key={item._id || item.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group"
              >
                {/* Visual Thumbnail */}
                <div className="aspect-square bg-slate-100 dark:bg-slate-850 relative flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                  {isPdf ? (
                    <div className="flex flex-col items-center text-slate-400">
                      <FileText size={40} className="text-rose-500" />
                      <span className="text-[10px] font-bold mt-1 uppercase">PDF File</span>
                    </div>
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover" alt="" />
                  )}

                  {/* Absolute floating quick actions */}
                  <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleCopyLink(item)}
                      className="p-2 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-600 rounded-xl cursor-pointer"
                      title="Copy full URL"
                    >
                      {copiedId === (item._id || item.id) ? <Check size={14} className="text-emerald-600 animate-scale" /> : <Copy size={14} />}
                    </button>
                    
                    <button 
                      onClick={() => openRenameModal(item)}
                      className="p-2 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-600 rounded-xl cursor-pointer"
                      title="Rename / Move"
                    >
                      <Edit2 size={14} />
                    </button>

                    <label className="p-2 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-600 rounded-xl cursor-pointer" title="Replace file">
                      <RefreshCw size={14} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept={isPdf ? 'application/pdf' : 'image/*'}
                        onChange={(e) => handleReplaceFile(e, item._id || item.id)} 
                      />
                    </label>

                    <button 
                      onClick={() => handleDelete(item._id || item.id)}
                      className="p-2 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-xl cursor-pointer"
                      title="Delete permanent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Footer labels */}
                <div className="p-2 text-left">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-white truncate" title={item.originalName}>{item.originalName}</p>
                  <div className="flex justify-between items-center mt-1 text-[9px] text-slate-500">
                    <span>{formatBytes(item.size)}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-1 rounded-sm">{item.album}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rename & Re-album Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-fadeIn">
            <button 
              onClick={() => setRenameModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Edit File Metadata</h3>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Custom Filename</label>
                <input 
                  type="text" 
                  required 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Move to Album (Category)</label>
                <input 
                  type="text" 
                  required 
                  value={newAlbum} 
                  onChange={(e) => setNewAlbum(e.target.value)} 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xs" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setRenameModalOpen(false)} className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-850 font-bold rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-md">Apply Info</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MediaLibrary;
