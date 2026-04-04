// CampusMobility Login - Version 2.0.0
import React, { useState } from 'react';
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { LogIn, Key, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { logSecurityEvent } from '../../services/auditService';

// Calm, cinematic video — aerial road / city at dusk
const VIDEO_URL = 'https://videos.pexels.com/video-files/3015510/3015510-hd_1920_1080_24fps.mp4';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [showDriverCodeModal, setShowDriverCodeModal] = useState(false);
  const [driverCode, setDriverCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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
    <div className="min-h-screen w-full flex flex-col items-center justify-between relative overflow-hidden pb-10 pt-16">

      {/* ── Video Background ── */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.45) saturate(0.8)' }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        {/* Dark gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 w-full max-w-md px-6">

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

        {/* ── Liquid Glass Login Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
          className="mt-auto w-full relative"
        >
          {/* Liquid Glass Container */}
          <div
            className="relative p-6 sm:p-8 rounded-[2rem] overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Inner highlight reflection */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)' }}
            />

            <div className="relative z-10">
              {/* Header */}
              <div className="mb-6 space-y-1">
                <h2 className="text-2xl font-bold text-white">Get moving</h2>
                <p className="text-zinc-400 text-sm">Sign in to start your journey</p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-left mb-4">
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
                  className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-semibold py-3.5 rounded-xl transition-all active:scale-[0.97] disabled:opacity-50"
                  style={{
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
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
                  <span>{isVerifying ? 'Verifying...' : 'Continue as Rider'}</span>
                </button>

                {/* Driver Login */}
                <button
                  onClick={() => setShowDriverCodeModal(true)}
                  disabled={isVerifying}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white font-semibold py-3.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-all active:scale-[0.97] disabled:opacity-50"
                  style={{
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  <LogIn size={18} />
                  <span>Continue as Driver</span>
                </button>
              </div>
              
              {/* Footer */}
              <p className="text-zinc-500/80 text-[10px] tracking-wide text-center mt-6">
                By continuing, you agree to our Terms & Privacy Policy
              </p>
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
