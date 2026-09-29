import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, Lock, Globe } from 'lucide-react';
import { authService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/ui';
import { getErrorMessage } from '../../utils/helpers';
import { LANG_KEY } from '../../constants';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      const { data } = await authService.login(username, password);
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token, data.data.refreshToken);
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const switchLang = () => {
    const next = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(next);
    localStorage.setItem(LANG_KEY, next);
  };

  return (
    <div className="min-h-screen flex bg-[#FFFBF5]">
      {/* ── Left panel – Rajasthan visual ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #5C1414 0%, #7B1D1D 35%, #C05621 70%, #B7791F 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full" />

        {/* Mandala pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, transparent 30%, rgba(246,173,85,0.3) 31%, transparent 32%),
              radial-gradient(circle at 50% 50%, transparent 45%, rgba(246,173,85,0.2) 46%, transparent 47%),
              radial-gradient(circle at 50% 50%, transparent 60%, rgba(246,173,85,0.1) 61%, transparent 62%)`,
            backgroundSize: '300px 300px',
            backgroundPosition: 'center',
          }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#B7791F] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">ढ</div>
              <div>
                <h1 className="text-white font-bold text-2xl font-devanagari leading-tight">ढढेरू</h1>
                <p className="text-[#F6AD55] text-sm">चूरू, राजस्थान</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-white text-4xl font-bold font-devanagari leading-tight mb-3">
                हमारा गांव,<br />हमारी पहचान
              </h2>
              <p className="text-white/70 text-base leading-relaxed">
                ढढेरू मतदाता सूचना प्रणाली — गांव के विकास में आपकी भागीदारी।
              </p>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'जिला', value: 'चूरू' },
                { label: 'राज्य', value: 'राजस्थान' },
                { label: 'तहसील', value: 'चूरू' },
                { label: 'पोर्टल', value: 'मतदाता सूचना' },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <p className="text-white/60 text-xs mb-0.5">{item.label}</p>
                  <p className="text-white font-semibold text-sm font-devanagari">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="pattern-border mb-4" />
            <p className="text-white/40 text-xs">© 2025 ढढेरू मतदाता सूचना प्रणाली</p>
          </div>
        </div>
      </div>

      {/* ── Right panel – Login form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#7B1D1D] to-[#C05621] rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-lg">ढ</div>
            <h1 className="text-2xl font-bold text-[#7B1D1D] font-devanagari">ढढेरू</h1>
            <p className="text-[#6B3F1A] text-sm">चूरू, राजस्थान</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8D5A3] overflow-hidden">
            {/* Card top pattern */}
            <div className="pattern-border" />

            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#7B1D1D] font-devanagari">{t('loginTitle')}</h2>
                  <p className="text-sm text-[#6B3F1A]/70 mt-0.5">{t('loginSubtitle')}</p>
                </div>
                <button onClick={switchLang}
                  className="flex items-center gap-1.5 text-xs text-[#7B1D1D] bg-[#FEF3E2] hover:bg-[#F5E6C8] px-3 py-1.5 rounded-lg border border-[#E8D5A3] transition-colors font-medium">
                  <Globe size={12} />
                  {i18n.language === 'hi' ? 'EN' : 'हिंदी'}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={t('username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('username')}
                  required
                  autoFocus
                  autoComplete="username"
                  icon={<User size={15} />}
                />

                <div className="w-full">
                  <label className="block text-xs font-semibold text-[#4A2C0A] mb-1.5 uppercase tracking-wide">{t('password')}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B7791F]"><Lock size={15} /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('password')}
                      required
                      autoComplete="current-password"
                      className="w-full pl-9 pr-10 py-2.5 border border-[#E8D5A3] rounded-lg text-sm bg-white text-[#2D2D2D] placeholder-[#B7791F]/50 focus:outline-none focus:ring-2 focus:ring-[#B7791F]/40 focus:border-[#B7791F] transition-colors hover:border-[#B7791F]/60"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B7791F]/60 hover:text-[#B7791F] transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                  {t('login')}
                </Button>
              </form>

              {/* Divider */}
              <div className="mt-6 pt-4 border-t border-[#E8D5A3]">
                <p className="text-xs text-center text-[#6B3F1A]/50">
                  ढढेरू मतदाता प्रबंधन प्रणाली v1.0
                </p>
              </div>
            </div>
          </div>

          {/* Back to public site */}
          <div className="text-center mt-4">
            <a href="/" className="text-xs text-[#6B3F1A]/60 hover:text-[#7B1D1D] transition-colors">
              ← सार्वजनिक वेबसाइट पर जाएं
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
