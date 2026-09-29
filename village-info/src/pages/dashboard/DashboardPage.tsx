import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Vote, MapPin, Users, UserCheck, FileText, CheckCircle, TrendingUp, User } from 'lucide-react';
import { dashboardService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { StatCard, Card, LoadingOverlay } from '../../components/ui';
import { ROLES } from '../../constants';

const GENDER_COLORS = ['#7B1D1D', '#C05621', '#B7791F'];

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isRole } = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => dashboardService.getStats() });
  const stats = data?.data?.data;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्ते' : 'शुभ संध्या';

  const genderData = stats ? [
    { name: t('male'), value: stats.maleVoters || 0 },
    { name: t('female'), value: stats.femaleVoters || 0 },
    { name: t('other'), value: (stats.totalVoters || 0) - (stats.maleVoters || 0) - (stats.femaleVoters || 0) },
  ].filter(d => d.value > 0) : [];

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div className="bg-gradient-to-r from-[#7B1D1D] to-[#C05621] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <p className="text-[#F6AD55] text-sm font-medium mb-1">{greeting} 🙏</p>
          <h1 className="text-2xl font-bold font-devanagari mb-1">{user?.name}</h1>
          <p className="text-white/70 text-sm">
            {user?.role === ROLES.SUPER_ADMIN ? t('superAdmin') : user?.role === ROLES.ADMIN ? t('admin') : t('wardAdmin')}
            {' • '} ढढेरू मतदाता सूचना प्रणाली
          </p>
        </div>
      </div>

      {/* Super Admin / Admin stats */}
      {!isRole(ROLES.WARD_ADMIN) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t('totalVoters')} value={stats?.totalVoters ?? 0} icon={<Vote size={20} />} gradient="from-[#7B1D1D] to-[#9B2C2C]" />
          <StatCard title={t('totalWards')} value={stats?.totalWards ?? 0} icon={<MapPin size={20} />} gradient="from-[#C05621] to-[#DD6B20]" />
          <StatCard title={t('totalAdmins')} value={stats?.totalAdmins ?? 0} icon={<Users size={20} />} gradient="from-[#B7791F] to-[#D69E2E]" />
          <StatCard title={t('wardAdminsCount')} value={stats?.totalWardAdmins ?? 0} icon={<UserCheck size={20} />} gradient="from-[#6B3F1A] to-[#8B5E3C]" />
        </div>
      )}

      {/* Voter breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title={t('maleVoters')} value={stats?.maleVoters ?? 0} icon={<User size={20} />} gradient="from-[#1E40AF] to-[#3B82F6]" />
        <StatCard title={t('femaleVoters')} value={stats?.femaleVoters ?? 0} icon={<User size={20} />} gradient="from-[#9D174D] to-[#EC4899]" />
        <StatCard title={t('active')} value={stats?.activeVoters ?? 0} icon={<CheckCircle size={20} />} gradient="from-[#065F46] to-[#10B981]" />
      </div>

      {/* Submissions */}
      {!isRole(ROLES.WARD_ADMIN) && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard title={t('totalSubmissions')} value={stats?.totalSubmissions ?? 0} icon={<FileText size={20} />} gradient="from-[#7B1D1D] to-[#C05621]" />
          <StatCard title={t('otpVerifiedCount')} value={stats?.verifiedSubmissions ?? 0} icon={<TrendingUp size={20} />} gradient="from-[#065F46] to-[#10B981]" />
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ward-wise voters bar chart */}
        {stats?.wardWiseCount && stats.wardWiseCount.length > 0 && (
          <Card className="p-5">
            <h3 className="font-bold text-[#7B1D1D] mb-4 text-sm uppercase tracking-wide">{t('wardWiseVoters')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.wardWiseCount.slice(0, 10)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="wardName" tick={{ fontSize: 10, fill: '#6B3F1A' }} tickLine={false} axisLine={false}
                  tickFormatter={(v: string) => v.length > 8 ? v.slice(0, 8) + '…' : v} />
                <YAxis tick={{ fontSize: 10, fill: '#6B3F1A' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#FFFBF5', border: '1px solid #E8D5A3', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#7B1D1D', fontWeight: 600 }}
                />
                <Bar dataKey="count" fill="#7B1D1D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Gender distribution donut */}
        {genderData.length > 0 && (
          <Card className="p-5">
            <h3 className="font-bold text-[#7B1D1D] mb-4 text-sm uppercase tracking-wide">{t('genderDistribution')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {genderData.map((_, index) => (
                    <Cell key={index} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#FFFBF5', border: '1px solid #E8D5A3', borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#4A2C0A' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Recent imports */}
      {stats?.recentImports && stats.recentImports.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8D5A3] bg-[#FFFBF5]">
            <h3 className="font-bold text-[#7B1D1D] text-sm uppercase tracking-wide">{t('recentImports')}</h3>
          </div>
          <div className="divide-y divide-[#F5E6C8]">
            {stats.recentImports.map((imp) => (
              <div key={imp.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#FFFBF5] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FEF3E2] rounded-lg flex items-center justify-center text-[#B7791F]">
                    <FileText size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2D2D2D]">{imp.fileName}</p>
                    <p className="text-xs text-[#6B3F1A]/60">{new Date(imp.importedAt).toLocaleDateString('hi-IN')}</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  +{imp.inserted}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
