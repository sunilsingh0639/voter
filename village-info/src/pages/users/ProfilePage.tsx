import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, Card, Badge, PageHeader } from '../../components/ui';
import { getErrorMessage } from '../../utils/helpers';

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authService.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success(t('updateSuccess'));
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwError('पासवर्ड मेल नहीं खाते'); return; }
    if (newPassword.length < 8) { setPwError(t('passwordRequirements')); return; }
    setPwError('');
    mutation.mutate();
  };

  const roleLabel = user?.role === 'SuperAdmin' ? t('superAdmin') : user?.role === 'Admin' ? t('admin') : t('wardAdmin');
  const roleVariant: 'danger' | 'warning' | 'info' = user?.role === 'SuperAdmin' ? 'danger' : user?.role === 'Admin' ? 'warning' : 'info';

  return (
    <div className="space-y-5 max-w-xl">
      <PageHeader title={t('profile')} />

      {/* Profile card */}
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#7B1D1D] to-[#C05621] relative">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 21px)' }} />
        </div>
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7B1D1D] to-[#C05621] flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="pb-1">
              <h2 className="text-lg font-bold text-[#2D2D2D]">{user?.name}</h2>
              <p className="text-sm text-[#6B3F1A]/70">@{user?.username}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge label={roleLabel} variant={roleVariant} />
            <Badge label={user?.status === 'Active' ? t('active') : t('inactive')} variant={user?.status === 'Active' ? 'success' : 'gray'} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t('email'), value: user?.email || '—' },
              { label: t('mobile'), value: user?.mobile || '—' },
            ].map((item) => (
              <div key={item.label} className="bg-[#FFFBF5] border border-[#E8D5A3] rounded-xl p-3">
                <p className="text-xs text-[#6B3F1A]/60 uppercase tracking-wide mb-0.5">{item.label}</p>
                <p className="text-sm font-medium text-[#2D2D2D]">{item.value}</p>
              </div>
            ))}
          </div>

          {user?.assignedWards && user.assignedWards.length > 0 && (
            <div className="mt-3 bg-[#FFFBF5] border border-[#E8D5A3] rounded-xl p-3">
              <p className="text-xs text-[#6B3F1A]/60 uppercase tracking-wide mb-1.5">{t('assignedWards')}</p>
              <div className="flex flex-wrap gap-1.5">
                {user.assignedWards.map((w) => (
                  <span key={w.id} className="text-xs bg-[#F5E6C8] text-[#4A2C0A] border border-[#E8D5A3] px-2 py-0.5 rounded-full">{w.wardNameHindi}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Change password */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8D5A3] bg-[#FFFBF5] flex items-center gap-2">
          <Lock size={15} className="text-[#B7791F]" />
          <h3 className="font-bold text-[#7B1D1D] text-sm uppercase tracking-wide">{t('changePassword')}</h3>
        </div>
        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input label={t('currentPassword')} type={showCurrent ? 'text' : 'password'} value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-8 text-[#B7791F]/60 hover:text-[#B7791F]">
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="relative">
              <Input label={t('newPassword')} type={showNew ? 'text' : 'password'} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-8 text-[#B7791F]/60 hover:text-[#B7791F]">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Input label={t('confirmPassword')} type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required error={pwError} />
            <Button type="submit" loading={mutation.isPending}>
              <Lock size={14} />
              {t('changePassword')}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default ProfilePage;
