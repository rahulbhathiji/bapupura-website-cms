import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Users, Upload, X, Camera, Check, Shield, AlertCircle, ArrowUpDown } from 'lucide-react';
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

export interface CommitteeMember {
  _id?: string;
  id?: string;
  nameGu: string;
  nameEn: string;
  designationGu: string;
  designationEn: string;
  committeeType: 'trustees' | 'advisory' | 'executive';
  photoUrl: string;
  order: number;
  isEnabled: boolean;
}

export const Committees: React.FC = () => {
  const { token } = useAuth();
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'trustees' | 'advisory' | 'executive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<CommitteeMember>({
    nameGu: '',
    nameEn: '',
    designationGu: '',
    designationEn: '',
    committeeType: 'trustees',
    photoUrl: '',
    order: 0,
    isEnabled: true
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/committees`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (e) {
      console.error('Error fetching committee members:', e);
    }
    setLoading(false);
  };

  const openModal = (member: CommitteeMember | null = null, defaultType: 'trustees' | 'advisory' | 'executive' = 'trustees') => {
    if (member) {
      setFormData(member);
      setEditingId(member._id || member.id || null);
    } else {
      const nextOrder = members.filter(m => m.committeeType === defaultType).length + 1;
      setFormData({
        nameGu: '',
        nameEn: '',
        designationGu: '',
        designationEn: '',
        committeeType: activeTab !== 'all' ? activeTab : defaultType,
        photoUrl: '',
        order: nextOrder,
        isEnabled: true
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setFormData((prev) => ({ ...prev, photoUrl: data.data[0].url }));
      } else {
        alert('Photo upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Photo upload error: ' + err.message);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameGu.trim() || !formData.nameEn.trim()) {
      alert('Member names in both Gujarati and English are required.');
      return;
    }

    try {
      const url = editingId ? `${API_BASE}/committees/${editingId}` : `${API_BASE}/committees`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        fetchMembers();
        setIsModalOpen(false);
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (err: any) {
      alert('Error saving committee member: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/committees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchMembers();
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (e: any) {
      alert('Delete error: ' + e.message);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesTab = activeTab === 'all' || m.committeeType === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || m.nameGu.toLowerCase().includes(q) || m.nameEn.toLowerCase().includes(q) || m.designationGu.toLowerCase().includes(q) || m.designationEn.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const getCommitteeBadge = (type: string) => {
    switch (type) {
      case 'trustees':
        return <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-900/50">Board of Trustees (ટ્રસ્ટીમંડળ)</span>;
      case 'advisory':
        return <span className="px-2.5 py-1 bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 text-xs font-bold rounded-lg border border-sky-200 dark:border-sky-900/50">Advisory Committee (સલાહકાર સમિતિ)</span>;
      case 'executive':
        return <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-900/50">Executive Committee (નિયામક મંડળ)</span>;
      default:
        return null;
    }
  };

  const trusteesCount = members.filter(m => m.committeeType === 'trustees').length;
  const advisoryCount = members.filter(m => m.committeeType === 'advisory').length;
  const executiveCount = members.filter(m => m.committeeType === 'executive').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="text-sky-600 dark:text-sky-400" size={28} />
            Board of Trustees & Committee Members
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage Board of Trustees, Advisory Committee, and Executive Committee members, upload photos, and update designations.
          </p>
        </div>
        <button
          onClick={() => openModal(null)}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer text-sm shrink-0"
        >
          <Plus size={18} /> Add Committee Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTab('trustees')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'trustees'
              ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">ટ્રસ્ટીમંડળ</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Board of Trustees</h3>
            </div>
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 w-12 h-12 rounded-2xl flex items-center justify-center border border-amber-200 dark:border-amber-800">
              {trusteesCount}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('advisory')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'advisory'
              ? 'bg-sky-500/10 border-sky-500 text-sky-900 dark:text-sky-300 ring-2 ring-sky-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-400'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">સલાહકાર સમિતિ</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Advisory Committee</h3>
            </div>
            <span className="text-3xl font-black text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 w-12 h-12 rounded-2xl flex items-center justify-center border border-sky-200 dark:border-sky-800">
              {advisoryCount}
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('executive')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'executive'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">નિયામક મંડળ</p>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">Executive Committee</h3>
            </div>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 w-12 h-12 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              {executiveCount}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-sky-600 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('trustees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'trustees'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Trustees ({trusteesCount})
          </button>
          <button
            onClick={() => setActiveTab('advisory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'advisory'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Advisory ({advisoryCount})
          </button>
          <button
            onClick={() => setActiveTab('executive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'executive'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Executive ({executiveCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search by name or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Grid of Members */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500">Loading committee roster...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <AlertCircle className="mx-auto text-slate-400 mb-2" size={36} />
          <p className="text-slate-600 dark:text-slate-300 font-semibold text-base">No committee members found</p>
          <p className="text-xs text-slate-400 mt-1">Try switching tabs or adjusting search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => {
            const photo = fixAdminUrl(member.photoUrl);
            return (
              <div
                key={member._id || member.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  {/* Top Bar: Badge & Action Buttons */}
                  <div className="flex justify-between items-start gap-2 mb-4">
                    {getCommitteeBadge(member.committeeType)}
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openModal(member)}
                        className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Member Details & Photo"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(member._id || member.id || '', member.nameEn)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Delete Member"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Member Photo & Identity Block */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      {photo ? (
                        <img
                          src={photo}
                          alt={member.nameEn}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-600 to-sky-800 text-white flex items-center justify-center font-extrabold text-xl shadow-md border-2 border-white dark:border-slate-800">
                          {member.nameEn.charAt(0)}
                        </div>
                      )}
                      
                      <button
                        onClick={() => openModal(member)}
                        className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 text-sky-600 p-1 rounded-full shadow-md border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform cursor-pointer"
                        title="Upload/Change Photo"
                      >
                        <Camera size={12} />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <span>No. {member.order}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base truncate" title={member.nameGu}>
                        {member.nameGu}
                      </h4>
                      <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 truncate" title={member.nameEn}>
                        {member.nameEn}
                      </p>
                    </div>
                  </div>

                  {/* Position / Designation Details */}
                  {(member.designationGu || member.designationEn) && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-xl">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        📌 {member.designationGu}
                      </p>
                      {member.designationEn && member.designationEn !== member.designationGu && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                          {member.designationEn}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                  <span>Photo: {member.photoUrl ? 'Uploaded ✅' : 'No photo 📷'}</span>
                  <button 
                    onClick={() => openModal(member)}
                    className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
                  >
                    Manage Photo & Details &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative animate-fadeIn">
            
            <div className="flex justify-between items-center border-b pb-4 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="text-sky-600" size={22} />
                {editingId ? 'Edit Committee Member' : 'Add Committee Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 mt-6">
              
              {/* Committee Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Select Committee *
                </label>
                <select
                  value={formData.committeeType}
                  onChange={(e) => setFormData({ ...formData, committeeType: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium outline-none focus:border-sky-500"
                >
                  <option value="trustees"> Board of Trustees (ટ્રસ્ટીમંડળ)</option>
                  <option value="advisory"> Advisory Committee (સલાહકાર સમિતિ)</option>
                  <option value="executive"> Executive Committee (નિયામક મંડળ)</option>
                </select>
              </div>

              {/* Member Photo Upload Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                  Member Photo
                </label>

                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {formData.photoUrl ? (
                      <img
                        src={fixAdminUrl(formData.photoUrl)}
                        alt="Member Preview"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-sky-500 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 flex flex-col items-center justify-center text-slate-400">
                        <Camera size={24} />
                        <span className="text-[10px] mt-1">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload Photo'}
                      </button>

                      {formData.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photoUrl: '' })}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste photo URL..."
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Name (GU & EN) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Name (Gujarati) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="શ્રી સંજયભાઈ ચૌધરી"
                    value={formData.nameGu}
                    onChange={(e) => setFormData({ ...formData, nameGu: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Shri Sanjaybhai Chaudhary"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Designation / Role / Institution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Designation (Gujarati)
                  </label>
                  <input
                    type="text"
                    placeholder="મેનેજિંગ ટ્રસ્ટી - પ્રમુખ"
                    value={formData.designationGu}
                    onChange={(e) => setFormData({ ...formData, designationGu: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Designation (English)
                  </label>
                  <input
                    type="text"
                    placeholder="Managing Trustee - President"
                    value={formData.designationEn}
                    onChange={(e) => setFormData({ ...formData, designationEn: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Display Order Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Display Serial / Order No.
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-32 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t pt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Committees;
