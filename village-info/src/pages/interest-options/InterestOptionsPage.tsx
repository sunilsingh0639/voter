import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Star, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { interestOptionService } from '../../services';
import { Button, Input, Modal, ConfirmDialog, Badge, Card, PageHeader, LoadingOverlay, EmptyState } from '../../components/ui';
import { getErrorMessage } from '../../utils/helpers';
import type { InterestOption } from '../../types';

const OptionForm: React.FC<{ option?: InterestOption; onClose: () => void }> = ({ option, onClose }) => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [nameHindi, setNameHindi] = useState(option?.nameHindi || '');
  const [nameEnglish, setNameEnglish] = useState(option?.nameEnglish || '');
  const [displayOrder, setDisplayOrder] = useState(String(option?.displayOrder || 1));
  const [imageFile, setImageFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('nameHindi', nameHindi);
      fd.append('nameEnglish', nameEnglish);
      fd.append('displayOrder', displayOrder);
      if (imageFile) fd.append('image', imageFile);
      return option ? interestOptionService.update(option.id, fd) : interestOptionService.create(fd);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interest-options'] }); toast.success(option ? t('updateSuccess') : t('createSuccess')); onClose(); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
      <Input label={t('nameHindi')} value={nameHindi} onChange={(e) => setNameHindi(e.target.value)} required />
      <Input label={t('nameEnglish')} value={nameEnglish} onChange={(e) => setNameEnglish(e.target.value)} required />
      <Input label={t('displayOrder')} type="number" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value)} min="1" />
      <div>
        <label className="block text-xs font-semibold text-[#4A2C0A] mb-1.5 uppercase tracking-wide">{t('image')}</label>
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="text-sm text-[#4A2C0A] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#FEF3E2] file:text-[#7B1D1D] hover:file:bg-[#F5E6C8] cursor-pointer" />
        {option?.imageUrl && !imageFile && (
          <img src={option.imageUrl} alt="" className="mt-2 h-16 w-16 object-cover rounded-xl border border-[#E8D5A3]" />
        )}
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t border-[#E8D5A3]">
        <Button variant="secondary" type="button" onClick={onClose}>{t('cancel')}</Button>
        <Button type="submit" loading={mutation.isPending}>{t('save')}</Button>
      </div>
    </form>
  );
};

const InterestOptionsPage: React.FC = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editOption, setEditOption] = useState<InterestOption | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['interest-options'], queryFn: () => interestOptionService.getAll() });
  const options: InterestOption[] = data?.data?.data || [];

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => interestOptionService.updateStatus(id, isActive),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interest-options'] }); toast.success(t('updateSuccess')); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => interestOptionService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interest-options'] }); toast.success(t('deleteSuccess')); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('interestOptions')}
        subtitle={`${options.length} विकल्प`}
        action={
          <Button onClick={() => { setEditOption(undefined); setModalOpen(true); }} size="sm">
            <Plus size={14} />
            {t('add')}
          </Button>
        }
      />

      {options.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            message={t('noInterestOptions')}
            description="पसंद विकल्प जोड़ें जो सार्वजनिक वेबसाइट पर दिखाए जाएंगे"
            icon={<Star size={24} className="text-[#B7791F]" />}
            action={<Button onClick={() => setModalOpen(true)} size="sm"><Plus size={14} />{t('add')}</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map((opt) => (
            <Card key={opt.id} className="overflow-hidden card-hover">
              {/* Card top */}
              <div className="relative h-32 bg-gradient-to-br from-[#7B1D1D] to-[#C05621] flex items-center justify-center">
                {opt.imageUrl ? (
                  <img src={opt.imageUrl} alt={opt.nameHindi} className="w-full h-full object-cover" />
                ) : (
                  <Star size={40} className="text-white/40" />
                )}
                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <Badge label={opt.isActive ? t('active') : t('inactive')} variant={opt.isActive ? 'success' : 'gray'} />
                </div>
                {/* Order badge */}
                <div className="absolute top-2 left-2 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
                  #{opt.displayOrder}
                </div>
              </div>

              {/* Card body */}
              <div className="p-4">
                <h3 className="font-bold text-[#2D2D2D] font-devanagari text-base">{opt.nameHindi}</h3>
                <p className="text-sm text-[#6B3F1A]/70 mt-0.5">{opt.nameEnglish}</p>

                {/* Actions */}
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-[#E8D5A3]">
                  <Button size="sm" variant="ghost" onClick={() => { setEditOption(opt); setModalOpen(true); }}>
                    <Edit2 size={12} />
                    {t('edit')}
                  </Button>
                  <Button size="sm" variant={opt.isActive ? 'secondary' : 'success'}
                    onClick={() => statusMutation.mutate({ id: opt.id, isActive: !opt.isActive })}>
                    {opt.isActive ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                    {opt.isActive ? t('disable') : t('enable')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteId(opt.id)}>
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editOption ? t('edit') + ' ' + t('interestOptions') : t('add') + ' ' + t('interestOptions')}>
        <OptionForm option={editOption} onClose={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('delete')} message={t('confirmDelete')} confirmLabel={t('delete')} />
    </div>
  );
};

export default InterestOptionsPage;
