import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, ClipboardList, Users, MessageSquare, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BottomNavProps {
  activeTab?: 'home' | 'trips' | 'support' | 'profile' | 'share';
}

export default function BottomNav({ activeTab: propActiveTab }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on route if not provided
  const getActiveTab = () => {
    if (propActiveTab) return propActiveTab;
    const path = location.pathname;
    if (path === '/' || path === '/rider-home') return 'home';
    if (path === '/history') return 'trips';
    if (path === '/support') return 'support';
    if (path === '/profile') return 'profile';
    if (path === '/ride-sharing') return 'share';
    return 'home';
  };

  const activeTab = getActiveTab();

  const tabs = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'trips', icon: ClipboardList, label: 'History', path: '/history' },
    { id: 'share', icon: Users, label: 'Share', path: '/ride-sharing', isCenter: true },
    { id: 'support', icon: MessageSquare, label: 'Support', path: '/support' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <motion.div 
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] isolation-isolate"
      style={{ width: 'calc(100% - 48px)', maxWidth: '360px' }}
      initial={{ y: 100, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: 0.4,
        ease: [0.34, 1.56, 0.64, 1]
      }}
    >
      <div className="relative h-16 rounded-[32px] overflow-hidden border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.60)]">
        
        {/* Layer 0: Background Video */}
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 rounded-[32px]"
        >
          <source src="/assets/name-bg.mp4" type="video/mp4" />
        </video>

        {/* Layer 1: Dark Dim Overlay & Blur */}
        <div 
          className="absolute inset-0 z-[1] rounded-[32px] bg-black/78 backdrop-blur-[16px]" 
        />

        {/* Layer 2: Subtle Edge Highlight */}
        <div className="absolute inset-0 z-[2] rounded-[32px] border border-white/[0.08] pointer-events-none" />

        {/* Layer 4: Content */}
        <div className="relative z-10 flex items-center justify-around h-full px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            if (tab.isCenter) {
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className="relative flex-shrink-0 mx-1 group"
                  whileTap={{ scale: 0.88 }}
                  initial={false}
                >
                  {/* Button Core */}
                  <div className="w-[52px] h-[52px] bg-transparent rounded-full flex items-center justify-center relative overflow-hidden transition-all duration-300">
                    {/* Video Layer */}
                    <video 
                      autoPlay loop muted playsInline 
                      className="absolute inset-0 w-full h-full object-cover"
                    >
                      <source src="/assets/name-bg.mp4" />
                    </video>

                    {/* Edge Border over video */}
                    <div className="absolute inset-0 border-[1.5px] border-white/20 rounded-full z-10 pointer-events-none" />
                    
                    {/* Icon Sitting Above */}
                    <Icon 
                      size={22} 
                      className="relative z-20 text-white opacity-90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]" 
                      strokeWidth={2.5} 
                    />
                  </div>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center justify-center min-w-[48px] py-1 gap-[3px] rounded-full"
                whileTap={{
                  scale: 0.82,
                  transition: { type: 'spring', stiffness: 500, damping: 15 }
                }}
              >
                {/* Active Indicator Background */}
                {isActive && (
                  <motion.div
                    layoutId="navActiveBg"
                    className="absolute inset-0 bg-white/8 border border-white/10 rounded-full -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Top Indicator Dot */}
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-1 h-1 bg-[#22C55E] rounded-full"
                  />
                )}

                <motion.div
                  className={isActive ? 'text-[#22C55E]' : 'text-white/35'}
                  animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>

                <span className={`text-[8px] font-medium tracking-wider uppercase font-dm ${isActive ? 'text-[#22C55E]' : 'text-white/22'}`}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
