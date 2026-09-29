import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download, Eye, EyeOff, FileText, CheckCircle, Clock, Smartphone } from 'lucide-react';
import { submissionService } from '../../services';
import { Button, Input, Select, Badge, Table, Pagination, Card, PageHeader } from '../../components/ui';
import { downloadBlob, maskMobile, getErrorMessage } from '../../utils/helpers';
import { PERMISSIONS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import type { PublicSubmission } from '../../types';

const SubmissionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', otpVerified: '', language: '', from: '', to: '' });
  const [showFullMobile, setShowFullMobile] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', page, filters],
    queryFn: () => submissionService.getAll({ page, pageSize: 25, ...filters }),
  });

  const result = data?.data?.data;
  const canViewFull = hasPermission(PERMISSIONS.VIEW_FULL_MOBILE);

  const setFilter = (k: string, v: string) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await submissionService.export(filters);
      downloadBlob(res.data, 'submissions.xlsx');
      toast.success(t('exportSuccess'));
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setExporting(false); }
  };

  const verifiedCount = result?.items.filter(i => i.isOtpVerified).length ?? 0;
  const pendingCount = result?.items.filter(i => !i.isOtpVerified).length ?? 0;
  const uniqueMobiles = new Set(result?.items.map(i => i.mobileNumber).filter(Boolean)).size;

  const columns = [
    { key: 'createdAt', header: t('createdAt'), render: (row: PublicSubmission) => (
      <span className="text-xs text-[#6B3F1A]">{new Date(row.createdAt).toLocaleString('hi-IN')}</span>
    )},
    { key: 'interest', header: t('interestOptions'), render: (row: PublicSubmission) => (
      <span className="font-medium text-[#2D2D2D] font-devanagari">{row.interestOption?.nameHindi || '—'}</span>
    )},
    { key: 'mobile', header: t('mobile'), render: (row: PublicSubmission) => {
      const mobile = row.mobileNumber || '—';
      return mobile === '—' ? '—' : (showFullMobile && canViewFull ? mobile : maskMobile(mobile));
    }},
    { key: 'otpStatus', header: t('otpStatus'), render: (row: PublicSubmission) => (
      <Badge label={row.isOtpVerified ? t('verified') : t('pending')} variant={row.isOtpVerified ? 'success' : 'warning'} />
    )},
    { key: 'language', header: t('language'), render: (row: PublicSubmission) => (
      <span className="text-xs bg-[#F5E6C8] text-[#4A2C0A] px-2 py-0.5 rounded-full">{row.language}</span>
    )},
    { key: 'source', header: t('source') },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('publicSubmissions')}
        action={
          <div className="flex gap-2">
            {canViewFull && (
              <Button variant="secondary" size="sm" onClick={() => setShowFullMobile(!showFullMobile)}>
                {showFullMobile ? <EyeOff size={13} /> : <Eye size={13} />}
                {showFullMobile ? t('maskedMobile') : t('viewFullMobile')}
              </Button>
            )}
            <Button variant="secondary" loading={exporting} onClick={handleExport} size="sm">
              <Download size={13} />
              {t('export')}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('totalSubmissions'), value: result.totalCount, icon: <FileText size={18} />, gradient: 'from-[#7B1D1D] to-[#9B2C2C]' },
            { label: t('verified'), value: verifiedCount, icon: <CheckCircle size={18} />, gradient: 'from-[#065F46] to-[#10B981]' },
            { label: t('pending'), value: pendingCount, icon: <Clock size={18} />, gradient: 'from-[#78350F] to-[#F59E0B]' },
            { label: t('uniqueMobiles'), value: uniqueMobiles, icon: <Smartphone size={18} />, gradient: 'from-[#1E40AF] to-[#3B82F6]' },
          ].map((item) => (
            <div key={item.label} className={`bg-gradient-to-br ${item.gradient} text-white rounded-xl p-4 relative overflow-hidden`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs opacity-80 mb-1">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">{item.icon}</div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-[#E8D5A3] bg-[#FFFBF5]">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} label={t('from')} />
            <Input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} label={t('to')} />
            <Select value={filters.otpVerified} onChange={(e) => setFilter('otpVerified', e.target.value)}
              options={[{ value: 'true', label: t('verified') }, { value: 'false', label: t('pending') }]}
              placeholder={t('otpStatus')} />
            <Select value={filters.language} onChange={(e) => setFilter('language', e.target.value)}
              options={[{ value: 'hi', label: t('hindi') }, { value: 'en', label: t('english') }]}
              placeholder={t('language')} />
            <Button variant="secondary" onClick={() => { setFilters({ search: '', otpVerified: '', language: '', from: '', to: '' }); setPage(1); }}>
              {t('reset')}
            </Button>
          </div>
        </div>

        <Table columns={columns as never} data={(result?.items || []) as never} loading={isLoading} emptyMessage={t('noSubmissionsFound')} />
        {result && <Pagination page={page} totalPages={result.totalPages} totalCount={result.totalCount} pageSize={25} onPageChange={setPage} />}
      </Card>
    </div>
  );
};

export default SubmissionsPage;
