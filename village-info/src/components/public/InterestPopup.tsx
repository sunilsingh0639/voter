import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, Phone, Shield, CheckCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { publicService } from '../../services';
import { POPUP_SUBMITTED_KEY, POPUP_SHOWN_KEY } from '../../constants';
import { getSessionId, getErrorMessage } from '../../utils/helpers';
import type { InterestOption } from '../../types';

type Step = 'interest' | 'mobile' | 'otp' | 'done';

interface InterestPopupProps {
  isOpen: boolean;
  onClose: () => void;
  options: InterestOption[];
  language: string;
}

const stepConfig = [
  { key: 'interest', label: 'पसंद', icon: '⭐' },
  { key: 'mobile', label: 'मोबाइल', icon: '📱' },
  { key: 'otp', label: 'OTP', icon: '🔐' },
];

const InterestPopup: React.FC<InterestPopupProps> = ({ isOpen, onClose, options, language }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('interest');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [submissionId, setSubmissionId] = useState<string>('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [mobileError, setMobileError] = useState('');
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  const currentStepIndex = step === 'interest' ? 0 : step === 'mobile' ? 1 : step === 'otp' ? 2 : 3;

  const handleSelectInterest = async (optionId: string) => {
    setSelectedOption(optionId);
    setLoading(true);
    try {
      const res = await publicService.submitInterest({ interestOptionId: optionId, sessionId: getSessionId(), language, source: 'website' });
      if (res.data.success && res.data.data) {
        setSubmissionId(res.data.data.submissionId);
        setStep('mobile');
      }
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) { setMobileError(t('invalidMobile')); return; }
    setMobileError('');
    setLoading(true);
    try {
      await publicService.sendOtp({ submissionId, mobileNumber: mobile });
      setStep('otp');
      setResendCooldown(60);
      toast.success(t('otpSent'));
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setOtpError(t('invalidOtp')); return; }
    setOtpError('');
    setLoading(true);
    try {
      const res = await publicService.verifyOtp({ submissionId, otp });
      if (res.data.success) {
        setStep('done');
        localStorage.setItem(POPUP_SUBMITTED_KEY, 'true');
        toast.success(t('otpVerified'));
      }
    } catch (err) { setOtpError(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  const handleSkipOtp = () => {
    localStorage.setItem(POPUP_SHOWN_KEY, 'true');
    onClose();
  };

  const handleClose = () => {
    localStorage.setItem(POPUP_SHOWN_KEY, 'true');
    onClose();
  };

  const selectedOpt = options.find(o => o.id === selectedOption);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#2D2D2D]/70 backdrop-blur-sm" onClick={step === 'done' ? handleClose : handleClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E8D5A3]"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5C1414 0%, #7B1D1D 60%, #C05621 100%)' }}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 px-5 pt-5 pb-4">
            <button onClick={handleClose}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="Close">
              <X size={14} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#B7791F] rounded-lg flex items-center justify-center text-white font-bold text-sm">ढ</div>
              <div>
                <p className="text-white font-bold text-sm font-devanagari">ढढेरू</p>
                <p className="text-[#F6AD55] text-xs">चूरू, राजस्थान</p>
              </div>
            </div>

            {step !== 'done' ? (
              <>
                <h2 className="text-white font-bold text-lg font-devanagari mb-0.5">{t('whoDoYouLike')}</h2>
                <p className="text-white/70 text-xs">{t('whoDoYouLikeSubtitle')}</p>
              </>
            ) : (
              <>
                <h2 className="text-white font-bold text-lg font-devanagari">धन्यवाद! 🙏</h2>
                <p className="text-white/70 text-xs">{t('thankYouSubtitle')}</p>
              </>
            )}
          </div>

          {/* Step indicator */}
          {step !== 'done' && (
            <div className="relative z-10 flex items-center justify-center gap-2 pb-4 px-5">
              {stepConfig.map((s, i) => (
                <React.Fragment key={s.key}>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${currentStepIndex === i ? 'bg-[#B7791F] text-white' : currentStepIndex > i ? 'bg-white/20 text-white/80' : 'bg-white/10 text-white/40'}`}>
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                  {i < stepConfig.length - 1 && <ChevronRight size={12} className="text-white/30" />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5">

          {/* ── Interest selection ── */}
          {step === 'interest' && (
            <div className="space-y-2">
              <p className="text-xs text-[#6B3F1A]/70 mb-3">{t('selectInterest')}</p>
              {options.length === 0 ? (
                <div className="text-center py-8 text-[#6B3F1A]/50 text-sm">
                  <p className="text-3xl mb-2">⭐</p>
                  <p>{t('noInterestOptions')}</p>
                </div>
              ) : (
                options.map((opt) => (
                  <button key={opt.id} onClick={() => handleSelectInterest(opt.id)} disabled={loading}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left group ${selectedOption === opt.id
                      ? 'border-[#7B1D1D] bg-[#FEF3E2] shadow-md'
                      : 'border-[#E8D5A3] hover:border-[#B7791F]/60 hover:bg-[#FFFBF5]'
                    }`}>
                    {opt.imageUrl ? (
                      <img src={opt.imageUrl} alt={opt.nameHindi}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-[#7B1D1D] to-[#C05621] rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm">⭐</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#2D2D2D] font-devanagari">{language === 'hi' ? opt.nameHindi : opt.nameEnglish}</p>
                      {language === 'hi' && opt.nameEnglish && (
                        <p className="text-xs text-[#6B3F1A]/60">{opt.nameEnglish}</p>
                      )}
                    </div>
                    {loading && selectedOption === opt.id ? (
                      <div className="w-5 h-5 border-2 border-[#7B1D1D] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : selectedOption === opt.id ? (
                      <CheckCircle size={18} className="text-[#7B1D1D] flex-shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-[#E8D5A3] group-hover:text-[#B7791F] flex-shrink-0 transition-colors" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── Mobile input ── */}
          {step === 'mobile' && (
            <div className="space-y-4">
              {selectedOpt && (
                <div className="flex items-center gap-2 p-3 bg-[#FEF3E2] rounded-xl border border-[#E8D5A3]">
                  <span className="text-[#B7791F]">✓</span>
                  <p className="text-sm text-[#4A2C0A] font-medium font-devanagari">
                    {language === 'hi' ? selectedOpt.nameHindi : selectedOpt.nameEnglish}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-[#4A2C0A] mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  <Phone size={12} className="text-[#B7791F]" />
                  {t('enterMobile')}
                </p>
                <div className="flex gap-0">
                  <span className="flex items-center px-3 bg-[#F5E6C8] border border-r-0 border-[#E8D5A3] rounded-l-xl text-[#4A2C0A] text-sm font-medium">+91</span>
                  <input type="tel" maxLength={10} value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="XXXXXXXXXX"
                    className="flex-1 px-3 py-2.5 border border-[#E8D5A3] rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B7791F]/40 focus:border-[#B7791F] bg-white"
                    autoFocus />
                </div>
                {mobileError && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">⚠ {mobileError}</p>}
              </div>

              <button onClick={handleSendOtp} disabled={loading || mobile.length !== 10}
                className="w-full py-3 bg-[#7B1D1D] hover:bg-[#9B2C2C] text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Phone size={15} />}
                {t('sendOtp')}
              </button>

              <button onClick={handleSkipOtp} className="w-full text-xs text-[#6B3F1A]/60 hover:text-[#6B3F1A] py-1 transition-colors">
                {t('skip')} →
              </button>
            </div>
          )}

          {/* ── OTP input ── */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div className="text-center p-3 bg-[#FEF3E2] rounded-xl border border-[#E8D5A3]">
                <p className="text-xs text-[#6B3F1A]/70">{t('enterOtp')}</p>
                <p className="text-sm font-bold text-[#7B1D1D]">+91 {mobile}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#4A2C0A] mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  <Shield size={12} className="text-[#B7791F]" />
                  6-digit OTP
                </p>
                <input type="tel" maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full px-4 py-4 border-2 border-[#E8D5A3] rounded-xl text-center text-3xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[#B7791F]/40 focus:border-[#B7791F] bg-white transition-colors"
                  autoFocus />
                {otpError && <p className="text-red-500 text-xs mt-1 text-center flex items-center justify-center gap-1">⚠ {otpError}</p>}
              </div>

              <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-[#7B1D1D] hover:bg-[#9B2C2C] text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Shield size={15} />}
                {t('verifyOtp')}
              </button>

              <div className="flex items-center justify-between text-xs">
                <button onClick={handleSkipOtp} className="text-[#6B3F1A]/60 hover:text-[#6B3F1A] transition-colors">{t('skip')}</button>
                <button onClick={() => { setStep('mobile'); setOtp(''); }} disabled={resendCooldown > 0}
                  className="flex items-center gap-1 text-[#B7791F] hover:text-[#7B1D1D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <RotateCcw size={11} />
                  {resendCooldown > 0 ? `${t('resendOtp')} (${resendCooldown}s)` : t('resendOtp')}
                </button>
              </div>
            </div>
          )}

          {/* ── Thank you ── */}
          {step === 'done' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#7B1D1D] to-[#C05621] rounded-full flex items-center justify-center text-4xl mx-auto shadow-xl">
                🙏
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#7B1D1D] font-devanagari mb-2">धन्यवाद!</h3>
                <p className="text-sm text-[#4A2C0A] leading-relaxed">{t('thankYou')}</p>
                <p className="text-xs text-[#6B3F1A]/60 mt-1">{t('thankYouSubtitle')}</p>
              </div>
              <button onClick={handleClose}
                className="px-8 py-3 bg-[#7B1D1D] hover:bg-[#9B2C2C] text-white rounded-xl font-semibold text-sm transition-colors shadow-md">
                {t('close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterestPopup;
