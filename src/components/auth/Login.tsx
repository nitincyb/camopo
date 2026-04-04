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
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">

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
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Campus<span className="text-emerald-400">Mobility</span>
          </h1>
          <p className="text-zinc-400 text-xs font-medium tracking-widest uppercase mt-2">
            Premium Mobility Platform
          </p>
        </motion.div>

        {/* ── Glass Login Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Glass surface */}
          <div
            className="relative p-6 sm:p-8 space-y-6"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Inner top highlight (reflection) */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)' }}
            />

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease }}
              className="space-y-1"
            >
              <h2 className="text-xl sm:text-2xl font-semibold text-white">Welcome back</h2>
              <p className="text-zinc-400 text-sm">Sign in to start your journey</p>
            </motion.div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-left">
                {error}
                <p className="mt-1 opacity-70">Tip: Ensure your domain is added to "Authorized Domains" in Firebase Console.</p>
              </div>
            )}

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease }}
              className="space-y-3"
            >
              {/* Rider Login */}
              <button
                onClick={async () => {
                  localStorage.setItem('desiredRole', 'rider');
                  await handleGoogleLogin();
                }}
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-3 font-semibold py-4 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'white',
                }}
              >
                {isVerifying ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn size={18} />
                )}
                <span>{isVerifying ? 'Verifying...' : 'Continue as Rider'}</span>
                <ChevronRight size={16} className="text-zinc-500 ml-auto" />
              </button>

              {/* Driver Login */}
              <button
                onClick={() => setShowDriverCodeModal(true)}
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-black font-semibold py-4 rounded-2xl hover:bg-emerald-400 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <LogIn size={18} />
                <span>Continue as Driver</span>
                <ChevronRight size={16} className="text-emerald-900 ml-auto" />
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease }}
          className="text-zinc-500 text-[10px] uppercase tracking-widest text-center mt-6"
        >
          By continuing, you agree to our Terms & Privacy Policy
        </motion.p>
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
