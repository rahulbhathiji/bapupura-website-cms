import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Users, Upload, X, Camera, FileSpreadsheet, CheckCircle, AlertCircle, Download, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

const API_BASE = '/api';

const fixAdminUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const base = (window.location.port === '3000')
    ? window.location.protocol + '//' + window.location.hostname + ':5000'
    : window.location.origin;
  return base + (url.startsWith('/') ? '' : '/') + url;
};

interface Donor {
  _id?: string;
  id?: string;
  nameGu: string;
  nameEn: string;
  photoUrl: string;
  bioGu: string;
  bioEn: string;
  detailsGu: string;
  detailsEn: string;
  isFeatured: boolean;
}

interface ImportRow {
  nameGu: string;
  nameEn: string;
  bioGu: string;
  bioEn: string;
  detailsGu: string;
  detailsEn: string;
  isFeatured: string | boolean;
  _valid?: boolean;
  _error?: string;
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: { row: number; name?: string; reason: string }[];
}

const TEMPLATE_HEADERS = ['nameGu', 'nameEn', 'bioGu', 'bioEn', 'detailsGu', 'detailsEn', 'isFeatured'];
const TEMPLATE_EXAMPLE = ['રાહુલ પટેલ', 'Rahul Patel', 'ગ્રામ વિકાસ', 'Community leader', 'ઉત્કૃષ્ટ...', 'Excellent...', 'false'];

