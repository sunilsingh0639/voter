import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
import { userService, wardService } from '../../services';
import { Button, Input, Select, Modal, ConfirmDialog, Badge, Table, Pagination, Card, PageHeader } from '../../components/ui';
import { getErrorMessage } from '../../utils/helpers';
import { ROLES } from '../../constants';
import { useAuthStore } from '../../store/authStore';
import type { User, Ward } from '../../types';

const UserForm: React.FC<{ user?: User; targetRole: string; onClose: () => void }> = ({ user, targetRole, onClose }) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: user?.name || '', username: user?.username || '', email: user?.email || '',
    mobile: user?.mobile || '', password: '', status: user?.status || 'Active',
    wardIds: user?.assignedWards?.map(w => w.id) || [],
  });

  const { data: wardsData } = useQuery({ queryKey: ['wards-all'], queryFn: () => wardService.getAll({ pageSize: 100 }) });
  const wards: Ward[] = wardsData?.data?.data?.items || [];

  const mutation = useMutation({
    mutationFn: () => user
      ? userService.update(user.id, { ...form, role: targetRole as User['role'] })
      : userService.create({ ...form, role: targetRole as User['role'] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(user ? t('updateSuccess') : t('createSuccess')); onClose(); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const toggleWard = (id: string) => {
    setForm((f) => ({
      ...f,
      wardIds: f.wardIds.includes(id) ? f.wardIds.filter(w => w !== id) : [...f.wardIds, id],
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('name')} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        <Input label={t('username')} value={form.username} onChange={(e) => set('username', e.target.value)} required disabled={!!user} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('email')} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <Input label={t('mobile')} value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
      </div>
      {!user && <Input label={t('password')} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required />}
      <Select label={t('status')} value={form.status} onChange={(e) => set('status', e.target.value)}
        options={[{ value: 'Active', label: t('active') }, { value: 'Inactive', label: t('inactive') }]} />

      {targetRole === ROLES.WARD_ADMIN ? (
        <Select label={t('selectWard')} value={form.wardIds[0] || ''} onChange={(e) => set('wardIds', [e.target.value])}
          options={wards.map(w => ({ value: w.id, label: `${w.wardNameHindi} (${w.wardNumber})` }))}
          placeholder={t('selectWard')} />
      ) : (
        <div>
          <label className="block text-xs font-semibold text-[#4A2C0A] mb-1.5 uppercase tracking-wide">{t('assignedWards')}</label>
          <div className="border border-[#E8D5A3] rounded-xl p-3 max-h-40 overflow-y-auto space-y-1 bg-[#FFFBF5]">
            {wards.map((w) => (
              <label key={w.id} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-[#F5E6C8] p-1.5 rounded-lg transition-colors">
                <input type="checkbox" checked={form.wardIds.includes(w.id)} onChange={() => toggleWard(w.id)}
                  className="accent-[#7B1D1D]" />
                <span className="text-[#2D2D2D]">{w.wardNameHindi}</span>
                <span className="text-[#6B3F1A]/50 text-xs">({w.wardNumber})</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2 border-t border-[#E8D5A3]">
        <Button variant="secondary" type="button" onClick={onClose}>{t('cancel')}</Button>
        <Button type="submit" loading={mutation.isPending}>{t('save')}</Button>
      </div>
    </form>
  );
};

interface UsersPageProps { targetRole: 'Admin' | 'WardAdmin' }

const UsersPage: React.FC<UsersPageProps> = ({ targetRole }) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { isRole } = useAuthStore();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | undefined>();
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', targetRole, page, search],
    queryFn: () => userService.getAll({ role: targetRole, page, pageSize: 25, search }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => userService.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(t('updateSuccess')); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const result = data?.data?.data;
  const canManage = isRole(ROLES.SUPER_ADMIN) || (targetRole === ROLES.WARD_ADMIN);

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'gray' | 'danger'> = { Active: 'success', Inactive: 'gray', Blocked: 'danger' };
    return <Badge label={t(status.toLowerCase())} variant={map[status] || 'gray'} />;
  };

  const columns = [
    { key: 'name', header: t('name'), sortable: true },
    { key: 'username', header: t('username') },
    { key: 'email', header: t('email') },
    { key: 'mobile', header: t('mobile') },
    { key: 'status', header: t('status'), render: (row: User) => statusBadge(row.status) },
    { key: 'assignedWards', header: t('assignedWards'), render: (row: User) => (
      <span className="text-xs text-[#6B3F1A]">{row.assignedWards?.map(w => w.wardNameHindi).join(', ') || '—'}</span>
    )},
    {
      key: 'actions', header: t('actions'), render: (row: User) => (
        <div className="flex gap-1 flex-wrap">
          {canManage && <Button size="sm" variant="ghost" onClick={() => { setEditUser(row); setModalOpen(true); }}>{t('edit')}</Button>}
          {row.status !== 'Blocked' && <Button size="sm" variant="danger" onClick={() => setConfirmAction({ id: row.id, action: 'Blocked' })}>{t('block')}</Button>}
          {row.status === 'Blocked' && <Button size="sm" variant="success" onClick={() => statusMutation.mutate({ id: row.id, status: 'Active' })}>{t('unblock')}</Button>}
          {row.status === 'Active' && <Button size="sm" variant="secondary" onClick={() => setConfirmAction({ id: row.id, action: 'Inactive' })}>{t('disable')}</Button>}
          {row.status === 'Inactive' && <Button size="sm" variant="success" onClick={() => statusMutation.mutate({ id: row.id, status: 'Active' })}>{t('enable')}</Button>}
        </div>
      )
    },
  ];

  const pageTitle = targetRole === ROLES.ADMIN ? t('admins') : t('wardAdmins');

  return (
    <div className="space-y-5">
      <PageHeader
        title={pageTitle}
        subtitle={result ? `${result.totalCount} ${pageTitle}` : undefined}
        action={
          canManage ? (
            <Button onClick={() => { setEditUser(undefined); setModalOpen(true); }} size="sm">
              <Plus size={14} />
              {t('add')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="p-4 border-b border-[#E8D5A3] bg-[#FFFBF5]">
          <Input placeholder={t('search')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-xs" icon={<Search size={14} />} />
        </div>
        <Table columns={columns as never} data={(result?.items || []) as never} loading={isLoading} emptyMessage={t('noData')} />
        {result && <Pagination page={page} totalPages={result.totalPages} totalCount={result.totalCount} pageSize={25} onPageChange={setPage} />}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? t('edit') + ' ' + pageTitle : t('add') + ' ' + pageTitle} size="lg">
        <UserForm user={editUser} targetRole={targetRole} onClose={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog isOpen={!!confirmAction} onClose={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && statusMutation.mutate({ id: confirmAction.id, status: confirmAction.action })}
        title={confirmAction?.action === 'Blocked' ? t('block') : t('disable')}
        message={confirmAction?.action === 'Blocked' ? t('confirmBlock') : t('confirmDisable')}
        confirmLabel={confirmAction?.action === 'Blocked' ? t('block') : t('disable')} />
    </div>
  );
};

export default UsersPage;
