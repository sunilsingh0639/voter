import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ChevronDown, X, ZoomIn } from 'lucide-react';
import { publicService } from '../../services';
import InterestPopup from '../../components/public/InterestPopup';
import { POPUP_SHOWN_KEY, POPUP_SUBMITTED_KEY, POPUP_DELAY_MS, LANG_KEY } from '../../constants';
import type { InterestOption, GalleryImage } from '../../types';

// Rajasthan/Churu region fallback images (open-license Unsplash)
const FALLBACK_HERO = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&q=80&auto=format&fit=crop';
const FALLBACK_ABOUT = 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80&auto=format&fit=crop';

const PublicWebsite: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [popupOpen, setPopupOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const popupShownRef = useRef(false);

  const { data: optionsData } = useQuery({ queryKey: ['public-options'], queryFn: publicService.getInterestOptions });
  const { data: galleryData } = useQuery({ queryKey: ['public-gallery'], queryFn: publicService.getGallery });

  const options: InterestOption[] = optionsData?.data?.data || [];
  const gallery: GalleryImage[] = galleryData?.data?.data || [];
  const lang = i18n.language;

  // Scroll listener for navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto popup
  useEffect(() => {
    const alreadyShown = localStorage.getItem(POPUP_SHOWN_KEY);
    const alreadySubmitted = localStorage.getItem(POPUP_SUBMITTED_KEY);
    if (alreadyShown || alreadySubmitted || popupShownRef.current) return;
    const timer = setTimeout(() => {
      popupShownRef.current = true;
      setPopupOpen(true);
      localStorage.setItem(POPUP_SHOWN_KEY, 'true');
    }, POPUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const switchLang = (l: string) => {
    i18n.changeLanguage(l);
    localStorage.setItem(LANG_KEY, l);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '#home', label: t('navHome') },
    { href: '#about', label: t('navAbout') },
    { href: '#gallery', label: t('navGallery') },
    { href: '#contact', label: t('navContact') },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF5] font-devanagari">

      {/* ── Sticky Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-[#E8D5A3]' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${scrolled ? 'bg-[#7B1D1D] text-white' : 'bg-white/20 text-white backdrop-blur-sm'}`}>ढ</div>
            <div>
              <p className={`font-bold text-lg leading-tight transition-colors ${scrolled ? 'text-[#7B1D1D]' : 'text-white'}`}>ढढेरू</p>
              <p className={`text-xs leading-tight transition-colors ${scrolled ? 'text-[#B7791F]' : 'text-white/70'}`}>चूरू, राजस्थान</p>
            </div>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#F6AD55] ${scrolled ? 'text-[#4A2C0A]' : 'text-white/90'}`}>
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <div className={`flex gap-0.5 rounded-full p-0.5 ${scrolled ? 'bg-[#F5E6C8]' : 'bg-white/20'}`}>
              <button onClick={() => switchLang('hi')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang === 'hi' ? 'bg-[#7B1D1D] text-white shadow-sm' : scrolled ? 'text-[#4A2C0A]' : 'text-white/80'}`}>
                हिंदी
              </button>
              <button onClick={() => switchLang('en')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${lang === 'en' ? 'bg-[#7B1D1D] text-white shadow-sm' : scrolled ? 'text-[#4A2C0A]' : 'text-white/80'}`}>
                EN
              </button>
            </div>

            {/* CTA button */}
            <button onClick={() => setPopupOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-[#B7791F] hover:bg-[#D69E2E] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-md hover:shadow-lg">
              ⭐ {t('sharePreference')}
            </button>

            {/* Mobile menu */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`md:hidden p-1.5 rounded-lg ${scrolled ? 'text-[#7B1D1D]' : 'text-white'}`}>
              {mobileMenuOpen ? <X size={20} /> : <span className="text-xl">☰</span>}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#E8D5A3] px-4 py-3 space-y-1 shadow-lg">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-[#4A2C0A] hover:text-[#7B1D1D] border-b border-[#F5E6C8] last:border-0">
                {link.label}
              </a>
            ))}
            <button onClick={() => { setPopupOpen(true); setMobileMenuOpen(false); }}
              className="w-full mt-2 bg-[#7B1D1D] text-white py-2.5 rounded-xl text-sm font-semibold">
              ⭐ {t('sharePreference')}
            </button>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={FALLBACK_HERO} alt="Rajasthan landscape"
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(92,20,20,0.85) 0%, rgba(123,29,29,0.75) 40%, rgba(192,86,33,0.65) 80%, rgba(183,121,31,0.5) 100%)' }} />
        </div>

        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(246,173,85,0.3) 40px, rgba(246,173,85,0.3) 41px)`,
          }} />

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
          {/* Location badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-xs px-4 py-1.5 rounded-full border border-white/30 mb-6">
            <MapPin size={12} className="text-[#F6AD55]" />
            {t('heroLocation')}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
            {t('heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-white/85 mb-3 font-medium">{t('heroSubtitle')}</p>
          <p className="text-white/60 text-sm mb-10 tracking-widest uppercase">{t('appTagline')}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => setPopupOpen(true)}
              className="px-8 py-4 bg-[#B7791F] hover:bg-[#D69E2E] text-white rounded-2xl font-bold text-base transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0">
              ⭐ {t('heroCta1')}
            </button>
            <a href="#about"
              className="px-8 py-4 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white rounded-2xl font-semibold text-base transition-all border border-white/30 hover:border-white/50">
              {t('heroCta2')}
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <a href="#about" className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 hover:text-white transition-colors animate-bounce">
          <ChevronDown size={28} />
        </a>
      </section>

      {/* ── About Section ── */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#B7791F] text-sm font-semibold uppercase tracking-widest mb-2">हमारे बारे में</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#7B1D1D] mb-3">{t('aboutDhadheru')}</h2>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-[#E8D5A3]" />
              <div className="w-2 h-2 bg-[#B7791F] rounded-full" />
              <div className="h-px w-12 bg-[#E8D5A3]" />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <img src={FALLBACK_ABOUT} alt="Dhadheru village"
                  className="w-full h-80 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.parentElement!.style.background = 'linear-gradient(135deg, #7B1D1D, #C05621)';
                    el.style.display = 'none';
                  }} />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-[#7B1D1D] text-white rounded-2xl p-4 shadow-xl">
                <p className="text-2xl font-bold font-devanagari">ढढेरू</p>
                <p className="text-[#F6AD55] text-xs">चूरू, राजस्थान</p>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <p className="text-[#4A2C0A] text-base leading-relaxed">{t('aboutText')}</p>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('aboutLocation'), value: t('aboutLocationValue'), icon: '📍' },
                  { label: t('aboutDistrict'), value: t('aboutDistrictValue'), icon: '🏛️' },
                  { label: t('aboutTehsil'), value: t('aboutTehsilValue'), icon: '🗺️' },
                  { label: t('aboutState'), value: t('aboutStateValue'), icon: '🏔️' },
                ].map((item) => (
                  <div key={item.label} className="bg-[#FFFBF5] border border-[#E8D5A3] rounded-xl p-3 hover:border-[#B7791F]/50 transition-colors">
                    <p className="text-lg mb-1">{item.icon}</p>
                    <p className="text-xs text-[#6B3F1A]/60 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-bold text-[#7B1D1D] font-devanagari">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gallery Section ── */}
      {gallery.length > 0 && (
        <section id="gallery" className="py-20 px-4" style={{ background: 'linear-gradient(180deg, #FEF3E2 0%, #FFFBF5 100%)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[#B7791F] text-sm font-semibold uppercase tracking-widest mb-2">गांव की झलक</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#7B1D1D] mb-3">{t('galleryTitle')}</h2>
              <p className="text-[#6B3F1A]/70 text-sm">{t('gallerySubtitle')}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="h-px w-12 bg-[#E8D5A3]" />
                <div className="w-2 h-2 bg-[#B7791F] rounded-full" />
                <div className="h-px w-12 bg-[#E8D5A3]" />
              </div>
            </div>

            {/* Masonry-style gallery */}
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
              {gallery.map((img, i) => (
                <div key={img.id}
                  className={`break-inside-avoid group relative overflow-hidden rounded-xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 ${i === 0 ? 'row-span-2' : ''}`}
                  onClick={() => setLightboxImg(img.imageUrl)}>
                  <img src={img.imageUrl} alt={lang === 'hi' ? img.titleHindi : img.titleEnglish}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    style={{ aspectRatio: i % 3 === 0 ? '3/4' : '4/3' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#5C1414]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                      <p className="text-white text-xs font-medium">{lang === 'hi' ? img.titleHindi : img.titleEnglish}</p>
                      <ZoomIn size={16} className="text-white/80" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Interest CTA Section ── */}
      <section className="py-20 px-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #5C1414 0%, #7B1D1D 50%, #C05621 100%)' }}>
        {/* Decorative */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-[#F6AD55] text-sm font-semibold uppercase tracking-widest mb-3">आपकी भागीदारी</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('ctaTitle')}</h2>
          <p className="text-white/75 text-base mb-8 leading-relaxed max-w-xl mx-auto">{t('ctaSubtitle')}</p>
          <button onClick={() => setPopupOpen(true)}
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#B7791F] hover:bg-[#D69E2E] text-white rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
            ⭐ {t('ctaButton')}
          </button>
        </div>
      </section>

      {/* ── Contact Section ── */}
      <section id="contact" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#B7791F] text-sm font-semibold uppercase tracking-widest mb-2">{t('contactSubtitle')}</p>
          <h2 className="text-3xl font-bold text-[#7B1D1D] mb-3">{t('contactTitle')}</h2>
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-px w-12 bg-[#E8D5A3]" />
            <div className="w-2 h-2 bg-[#B7791F] rounded-full" />
            <div className="h-px w-12 bg-[#E8D5A3]" />
          </div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: '📍', title: 'पता', value: 'ढढेरू, चूरू, राजस्थान' },
              { icon: '🏛️', title: 'जिला', value: 'चूरू' },
              { icon: '🗺️', title: 'राज्य', value: 'राजस्थान' },
            ].map((item) => (
              <div key={item.title} className="bg-[#FFFBF5] border border-[#E8D5A3] rounded-2xl p-5 hover:border-[#B7791F]/50 transition-colors">
                <p className="text-3xl mb-2">{item.icon}</p>
                <p className="text-xs text-[#6B3F1A]/60 uppercase tracking-wide mb-1">{item.title}</p>
                <p className="font-bold text-[#7B1D1D] font-devanagari">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'linear-gradient(135deg, #2D1010 0%, #4A2C0A 100%)' }}>
        <div className="pattern-border" />
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-[#B7791F] rounded-xl flex items-center justify-center text-white font-bold">ढ</div>
                <div>
                  <p className="text-white font-bold font-devanagari">ढढेरू</p>
                  <p className="text-[#F6AD55] text-xs">चूरू, राजस्थान</p>
                </div>
              </div>
              <p className="text-white/50 text-xs leading-relaxed">{t('footerTagline')}</p>
            </div>

            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">त्वरित लिंक</p>
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className="block text-white/50 hover:text-[#F6AD55] text-sm transition-colors">{link.label}</a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">जानकारी</p>
              <div className="space-y-1 text-white/50 text-sm">
                <p>📍 ढढेरू, चूरू</p>
                <p>🏛️ राजस्थान, भारत</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-white/40 text-xs">{t('footerCopyright')}</p>
            <p className="text-white/30 text-xs">{t('footerDisclaimer')}</p>
          </div>
        </div>
      </footer>

      {/* ── Sticky CTA button ── */}
      <button onClick={() => setPopupOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-[#7B1D1D] hover:bg-[#9B2C2C] text-white px-5 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all font-semibold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 border-2 border-[#B7791F]/50">
        <span>⭐</span>
        <span className="hidden sm:inline">{t('sharePreference')}</span>
      </button>

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2">
            <X size={20} />
          </button>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-xl shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <InterestPopup isOpen={popupOpen} onClose={() => setPopupOpen(false)} options={options} language={lang} />
    </div>
  );
};

export default PublicWebsite;
