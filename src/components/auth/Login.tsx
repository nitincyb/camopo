// CampusMobility Login - Version 1.0.3
import React, { useState, useCallback } from 'react';
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, UserCredential } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { LogIn, Key, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import Logo from '../shared/Logo';
import { logSecurityEvent } from '../../services/auditService';

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
    // Simple hardcoded access code for MVP to prevent unauthorized driver signups
    if (driverCode.trim().toUpperCase() === 'CAMPUS2026') {
      setShowDriverCodeModal(false);
      setCodeError('');
      localStorage.setItem('desiredRole', 'driver');
      await handleGoogleLogin();
    } else {
      setCodeError('Invalid driver access code');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-50 p-6 overflow-hidden relative">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 sm:space-y-8 text-center"
      >
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter italic text-zinc-50">CampusMobility</h1>
          <p className="text-zinc-500 font-medium uppercase tracking-widest text-[10px] sm:text-xs">Premium Mobility Platform</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-6 sm:p-8 rounded-3xl backdrop-blur-xl space-y-4 sm:space-y-6 shadow-2xl">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-50">Welcome back</h2>
            <p className="text-zinc-400 text-xs sm:text-sm">Sign in to start your journey</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-left">
              {error}
              <p className="mt-1 opacity-70">Tip: Ensure your domain is added to "Authorized Domains" in Firebase Console.</p>
            </div>
          )}

          <button
            onClick={async () => {
              localStorage.setItem('desiredRole', 'rider');
              await handleGoogleLogin();
            }}
            disabled={isVerifying}
            className="w-full flex items-center justify-center gap-3 bg-zinc-50 text-zinc-950 font-bold py-4 rounded-2xl hover:bg-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
          >
            {isVerifying ? (
              <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
            ) : (
              <LogIn size={20} />
            )}
            {isVerifying ? 'Verifying...' : 'Continue as Rider'}
          </button>

          <button
            onClick={() => setShowDriverCodeModal(true)}
            disabled={isVerifying}
            className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-lg disabled:opacity-50"
          >
            <LogIn size={20} />
            Continue as Driver
          </button>

        </div>

        <p className="text-zinc-600 text-[10px] uppercase tracking-widest">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </motion.div>

      {/* Driver Access Code Modal */}
      <AnimatePresence>
        {showDriverCodeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative"
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
              
              <h3 className="text-xl font-bold text-zinc-50 mb-2">Driver Access</h3>
              <p className="text-sm text-zinc-400 mb-6">
                Please enter the driver access code provided by the administration to continue.
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
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-50 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors uppercase"
                  />
                  {codeError && <p className="text-red-500 text-xs mt-2">{codeError}</p>}
                </div>

                <button 
                  onClick={handleDriverSubmit}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
                >
                  Verify & Login
                </button>
                
                <p className="text-[10px] text-zinc-500 text-center">
                  Existing drivers: You still need to enter the code to log in on a new device.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
