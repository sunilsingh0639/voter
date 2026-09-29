import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import { wardService } from '../../services';
import { Button, Input, Select, Modal, ConfirmDialog, Badge, Table, Pagination, Card, PageHeader } from '../../components/ui';
import { getErrorMessage } from '../../utils/helpers';
import type { Ward } from '../../types';

const WardForm: React.FC<{ ward?: Ward; onClose: () => void }> = ({ ward, onClose }) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    wardNumber: ward?.wardNumber || '',
    wardNameHindi: ward?.wardNameHindi || '',
    wardNameEnglish: ward?.wardNameEnglish || '',
    descriptionHindi: ward?.descriptionHindi || '',
    descriptionEnglish: ward?.descriptionEnglish || '',
    status: ward?.status || 'Active',
  });

  const mutation = useMutation({
    mutationFn: () => ward ? wardService.update(ward.id, form) : wardService.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wards'] });
      toast.success(ward ? t('updateSuccess') : t('createSuccess'));
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('wardNumber')} value={form.wardNumber} onChange={(e) => set('wardNumber', e.target.value)} required />
        <Select label={t('status')} value={form.status} onChange={(e) => set('status', e.target.value)}
          options={[{ value: 'Active', label: t('active') }, { value: 'Inactive', label: t('inactive') }]} />
      </div>
      <Input label={t('wardNameHindi')} value={form.wardNameHindi} onChange={(e) => set('wardNameHindi', e.target.value)} required />
      <Input label={t('wardNameEnglish')} value={form.wardNameEnglish} onChange={(e) => set('wardNameEnglish', e.target.value)} required />
      <Input label={t('descriptionHindi')} value={form.descriptionHindi} onChange={(e) => set('descriptionHindi', e.target.value)} />
      <Input label={t('descriptionEnglish')} value={form.descriptionEnglish} onChange={(e) => set('descriptionEnglish', e.target.value)} />
      <div className="flex gap-2 justify-end pt-2 border-t border-[#E8D5A3]">
        <Button variant="secondary" type="button" onClick={onClose}>{t('cancel')}</Button>
        <Button type="submit" loading={mutation.isPending}>{t('save')}</Button>
      </div>
    </form>
  );
};

const WardsPage: React.FC = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editWard, setEditWard] = useState<Ward | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['wards', page, search],
    queryFn: () => wardService.getAll({ page, pageSize: 25, search }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => wardService.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wards'] }); toast.success(t('updateSuccess')); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => wardService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wards'] }); toast.success(t('deleteSuccess')); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const result = data?.data?.data;

  const columns = [
    { key: 'wardNumber', header: t('wardNumber'), sortable: true },
    { key: 'wardNameHindi', header: t('wardNameHindi') },
    { key: 'wardNameEnglish', header: t('wardNameEnglish') },
    { key: 'voterCount', header: t('totalVoters') },
    { key: 'status', header: t('status'), render: (row: Ward) => <Badge label={t(row.status.toLowerCase())} variant={row.status === 'Active' ? 'success' : 'gray'} /> },
    {
      key: 'actions', header: t('actions'), render: (row: Ward) => (
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => { setEditWard(row); setModalOpen(true); }}>{t('edit')}</Button>
          <Button size="sm" variant={row.status === 'Active' ? 'secondary' : 'success'}
            onClick={() => statusMutation.mutate({ id: row.id, status: row.status === 'Active' ? 'Inactive' : 'Active' })}>
            {row.status === 'Active' ? t('disable') : t('enable')}
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteId(row.id)}>{t('delete')}</Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('wards')}
        subtitle={result ? `${result.totalCount} ${t('totalWards')}` : undefined}
        action={
          <Button onClick={() => { setEditWard(undefined); setModalOpen(true); }} size="sm">
            <Plus size={14} />
            {t('add')}
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b border-[#E8D5A3] bg-[#FFFBF5]">
          <Input placeholder={t('search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-xs" icon={<Search size={14} />} />
        </div>
        <Table columns={columns as never} data={(result?.items || []) as never} loading={isLoading} emptyMessage={t('noWardsFound')} />
        {result && <Pagination page={page} totalPages={result.totalPages} totalCount={result.totalCount} pageSize={25} onPageChange={setPage} />}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editWard ? t('edit') + ' ' + t('wards') : t('add') + ' ' + t('wards')} size="lg">
        <WardForm ward={editWard} onClose={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('delete')} message={t('confirmDelete')} confirmLabel={t('delete')} />
    </div>
  );
};

export default WardsPage;
