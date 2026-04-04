// CampusMobility Login - Version 2.0.0
import React, { useState, useEffect } from 'react';
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { LogIn, Key, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { logSecurityEvent } from '../../services/auditService';

// Calm, cinematic video — aerial road / city at dusk
const VIDEO_URL = 'https://videos.pexels.com/video-files/3015510/3015510-hd_1920_1080_24fps.mp4';

const RANDOM_HEADERS = [
  // Class & Attendance Core
  { title: "Get moving", subtitle: "Sign in to start your journey" },
  { title: "By the students", subtitle: "For the students" },
  { title: "Made by RRU", subtitle: "With ❤️ and probably too much caffeine" },
  { title: "Adventure awaits", subtitle: "Or just the library. We don't judge." },
  { title: "Ready to roll?", subtitle: "Let's get you where you need to be." },
  { title: "Is it a bird? Is it a plane?", subtitle: "No, it's just your ride arriving." },
  { title: "Next stop:", subtitle: "Academic success (hopefully)." },
  { title: "Buckle up", subtitle: "Your degree is waiting." },
  { title: "Campus bounds", subtitle: "Taking you from A to B." },
  { title: "Skip the sweat", subtitle: "Let us do the walking." },

  // Time & Panic
  { title: "Time is an illusion.", subtitle: "But your class starts in 5 minutes. Hurry up." },
  { title: "Running late?", subtitle: "We can't bend time, but we can drive." },
  { title: "The 8:59 AM Sprint", subtitle: "Let's get you there before the door locks." },
  { title: "Professor already there?", subtitle: "Time to slip in the back silently." },
  { title: "Attendance is mandatory.", subtitle: "Your walking is optional." },
  { title: "Snooze button regrets?", subtitle: "We've all been there. Hop in." },
  { title: "Don't run.", subtitle: "Riding is much more dignified." },
  { title: "Beat the clock", subtitle: "Campus rides on demand." },
  { title: "Out of time?", subtitle: "In to the cab." },
  { title: "Deadlines closer than they appear", subtitle: "So is your ride." },

  // Philosophical / Deep Humor
  { title: "I think, therefore I am...", subtitle: "...late for my 9 AM lecture." },
  { title: "To be or not to be...", subtitle: "...on time. That is the question." },
  { title: "Schrödinger's Class", subtitle: "You are both present and absent until you arrive." },
  { title: "Nihilism is exhausting.", subtitle: "Take a ride and rest your legs instead." },
  { title: "If a tree falls in a forest...", subtitle: "...it still needs a driver to get to class." },
  { title: "What is the meaning of life?", subtitle: "Passing this semester." },
  { title: "Plato's Cave", subtitle: "Is just the basement study room. Let's get out." },
  { title: "Existential dread?", subtitle: "At least you don't have to walk." },
  { title: "We are stardust.", subtitle: "Stardust that really needs a ride right now." },
  { title: "The absurd is born...", subtitle: "...from walking across campus in the sun." },

  // Student Life Jokes
  { title: "Why did the student cross the road?", subtitle: "To catch the campus ride, obviously." },
  { title: "My GPA might drop", subtitle: "But our drivers won't drop you." },
  { title: "Powered by coffee.", subtitle: "And electric motors." },
  { title: "Assignments due at 11:59", subtitle: "Your ride arrives at 11:50." },
  { title: "Group project meeting?", subtitle: "Don't be the one who's late." },
  { title: "Library all-nighter?", subtitle: "We'll get you back to bed." },
  { title: "Forgot your laptop charger?", subtitle: "Fastest U-turn on campus." },
  { title: "Mess food awaits", subtitle: "Beat the lunch queue." },
  { title: "Surviving on instant noodles?", subtitle: "At least your ride is premium." },
  { title: "Midterms incoming", subtitle: " Brace for impact." },

  // Random RRU Vibes
  { title: "Welcome to RRU", subtitle: "Where every minute counts." },
  { title: "Campus Mobility", subtitle: "Because running is for athletes." },
  { title: "The smart way", subtitle: "To navigate the campus." },
  { title: "Save your energy", subtitle: "You'll need it for the exams." },
  { title: "A ride for a ride", subtitle: "Share the journey." },
  { title: "Destination: Graduation", subtitle: "We're just helping you along the way." },
  { title: "No more long walks", subtitle: "Just smooth rides." },
  { title: "RRU's finest", subtitle: "Driven by the students." },
  { title: "Your campus, your ride", subtitle: "Take control of your time." },
  { title: "Less walking", subtitle: "More learning (or sleeping)." },

  // Wholesome / Motivating
  { title: "You got this.", subtitle: "One lecture at a time." },
  { title: "Deep breaths.", subtitle: "Your ride is on the way." },
  { title: "Make today count.", subtitle: "Starting with a good ride." },
  { title: "Smile", subtitle: "You're doing great." },
  { title: "A new day", subtitle: "A new journey." }
];

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [showDriverCodeModal, setShowDriverCodeModal] = useState(false);
  const [driverCode, setDriverCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [headerContent, setHeaderContent] = useState(RANDOM_HEADERS[0]);

  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * RANDOM_HEADERS.length);
    setHeaderContent(RANDOM_HEADERS[randomIdx]);
  }, []);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsVerifying(true);
    try {
      let userCred: UserCredential;
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          userCred = await signInWithCredential(auth, credential);
        } else {
          throw new Error("No ID token returned from Google Sign-In");
        }
      } else {
        userCred = await signInWithPopup(auth, googleProvider);
      }

      if (userCred && userCred.user) {
        await logSecurityEvent({
          action: 'User Login',
          userEmail: userCred.user.email || 'Unknown',
          userId: userCred.user.uid,
          details: `Logged in via Google. Intended role: ${localStorage.getItem('desiredRole') || 'rider'}`
        });
      }
    } catch (error: any) {
      const ignoredErrors = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', '12501'];
      if (!ignoredErrors.includes(error.code) && !ignoredErrors.includes(String(error.code))) {
        console.error("Login error:", error);
        setError(`Login failed: ${error.message || JSON.stringify(error)}`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDriverSubmit = async () => {
    if (driverCode.trim().toUpperCase() === 'CAMPUS2026') {
      setShowDriverCodeModal(false);
      setCodeError('');
      localStorage.setItem('desiredRole', 'driver');
      await handleGoogleLogin();
    } else {
      setCodeError('Invalid driver access code');
    }
  };

  const ease = [0.25, 0.46, 0.45, 0.94] as const;

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden bg-black selection:bg-emerald-500/30">

      {/* ── Video Background ── */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center scale-[1.05]"
          style={{ 
            filter: 'brightness(0.45) saturate(0.8)',
            transform: 'translateZ(0)',
            willChange: 'transform'
          }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* ── Main Content ── */}
      <div 
        className="relative z-10 w-full flex-1 max-w-md px-6 flex flex-col"
        style={{ 
          paddingTop: 'max(env(safe-area-inset-top, 4rem), 15dvh)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 2rem), 2rem)'
        }}
      >

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Campus<span className="text-emerald-400">Mobility</span>
          </h1>
        </motion.div>

        {/* ── Cinematic Liquid Glass Container ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
          className="mt-auto w-full relative"
        >
          {/* Animated Moving Light Border Wrapper (1px padding acts as the border) */}
          <div className="relative rounded-[2.5rem] p-[1px] overflow-hidden">
            
            {/* Spinning Light Source (Colorless so it blends exactly with video background) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-100%] rounded-full opacity-60"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, transparent 35%, rgba(255, 255, 255, 0.4) 45%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0.4) 55%, transparent 65%, transparent 100%)',
              }}
            />

            {/* Curved Cinematic Liquid Glass Box */}
            <div
              className="relative p-6 sm:p-8 rounded-[2.45rem] overflow-hidden z-10 h-full w-full"
              style={{
                /* Extremely dark/transparent liquid tint so video colors bleed through easily */
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                /* Intense 40px blur array for true liquid refraction depth */
                backdropFilter: 'blur(40px) saturate(140%) brightness(1.1)',
                WebkitBackdropFilter: 'blur(40px) saturate(140%) brightness(1.1)',
                /* Deep interior shadow for the cinematic darkness without white streaks */
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), inset 0 2px 20px rgba(0, 0, 0, 0.3)',
                /* No inner border; the parent container's 1px padding is the border */
              }}
            >

            <div className="relative z-10 font-sans tracking-tight">
              {/* Header */}
              <div className="mb-6 space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">{headerContent.title}</h2>
                <p className="text-zinc-300 text-xs font-semibold">{headerContent.subtitle}</p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-2xl text-left mb-4">
                  {error}
                  <p className="mt-1 opacity-70">Tip: Ensure your domain is added to "Authorized Domains" in Firebase Console.</p>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-3">
                {/* Rider Login */}
                <button
                  onClick={async () => {
                    localStorage.setItem('desiredRole', 'rider');
                    await handleGoogleLogin();
                  }}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-xl cursor-pointer transition-all hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-50"
                  style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
                >
                  {isVerifying ? (
                    <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  <span className="text-[0.95rem]">{isVerifying ? 'Verifying...' : 'Continue as Rider'}</span>
                </button>

                {/* Driver Login */}
                <button
                  onClick={() => setShowDriverCodeModal(true)}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 bg-black/60 text-white font-bold py-3.5 rounded-xl cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <LogIn size={18} />
                  <span className="text-[0.95rem]">Continue as Driver</span>
                </button>
              </div>
              
              {/* Footer */}
              <p className="text-white/40 text-[9px] tracking-wider text-center mt-6">
                By continuing, you agree to our Terms & Privacy Policy
              </p>
            </div>
          </div>
          </div>
        </motion.div>
      </div>

      {/* ── Driver Access Code Modal ── */}
      <AnimatePresence>
        {showDriverCodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              transition={{ duration: 0.3, ease }}
              className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden"
              style={{
                background: 'rgba(24, 24, 27, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
              }}
            >
              <button
                onClick={() => {
                  setShowDriverCodeModal(false);
                  setCodeError('');
                  setDriverCode('');
                }}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-50 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                <Key size={24} />
              </div>

              <h3 className="text-xl font-semibold text-zinc-50 mb-2">Driver Access</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Enter the driver access code provided by administration.
              </p>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Enter Access Code"
                    value={driverCode}
                    onChange={(e) => {
                      setDriverCode(e.target.value);
                      setCodeError('');
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleDriverSubmit()}
                    className="w-full rounded-xl px-4 py-3.5 text-zinc-50 placeholder-zinc-600 focus:outline-none transition-all uppercase font-medium"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {codeError && <p className="text-red-500 text-xs mt-2">{codeError}</p>}
                </div>

                <button
                  onClick={handleDriverSubmit}
                  className="w-full py-3.5 bg-emerald-500 text-black font-semibold rounded-xl hover:bg-emerald-400 transition-all active:scale-[0.97]"
                >
                  Verify & Login
                </button>

                <p className="text-[10px] text-zinc-500 text-center">
                  Existing drivers: Enter the code to log in on a new device.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