export const Donors: React.FC = () => {
  const { token } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Donor>({ nameGu: '', nameEn: '', photoUrl: '', bioGu: '', bioEn: '', detailsGu: '', detailsEn: '', isFeatured: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importFile, setImportFile] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchDonors(); }, []);

  const fetchDonors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/donors`);
      const data = await res.json();
      if (data.success) setDonors(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openModal = (donor: Donor | null = null) => {
    if (donor) { setFormData(donor); setEditingId(donor._id || donor.id || null); }
    else { setFormData({ nameGu: '', nameEn: '', photoUrl: '', bioGu: '', bioEn: '', detailsGu: '', detailsEn: '', isFeatured: false }); setEditingId(null); }
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      const res = await fetch(`${API_BASE}/media/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (data.success && data.data && data.data[0]) setFormData((prev) => ({ ...prev, photoUrl: data.data[0].url }));
      else alert('Upload failed: ' + (data.message || 'Unknown error'));
    } catch (err: any) { alert('Upload error: ' + err.message); }
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/donors${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) { setIsModalOpen(false); fetchDonors(); }
      else alert(data.message || 'Failed to save donor.');
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this donor?')) return;
    try {
      const res = await fetch(`${API_BASE}/donors/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) fetchDonors();
    } catch (e) { console.error(e); }
  };

  const parseRows = (rawRows: any[]): ImportRow[] => {
    return rawRows
      .filter(row => Object.values(row).some(v => v !== '' && v !== null && v !== undefined))
      .map(row => {
        const n: any = {};
        Object.entries(row).forEach(([k, v]) => { n[k.trim()] = (v ?? '').toString().trim(); });
        const nameGu = n.nameGu || n['Name (Gujarati)'] || n['name_gu'] || '';
        const nameEn = n.nameEn || n['Name (English)'] || n['name_en'] || '';
        const valid = !!(nameGu || nameEn);
        return {
          nameGu, nameEn,
          bioGu: n.bioGu || n['Bio (Gujarati)'] || n['bio_gu'] || '',
          bioEn: n.bioEn || n['Bio (English)'] || n['bio_en'] || '',
          detailsGu: n.detailsGu || n['Details (Gujarati)'] || n['details_gu'] || '',
          detailsEn: n.detailsEn || n['Details (English)'] || n['details_en'] || '',
          isFeatured: n.isFeatured || n['is_featured'] || n['Featured'] || 'false',
          _valid: valid,
          _error: valid ? undefined : 'Missing name: both nameGu and nameEn are empty'
        };
      });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file.name);
    setImportResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' });
      setImportRows(parseRows(jsonData as any[]));
      setImportStep('preview');
    } catch (err: any) { alert('Failed to parse file: ' + err.message); }
    e.target.value = '';
  };

  const handleBulkImport = async () => {
    const validRows = importRows.filter(r => r._valid);
    if (validRows.length === 0) { alert('No valid rows to import.'); return; }
    setImporting(true);
    try {
      const payload = validRows.map(r => ({
        nameGu: r.nameGu, nameEn: r.nameEn, bioGu: r.bioGu, bioEn: r.bioEn,
        detailsGu: r.detailsGu, detailsEn: r.detailsEn,
        isFeatured: r.isFeatured === true || r.isFeatured === 'true' || r.isFeatured === '1' || r.isFeatured === 'yes'
      }));
      const res = await fetch(`${API_BASE}/donors/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ donors: payload })
      });
      const data = await res.json();
      if (data.success) { setImportResult(data.data); setImportStep('result'); fetchDonors(); }
      else alert(data.message || 'Import failed.');
    } catch (err: any) { alert('Import error: ' + err.message); }
    setImporting(false);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_EXAMPLE]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Donors');
    XLSX.writeFile(wb, 'donors_import_template.xlsx');
  };

  const openImportModal = () => { setImportRows([]); setImportFile(''); setImportResult(null); setImportStep('upload'); setIsImportModalOpen(true); };
  const closeImportModal = () => { setIsImportModalOpen(false); setImportRows([]); setImportFile(''); setImportResult(null); setImportStep('upload'); };

  const validCount = importRows.filter(r => r._valid).length;
  const invalidCount = importRows.filter(r => !r._valid).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users className="text-sky-600" /> Donors Directory
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={openImportModal} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 cursor-pointer transition-colors">
            <FileSpreadsheet size={18} /> Import Excel / CSV
          </button>
          <button onClick={() => openModal()} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium shadow flex items-center gap-2 cursor-pointer transition-colors">
            <Plus size={18} /> Add Donor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading...</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-4 w-20">Photo</th>
                <th className="p-4">Name (En)</th>
                <th className="p-4">Name (Gu)</th>
                <th className="p-4">Featured</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
              {donors.map((d) => (
                <tr key={d._id || d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4">
                    {d.photoUrl ? (
                      <img src={fixAdminUrl(d.photoUrl)} alt={d.nameEn} className="w-12 h-12 object-cover rounded-full border-2 border-sky-100" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 text-lg font-bold">
                        {(d.nameEn || 'D').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{d.nameEn}</td>
                  <td className="p-4">{d.nameGu}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${d.isFeatured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {d.isFeatured ? 'Featured' : 'Standard'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => openModal(d)} className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(d._id || d.id || '')} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {donors.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No donors yet. Use "Add Donor" or "Import Excel / CSV" to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Single Donor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{editingId ? 'Edit Donor' : 'New Donor'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={22} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="donorForm" onSubmit={handleSave} className="space-y-5">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="relative w-28 h-28">
                      {formData.photoUrl ? (
                        <img src={fixAdminUrl(formData.photoUrl)} alt="Donor" className="w-28 h-28 rounded-full object-cover border-4 border-sky-100 shadow" />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                          <Camera size={24} /><span className="text-xs mt-1">No Photo</span>
                        </div>
                      )}
                      <button type="button" onClick={() => photoInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-sky-600 hover:bg-sky-700 text-white rounded-full p-1.5 shadow-md cursor-pointer">
                        <Upload size={14} />
                      </button>
                    </div>
                    <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoUpload} className="hidden" />
                    {uploading && <p className="text-xs text-sky-600 mt-1 text-center">Uploading...</p>}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Photo URL</label>
                      <input type="text" value={formData.photoUrl} onChange={e => setFormData({ ...formData, photoUrl: e.target.value })}
                        placeholder="Or paste image URL directly"
                        className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="isFeatured" checked={formData.isFeatured}
                        onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="w-4 h-4 accent-sky-600 cursor-pointer" />
                      <label htmlFor="isFeatured" className="font-semibold text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Featured Donor</label>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Name (Gujarati)</label>
                    <input type="text" required value={formData.nameGu} onChange={e => setFormData({ ...formData, nameGu: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Name (English)</label>
                    <input type="text" required value={formData.nameEn} onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Biography (Gujarati)</label>
                    <textarea rows={3} value={formData.bioGu} onChange={e => setFormData({ ...formData, bioGu: e.target.value })}
                      placeholder="Short quote or biography in Gujarati..."
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Biography (English)</label>
                    <textarea rows={3} value={formData.bioEn} onChange={e => setFormData({ ...formData, bioEn: e.target.value })}
                      placeholder="Short quote or biography in English..."
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Details (Gujarati)</label>
                    <textarea rows={5} value={formData.detailsGu} onChange={e => setFormData({ ...formData, detailsGu: e.target.value })}
                      placeholder="Achievements, contributions, background..."
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Details (English)</label>
                    <textarea rows={5} value={formData.detailsEn} onChange={e => setFormData({ ...formData, detailsEn: e.target.value })}
                      placeholder="Achievements, contributions, background..."
                      className="w-full border border-slate-200 rounded-lg p-2.5 dark:bg-slate-800 dark:border-slate-700 focus:border-sky-400 outline-none text-sm" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer">Cancel</button>
              <button type="submit" form="donorForm" className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium shadow cursor-pointer">
                {editingId ? 'Save Changes' : 'Add Donor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Excel/CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg"><FileSpreadsheet className="text-emerald-600" size={22} /></div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Import Donors via Excel / CSV</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Photos can be added individually after import</p>
                </div>
              </div>
              <button onClick={closeImportModal} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={22} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {importStep === 'upload' && (
                <div className="space-y-6">
                  <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-xl p-4">
                    <Info className="text-sky-500 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-sky-800">
                      <p className="font-semibold mb-2">Required column headers:</p>
                      <div className="flex flex-wrap gap-2">
                        {TEMPLATE_HEADERS.map(h => <code key={h} className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded text-xs font-mono">{h}</code>)}
                      </div>
                      <p className="mt-2 text-xs text-sky-600">
                        At least <strong>nameGu</strong> or <strong>nameEn</strong> is required per row. All other fields are optional.
                        Set <code className="bg-sky-100 px-1 rounded">isFeatured</code> to <code className="bg-sky-100 px-1 rounded">true</code> or <code className="bg-sky-100 px-1 rounded">false</code>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={downloadTemplate}
                      className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-xl cursor-pointer transition-colors">
                      <Download size={16} /> Download Template (.xlsx)
                    </button>
                    <span className="text-xs text-slate-400">Fill this template then upload it below</span>
                  </div>
                  <div onClick={() => csvInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-2xl p-12 text-center cursor-pointer transition-colors group">
                    <FileSpreadsheet className="mx-auto text-slate-300 group-hover:text-emerald-400 transition-colors mb-3" size={48} />
                    <p className="text-slate-600 font-semibold">Click to select your Excel or CSV file</p>
                    <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, .csv — up to 500 donors per file</p>
                    <input ref={csvInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} />
                  </div>
                </div>
              )}

              {importStep === 'preview' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <FileSpreadsheet size={16} className="text-slate-400" />{importFile}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <CheckCircle size={14} /><span className="font-bold">{validCount}</span>&nbsp;valid
                    </div>
                    {invalidCount > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                        <AlertCircle size={14} /><span className="font-bold">{invalidCount}</span>&nbsp;skipped
                      </div>
                    )}
                    <button onClick={() => { setImportStep('upload'); setImportRows([]); setImportFile(''); }}
                      className="ml-auto text-xs text-slate-500 hover:text-slate-700 cursor-pointer underline">Different file?</button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                          <tr>
                            <th className="p-3 font-bold text-slate-500 w-10">#</th>
                            <th className="p-3 font-bold text-slate-600">Name (Gu)</th>
                            <th className="p-3 font-bold text-slate-600">Name (En)</th>
                            <th className="p-3 font-bold text-slate-600">Bio (Gu)</th>
                            <th className="p-3 font-bold text-slate-600">Bio (En)</th>
                            <th className="p-3 font-bold text-slate-600">Featured</th>
                            <th className="p-3 font-bold text-slate-600 w-20">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {importRows.map((row, i) => (
                            <tr key={i} className={!row._valid ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}>
                              <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                              <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{row.nameGu || <em className="text-slate-300">—</em>}</td>
                              <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{row.nameEn || <em className="text-slate-300">—</em>}</td>
                              <td className="p-3 text-slate-500 max-w-[120px] truncate">{row.bioGu || '—'}</td>
                              <td className="p-3 text-slate-500 max-w-[120px] truncate">{row.bioEn || '—'}</td>
                              <td className="p-3">
                                {(row.isFeatured === 'true' || row.isFeatured === true || row.isFeatured === '1' || row.isFeatured === 'yes')
                                  ? <span className="text-amber-600 font-bold">Yes</span>
                                  : <span className="text-slate-400">No</span>}
                              </td>
                              <td className="p-3">
                                {row._valid
                                  ? <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={12} />OK</span>
                                  : <span className="text-red-500 font-bold flex items-center gap-1" title={row._error}><AlertCircle size={12} />Skip</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {validCount === 0 && (
                    <div className="text-center py-4 text-red-500 font-medium">No valid rows found. Check your file headers match the template.</div>
                  )}
                </div>
              )}

              {importStep === 'result' && importResult && (
                <div className="space-y-6">
                  <div className="text-center py-6">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Import Complete!</h3>
                    <p className="text-slate-500">Donors added to the system. Add photos individually via Edit.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                      <div className="text-4xl font-bold text-emerald-700">{importResult.imported}</div>
                      <div className="text-sm font-semibold text-emerald-600 mt-1">Donors Imported</div>
                    </div>
                    <div className={`${importResult.failed > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} border rounded-xl p-6 text-center`}>
                      <div className={`text-4xl font-bold ${importResult.failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>{importResult.failed}</div>
                      <div className={`text-sm font-semibold mt-1 ${importResult.failed > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                        {importResult.failed > 0 ? 'Failed / Skipped' : 'No Failures'}
                      </div>
                    </div>
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-sm font-bold text-red-700 mb-2">Error Details:</p>
                      <ul className="space-y-1">
                        {importResult.errors.map((err, i) => (
                          <li key={i} className="text-xs text-red-600">Row {err.row}{err.name ? ` (${err.name})` : ''}: {err.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div className="text-xs text-slate-400">
                {importStep === 'preview' && `${validCount} of ${importRows.length} rows will be imported`}
              </div>
              <div className="flex gap-3">
                <button onClick={closeImportModal} className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer">
                  {importStep === 'result' ? 'Close' : 'Cancel'}
                </button>
                {importStep === 'preview' && validCount > 0 && (
                  <button onClick={handleBulkImport} disabled={importing}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg font-medium shadow cursor-pointer flex items-center gap-2">
                    {importing
                      ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>Importing...</>
                      : <><CheckCircle size={16} />Import {validCount} Donors</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
