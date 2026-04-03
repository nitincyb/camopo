import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../firebase';
import { User, LogOut, ChevronLeft, Bell, Car, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';

const translations = {
  en: {
    profile: 'Profile',
    language: 'Language',
    becomeDriver: 'Become a Driver',
    signOut: 'Sign Out',
    enableNotifications: 'Enable Notifications'
  },
  hi: {
    profile: 'प्रोफ़ाइल',
    language: 'भाषा',
    becomeDriver: 'ड्राइवर बनें',
    signOut: 'साइन आउट',
    enableNotifications: 'सूचनाएं सक्षम करें'
  },
  gu: {
    profile: 'પ્રોફાઇલ',
    language: 'ભાષા',
    becomeDriver: 'ડ્રાઇવર બનો',
    signOut: 'સાઇન આઉટ',
    enableNotifications: 'સૂચનાઓ સક્ષમ કરો'
  }
};

export function Profile() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const language = (profile?.language as 'en' | 'hi' | 'gu') || 'en';
  const t = translations[language];

  const handleLanguageChange = async (newLang: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        language: newLang
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 space-y-8 text-zinc-50">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900 rounded-full text-zinc-50">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-black tracking-tight italic">{t.profile}</h1>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[32px] space-y-6 text-center">
        <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto flex items-center justify-center text-4xl font-black text-zinc-950">
          {profile?.displayName?.[0] || <User size={48} />}
        </div>
        
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-zinc-50">{profile?.displayName}</h2>
          <p className="text-zinc-500 text-sm">{profile?.email}</p>
          <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest mt-2">
            {profile?.role}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center gap-3 text-zinc-400 mb-4 px-2">
              <Languages size={18} />
              <span className="text-xs font-black uppercase tracking-widest">{t.language}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleLanguageChange('en')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${profile?.language === 'en' || !profile?.language ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
              >
                English
              </button>
              <button 
                onClick={() => handleLanguageChange('hi')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${profile?.language === 'hi' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
              >
                हिन्दी
              </button>
              <button 
                onClick={() => handleLanguageChange('gu')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${profile?.language === 'gu' ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
              >
                ગુજરાતી
              </button>
            </div>
          </div>

          {profile?.role === 'rider' && (
            <button 
              onClick={() => navigate('/driver-onboarding')}
              className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-zinc-950 font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-all"
            >
              <Car size={20} />
              {t.becomeDriver}
            </button>
          )}

          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center justify-center gap-3 bg-red-500/10 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-500/20 transition-all"
          >
            <LogOut size={20} />
            {t.signOut}
          </button>

          {'Notification' in window && Notification.permission !== 'granted' && (
            <button 
              onClick={async () => {
                if (profile?.uid) {
                  const { requestNotificationPermission } = await import('../../services/notificationService');
                  await requestNotificationPermission(profile.uid);
                }
              }}
              className="w-full flex items-center justify-center gap-3 bg-emerald-500/10 text-emerald-500 font-bold py-4 rounded-2xl hover:bg-emerald-500/20 transition-all"
            >
              <Bell size={20} />
              {t.enableNotifications}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
