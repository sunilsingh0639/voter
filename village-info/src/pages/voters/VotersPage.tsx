import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download, Search, RotateCcw, Filter } from 'lucide-react';
import { voterService, wardService } from '../../services';
import { Button, Input, Select, Badge, Table, Pagination, Card, PageHeader } from '../../components/ui';
import { downloadBlob, getErrorMessage } from '../../utils/helpers';
import { PERMISSIONS } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import type { Voter, Ward } from '../../types';

const VotersPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuthStore();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', wardId: '', boothNumber: '', gender: '', status: '', sortBy: 'fullNameHindi', sortDesc: false });
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['voters', page, filters],
    queryFn: () => voterService.getAll({ page, pageSize: 25, ...filters }),
  });

  const { data: wardsData } = useQuery({ queryKey: ['wards-all'], queryFn: () => wardService.getAll({ pageSize: 100 }) });
  const wards: Ward[] = wardsData?.data?.data?.items || [];
  const result = data?.data?.data;

  const setFilter = useCallback((k: string, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  }, []);

  const handleExport = async () => {
    if (!hasPermission(PERMISSIONS.EXPORT_VOTERS)) return;
    setExporting(true);
    try {
      const res = await voterService.export(filters);
      downloadBlob(res.data, 'voters.xlsx');
      toast.success(t('exportSuccess'));
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setExporting(false); }
  };

  const genderBadge = (g: string) => {
    const map: Record<string, 'info' | 'warning' | 'gray'> = { Male: 'info', Female: 'warning', Other: 'gray' };
    return <Badge label={t(g.toLowerCase())} variant={map[g] || 'gray'} />;
  };

  const columns = [
    { key: 'serialNumber', header: t('serialNumber') },
    { key: 'epicNumber', header: t('epicNumber'), sortable: true },
    { key: 'fullNameHindi', header: t('voterName'), sortable: true },
    { key: 'fatherHusbandNameHindi', header: t('fatherName') },
    { key: 'gender', header: t('gender'), render: (row: Voter) => genderBadge(row.gender) },
    { key: 'age', header: t('age') },
    { key: 'ward', header: t('wardName'), render: (row: Voter) => row.ward?.wardNameHindi || '—' },
    { key: 'boothNumber', header: t('boothNumber') },
    { key: 'houseNumber', header: t('houseNumber') },
    { key: 'area', header: t('area') },
    { key: 'status', header: t('status'), render: (row: Voter) => <Badge label={t(row.status.toLowerCase())} variant={row.status === 'Active' ? 'success' : 'gray'} /> },
  ];

  const hasActiveFilters = filters.search || filters.wardId || filters.boothNumber || filters.gender || filters.status;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('voters')}
        subtitle={result ? `${result.totalCount.toLocaleString('hi-IN')} ${t('totalVoters')}` : undefined}
        action={
          hasPermission(PERMISSIONS.EXPORT_VOTERS) ? (
            <Button variant="secondary" loading={exporting} onClick={handleExport} size="sm">
              <Download size={14} />
              {t('export')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        {/* Filters */}
        <div className="p-4 border-b border-[#E8D5A3] bg-[#FFFBF5]">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-[#B7791F]" />
            <span className="text-xs font-semibold text-[#4A2C0A] uppercase tracking-wide">{t('filter')}</span>
            {hasActiveFilters && (
              <span className="ml-auto">
                <Button variant="ghost" size="sm" onClick={() => { setFilters({ search: '', wardId: '', boothNumber: '', gender: '', status: '', sortBy: 'fullNameHindi', sortDesc: false }); setPage(1); }}>
                  <RotateCcw size={12} />
                  {t('reset')}
                </Button>
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Input
              placeholder={t('search')}
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              icon={<Search size={14} />}
            />
            <Select value={filters.wardId} onChange={(e) => setFilter('wardId', e.target.value)}
              options={wards.map(w => ({ value: w.id, label: w.wardNameHindi }))} placeholder={t('selectWard')} />
            <Input placeholder={t('boothNumber')} value={filters.boothNumber} onChange={(e) => setFilter('boothNumber', e.target.value)} />
            <Select value={filters.gender} onChange={(e) => setFilter('gender', e.target.value)}
              options={[{ value: 'Male', label: t('male') }, { value: 'Female', label: t('female') }, { value: 'Other', label: t('other') }]}
              placeholder={t('selectGender')} />
            <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}
              options={[{ value: 'Active', label: t('active') }, { value: 'Inactive', label: t('inactive') }]}
              placeholder={t('selectStatus')} />
          </div>
        </div>

        <Table
          columns={columns as never}
          data={(result?.items || []) as never}
          loading={isLoading}
          emptyMessage={t('noVotersFound')}
          sortBy={filters.sortBy}
          sortDesc={filters.sortDesc}
          onSort={(key) => setFilters((f) => ({ ...f, sortBy: key, sortDesc: f.sortBy === key ? !f.sortDesc : false }))}
        />
        {result && <Pagination page={page} totalPages={result.totalPages} totalCount={result.totalCount} pageSize={25} onPageChange={setPage} />}
      </Card>
    </div>
  );
};

export default VotersPage;
