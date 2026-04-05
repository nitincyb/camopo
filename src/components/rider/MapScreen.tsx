import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronLeft, Clock, Navigation2, X } from 'lucide-react';
import Map from '../shared/Map';
import { useGeolocation } from '../../hooks/useGeolocation';
import { mapService } from '../../services/mapService';
import { useAuth } from '../../contexts/AuthContext';

// ─── Snap heights ────────────────────────────────────────────────────────────
const COLLAPSED_VH = 0.22; // 22% of screen
const EXPANDED_VH  = 0.75; // 75% of screen

// ─── Recent / quick destinations shared with RiderHome ────────────────────
const QUICK_LOCATIONS = [
  { id: 'gate1', name: 'RRU (Gate-1)', address: 'Main Entrance, RRU Campus', lat: 23.156126, lng: 72.884574 },
  { id: 'gate2', name: 'RRU (Gate-2)', address: 'Secondary Entrance, RRU Campus', lat: 23.152045, lng: 72.880048 },
  { id: 'rru',   name: 'RRU Campus',   address: 'Lavad, Dahegam, Gandhinagar', lat: 23.154578, lng: 72.884973 },
  { id: 'dah',   name: 'Dahegam Bus Stand', address: 'Dahegam, Gandhinagar', lat: 23.1691, lng: 72.8124 },
];

