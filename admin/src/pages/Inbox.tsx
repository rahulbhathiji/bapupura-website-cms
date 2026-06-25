import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, MailOpen, Mail, Trash2, Download, 
  ArrowLeft, ArrowRight, CheckCircle, FileDown 
} from 'lucide-react';

interface Inquiry {
  _id: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const Inbox: React.FC = () => {
  const { token } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const url = `/api/inquiries?status=${statusFilter}&search=${search}&page=${page}&limit=8`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setInquiries(json.data);
        setPagination(json.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, page, token]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInquiries();
  };

  const handleToggleRead = async (id: string, currentReadStatus: boolean) => {
    const nextStatus = !currentReadStatus;
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: nextStatus })
      });
      const json = await res.json();
      if (json.success) {
        setInquiries(prev => prev.map(i => (i._id === id || i.id === id) ? { ...i, isRead: nextStatus } : i));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this message circular from inbox?')) return;
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setInquiries(prev => prev.filter(i => i._id !== id && i.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    // Open full CSV export URL direct in browser window
    const exportUrl = `${window.location.origin}/api/inquiries/export?token=${token}`;
    
    // We can also fetch it with Bearer header and trigger download programmatically
    fetch('/api/inquiries/export', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inquiries_export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => {
      console.error('CSV Export failed', err);
      // Fallback
      window.open(exportUrl);
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header and Actions */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-lg">Inquiries Inbox</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review message submissions from the public website contact form</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
        >
          <FileDown size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Options */}
      <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-xs flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by sender name, message keyword, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:bg-white"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none cursor-pointer"
          >
            <option value="">All Message Status</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
          <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer">
            Filter
          </button>
        </div>
      </form>

      {/* Inbox List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs">Fetching messages inbox...</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">Your inbox is completely clear.</div>
        ) : (
          inquiries.map(item => (
            <div 
              key={item._id || item.id} 
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                item.isRead 
                  ? 'border-slate-200 dark:border-slate-800 opacity-75' 
                  : 'border-sky-200 dark:border-sky-900 shadow-md shadow-sky-500/[0.02]'
              }`}
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    item.isRead ? 'bg-slate-300 dark:bg-slate-700' : 'bg-sky-500 animate-pulse'
                  }`} />
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.name}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>📞 Phone: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{item.phone}</strong></span>
                  {item.email && <span>✉️ Email: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{item.email}</strong></span>}
                </div>

                <p className="text-xs text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border dark:border-slate-800 leading-relaxed font-sans mt-2">
                  {item.message}
                </p>
              </div>

              <div className="flex md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                <button 
                  onClick={() => handleToggleRead(item._id || item.id, item.isRead)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    item.isRead 
                      ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border-transparent text-slate-700 dark:text-slate-300' 
                      : 'bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 border-sky-100 dark:border-sky-900/50 text-sky-700 dark:text-sky-400'
                  }`}
                >
                  {item.isRead ? <Mail size={14} /> : <MailOpen size={14} />}
                  <span>{item.isRead ? 'Mark Unread' : 'Mark Read'}</span>
                </button>
                <button 
                  onClick={() => handleDelete(item._id || item.id)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-550 dark:text-slate-355 hover:text-rose-600 dark:hover:text-rose-450 border border-transparent rounded-xl flex items-center justify-center cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination component */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-6">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl disabled:opacity-40 cursor-pointer text-slate-600 dark:text-slate-400"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs text-slate-500 font-bold">
            Page {page} of {pagination.pages}
          </span>
          <button 
            disabled={page === pagination.pages}
            onClick={() => setPage(p => p + 1)}
            className="p-2 border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl disabled:opacity-40 cursor-pointer text-slate-600 dark:text-slate-400"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      )}

    </div>
  );
};

export default Inbox;
