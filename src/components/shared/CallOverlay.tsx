/**
 * CallOverlay.tsx
 *
 * Full-screen call overlay:
 *   - Ringing/Calling → custom UI with pulse animation
 *   - Connected → embedded JitsiMeeting iframe (handles audio/video)
 *
 * STABILITY FIXES (v3):
 *   - Config objects are memoized to prevent JitsiMeeting remounts
 *   - videoConferenceLeft is guarded with a "joined" flag to prevent premature endCall
 *   - readyToClose is ALSO guarded — only fires hangup if user has joined
 *   - A stable React key on JitsiMeeting prevents unmount/remount cycles
 *   - Added a 3s delay before rendering Jitsi to ensure Firestore state is settled
 *   - Fallback "End Call" button always visible above the iframe
 */

import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, PhoneIncoming, Loader2 } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { useAuth } from '../../contexts/AuthContext';
import { JitsiMeeting } from '@jitsi/react-sdk';

// ── Pulsing ring animation ──────────────────────────────────────────────────
const PulseRing: React.FC<{ color: string }> = ({ color }) => (
  <>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: color }}
        initial={{ opacity: 0.6, scale: 1 }}
        animate={{ opacity: 0, scale: 1.8 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.6,
          ease: 'easeOut',
        }}
      />
    ))}
  </>
);

// ── Action button ───────────────────────────────────────────────────────────
interface ActionBtnProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: 'red' | 'green' | 'ghost';
}

