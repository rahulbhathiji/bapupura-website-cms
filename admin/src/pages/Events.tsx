import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, Edit2, Trash2, Calendar, MapPin, 
  Link as LinkIcon, Star, EyeOff, X, Upload 
} from 'lucide-react';

interface Event {
  _id: string;
  id: string;
  titleGu: string;
  titleEn: string;
  descGu: string;
  descEn: string;
  date: string;
  locationGu: string;
  locationEn: string;
  registrationLink: string;
  isFeatured: boolean;
  images: string[];
  isArchived: boolean;
}

export const Events: React.FC = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [archivedFilter, setArchivedFilter] = useState('false');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [titleGu, setTitleGu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descGu, setDescGu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [date, setDate] = useState('');
  const [locationGu, setLocationGu] = useState('બાપુપુરા');
  const [locationEn, setLocationEn] = useState('Bapupura');
  const [registrationLink, setRegistrationLink] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const url = `/api/events?archived=${archivedFilter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [archivedFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setTitleGu('');
    setTitleEn('');
    setDescGu('');
    setDescEn('');
    setDate(new Date().toISOString().split('T')[0]);
    setLocationGu('બાપુપુરા');
    setLocationEn('Bapupura');
    setRegistrationLink('');
    setIsFeatured(false);
    setIsArchived(false);
    setImages([]);
    setModalOpen(true);
  };

  const openEditModal = (item: Event) => {
    setEditingId(item._id || item.id);
    setTitleGu(item.titleGu);
    setTitleEn(item.titleEn);
    setDescGu(item.descGu);
    setDescEn(item.descEn);
    setDate(item.date);
    setLocationGu(item.locationGu);
    setLocationEn(item.locationEn);
    setRegistrationLink(item.registrationLink);
    setIsFeatured(item.isFeatured);
    setIsArchived(item.isArchived);
    setImages(item.images || []);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this event? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setEvents(prev => prev.filter(e => e._id !== id && e.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('files', file);
    formData.append('album', 'EVENTS');

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setImages(prev => [...prev, json.data[0].url]);
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      titleGu, titleEn, descGu, descEn, date, 
      locationGu, locationEn, registrationLink, 
      isFeatured, isArchived, images 
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/events/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/events', {
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
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Filter */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">Workshops & Seminars</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Publish community events, agricultural workshops, and literacy classes</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Create Seminar Event</span>
        </button>
      </div>

      {/* Tabs / Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xs flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={() => setArchivedFilter('false')}
            className={`px-4 py-1.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
              archivedFilter === 'false' 
                ? 'bg-sky-600 text-white border-sky-600' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200'
            }`}
          >
            Active & Upcoming
          </button>
          <button 
            onClick={() => setArchivedFilter('true')}
            className={`px-4 py-1.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
              archivedFilter === 'true' 
                ? 'bg-sky-600 text-white border-sky-600' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200'
            }`}
          >
            Archived (Past Events)
          </button>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs">Loading events logs...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-slate-500 text-xs">No events published in this category yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {events.map(item => (
            <div key={item._id || item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(item.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                  
                  <div className="flex gap-2">
                    {item.isFeatured && <Star size={16} className="text-amber-500 fill-amber-500" />}
                    {item.isArchived && <EyeOff size={16} className="text-slate-400" />}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="font-bold text-slate-850 dark:text-white text-base">{item.titleEn}</h4>
                  <h4 className="text-xs font-semibold text-slate-500">{item.titleGu}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-3">{item.descEn}</p>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 pt-3">
                    <MapPin size={14} className="text-sky-600" />
                    <span>{item.locationEn} / {item.locationGu}</span>
                  </div>

                  {item.registrationLink && (
                    <a 
                      href={item.registrationLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline pt-2"
                    >
                      <LinkIcon size={12} />
                      <span>Registration Form Link</span>
                    </a>
                  )}

                  {/* Images Gallery Previews */}
                  {item.images && item.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pt-3 max-w-full">
                      {item.images.slice(0, 4).map((img, i) => (
                        <div key={i} className="w-12 h-12 rounded-lg bg-slate-100 border dark:border-slate-800 overflow-hidden shrink-0">
                          <img src={img} className="w-full h-full object-cover" alt="" />
                        </div>
                      ))}
                      {item.images.length > 4 && (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
                          +{item.images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80 mt-5 pt-3.5">
                <button 
                  onClick={() => openEditModal(item)}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-sky-50 dark:hover:bg-sky-950/20 text-slate-650 dark:text-slate-355 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Edit Details
                </button>
                <button 
                  onClick={() => handleDelete(item._id || item.id)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-650 dark:text-slate-355 hover:text-rose-600 dark:hover:text-rose-450 rounded-xl cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Event Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">
              {editingId ? 'Edit Event Details' : 'Create Seminar Event'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title (Gujarati)</label>
                  <input type="text" required value={titleGu} onChange={(e) => setTitleGu(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title (English)</label>
                  <input type="text" required value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Date</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location (Gujarati)</label>
                  <input type="text" required value={locationGu} onChange={(e) => setLocationGu(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location (English)</label>
                  <input type="text" required value={locationEn} onChange={(e) => setLocationEn(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Gujarati)</label>
                <textarea rows={2} required value={descGu} onChange={(e) => setDescGu(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (English)</label>
                <textarea rows={2} required value={descEn} onChange={(e) => setDescEn(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Registration form Link (e.g. Google Form)</label>
                <input type="url" value={registrationLink} onChange={(e) => setRegistrationLink(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" placeholder="https://forms.gle/..." />
              </div>

              {/* GALLERY UPLOADER */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Photo Gallery</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-3">
                  {images.map((img, i) => (
                    <div key={i} className="aspect-square bg-slate-100 border dark:border-slate-800 rounded-xl overflow-hidden relative group">
                      <img src={img} className="w-full h-full object-cover" alt="" />
                      <button 
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-center items-center cursor-pointer text-slate-400 hover:text-slate-600 transition-colors shadow-xs">
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-500"></div>
                    ) : (
                      <>
                        <Plus size={20} />
                        <span className="text-[9px] font-bold mt-1 uppercase">Upload</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="text-sky-600 w-4 h-4 rounded" />
                  <span className="text-sm font-semibold">Featured Event (Top banner)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isArchived} onChange={(e) => setIsArchived(e.target.checked)} className="text-sky-600 w-4 h-4 rounded" />
                  <span className="text-sm font-semibold">Archive Event (Past program)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-850 font-bold rounded-xl text-sm cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Events;
