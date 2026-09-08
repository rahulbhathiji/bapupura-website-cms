import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Image as ImageIcon, Video, FolderPlus, 
  Search, Eye, EyeOff, Star, X, Upload, Calendar, Tag, ExternalLink,
  ChevronRight, CheckCircle2, Film
} from 'lucide-react';
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

interface PhotoItem {
  url: string;
  captionGu?: string;
  captionEn?: string;
}

interface VideoItem {
  url: string;
  titleGu?: string;
  titleEn?: string;
  type?: 'youtube' | 'file';
}

interface GalleryAlbum {
  _id?: string;
  id?: string;
  titleGu: string;
  titleEn: string;
  category: string;
  date: string;
  descGu?: string;
  descEn?: string;
  coverImage?: string;
  photos: PhotoItem[];
  videos: VideoItem[];
  isFeatured: boolean;
  isEnabled: boolean;
  order: number;
  createdAt?: string;
}

const PRESET_CATEGORIES = [
  'Cultural',
  'Education',
  'Agriculture',
  'Social',
  'Health',
  'Workshops',
  'Sports',
  'General'
];

export const GalleryManager: React.FC = () => {
  const { token } = useAuth();
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'videos'>('info');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<GalleryAlbum>({
    titleGu: '',
    titleEn: '',
    category: 'Cultural',
    date: new Date().toISOString().split('T')[0],
    descGu: '',
    descEn: '',
    coverImage: '',
    photos: [],
    videos: [],
    isFeatured: false,
    isEnabled: true,
    order: 0
  });

  // Custom Category Input
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);

  // New Video Input State
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitleGu, setNewVideoTitleGu] = useState('');
  const [newVideoTitleEn, setNewVideoTitleEn] = useState('');

  // Upload States
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideoFile, setUploadingVideoFile] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/gallery?all=true`);
      const json = await res.json();
      if (json.success) {
        setAlbums(json.data || []);
      }
    } catch (e) {
      console.error('Fetch gallery error:', e);
    } finally {
      setLoading(false);
    }
  };

  const allCategories = Array.from(
    new Set(['All', ...PRESET_CATEGORIES, ...albums.map(a => a.category).filter(Boolean)])
  );

  const filteredAlbums = albums.filter(a => {
    const matchesCat = selectedCategory === 'All' || a.category.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      a.titleGu.toLowerCase().includes(q) ||
      a.titleEn.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const openModal = (album: GalleryAlbum | null = null) => {
    if (album) {
      setEditingId(album._id || album.id || null);
      setFormData({
        titleGu: album.titleGu || '',
        titleEn: album.titleEn || '',
        category: album.category || 'General',
        date: album.date || new Date().toISOString().split('T')[0],
        descGu: album.descGu || '',
        descEn: album.descEn || '',
        coverImage: album.coverImage || '',
        photos: album.photos || [],
        videos: album.videos || [],
        isFeatured: !!album.isFeatured,
        isEnabled: album.isEnabled !== false,
        order: album.order || 0
      });
      if (!PRESET_CATEGORIES.includes(album.category)) {
        setIsCustomCat(true);
        setCustomCategory(album.category);
      } else {
        setIsCustomCat(false);
        setCustomCategory('');
      }
    } else {
      setEditingId(null);
      setFormData({
        titleGu: '',
        titleEn: '',
        category: 'Cultural',
        date: new Date().toISOString().split('T')[0],
        descGu: '',
        descEn: '',
        coverImage: '',
        photos: [],
        videos: [],
        isFeatured: false,
        isEnabled: true,
        order: albums.length + 1
      });
      setIsCustomCat(false);
      setCustomCategory('');
    }
    setActiveTab('info');
    setNewVideoUrl('');
    setNewVideoTitleGu('');
    setNewVideoTitleEn('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleGu || !formData.titleEn) {
      alert('Please fill both Gujarati and English titles.');
      return;
    }

    const payload = {
      ...formData,
      category: isCustomCat && customCategory.trim() ? customCategory.trim() : formData.category,
      coverImage: formData.coverImage || (formData.photos[0] ? formData.photos[0].url : '')
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API_BASE}/gallery/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/gallery`, {
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
        setIsModalOpen(false);
        fetchAlbums();
      } else {
        alert(json.message || 'Save failed');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving album');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event album?')) return;
    try {
      const res = await fetch(`${API_BASE}/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        fetchAlbums();
      } else {
        alert(json.message || 'Delete failed');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error deleting album');
    }
  };

  const handleToggleEnable = async (album: GalleryAlbum) => {
    const id = album._id || album.id;
    if (!id) return;
    try {
      await fetch(`${API_BASE}/gallery/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isEnabled: !album.isEnabled })
      });
      fetchAlbums();
    } catch (e) {
      console.error(e);
    }
  };

  // Upload Cover Image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      fd.append('album', 'Gallery_Covers');
      const res = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success && data.data?.[0]?.url) {
        setFormData(prev => ({ ...prev, coverImage: data.data[0].url }));
      }
    } catch (err) {
      console.error('Cover upload error:', err);
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload Multiple Photos
  const handleMultiplePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        fd.append('files', files[i]);
      }
      fd.append('album', `Gallery_${formData.titleEn || 'Event'}`);
      const res = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const newPhotos: PhotoItem[] = data.data.map((m: any) => ({
          url: m.url,
          captionGu: '',
          captionEn: ''
        }));
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, ...newPhotos],
          coverImage: prev.coverImage || (newPhotos[0] ? newPhotos[0].url : '')
        }));
      }
    } catch (err) {
      console.error('Photos upload error:', err);
    } finally {
      setUploadingPhotos(false);
      if (photosInputRef.current) photosInputRef.current.value = '';
    }
  };

  // Add YouTube Video
  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    let url = newVideoUrl.trim();
    let type: 'youtube' | 'file' = 'youtube';

    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      type = 'file';
    }

    const newVid: VideoItem = {
      url,
      titleGu: newVideoTitleGu.trim() || 'ઇવેન્ટ વિડિઓ',
      titleEn: newVideoTitleEn.trim() || 'Event Video',
      type
    };

    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, newVid]
    }));

    setNewVideoUrl('');
    setNewVideoTitleGu('');
    setNewVideoTitleEn('');
  };

  // Upload Video File
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideoFile(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      fd.append('album', 'Gallery_Videos');
      const res = await fetch(`${API_BASE}/media/upload-large`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (data.success && data.data?.[0]?.url) {
        const newVid: VideoItem = {
          url: data.data[0].url,
          titleGu: newVideoTitleGu.trim() || file.name,
          titleEn: newVideoTitleEn.trim() || file.name,
          type: 'file'
        };
        setFormData(prev => ({ ...prev, videos: [...prev.videos, newVid] }));
        setNewVideoTitleGu('');
        setNewVideoTitleEn('');
      }
    } catch (err) {
      console.error('Video file upload error:', err);
    } finally {
      setUploadingVideoFile(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const updatePhotoCaption = (index: number, lang: 'gu' | 'en', text: string) => {
    setFormData(prev => {
      const updated = [...prev.photos];
      if (updated[index]) {
        if (lang === 'gu') updated[index].captionGu = text;
        else updated[index].captionEn = text;
      }
      return { ...prev, photos: updated };
    });
  };

  const totalPhotos = albums.reduce((acc, a) => acc + (a.photos?.length || 0), 0);
  const totalVideos = albums.reduce((acc, a) => acc + (a.videos?.length || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <ImageIcon className="text-sky-600 dark:text-sky-400" />
            Event Photo & Video Gallery Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create event categories and upload event-wise photos and videos displayed on the homepage.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Create Event Album
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 flex items-center justify-center font-bold text-xl">
            📁
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{albums.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Event Albums</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center font-bold text-xl">
            📷
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalPhotos}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Photos</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-bold text-xl">
            🎬
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalVideos}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Videos</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center font-bold text-xl">
            🏷️
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{allCategories.length - 1}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Categories</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search albums..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Albums Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading gallery albums...</div>
      ) : filteredAlbums.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8">
          <FolderPlus size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No event albums found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">Create your first event photo and video album now.</p>
          <button
            onClick={() => openModal()}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            + Add New Album
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlbums.map(album => {
            const id = album._id || album.id || '';
            const cover = fixAdminUrl(album.coverImage || (album.photos?.[0]?.url) || '');
            return (
              <div
                key={id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all"
              >
                {/* Cover Image & Badges */}
                <div className="relative h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  {cover ? (
                    <img
                      src={cover}
                      alt={album.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageIcon size={36} />
                    </div>
                  )}

                  {/* Category Badge */}
                  <span className="absolute top-3 left-3 bg-sky-900/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                    {album.category}
                  </span>

                  {/* Featured Tag */}
                  {album.isFeatured && (
                    <span className="absolute top-3 right-3 bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                      <Star size={12} fill="white" /> Featured
                    </span>
                  )}

                  {/* Counts Overlay at bottom of image */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                    <span className="bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                      📷 {album.photos?.length || 0}
                    </span>
                    {album.videos && album.videos.length > 0 && (
                      <span className="bg-purple-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                        🎬 {album.videos.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                      <Calendar size={13} />
                      <span>{album.date || 'No date'}</span>
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-white text-base leading-snug line-clamp-1">
                      {album.titleGu}
                    </h3>
                    <h4 className="font-semibold text-slate-600 dark:text-slate-300 text-sm mb-2 line-clamp-1">
                      {album.titleEn}
                    </h4>

                    {album.descEn && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {album.descEn}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleEnable(album)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        album.isEnabled
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {album.isEnabled ? <Eye size={13} /> : <EyeOff size={13} />}
                      {album.isEnabled ? 'Published' : 'Hidden'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(album)}
                        className="p-1.5 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-all cursor-pointer"
                        title="Edit Album"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                        title="Delete Album"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Album Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700 flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                  {editingId ? 'Edit Event Album' : 'Create Event Album'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage event category, bilingual titles, photos, and video links.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-700 px-6 bg-white dark:bg-slate-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'info'
                    ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                📝 Basic Info
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'photos'
                    ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                📷 Photos ({formData.photos.length})
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'videos'
                    ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                🎬 Videos ({formData.videos.length})
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              {/* Tab 1: Basic Info */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Title (ગુજરાતી) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.titleGu}
                        onChange={e => setFormData({ ...formData, titleGu: e.target.value })}
                        placeholder="દા.ત. વાર્ષિક સ્નેહમિલન ૨૦૨૬"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Title (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.titleEn}
                        onChange={e => setFormData({ ...formData, titleEn: e.target.value })}
                        placeholder="e.g. Annual Gathering 2026"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Category Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Event Category
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={isCustomCat ? 'Custom' : formData.category}
                          onChange={e => {
                            if (e.target.value === 'Custom') {
                              setIsCustomCat(true);
                            } else {
                              setIsCustomCat(false);
                              setFormData({ ...formData, category: e.target.value });
                            }
                          }}
                          className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-sky-500"
                        >
                          {PRESET_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                          <option value="Custom">+ Custom Category...</option>
                        </select>
                      </div>
                      {isCustomCat && (
                        <input
                          type="text"
                          value={customCategory}
                          onChange={e => setCustomCategory(e.target.value)}
                          placeholder="Type custom category name..."
                          className="mt-2 w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-sky-400 rounded-xl text-xs outline-none"
                        />
                      )}
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      Cover Thumbnail Image
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.coverImage ? (
                        <img
                          src={fixAdminUrl(formData.coverImage)}
                          alt="Cover"
                          className="w-24 h-16 object-cover rounded-xl border border-slate-200"
                        />
                      ) : (
                        <div className="w-24 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                          No Cover
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={formData.coverImage}
                            onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                            placeholder="Image URL or upload file..."
                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            disabled={uploadingCover}
                            className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload size={14} />
                            {uploadingCover ? 'Uploading...' : 'Upload'}
                          </button>
                        </div>
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="hidden"
                        />
                        <span className="text-[11px] text-slate-400">
                          (If left empty, the first photo from the album photos tab will be used)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Description (ગુજરાતી)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.descGu}
                        onChange={e => setFormData({ ...formData, descGu: e.target.value })}
                        placeholder="ઇવેન્ટ વિશે ટૂંકી માહિતી..."
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Description (English)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.descEn}
                        onChange={e => setFormData({ ...formData, descEn: e.target.value })}
                        placeholder="Brief summary of the event..."
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Checkboxes & Order */}
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="w-4 h-4 rounded text-sky-600"
                      />
                      ⭐ Feature on Homepage Top
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={formData.isEnabled}
                        onChange={e => setFormData({ ...formData, isEnabled: e.target.checked })}
                        className="w-4 h-4 rounded text-sky-600"
                      />
                      ✅ Publish Album (Visible on Site)
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Order:</span>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                        className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Photos */}
              {activeTab === 'photos' && (
                <div className="space-y-6">
                  {/* Multi-Photo Uploader Box */}
                  <div className="bg-sky-50/50 dark:bg-sky-950/20 border-2 border-dashed border-sky-200 dark:border-sky-800/60 rounded-2xl p-6 text-center">
                    <input
                      ref={photosInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultiplePhotosUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 mx-auto flex items-center justify-center mb-3">
                      <Upload size={22} />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                      Upload Event Photos
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Select multiple images at once (JPG, PNG, WebP)
                    </p>
                    <button
                      type="button"
                      onClick={() => photosInputRef.current?.click()}
                      disabled={uploadingPhotos}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
                    >
                      <Plus size={16} />
                      {uploadingPhotos ? 'Uploading Photos...' : 'Choose Photos to Upload'}
                    </button>
                  </div>

                  {/* Photos Grid */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3">
                      Album Photos ({formData.photos.length})
                    </h4>

                    {formData.photos.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No photos added yet. Use the upload box above to add photos.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.photos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex gap-3 relative group"
                          >
                            <img
                              src={fixAdminUrl(photo.url)}
                              alt="Item"
                              className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-750 flex-shrink-0"
                            />
                            <div className="flex-1 flex flex-col gap-1.5">
                              <input
                                type="text"
                                value={photo.captionGu || ''}
                                onChange={e => updatePhotoCaption(idx, 'gu', e.target.value)}
                                placeholder="ફોટો કેપ્શન (ગુજરાતી)..."
                                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none"
                              />
                              <input
                                type="text"
                                value={photo.captionEn || ''}
                                onChange={e => updatePhotoCaption(idx, 'en', e.target.value)}
                                placeholder="Photo caption (English)..."
                                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute top-2 right-2 p-1 bg-rose-100 text-rose-600 rounded-md hover:bg-rose-200 transition-all cursor-pointer"
                              title="Delete Photo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Videos */}
              {activeTab === 'videos' && (
                <div className="space-y-6">
                  {/* Add YouTube / Video Input Form */}
                  <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3 flex items-center gap-2">
                      <Film size={16} className="text-purple-600" />
                      Add Event Video
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          YouTube Video URL or Direct Video Link
                        </label>
                        <input
                          type="text"
                          value={newVideoUrl}
                          onChange={e => setNewVideoUrl(e.target.value)}
                          placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtu.be/..."
                          className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={newVideoTitleGu}
                            onChange={e => setNewVideoTitleGu(e.target.value)}
                            placeholder="વિડિઓ શીર્ષક (ગુજરાતી)..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={newVideoTitleEn}
                            onChange={e => setNewVideoTitleEn(e.target.value)}
                            placeholder="Video title (English)..."
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={handleAddVideo}
                          disabled={!newVideoUrl.trim()}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus size={15} />
                          Add Video Link
                        </button>

                        <div>
                          <input
                            ref={videoFileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleVideoFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => videoFileInputRef.current?.click()}
                            disabled={uploadingVideoFile}
                            className="text-xs text-purple-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                          >
                            <Upload size={13} />
                            {uploadingVideoFile ? 'Uploading Video File...' : 'Upload Video File (.mp4)'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* List of Attached Videos */}
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3">
                      Attached Videos ({formData.videos.length})
                    </h4>

                    {formData.videos.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No videos attached yet. Paste a YouTube link above to add.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.videos.map((vid, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col justify-between relative"
                          >
                            <div className="pr-8">
                              <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs mb-1">
                                <Film size={13} />
                                <span>{vid.type === 'youtube' ? 'YouTube' : 'Video File'}</span>
                              </div>
                              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {vid.titleGu || vid.titleEn || 'Untitled Video'}
                              </h5>
                              <a
                                href={vid.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-sky-600 truncate block mt-1 hover:underline"
                              >
                                {vid.url}
                              </a>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeVideo(idx)}
                              className="absolute top-3 right-3 p-1 bg-rose-100 text-rose-600 rounded-md hover:bg-rose-200 transition-all cursor-pointer"
                              title="Delete Video"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