export default function MapScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { location, path } = useGeolocation();

  // ── Panel state ──────────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState(false);
  const [toValue, setToValue] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

  // ── Drag gesture ────────────────────────────────────────────────────────
  const panelY = useMotionValue(0);
  const dragStartY = useRef(0);
  const panelHeightCollapsedBase = Math.round(screenH * COLLAPSED_VH);
  const panelHeightCollapsed = panelHeightCollapsedBase + (!expanded && toValue.length > 0 ? 64 : 0);
  const panelHeightExpanded  = Math.round(screenH * EXPANDED_VH);
  const [panelHeight, setPanelHeight] = useState(panelHeightCollapsed);

  useEffect(() => {
    if (!expanded) {
      setPanelHeight(panelHeightCollapsed);
    }
  }, [expanded, panelHeightCollapsed]);

  // ── Map camera ──────────────────────────────────────────────────────────
  const mapCenter = location || { lat: 23.154578, lng: 72.884973 };

  // ── Suggestions fetching ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (toValue.length > 2) {
        const results = await mapService.autosuggest(toValue);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [toValue]);

  // ── Expand/collapse helpers ──────────────────────────────────────────────
  const snapTo = useCallback((isExpanded: boolean) => {
    setExpanded(isExpanded);
    setPanelHeight(isExpanded ? panelHeightExpanded : panelHeightCollapsed);
    panelY.set(0);
  }, [panelHeightCollapsed, panelHeightExpanded, panelY]);

  const handleFocusInput = () => {
    if (!expanded) snapTo(true);
    setIsFocused(true);
  };

  const handleTapOutside = () => {
    if (expanded) {
      snapTo(false);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  // ── Drag handlers ────────────────────────────────────────────────────────
  const onDragStart = (e: React.TouchEvent | React.PointerEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.PointerEvent).clientY;
    dragStartY.current = clientY;
  };

  const onDragMove = (e: React.TouchEvent | React.PointerEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.PointerEvent).clientY;
    const delta = dragStartY.current - clientY; // positive = dragging up
    const newH = Math.max(
      panelHeightCollapsed * 0.8,
      Math.min(panelHeightExpanded * 1.05, panelHeight + delta)
    );
    setPanelHeight(newH);
    dragStartY.current = clientY;
  };

  const onDragEnd = () => {
    const mid = (panelHeightCollapsed + panelHeightExpanded) / 2;
    snapTo(panelHeight > mid);
  };

  // ── Panel backdrop blur intensity ────────────────────────────────────────
  const blurAmount = expanded ? '28px' : '20px';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">

      {/* ── Full-screen Map ─────────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Map
          center={mapCenter}
          onMarkerClick={() => {}}
          markers={[
            ...(location?.lat && location?.lng
              ? [{ id: 'user-loc', lat: location.lat, lng: location.lng, type: 'user' as const, title: 'You' }]
              : []),
          ]}
          path={path}
        />
        {/* Dark vignette overlay for premium feel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)',
          }}
        />
      </motion.div>

      {/* ── Tap backdrop to collapse ────────────────────────────────────── */}
      {expanded && (
        <div
          className="absolute inset-0 z-10"
          style={{ bottom: panelHeight }}
          onClick={handleTapOutside}
        />
      )}

      {/* ── Back Button ─────────────────────────────────────────────────── */}
      <motion.button
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={() => navigate(-1)}
        className="absolute top-12 left-4 z-30 w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(25,25,25,0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 0 14px rgba(255,255,255,0.04)',
        }}
        aria-label="Go back"
      >
        <ChevronLeft size={20} className="text-white" />
      </motion.button>

      {/* ── Glass Bottom Panel ──────────────────────────────────────────── */}
      <motion.div
        ref={containerRef}
        className="absolute left-0 right-0 bottom-0 z-20"
        initial={{ y: 120, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 32,
          opacity: { duration: 0.45 },
          scale: { duration: 0.45 },
          delay: 0.15,
        }}
        style={{ height: panelHeight }}
      >
        {/* Animated height wrapper */}
        <motion.div
          className="w-full h-full flex flex-col"
          animate={{ height: panelHeight }}
          transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          style={{
            borderRadius: '24px 24px 0 0',
            background: 'rgba(25, 25, 25, 0.35)',
            backdropFilter: `blur(${blurAmount})`,
            WebkitBackdropFilter: `blur(${blurAmount})`,
            border: '1px solid rgba(255,255,255,0.08)',
            borderBottom: 'none',
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05)',
          }}
        >
          {/* ── Drag Handle ─────────────────────────────────────────────── */}
          <div
            className="flex-shrink-0 flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={onDragStart as any}
            onPointerMove={onDragMove as any}
            onPointerUp={onDragEnd}
            onPointerLeave={onDragEnd}
            onTouchStart={onDragStart as any}
            onTouchMove={onDragMove as any}
            onTouchEnd={onDragEnd}
          >
            <div
              className="w-10 h-1 rounded-full transition-colors duration-200"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            />
          </div>

          {/* ── Panel Content ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden flex flex-col px-5 pb-6 gap-4">

            {/* From Row */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">From</p>
                <p className="text-sm font-semibold text-zinc-200 truncate">
                  {location ? 'Current Location' : 'Locating…'}
                </p>
              </div>
              <Navigation2 size={15} className="text-emerald-500 flex-shrink-0" />
            </div>

            {/* To Row */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200"
              style={{
                background: isFocused
                  ? 'rgba(16,185,129,0.08)'
                  : 'rgba(255,255,255,0.06)',
                border: isFocused
                  ? '1px solid rgba(16,185,129,0.3)'
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: isFocused
                  ? '0 0 0 3px rgba(16,185,129,0.06)'
                  : 'none',
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-0.5">To</p>
                <input
                  ref={inputRef}
                  type="text"
                  value={toValue}
                  onChange={(e) => setToValue(e.target.value)}
                  onFocus={handleFocusInput}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Where to?"
                  className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-zinc-600 outline-none"
                />
              </div>
              {toValue.length > 0 && (
                <button
                  onClick={() => { setToValue(''); setSuggestions([]); }}
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center"
                >
                  <X size={12} className="text-zinc-300" />
                </button>
              )}
            </div>

            {/* ── Expanded Content ─────────────────────────────────────── */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  key="expanded-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {/* Suggestions from API */}
                  {suggestions.length > 0 ? (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-widest px-3 pb-1"
                         style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Results
                      </p>
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setToValue(s.placeName);
                            setSuggestions([]);
                            snapTo(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors duration-150"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.07)' }}
                          >
                            <MapPin size={16} className="text-zinc-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{s.placeName}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{s.placeAddress}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : toValue.length === 0 ? (
                    /* Quick locations when input is empty */
                    <>
                      <p className="text-[10px] font-black uppercase tracking-widest px-3 pb-1"
                         style={{ color: 'rgba(255,255,255,0.3)' }}>
                        Recent & Nearby
                      </p>
                      {QUICK_LOCATIONS.map((loc) => (
                        <button
                          key={loc.id}
                          onClick={() => {
                            setToValue(loc.name);
                            snapTo(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-colors duration-150"
                          style={{ background: 'rgba(255,255,255,0.04)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(16,185,129,0.1)' }}
                          >
                            <Clock size={15} className="text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{loc.name}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{loc.address}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    /* Searching state */
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Search size={28} className="text-zinc-700" />
                      <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                        Type to search locations
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Confirm Button ────────────────────────────────────────────── */}
            {!expanded && toValue.length > 0 && (
              <button
                onClick={() => navigate('/', { state: { destination: toValue, intent: 'select_ride' } })}
                className="w-full bg-emerald-500 text-black py-3.5 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] mt-2"
              >
                Confirm Destination
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
