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
  const panelHeightCollapsedBase = Math.max(Math.round(screenH * COLLAPSED_VH), 220); // ensure min height
  const panelHeightCollapsed = panelHeightCollapsedBase + (!expanded && toValue.length > 0 ? 76 : 0);
  const panelHeightExpanded  = Math.max(Math.round(screenH * EXPANDED_VH), 500);
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
        className="absolute left-4 right-4 bottom-6 z-20"
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
            borderRadius: '28px 28px 0 0',
            background: 'rgba(13, 15, 14, 0.8)',
            backdropFilter: `blur(${blurAmount})`,
            WebkitBackdropFilter: `blur(${blurAmount})`,
            boxShadow: '0 -12px 48px rgba(34,197,94,0.08)',
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

            {/* Location Inputs Container */}
            <div className="relative flex flex-col px-4 py-4 rounded-2xl bg-[#0B0E0C] shadow-[inset_0_1px_4px_rgba(255,255,255,0.02)]">
              {/* Connecting Wire */}
              <div className="absolute left-[26px] top-[40px] bottom-[40px] w-0 border-l-[1.5px] border-dashed border-[#22c55e]/40 z-0" />
              
              {/* From Row */}
              <div className="flex items-center gap-4 py-1 relative z-10">
                <div className="w-[10px] h-[10px] rounded-full bg-[#22c55e] flex items-center justify-center flex-shrink-0">
                  <div className="w-[4px] h-[4px] bg-white rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] tracking-[0.2em] font-dm font-light uppercase text-[#7AAF8A] mb-0.5">From</p>
                  <p className="text-[17px] font-sora font-semibold text-[#F4F4F0] truncate">
                    {location ? 'Current Location' : 'Locating…'}
                  </p>
                </div>
                <div className="w-[38px] h-[38px] rounded-full bg-[#1A2E1E] flex items-center justify-center flex-shrink-0">
                  <Navigation2 size={20} className="text-[#22C55E]" strokeWidth={2} />
                </div>
              </div>

              {/* 24px gap area */}
              <div className="h-[24px]" />

              {/* To Row */}
              <div className="flex items-center gap-4 py-1 relative z-10">
                <div className="w-[10px] h-[10px] border-[2px] border-white rounded-[1px] flex-shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-[9px] tracking-[0.2em] font-dm font-light uppercase text-[#7AAF8A] mb-0.5">To</p>
                  <input
                    ref={inputRef}
                    type="text"
                    value={toValue}
                    onChange={(e) => setToValue(e.target.value)}
                    onFocus={handleFocusInput}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Where to?"
                    className="w-full bg-transparent text-[17px] font-sora font-semibold text-[#F4F4F0] placeholder:text-[#3D4D40] outline-none"
                  />
                </div>
                {toValue.length > 0 && (
                  <button
                    onClick={() => { setToValue(''); setSuggestions([]); }}
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
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
                      <p className="text-[10px] tracking-[0.35em] uppercase text-[#5A6B5E] font-dm px-4 pb-2">
                        Results
                      </p>
                      <div className="flex flex-col gap-[12px]">
                        {suggestions.map((s, idx) => (
                          <div key={s.id}>
                            <button
                              onClick={() => {
                                setToValue(s.placeName);
                                setSuggestions([]);
                                snapTo(false);
                              }}
                              className="w-full h-[64px] flex items-center gap-4 px-[16px] rounded-xl text-left hover:bg-[#141A15] hover:border hover:border-[#1E2B1F] border border-transparent transition-colors"
                            >
                              <div className="w-[40px] h-[40px] rounded-full bg-[#141A15] flex items-center justify-center flex-shrink-0">
                                <MapPin size={20} className="text-[#22c55e]" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-[17px] font-sora font-semibold text-[#F4F4F0] truncate">{s.placeName}</p>
                                <p className="text-[13px] font-dm font-normal text-[#8A9A8E] truncate">{s.placeAddress}</p>
                              </div>
                            </button>
                            {idx !== suggestions.length - 1 && (
                              <div className="h-[0.5px] bg-[#1A2318] mx-[16px] mt-[12px]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : toValue.length === 0 ? (
                    /* Quick locations when input is empty */
                    <>
                      <p className="text-[10px] tracking-[0.35em] uppercase text-[#5A6B5E] font-dm px-4 pb-2 pt-2">
                        Recent & Nearby
                      </p>
                      <div className="flex flex-col gap-[12px]">
                        {QUICK_LOCATIONS.map((loc, idx) => (
                          <div key={loc.id}>
                            <button
                              onClick={() => {
                                setToValue(loc.name);
                                snapTo(false);
                              }}
                              className="w-full h-[64px] flex items-center gap-4 px-[16px] rounded-xl text-left hover:bg-[#141A15] hover:border hover:border-[#1E2B1F] border border-transparent transition-colors"
                            >
                              <div className="w-[40px] h-[40px] rounded-full bg-[#141A15] flex items-center justify-center flex-shrink-0">
                                <Clock size={20} className="text-[#22c55e]" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-[17px] font-sora font-semibold text-[#F4F4F0] truncate">{loc.name}</p>
                                <p className="text-[13px] font-dm font-normal text-[#8A9A8E] truncate">{loc.address}</p>
                              </div>
                            </button>
                            {idx !== QUICK_LOCATIONS.length - 1 && (
                              <div className="h-[0.5px] bg-[#1A2318] mx-[16px] mt-[12px]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* Searching state */
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Search size={28} className="text-[#5A6B5E]" />
                      <p className="text-[10px] tracking-[0.35em] font-dm font-bold text-[#5A6B5E] uppercase mt-2">
                        Type to search
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
                className="w-full h-[52px] rounded-[20px] bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-black font-sora font-semibold text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center mt-2"
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
