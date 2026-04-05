import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../firebase';
import { User, LogOut, Settings, Wallet, Globe, Shield, CreditCard, Clock, Bell, HelpCircle, ChevronRight, ArrowRight, Car, Home, History, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';

export function Profile() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const language = (profile?.language as 'en' | 'hi' | 'gu') || 'en';
  
  const [ridesCount, setRidesCount] = useState(0);
  const [distance, setDistance] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Inject Fonts and Custom Animations
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Sora:wght@100..800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes riseIn {
        0%   { transform: translateY(16px) translateZ(0); opacity: 0; }
        100% { transform: translateY(0) translateZ(0); opacity: 1; }
      }
      .animate-rise-in {
        animation: riseIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      @keyframes avatarEnter {
        0% { transform: scale(0.65); opacity: 0; }
        60% { transform: scale(1.08); }
        100% { transform: scale(1.0); opacity: 1; }
      }
      .animate-avatar-enter {
        animation: avatarEnter 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s both;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-ring {
        animation: spin 5s linear infinite;
        will-change: transform;
        transform: translateZ(0);
      }
      .glass-card {
        background: rgba(255,255,255,0.04);
        backdrop-filter: blur(20px) saturate(160%);
        -webkit-backdrop-filter: blur(20px) saturate(160%);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.07), 0 8px 32px rgba(0,0,0,0.35);
      }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    // Count up animation with ease-out cubic
    const duration = 1200;
    const start = performance.now();
    // Default values as per specification
    const targetRides = 24;
    const targetDistance = 87;

    let rAF: number;
    const updateCounters = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setRidesCount(Math.floor(targetRides * easeOut));
      setDistance(Math.floor(targetDistance * easeOut));

      if (progress < 1) rAF = requestAnimationFrame(updateCounters);
    };
    rAF = requestAnimationFrame(updateCounters);
    return () => cancelAnimationFrame(rAF);
  }, [profile?.stats]);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      setScrolled(scrollContainerRef.current.scrollTop > 10);
    };
    const el = scrollContainerRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageChange = async (newLang: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { language: newLang });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleSignOut = () => {
    if (window.confirm('Sign out of CampusMobility?')) {
      auth.signOut();
    }
  };

  const SectionLabel = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div 
      className={`mx-4 mb-2 text-[10px] text-white/25 uppercase tracking-[0.15em] font-medium ${className}`}
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      {children}
    </div>
  );

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 bg-[#080C09] overflow-y-auto no-scrollbar"
      style={{ paddingBottom: '100px' }}
    >
      {/* ════════ HEADER ════════ */}
      <div 
        className={`sticky top-0 z-50 px-4 pt-10 pb-4 flex justify-between items-center transition-all duration-300 ${
          scrolled ? 'bg-[#080C09]/95 backdrop-blur-[20px]' : 'bg-transparent'
        }`}
      >
        <div className="w-10" />
        <h1 
          className="text-[18px] font-semibold text-[#F0FFF4]" 
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          Profile
        </h1>
        <button 
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/08 active:rotate-90 transition-all duration-300"
          onClick={() => {}} 
        >
          <Settings size={18} className="text-white/50" />
        </button>
      </div>

      <div className="pb-10">
        
        {/* ════════ IDENTITY CARD ════════ */}
        <div 
          className="mx-4 mt-3 mb-6 glass-card p-6 animate-rise-in"
          style={{ animationDelay: '0.06s' }}
        >
          <div className="flex flex-col items-center">
            <div className="relative w-[84px] h-[84px] flex items-center justify-center">
              <div 
                className="absolute w-[92px] h-[92px] rounded-full animate-spin-ring"
                style={{
                  zIndex: 1,
                  padding: '2px',
                  background: 'conic-gradient(#22C55E 0deg, rgba(34,197,94,0.10) 180deg, #22C55E 360deg)',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #fff calc(100% - 2.5px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #fff calc(100% - 2.5px))'
                }}
              />
              
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-[84px] h-[84px] rounded-full object-cover animate-avatar-enter" 
                  style={{ zIndex: 2, position: 'relative' }}
                />
              ) : (
                <div 
                  className="w-[84px] h-[84px] rounded-full flex items-center justify-center bg-[#0D1A0F] border-2 border-[#22C55E] animate-avatar-enter"
                  style={{ zIndex: 2, position: 'relative' }}
                >
                  <span 
                    className="text-[30px] font-bold text-[#22C55E]"
                    style={{ fontFamily: 'Sora, sans-serif' }}
                  >
                    {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'P'}
                  </span>
                </div>
              )}
            </div>

            <h2 
              className="text-[20px] font-semibold text-[#F0FFF4] mt-[14px]"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              {profile?.displayName || 'User'}
            </h2>
            <p 
              className="text-[13px] text-white/38 mt-1"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {user?.email || 'user@campus.edu'}
            </p>
            
            <div 
              className="mt-2 px-[14px] py-[5px] rounded-full bg-[#22C55E1A] border border-[#22C55E38] text-[#4ADE80] text-[10px] uppercase font-medium tracking-[0.12em]"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              {profile?.role === 'driver' ? 'DRIVER' : 'RIDER'}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/06">
            <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
                <div className="text-[18px] font-semibold text-[#F0FFF4]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {ridesCount}
                </div>
                <div className="text-[10px] text-white/28 uppercase tracking-[0.10em] mt-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  RIDES
                </div>
              </div>
              <div className="w-[1px] h-6 bg-white/07" />
              <div className="flex-1 text-center">
                <div className="text-[18px] font-semibold text-[#F0FFF4]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {distance}
                </div>
                <div className="text-[10px] text-white/28 uppercase tracking-[0.10em] mt-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  DISTANCE
                </div>
              </div>
              <div className="w-[1px] h-6 bg-white/07" />
              <div className="flex-1 text-center">
                <div className="text-[18px] font-semibold text-[#F0FFF4]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  2024
                </div>
                <div className="text-[10px] text-white/28 uppercase tracking-[0.10em] mt-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                  SINCE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ LANGUAGE ════════ */}
        <div className="animate-rise-in" style={{ animationDelay: '0.12s' }}>
          <SectionLabel>LANGUAGE</SectionLabel>
          <div className="mx-4 glass-card p-4">
            <div className="flex items-center gap-3 mb-3">
              <Globe size={16} className="text-white/40" />
              <span className="text-[14px] font-medium text-[#F0FFF4]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Select Language
              </span>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'en', label: 'English' },
                { id: 'hi', label: 'हिन्दी' },
                { id: 'gu', label: 'ગુજરાતી' }
              ].map(lang => {
                const isActive = language === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className="flex-1 py-2 text-[13px] rounded-full transition-all duration-200 active:scale-95"
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      background: isActive ? '#22C55E' : 'rgba(255,255,255,0.05)',
                      border: isActive ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      color: isActive ? '#0A0F0B' : 'rgba(255,255,255,0.40)',
                      fontWeight: isActive ? 600 : 400
                    }}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════════ WALLET ════════ */}
        <div className="animate-rise-in" style={{ animationDelay: '0.17s' }}>
          <SectionLabel className="mt-6">WALLET</SectionLabel>
          <div className="mx-4 glass-card p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.10)' }}>
                  <Wallet size={18} className="text-[#22C55E]" />
                </div>
                <div>
                  <div className="text-[14px] font-medium text-[#F0FFF4]" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    Campus Wallet
                  </div>
                  <div className="text-[11px] text-white/30 mt-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    Available Balance
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[22px] font-semibold text-[#F0FFF4] mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                  ₹0.00
                </div>
                <button 
                  className="px-[14px] py-[6px] rounded-full text-[12px] font-medium transition-all active:scale-95"
                  style={{ 
                    fontFamily: 'DM Sans, sans-serif',
                    background: 'rgba(34,197,94,0.10)',
                    border: '1px solid rgba(34,197,94,0.22)',
                    color: '#4ADE80'
                  }}
                >
                  Add Money
                </button>
              </div>
            </div>
            <div className="h-[1px] bg-white/06 my-3" />
            <div className="text-center text-[12px] text-white/22 py-1" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              No transactions yet
            </div>
          </div>
        </div>

        {/* ════════ SETTINGS ════════ */}
        <div className="animate-rise-in" style={{ animationDelay: '0.22s' }}>
          <SectionLabel className="mt-6">ACCOUNT</SectionLabel>
          <div className="mx-4 glass-card overflow-hidden">
            {[
              { id: 'profile', icon: User, label: 'Edit Profile', component: 'chevron' },
              { id: 'payment', icon: CreditCard, label: 'Payment Methods', subLabel: 'Personal • UPI', component: 'chevron' },
              { id: 'history', icon: Clock, label: 'Ride History', component: 'chevron' },
              { id: 'driver', icon: Car, label: 'Become a Driver', subLabel: 'Earn on your schedule', component: 'arrow', highlight: true },
              { id: 'notifications', icon: Bell, label: 'Notifications', component: 'toggle' },
              { id: 'help', icon: HelpCircle, label: 'Help & Support', component: 'chevron' },
            ].map((item, i, arr) => (
              <React.Fragment key={item.id}>
                <button className={`w-full h-[54px] px-4 flex items-center justify-between group active:bg-white/5 transition-colors ${item.highlight ? 'bg-[#22C55E08]' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-[34px] h-[34px] rounded-full flex items-center justify-center transition-colors"
                      style={{ background: item.highlight ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.05)' }}
                    >
                      <item.icon size={16} className={item.highlight ? 'text-[#22C55E]' : 'text-white/40'} />
                    </div>
                    <div className="text-left">
                      <div className="text-[14px] font-medium text-[#F0FFF4] leading-tight" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {item.label}
                      </div>
                      {item.subLabel && (
                        <div className="text-[11px] text-white/28 mt-0.5" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {item.subLabel}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {item.component === 'chevron' && (
                      <ChevronRight size={14} className="text-white/18 group-active:translate-x-[2px] transition-transform" />
                    )}
                    {item.component === 'arrow' && (
                      <ArrowRight size={14} className="text-[#22C55E] group-active:translate-x-[2px] transition-transform" />
                    )}
                    {item.component === 'toggle' && (
                      <div className="w-[34px] h-[20px] rounded-full relative bg-[#22C55E]">
                        <div className="absolute right-[2px] top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm" />
                      </div>
                    )}
                  </div>
                </button>
                {i < arr.length - 1 && <div className="h-[1px] bg-white/05 ml-[62px]" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ════════ SIGN OUT ════════ */}
        <div className="animate-rise-in" style={{ animationDelay: '0.27s' }}>
          <div className="mx-4 mt-6">
            <button 
              onClick={handleSignOut}
              className="w-full h-[52px] px-4 flex items-center gap-3 rounded-[14px] active:bg-[#EF44441A] transition-all group"
              style={{ 
                background: 'rgba(239,68,68,0.05)', 
                border: '1px solid rgba(239,68,68,0.10)', 
                borderLeft: '2px solid rgba(239,68,68,0.28)' 
              }}
            >
              <LogOut size={16} className="text-[#EF4444]/45 group-active:text-[#EF4444]/85 transition-colors" />
              <span className="text-[14px] font-medium text-[#EF4444]/55 group-active:text-[#EF4444]/85 transition-colors" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Sign Out
              </span>
            </button>
          </div>
        </div>

        <div className="text-center mt-6 mb-4 text-[11px] text-white/12 font-medium" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          CampusMobility v1.0.0
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-[#080C09]/95 backdrop-blur-[20px] border-t border-white/05 px-2 pb-safe">
          <div className="max-w-xl mx-auto flex items-center justify-around py-2">
            <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 py-1 px-3 text-white/30 hover:text-white/60 transition-colors">
              <Home size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
            </button>
            <button onClick={() => navigate('/history')} className="flex flex-col items-center gap-1 py-1 px-3 text-white/30 hover:text-white/60 transition-colors">
              <History size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">History</span>
            </button>
            <button onClick={() => navigate('/ride-sharing')} className="relative flex flex-col items-center gap-1 py-1 px-4">
              <div className="w-11 h-11 -mt-5 bg-[#22C55E] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(34,197,94,0.35)]">
                <Users size={20} className="text-[#080C09]" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#22C55E]">Share</span>
            </button>
            <button onClick={() => navigate('/support')} className="flex flex-col items-center gap-1 py-1 px-3 text-white/30 hover:text-white/60 transition-colors">
              <HelpCircle size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Support</span>
            </button>
            <button className="flex flex-col items-center gap-1 py-1 px-3 text-[#22C55E]">
              <User size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
