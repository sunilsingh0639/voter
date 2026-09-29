import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search, ClipboardList } from 'lucide-react';
import { auditService } from '../../services';
import { Input, Table, Pagination, Card, PageHeader, Badge } from '../../components/ui';
import type { AuditLog } from '../../types';

const actionVariant = (action: string): 'success' | 'danger' | 'warning' | 'info' | 'gray' => {
  if (action?.toLowerCase().includes('create')) return 'success';
  if (action?.toLowerCase().includes('delete')) return 'danger';
  if (action?.toLowerCase().includes('update')) return 'warning';
  if (action?.toLowerCase().includes('login')) return 'info';
  return 'gray';
};

const AuditLogsPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search],
    queryFn: () => auditService.getAll({ page, pageSize: 25, search }),
  });

  const result = data?.data?.data;

  const columns = [
    { key: 'createdAt', header: t('createdAt'), render: (row: AuditLog) => (
      <span className="text-xs text-[#6B3F1A]">{new Date(row.createdAt).toLocaleString('hi-IN')}</span>
    )},
    { key: 'userName', header: t('user'), render: (row: AuditLog) => (
      <span className="font-medium text-[#2D2D2D]">{row.userName}</span>
    )},
    { key: 'action', header: t('action'), render: (row: AuditLog) => (
      <Badge label={row.action} variant={actionVariant(row.action)} />
    )},
    { key: 'entityType', header: t('entity'), render: (row: AuditLog) => (
      <span className="text-xs bg-[#F5E6C8] text-[#4A2C0A] px-2 py-0.5 rounded-full">{row.entityType}</span>
    )},
    { key: 'description', header: t('description'), render: (row: AuditLog) => (
      <span className="text-xs text-[#6B3F1A] max-w-xs truncate block">{row.description}</span>
    )},
    { key: 'ipAddress', header: t('ipAddress'), render: (row: AuditLog) => (
      <span className="text-xs font-mono text-[#6B3F1A]/70">{row.ipAddress}</span>
    )},
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('auditLogs')}
        subtitle={result ? `${result.totalCount} ${t('recentActivity')}` : undefined}
      />

      <Card>
        <div className="p-4 border-b border-[#E8D5A3] bg-[#FFFBF5] flex items-center gap-3">
          <ClipboardList size={15} className="text-[#B7791F]" />
          <Input placeholder={t('search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-xs" icon={<Search size={14} />} />
        </div>
        <Table columns={columns as never} data={(result?.items || []) as never} loading={isLoading} emptyMessage={t('noData')} />
        {result && <Pagination page={page} totalPages={result.totalPages} totalCount={result.totalCount} pageSize={25} onPageChange={setPage} />}
      </Card>
    </div>
  );
};

export default AuditLogsPage;