const ActionBtn: React.FC<ActionBtnProps> = ({ onClick, icon, label, variant }) => {
  const colors: Record<string, string> = {
    red: 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/30 text-white',
    green: 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 text-white',
    ghost: 'bg-white/10 hover:bg-white/20 border border-white/20 text-zinc-200',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-colors ${colors[variant]}`}
      >
        {icon}
      </motion.button>
      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

// ── Jitsi connected view (isolated component to prevent parent re-renders) ──
const JitsiCallView: React.FC<{
  roomName: string;
  displayName: string;
  onHangup: () => void;
}> = React.memo(({ roomName, displayName, onHangup }) => {
  const hasJoinedRef = useRef(false);
  const [isJitsiReady, setIsJitsiReady] = useState(false);
  const hangupCalledRef = useRef(false);

  // Small delay before rendering Jitsi to let Firestore state settle
  // This prevents the iframe from loading and immediately being torn down
  const [shouldRender, setShouldRender] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
      console.log('[JitsiCallView] Rendering Jitsi iframe for room:', roomName);
    }, 1500);
    return () => clearTimeout(timer);
  }, [roomName]);

  // Safe hangup that only fires once
  const safeHangup = useCallback(() => {
    if (hangupCalledRef.current) return;
    hangupCalledRef.current = true;
    console.log('[JitsiCallView] Safe hangup triggered');
    onHangup();
  }, [onHangup]);

  // Memoize config to prevent iframe reloads on parent re-renders
  const configOverwrite = useMemo(
    () => ({
      startWithAudioMuted: false,
      startWithVideoMuted: true,
      prejoinPageEnabled: false,
      disableDeepLinking: true,
      enableInsecureRoomNameWarning: false,
      hideConferenceSubject: true,
      hideConferenceTimer: false,
      // Audio processing
      disableAP: false,
      disableAEC: false,
      disableNS: false,
      disableAGC: false,
      disableHPF: false,
      stereo: false,
      // Reduce P2P issues
      p2p: {
        enabled: true,
      },
    }),
    [],
  );

  const interfaceConfigOverwrite = useMemo(
    () => ({
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
      SHOW_PROMOTIONAL_CLOSE_PAGE: false,
      SHOW_JITSI_WATERMARK: false,
      SHOW_BRAND_WATERMARK: false,
      MOBILE_APP_PROMO: false,
      HIDE_INVITE_MORE_HEADER: true,
      TOOLBAR_BUTTONS: [
        'microphone',
        'hangup',
        'tileview',
        'toggle-camera',
        'settings',
      ],
    }),
    [],
  );

  const userInfo = useMemo(
    () => ({ displayName, email: '' }),
    [displayName],
  );

  const handleApiReady = useCallback(
    (externalApi: any) => {
      console.log('[Jitsi] API ready for room:', roomName);
      setIsJitsiReady(true);

      // Mark as joined only when conference is actually connected
      externalApi.addListener('videoConferenceJoined', () => {
        console.log('[Jitsi] Conference joined');
        hasJoinedRef.current = true;
      });

      // Only trigger hangup AFTER a successful join
      externalApi.addListener('videoConferenceLeft', () => {
        console.log('[Jitsi] Conference left, hasJoined:', hasJoinedRef.current);
        if (hasJoinedRef.current) {
          safeHangup();
        }
      });

      // readyToClose: ONLY fire hangup if user has actually joined
      // This prevents premature call termination when iframe fails to load
      externalApi.addListener('readyToClose', () => {
        console.log('[Jitsi] readyToClose, hasJoined:', hasJoinedRef.current);
        if (hasJoinedRef.current) {
          safeHangup();
        } else {
          console.log('[Jitsi] readyToClose ignored — never joined conference');
        }
      });
    },
    [roomName, safeHangup],
  );

  const handleIframeRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      node.style.height = '100%';
      node.style.width = '100%';
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Fallback end-call button — always visible above Jitsi iframe */}
      <div className="absolute top-4 right-4 z-[10000]">
        <button
          onClick={safeHangup}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 transition-colors"
        >
          <PhoneOff size={16} />
          End Call
        </button>
      </div>

      {/* Connection status indicator */}
      {!isJitsiReady && (
        <div className="absolute inset-0 z-[9998] flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-emerald-400 animate-spin" />
            <p className="text-white text-lg font-semibold">Connecting call…</p>
            <p className="text-zinc-400 text-sm">Setting up secure audio channel</p>
          </div>
        </div>
      )}

      <div className="flex-1">
        {shouldRender && (
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomName}
            configOverwrite={configOverwrite}
            interfaceConfigOverwrite={interfaceConfigOverwrite}
            userInfo={userInfo}
            onApiReady={handleApiReady}
            getIFrameRef={handleIframeRef}
          />
        )}
      </div>
    </div>
  );
});

JitsiCallView.displayName = 'JitsiCallView';

// ─────────────────────────────────────────────────────────────────────────────

export const CallOverlay: React.FC = () => {
  const {
    activeCall,
    isRinging,
    isCalling,
    isInCall,
    acceptCall,
    rejectCall,
    endCall,
  } = useCall();

  const { user, profile } = useAuth();

  const show = isRinging || isCalling || isInCall;
  if (!show || !activeCall || !user) return null;

  // ── Connected → Jitsi ─────────────────────────────────────────────────────
  if (isInCall) {
    // Sanitize room name: Jitsi requires alphanumeric + limited special chars
    const safeRoom = `camo_${activeCall.id}`.replace(/[^a-zA-Z0-9_-]/g, '');
    return (
      <JitsiCallView
        key={activeCall.id}
        roomName={safeRoom}
        displayName={profile?.displayName || 'Camo User'}
        onHangup={endCall}
      />
    );
  }

  // ── Ringing / Calling UI ──────────────────────────────────────────────────
  const iAmCaller = activeCall.callerId === user.uid;
  const peerName = iAmCaller ? activeCall.receiverName : activeCall.callerName;
  const peerInitials = peerName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const statusLabel = isCalling ? 'Calling…' : 'Incoming Call';
  const pulseColor = isRinging ? '#10b981' : '#6366f1';

  return (
    <AnimatePresence>
      <motion.div
        key="call-overlay-ringing"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden"
        style={{
          background:
            'linear-gradient(160deg, #0f0f13 0%, #16161f 60%, #0c1a14 100%)',
        }}
      >
        {/* Top status */}
        <div className="w-full flex items-center px-6 pt-14 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-zinc-500" />
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              {isRinging ? 'Incoming' : 'Calling'}
            </span>
          </div>
        </div>

        {/* Avatar + Pulse */}
        <div className="flex flex-col items-center gap-6 flex-1 justify-center">
          <div className="relative flex items-center justify-center w-36 h-36">
            <PulseRing color={pulseColor} />
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${
                  isRinging ? '#059669' : '#4f46e5'
                } 0%, ${isRinging ? '#064e3b' : '#312e81'} 100%)`,
              }}
            >
              {peerInitials || '?'}
            </motion.div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-4xl font-black text-white tracking-tight">
              {peerName}
            </h2>
            <div className="flex items-center justify-center gap-2">
              {isRinging && (
                <PhoneIncoming
                  size={14}
                  className="text-emerald-400 animate-bounce"
                />
              )}
              <p
                className={`text-base font-semibold ${
                  isRinging ? 'text-emerald-400' : 'text-indigo-400'
                }`}
              >
                {statusLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="w-full px-12 pb-16">
          {isRinging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-end justify-between"
            >
              <ActionBtn
                onClick={rejectCall}
                icon={<PhoneOff size={26} />}
                label="Decline"
                variant="red"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <ActionBtn
                  onClick={acceptCall}
                  icon={<Phone size={26} />}
                  label="Accept"
                  variant="green"
                />
              </motion.div>
            </motion.div>
          )}

          {isCalling && (
            <div className="flex justify-center">
              <ActionBtn
                onClick={endCall}
                icon={<PhoneOff size={26} />}
                label="Cancel"
                variant="red"
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
