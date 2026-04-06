import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../firebase';
import { Globe, ChevronRight, Home, History, Users, HelpCircle, User, CreditCard, Bell, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';

export function Profile() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const language = (profile?.language as 'en' | 'hi' | 'gu') || 'en';
  
  const [ridesCount, setRidesCount] = useState(0);
  const [distance, setDistance] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isSweeping, setIsSweeping] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const playSequence = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setIsSweeping(true);
    const t1 = setTimeout(() => setIsSweeping(false), 1500);
    timeoutsRef.current = [t1];
  };

  useEffect(() => {
    const t = setTimeout(playSequence, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Sora:wght@100..800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes sweep {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
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
    const duration = 1200;
    const start = performance.now();
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
  }, [profile]);

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

  return (
    <div 
      ref={scrollContainerRef}
      className="fixed inset-0 bg-zinc-950 overflow-y-auto no-scrollbar pb-[100px]"
    >
      {/* ════════ HEADER ════════ */}
      <motion.div 
        className="px-5 pt-20 pb-4"
        initial={{ opacity: 0, y: 14 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, delay: 0, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 opacity-50">Profile</h1>
            <motion.div 
               onClick={playSequence}
               whileTap={{ scale: 0.96 }}
               style={{ 
                  position: 'relative',
                  display: 'inline-block',
                  cursor: 'pointer',
                  userSelect: 'none',
               }}
            >
              <h1 
                style={{
                  fontSize: '56px',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.0,
                  margin: 0,
                  fontFamily: '"Sora", sans-serif',
                  background: 'linear-gradient(90deg, #F59E0B, #10B981, #F59E0B)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: isSweeping ? 'sweep 1.5s ease-out forwards' : 'none',
                  textShadow: '0 0 30px rgba(16,185,129,0.15)'
                }}>
                {profile?.displayName || 'Raj Tak'}
              </h1>
            </motion.div>
            <p className="text-zinc-500 text-sm mt-1.5 font-medium opacity-80">{user?.email || 'user@campus.edu'}</p>
            <div className="mt-4 inline-flex">
              <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/20 tracking-wider">
                {profile?.role === 'driver' ? 'DRIVER' : 'RIDER'}
              </span>
            </div>
          </div>

          <motion.div 
            className="group relative w-11 h-11 shrink-0 ml-4"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div 
              className="absolute inset-[-3px] rounded-full z-0 pointer-events-none transition-[animation-duration] duration-300 ease-in-out group-hover:![animation-duration:1.5s]"
              style={{
                background: 'conic-gradient(from 0deg, #22C55E 0deg, rgba(34,197,94,0.10) 180deg, #22C55E 360deg)',
                maskImage: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
                WebkitMaskImage: 'radial-gradient(farthest-side, transparent calc(100% - 2px), white calc(100% - 2px))',
                animation: 'spin 4s linear infinite',
                willChange: 'transform',
                transform: 'translateZ(0)'
              }}
            />
            <div className="relative z-10 w-full h-full rounded-full border border-zinc-800 overflow-hidden flex items-center justify-center bg-[#181a20]">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-white">
                  {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'P'}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ════════ STATS ════════ */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, delay: 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="px-5 mt-8 mb-4">
          <h3 className="text-sm font-medium text-zinc-300">Activity</h3>
        </div>
        <div className="px-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: ridesCount, label: 'RIDES' },
              { value: distance, label: 'DISTANCE' },
              { value: '2024', label: 'SINCE' }
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                className="group relative overflow-hidden bg-[#181a20] rounded-2xl border border-white/[0.06] py-5 flex flex-col items-center justify-center hover:scale-[1.05] hover:-translate-y-[4px] hover:border-white/[0.12] transition-all duration-300 ease-in-out"
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="absolute top-0 left-[-100%] h-full w-[150%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-[800ms] ease-in-out pointer-events-none" />
                <span className="relative z-10 text-white font-semibold text-xl">{stat.value}</span>
                <span className="relative z-10 text-zinc-500 text-xs font-medium tracking-wide mt-1">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ════════ LANGUAGE ════════ */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, delay: 0.14, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="px-5 mt-6 mb-4">
          <h3 className="text-sm font-medium text-zinc-300">Language</h3>
        </div>
        <div className="px-5 flex gap-3 overflow-x-auto no-scrollbar">
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
                className={`px-4 py-2.5 rounded-full shrink-0 transition-colors ${
                  isActive 
                    ? 'bg-white text-black font-bold text-xs' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-medium'
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ════════ WALLET ════════ */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, delay: 0.21, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="px-5 mt-6 mb-4">
          <h3 className="text-sm font-medium text-zinc-300">Wallet</h3>
        </div>
        <div className="px-5">
          <div className="group relative overflow-hidden bg-[#181a20] rounded-2xl border border-white/[0.06] p-5 flex items-center justify-between hover:border-white/[0.12] transition-colors duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.06)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="absolute top-0 left-[-100%] h-full w-[150%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-[-20deg] group-hover:translate-x-[150%] transition-transform duration-[800ms] ease-in-out pointer-events-none" />
            
            <div className="relative z-10">
              <div className="text-white font-semibold text-2xl tracking-tight">₹0.00</div>
              <div className="text-zinc-500 text-xs mt-1">Available Balance</div>
            </div>
            <button className="relative z-10 bg-emerald-500/10 text-emerald-500 text-xs font-bold px-4 py-2 rounded-full border border-emerald-500/20 active:opacity-70 transition-opacity">
              Add Money
            </button>
          </div>
        </div>
      </motion.div>

      {/* ════════ SETTINGS ════════ */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="px-5 mt-6 mb-4">
          <h3 className="text-sm font-medium text-zinc-300">Settings</h3>
        </div>
        <div className="px-5">
          <div className="bg-[#181a20] rounded-2xl border border-white/[0.06] overflow-hidden">
            {[
              { id: 'profile', icon: User, label: 'Edit Profile' },
              { id: 'payment', icon: CreditCard, label: 'Payment Methods', subLabel: 'Personal • UPI' },
              { id: 'notifications', icon: Bell, label: 'Notifications', isToggle: true },
              { id: 'help', icon: HelpCircle, label: 'Help & Support' },
            ].map((item, i, arr) => (
              <motion.button 
                key={item.id}
                whileTap={{ scale: 0.98, x: 2 }}
                transition={{ duration: 0.1 }}
                className={`group w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-white/[0.02] transition-colors duration-200 ${
                  i < arr.length - 1 ? 'border-b border-white/[0.04]' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                  <item.icon size={18} className="text-zinc-400" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{item.label}</div>
                  {item.subLabel && <div className="text-zinc-600 text-xs mt-0.5">{item.subLabel}</div>}
                </div>
                {item.isToggle ? (
                  <div className="w-12 h-6 rounded-full bg-emerald-500 relative flex items-center px-1">
                    <motion.div 
                      className="w-4 h-4 rounded-full bg-white shadow-sm"
                      initial={{ x: 24 }}
                    />
                  </div>
                ) : (
                  <ChevronRight size={16} className="text-zinc-700 group-hover:translate-x-[3px] transition-transform duration-200" />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ════════ SIGN OUT ════════ */}
      <motion.div 
        initial={{ opacity: 0, y: 14 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.4, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="px-5 mt-4">
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 py-4 border-t border-white/[0.04] active:opacity-60 transition-opacity">
            <LogOut size={18} className="text-red-400" />
            <span className="text-red-400 font-medium text-sm">Sign out</span>
          </button>
        </div>
        <div className="text-zinc-700 text-[10px] text-center mt-3">
          CampusMobility v1.0.0
        </div>
      </motion.div>

      {/* Shared Bottom Navigation */}
      <BottomNav activeTab="profile" />
    </div>
  );
}
