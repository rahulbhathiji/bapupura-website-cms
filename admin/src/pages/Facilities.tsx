import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, Edit2, Trash2, ArrowUp, ArrowDown, 
  CheckCircle, ToggleLeft, ToggleRight, X, AlertTriangle 
} from 'lucide-react';

interface Facility {
  _id: string;
  id: string;
  icon: string;
  titleGu: string;
  titleEn: string;
  descGu: string;
  descEn: string;
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
  const [icon, setIcon] = useState('📚');
  const [titleGu, setTitleGu] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descGu, setDescGu] = useState('');
  const [descEn, setDescEn] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

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
    setIcon('📚');
    setTitleGu('');
    setTitleEn('');
    setDescGu('');
    setDescEn('');
    setIsEnabled(true);
    setModalOpen(true);
  };

  const openEditModal = (item: Facility) => {
    setEditingId(item._id || item.id);
    setIcon(item.icon);
    setTitleGu(item.titleGu);
    setTitleEn(item.titleEn);
    setDescGu(item.descGu);
    setDescEn(item.descEn);
    setIsEnabled(item.isEnabled);
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
      if (json.success) {
        setFacilities(prev => prev.filter(f => f._id !== id && f.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { icon, titleGu, titleEn, descGu, descEn, isEnabled };
    
    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/facilities/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/facilities', {
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isEnabled: nextStatus })
      });
      const json = await res.json();
      if (json.success) {
        setFacilities(prev => prev.map(f => (f._id === id || f.id === id) ? { ...f, isEnabled: nextStatus } : f));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newFacilities = [...facilities];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newFacilities.length) return;
    
    // Swap items in memory
    const temp = newFacilities[index];
    newFacilities[index] = newFacilities[targetIndex];
    newFacilities[targetIndex] = temp;

    // Recalculate order indices
    const updatedOrders = newFacilities.map((f, i) => ({
      id: f._id || f.id,
      order: i
    }));

    setFacilities(newFacilities);

    try {
      await fetch('/api/facilities/reorder', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orders: updatedOrders })
      });
    } catch (e) {
      console.error('Failed to save priority order on backend', e);
      // rollback
      fetchFacilities();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading facilities grid...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">Manage Facilities</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control the grid blocks representing community wings</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Facility Card</span>
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {facilities.map((item, index) => (
          <div 
            key={item._id || item.id} 
            className={`border rounded-3xl p-5 flex flex-col justify-between transition-all bg-white dark:bg-slate-900 ${
              item.isEnabled 
                ? 'border-slate-200 dark:border-slate-800' 
                : 'border-slate-200 dark:border-slate-800 opacity-60 border-dashed'
            }`}
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1.5 rounded-xl shadow-inner">
                  <button 
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="p-1 text-slate-500 hover:text-sky-600 hover:bg-white dark:hover:bg-slate-900 rounded-lg disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    disabled={index === facilities.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="p-1 text-slate-500 hover:text-sky-600 hover:bg-white dark:hover:bg-slate-900 rounded-lg disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="font-bold text-slate-850 dark:text-white text-sm">{item.titleEn}</h4>
                <h4 className="text-xs font-semibold text-slate-500 mt-0.5">{item.titleGu}</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">{item.descEn}</p>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 mt-4 pt-3.5">
              <button 
                onClick={() => handleToggleStatus(item)}
                className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  item.isEnabled ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {item.isEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                <span>{item.isEnabled ? 'Enabled' : 'Disabled'}</span>
              </button>

              <div className="flex gap-2">
                <button 
                  onClick={() => openEditModal(item)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/20 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl cursor-pointer"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(item._id || item.id)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Facility Add/Edit Modal */}
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
              {editingId ? 'Edit Facility Card' : 'Add Facility Card'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Emoji Icon</label>
                  <input 
                    type="text" 
                    required 
                    value={icon} 
                    onChange={(e) => setIcon(e.target.value)} 
                    className="w-full text-center px-2 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-xl" 
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Card Status</label>
                  <div className="flex gap-4 items-center h-10">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="isEnabled" 
                        checked={isEnabled} 
                        onChange={() => setIsEnabled(true)} 
                        className="text-sky-600 w-4 h-4"
                      />
                      <span className="text-sm font-semibold">Active (Show)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="isEnabled" 
                        checked={!isEnabled} 
                        onChange={() => setIsEnabled(false)} 
                        className="text-sky-600 w-4 h-4"
                      />
                      <span className="text-sm font-semibold">Hidden (Draft)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title (Gujarati)</label>
                  <input 
                    type="text" 
                    required 
                    value={titleGu} 
                    onChange={(e) => setTitleGu(e.target.value)} 
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title (English)</label>
                  <input 
                    type="text" 
                    required 
                    value={titleEn} 
                    onChange={(e) => setTitleEn(e.target.value)} 
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (Gujarati)</label>
                <textarea 
                  rows={2} 
                  required 
                  value={descGu} 
                  onChange={(e) => setDescGu(e.target.value)} 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description (English)</label>
                <textarea 
                  rows={2} 
                  required 
                  value={descEn} 
                  onChange={(e) => setDescEn(e.target.value)} 
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-sm" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-sm shadow-md cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Facilities;
