import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, RotateCcw } from 'lucide-react';
import { importService, wardService } from '../../services';
import { Button, Select, Card, PageHeader } from '../../components/ui';
import { downloadBlob, getErrorMessage } from '../../utils/helpers';
import type { Ward } from '../../types';

type ImportMode = 'InsertOnly' | 'Upsert';

interface PreviewData {
  importId: string;
  totalRows: number;
  validRows: unknown[];
  invalidRows: unknown[];
  duplicateRows: unknown[];
  missingWardRows: unknown[];
}

const steps = [
  { key: 'upload', icon: <Upload size={16} />, labelKey: 'step1Upload' },
  { key: 'preview', icon: <FileSpreadsheet size={16} />, labelKey: 'step2Preview' },
  { key: 'done', icon: <CheckCircle size={16} />, labelKey: 'step3Summary' },
];

const ImportPage: React.FC = () => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [wardId, setWardId] = useState('');
  const [mode, setMode] = useState<ImportMode>('Upsert');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: wardsData } = useQuery({ queryKey: ['wards-all'], queryFn: () => wardService.getAll({ pageSize: 100 }) });
  const wards: Ward[] = wardsData?.data?.data?.items || [];

  const previewMutation = useMutation({
    mutationFn: () => importService.preview(file!, wardId, mode),
    onSuccess: (res) => {
      if (res.data.success && res.data.data) {
        setPreview(res.data.data as PreviewData);
        setStep('preview');
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const confirmMutation = useMutation({
    mutationFn: () => importService.confirm((preview as PreviewData).importId),
    onSuccess: (res) => {
      if (res.data.success && res.data.data) {
        setSummary(res.data.data as unknown as Record<string, number>);
        setStep('done');
        toast.success(t('importSuccess'));
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleFileChange = (f: File | null) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext || '')) { toast.error('Only .xlsx/.xls files allowed'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('File size must be under 10MB'); return; }
    setFile(f);
  };

  const handleDownloadErrors = async () => {
    if (!preview?.importId) return;
    try {
      const res = await importService.downloadErrorFile(preview.importId);
      downloadBlob(res.data, 'import_errors.xlsx');
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const reset = () => { setFile(null); setPreview(null); setSummary(null); setStep('upload'); if (fileRef.current) fileRef.current.value = ''; };

  const currentStepIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title={t('importVoters')} subtitle="Excel फ़ाइल से मतदाता डेटा आयात करें" />

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <React.Fragment key={s.key}>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentStepIdx === i ? 'bg-[#7B1D1D] text-white shadow-md' : currentStepIdx > i ? 'bg-[#FEF3E2] text-[#7B1D1D] border border-[#E8D5A3]' : 'bg-white text-[#6B3F1A]/50 border border-[#E8D5A3]'}`}>
              <span className={currentStepIdx > i ? 'text-emerald-600' : ''}>{currentStepIdx > i ? <CheckCircle size={14} /> : s.icon}</span>
              <span className="hidden sm:inline">{t(s.labelKey)}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${currentStepIdx > i ? 'bg-[#7B1D1D]' : 'bg-[#E8D5A3]'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <Card className="p-6 space-y-5">
          {/* Drag & drop area */}
          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-[#7B1D1D] bg-[#FEF3E2]' : file ? 'border-emerald-400 bg-emerald-50' : 'border-[#E8D5A3] hover:border-[#B7791F] hover:bg-[#FFFBF5]'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileChange(e.dataTransfer.files[0]); }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />

            {file ? (
              <div className="space-y-2">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                  <FileSpreadsheet size={28} className="text-emerald-600" />
                </div>
                <p className="font-semibold text-emerald-700">{file.name}</p>
                <p className="text-xs text-emerald-600">{(file.size / 1024).toFixed(1)} KB</p>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-xs text-red-500 hover:text-red-700 underline">फ़ाइल हटाएं</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-[#FEF3E2] rounded-2xl flex items-center justify-center mx-auto">
                  <Upload size={28} className="text-[#B7791F]" />
                </div>
                <p className="font-semibold text-[#4A2C0A]">{t('dragDropExcel')}</p>
                <p className="text-xs text-[#6B3F1A]/60">.xlsx, .xls — अधिकतम 10MB</p>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Select label={t('selectWard')} value={wardId} onChange={(e) => setWardId(e.target.value)}
              options={wards.map(w => ({ value: w.id, label: `${w.wardNameHindi} (${w.wardNumber})` }))}
              placeholder={t('selectWard')} />
            <Select label={t('importMode')} value={mode} onChange={(e) => setMode(e.target.value as ImportMode)}
              options={[{ value: 'InsertOnly', label: t('insertOnly') }, { value: 'Upsert', label: t('upsert') }]} />
          </div>

          <div className="bg-[#FEF3E2] border border-[#E8D5A3] rounded-xl p-3 text-sm text-[#4A2C0A]">
            <strong className="text-[#7B1D1D]">{t('importMode')}:</strong>{' '}
            {mode === 'InsertOnly' ? 'केवल नए मतदाता जोड़े जाएंगे' : 'मौजूदा मतदाता अपडेट होंगे और नए जोड़े जाएंगे'}
          </div>

          <Button onClick={() => previewMutation.mutate()} disabled={!file || !wardId} loading={previewMutation.isPending} className="w-full" size="lg">
            <FileSpreadsheet size={16} />
            {t('preview')}
          </Button>
        </Card>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t('totalRows'), value: preview.totalRows, icon: '📋', color: 'from-[#6B3F1A] to-[#8B5E3C]' },
              { label: t('validRows'), value: preview.validRows.length, icon: '✅', color: 'from-[#065F46] to-[#10B981]' },
              { label: t('invalidRows'), value: preview.invalidRows.length, icon: '❌', color: 'from-[#7F1D1D] to-[#EF4444]' },
              { label: t('duplicateRows'), value: preview.duplicateRows.length, icon: '🔄', color: 'from-[#78350F] to-[#F59E0B]' },
            ].map((item) => (
              <div key={item.label} className={`bg-gradient-to-br ${item.color} text-white rounded-xl p-4 text-center`}>
                <p className="text-2xl mb-1">{item.icon}</p>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs opacity-80 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Invalid rows */}
          {preview.invalidRows.length > 0 && (
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <h3 className="font-semibold text-red-700 text-sm">{t('invalidRows')} ({preview.invalidRows.length})</h3>
                </div>
                <Button size="sm" variant="secondary" onClick={handleDownloadErrors}>
                  <Download size={12} />
                  {t('downloadErrorFile')}
                </Button>
              </div>
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-xs">
                  <thead><tr className="bg-red-50 border-b border-red-100">
                    <th className="px-3 py-2 text-left text-red-700">{t('rowNumber')}</th>
                    <th className="px-3 py-2 text-left text-red-700">{t('epicNumber')}</th>
                    <th className="px-3 py-2 text-left text-red-700">{t('errorReason')}</th>
                  </tr></thead>
                  <tbody>{(preview.invalidRows as { rowNumber: number; epicNumber: string; error: string }[]).map((r, i) => (
                    <tr key={i} className="border-b border-red-50">
                      <td className="px-3 py-2 text-[#2D2D2D]">{r.rowNumber}</td>
                      <td className="px-3 py-2 text-[#2D2D2D]">{r.epicNumber}</td>
                      <td className="px-3 py-2 text-red-600">{r.error}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={reset}>
              <RotateCcw size={14} />
              {t('cancel')}
            </Button>
            <Button onClick={() => confirmMutation.mutate()} loading={confirmMutation.isPending} disabled={preview.validRows.length === 0} className="flex-1">
              <CheckCircle size={14} />
              {t('confirmImport')} ({preview.validRows.length} {t('validRows')})
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === 'done' && summary && (
        <Card className="p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center text-4xl mx-auto shadow-xl">✅</div>
          <div>
            <h3 className="text-xl font-bold text-emerald-700 font-devanagari">{t('importSuccess')}</h3>
            <p className="text-sm text-[#6B3F1A]/70 mt-1">आयात सफलतापूर्वक पूर्ण हुआ</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: t('inserted'), value: summary.inserted || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: t('updated'), value: summary.updated || 0, color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: t('duplicates'), value: summary.duplicates || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: t('invalid'), value: summary.invalid || 0, color: 'bg-red-50 text-red-700 border-red-200' },
              { label: t('failed'), value: summary.failed || 0, color: 'bg-orange-50 text-orange-700 border-orange-200' },
              { label: t('missingWard'), value: summary.missingWard || 0, color: 'bg-[#FEF3E2] text-[#7B1D1D] border-[#E8D5A3]' },
            ].map((item) => (
              <div key={item.label} className={`border rounded-xl p-3 text-center ${item.color}`}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>

          <Button onClick={reset} className="w-full" size="lg">
            <Upload size={16} />
            नया आयात करें
          </Button>
        </Card>
      )}
    </div>
  );
};

export default ImportPage;
