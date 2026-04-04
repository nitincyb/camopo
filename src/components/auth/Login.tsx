// CampusMobility Login - Version 3.0.0
import React, { useState } from 'react';
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { LogIn, Key, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { logSecurityEvent } from '../../services/auditService';

// Reliable 4K video sources (CDN-hosted, no hotlink block)
const VIDEO_SOURCES = [
  'https://assets.mixkit.co/videos/preview/mixkit-night-city-with-illuminated-buildings-and-traffic-33230-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-city-traffic-on-a-bridge-at-night-32860-large.mp4',
];

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [showDriverCodeModal, setShowDriverCodeModal] = useState(false);
  const [driverCode, setDriverCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

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
    <div className="min-h-screen w-full flex flex-col items-center justify-end relative overflow-hidden bg-black">

      {/* ── 4K Video Background ── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={() => setVideoLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{
          opacity: videoLoaded ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      >
        {VIDEO_SOURCES.map((src, i) => (
          <source key={i} src={src} type="video/mp4" />
        ))}
      </video>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 z-[1]" style={{
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.92) 100%)',
      }} />

      {/* ── Brand (top center) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease }}
        className="absolute top-16 left-0 right-0 z-10 text-center"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Campus<span className="text-emerald-400">Mobility</span>
        </h1>
      </motion.div>

      {/* ── Minimal Login Section (bottom) ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease }}
        className="relative z-10 w-full max-w-md px-6 pb-10 pt-6"
      >
        {/* Subtitle */}
        <p className="text-white text-xl font-semibold mb-1">Get moving</p>
        <p className="text-zinc-400 text-sm mb-6">Sign in to start your journey</p>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Rider — White button with Google icon */}
        <button
          onClick={async () => {
            localStorage.setItem('desiredRole', 'rider');
            await handleGoogleLogin();
          }}
          disabled={isVerifying}
          className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-medium py-3.5 rounded-xl transition-all active:scale-[0.97] disabled:opacity-50"
        >
          {isVerifying ? (
            <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span className="text-sm">{isVerifying ? 'Signing in...' : 'Continue as Rider'}</span>
        </button>

        {/* Driver — Outline button */}
        <button
          onClick={() => setShowDriverCodeModal(true)}
          disabled={isVerifying}
          className="w-full flex items-center justify-center gap-2.5 font-medium py-3.5 rounded-xl mt-3 transition-all active:scale-[0.97] disabled:opacity-50 border border-zinc-700 text-white"
        >
          <LogIn size={16} />
          <span className="text-sm">Continue as Driver</span>
        </button>

        {/* Footer */}
        <p className="text-zinc-600 text-[10px] text-center mt-6 tracking-wide">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </motion.div>

      {/* ── Driver Access Code Modal ── */}
      <AnimatePresence>
        {showDriverCodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ duration: 0.3, ease }}
              className="w-full max-w-md bg-zinc-900 rounded-t-3xl p-6 pb-10 relative"
            >
              <button
                onClick={() => {
                  setShowDriverCodeModal(false);
                  setCodeError('');
                  setDriverCode('');
                }}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Driver Access</h3>
                  <p className="text-xs text-zinc-500">Enter your access code</p>
                </div>
              </div>

              <input
                type="text"
                placeholder="Access Code"
                value={driverCode}
                onChange={(e) => {
                  setDriverCode(e.target.value);
                  setCodeError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleDriverSubmit()}
                className="w-full bg-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all uppercase font-medium text-sm"
              />
              {codeError && <p className="text-red-500 text-xs mt-2">{codeError}</p>}

              <button
                onClick={handleDriverSubmit}
                className="w-full py-3.5 bg-emerald-500 text-black font-semibold rounded-xl mt-4 transition-all active:scale-[0.97]"
              >
                Verify & Login
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
