import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Globe, Image as ImageIcon } from 'lucide-react';
import { contentService, galleryService } from '../../services';
import { Button, Input, Modal, Card, Table, PageHeader, EmptyState, LoadingOverlay } from '../../components/ui';
import { getErrorMessage } from '../../utils/helpers';
import type { ContentItem, GalleryImage } from '../../types';

const ContentPage: React.FC = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [editValues, setEditValues] = useState({ valueHindi: '', valueEnglish: '' });

  const { data, isLoading } = useQuery({ queryKey: ['content'], queryFn: contentService.getAll });
  const items: ContentItem[] = data?.data?.data || [];

  const mutation = useMutation({
    mutationFn: () => contentService.update(editItem!.id, editValues),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['content'] }); toast.success(t('updateSuccess')); setEditItem(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openEdit = (item: ContentItem) => {
    setEditItem(item);
    setEditValues({ valueHindi: item.valueHindi, valueEnglish: item.valueEnglish });
  };

  const columns = [
    { key: 'key', header: t('contentKey'), render: (row: ContentItem) => (
      <span className="font-mono text-xs bg-[#F5E6C8] text-[#4A2C0A] px-2 py-0.5 rounded">{row.key}</span>
    )},
    { key: 'type', header: t('contentType'), render: (row: ContentItem) => (
      <span className="text-xs text-[#6B3F1A]">{row.type}</span>
    )},
    { key: 'valueHindi', header: t('contentHindi'), render: (row: ContentItem) => (
      <span className="text-sm text-[#2D2D2D] font-devanagari truncate max-w-[200px] block">{row.valueHindi}</span>
    )},
    { key: 'valueEnglish', header: t('contentEnglish'), render: (row: ContentItem) => (
      <span className="text-sm text-[#2D2D2D] truncate max-w-[200px] block">{row.valueEnglish}</span>
    )},
    { key: 'actions', header: t('actions'), render: (row: ContentItem) => (
      <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
        <Edit2 size={12} />
        {t('edit')}
      </Button>
    )},
  ];

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="space-y-5">
      <PageHeader title={t('websiteContent')} subtitle="सार्वजनिक वेबसाइट की सामग्री प्रबंधित करें" />

      <Card>
        <div className="px-5 py-3 border-b border-[#E8D5A3] bg-[#FFFBF5] flex items-center gap-2">
          <Globe size={15} className="text-[#B7791F]" />
          <span className="text-xs font-semibold text-[#4A2C0A] uppercase tracking-wide">सामग्री आइटम</span>
        </div>
        <Table columns={columns as never} data={items as never} loading={isLoading} emptyMessage={t('noData')} />
      </Card>

      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title={t('edit') + ': ' + editItem?.key} size="lg">
        <div className="space-y-4">
          <div className="bg-[#FEF3E2] border border-[#E8D5A3] rounded-xl p-3 text-xs text-[#4A2C0A]">
            <strong>Key:</strong> <code className="font-mono">{editItem?.key}</code>
            {' • '}<strong>Type:</strong> {editItem?.type}
          </div>
          <Input label={t('contentHindi')} value={editValues.valueHindi}
            onChange={(e) => setEditValues(v => ({ ...v, valueHindi: e.target.value }))} />
          <Input label={t('contentEnglish')} value={editValues.valueEnglish}
            onChange={(e) => setEditValues(v => ({ ...v, valueEnglish: e.target.value }))} />
          <div className="flex gap-2 justify-end border-t border-[#E8D5A3] pt-3">
            <Button variant="secondary" onClick={() => setEditItem(null)}>{t('cancel')}</Button>
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>{t('save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const GalleryPage: React.FC = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<GalleryImage | null>(null);
  const [titleHindi, setTitleHindi] = useState('');
  const [titleEnglish, setTitleEnglish] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ['gallery-admin'], queryFn: galleryService.getAll });
  const items: GalleryImage[] = data?.data?.data || [];

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('titleHindi', titleHindi);
      fd.append('titleEnglish', titleEnglish);
      if (imageFile) fd.append('image', imageFile);
      return editItem ? galleryService.update(editItem.id, fd) : galleryService.create(fd);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gallery-admin'] }); toast.success(editItem ? t('updateSuccess') : t('createSuccess')); setModalOpen(false); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => galleryService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gallery-admin'] }); toast.success(t('deleteSuccess')); setDeleteId(null); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openAdd = () => { setEditItem(null); setTitleHindi(''); setTitleEnglish(''); setImageFile(null); setModalOpen(true); };
  const openEdit = (item: GalleryImage) => { setEditItem(item); setTitleHindi(item.titleHindi); setTitleEnglish(item.titleEnglish); setImageFile(null); setModalOpen(true); };

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('gallery')}
        subtitle={`${items.length} छवियाँ`}
        action={
          <Button onClick={openAdd} size="sm">
            <Plus size={14} />
            {t('add')}
          </Button>
        }
      />

      {items.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            message={t('noGalleryImages')}
            description="गैलरी में छवियाँ जोड़ें जो सार्वजनिक वेबसाइट पर दिखाई जाएंगी"
            icon={<ImageIcon size={24} className="text-[#B7791F]" />}
            action={<Button onClick={openAdd} size="sm"><Plus size={14} />{t('add')}</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((img) => (
            <Card key={img.id} className="overflow-hidden card-hover group">
              <div className="relative h-40 bg-[#F5E6C8]">
                <img src={img.imageUrl} alt={img.titleHindi}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#5C1414]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-[#2D2D2D] font-devanagari truncate">{img.titleHindi}</p>
                <p className="text-xs text-[#6B3F1A]/60 truncate">{img.titleEnglish}</p>
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-[#E8D5A3]">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(img)}>
                    <Edit2 size={11} />
                    {t('edit')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteId(img.id)}>
                    <Trash2 size={11} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? t('edit') + ' ' + t('gallery') : t('add') + ' ' + t('gallery')}>
        <div className="space-y-4">
          <Input label={t('titleHindi')} value={titleHindi} onChange={(e) => setTitleHindi(e.target.value)} required />
          <Input label={t('titleEnglish')} value={titleEnglish} onChange={(e) => setTitleEnglish(e.target.value)} required />
          <div>
            <label className="block text-xs font-semibold text-[#4A2C0A] mb-1.5 uppercase tracking-wide">{t('uploadImage')}</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="text-sm text-[#4A2C0A] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#FEF3E2] file:text-[#7B1D1D] hover:file:bg-[#F5E6C8] cursor-pointer" />
            {editItem?.imageUrl && !imageFile && (
              <img src={editItem.imageUrl} alt="" className="mt-2 h-24 rounded-xl object-cover border border-[#E8D5A3]" />
            )}
          </div>
          <div className="flex gap-2 justify-end border-t border-[#E8D5A3] pt-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('cancel')}</Button>
            <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>{t('save')}</Button>
          </div>
        </div>
      </Modal>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2D2D]/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 border border-[#E8D5A3] shadow-2xl">
            <p className="text-[#4A2C0A] mb-5 font-devanagari">{t('confirmDelete')}</p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>{t('cancel')}</Button>
              <Button variant="danger" onClick={() => deleteMutation.mutate(deleteId)}>{t('delete')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPage;
