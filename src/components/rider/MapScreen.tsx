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
  const panelHeightCollapsedBase = Math.max(Math.round(screenH * COLLAPSED_VH), 240); // ensure min height
  const panelHeightCollapsed = panelHeightCollapsedBase + (!expanded && toValue.length > 0 ? 80 : 0);
  const panelHeightExpanded  = Math.min(Math.round(screenH * 0.65), screenH - 280);
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
            borderRadius: '28px 28px 0 0',
            background: '#0C1210',
            boxShadow: '0 -1px 0 #22C55E40, 0 -32px 80px rgba(0,0,0,0.9)',
            padding: '16px 20px',
          }}
        >
          {/* ── Drag Handle ─────────────────────────────────────────────── */}
          <div
            className="flex-shrink-0 flex justify-center pt-2 pb-4 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={onDragStart as any}
            onPointerMove={onDragMove as any}
            onPointerUp={onDragEnd}
            onPointerLeave={onDragEnd}
            onTouchStart={onDragStart as any}
            onTouchMove={onDragMove as any}
            onTouchEnd={onDragEnd}
          >
            <div
              className="w-[36px] h-[4px] rounded-full transition-colors duration-200 bg-[#22C55E]/20"
            />
          </div>

          {/* ── Panel Content ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden flex flex-col gap-4">

            {/* Location Inputs Container */}
            <div className="relative flex flex-col px-[16px] py-[14px] rounded-[16px] bg-[#101915] border border-[#1A3322] shadow-[inset_0_1px_0_#22C55E15,_0_2px_12px_#00000060]">
              {/* Connecting Wire */}
              <svg className="absolute left-[25px] top-[34px] w-[2px] h-[32px] z-0" style={{ strokeDasharray: "4 8", animation: "line-flow 1.5s linear infinite" }}>
                <line x1="1" y1="0" x2="1" y2="32" stroke="#22C55E" strokeWidth="1.5" strokeOpacity="0.25" />
              </svg>
              
              {/* From Row */}
              <div className="flex items-center gap-4 relative z-10">
                <div 
                  className="w-[20px] h-[20px] rounded-full border-[1.5px] border-[#22C55E]/30 flex items-center justify-center flex-shrink-0 animate-[map-dot-pulse_2s_ease-in-out_infinite]"
                  style={{ filter: 'drop-shadow(0 0 8px #22C55E)' }}
                >
                  <div className="w-[8px] h-[8px] rounded-full bg-[#22C55E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] tracking-[0.2em] font-dm font-light uppercase text-[#4ADE80]/45 mb-0.5">From</p>
                  <p className="text-[17px] font-sora font-semibold text-[#F0FFF4] truncate">
                    {location ? 'Current Location' : 'Locating…'}
                  </p>
                </div>
                <button 
                  onClick={() => navigate(-1)} 
                  className="w-[32px] h-[32px] rounded-full bg-[#0F1F14] border border-[#22C55E]/25 hover:bg-[#162B1C] hover:border-[#22C55E]/60 flex items-center justify-center flex-shrink-0 transition-all duration-200 group"
                >
                  <X size={16} className="text-[#4ADE80] opacity-70 group-hover:opacity-100 group-hover:text-[#22C55E] transition-colors duration-200" strokeWidth={2} />
                </button>
              </div>

              {/* 16px gap area for wire */}
              <div className="h-[20px]" />

              {/* To Row */}
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-[20px] flex justify-center items-center flex-shrink-0">
                  <div 
                    className="w-[9px] h-[9px] border-[1.5px] border-white animate-[breathe_2.5s_ease_infinite]"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center relative">
                  {toValue.length === 0 && (
                    <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-[2px] h-[16px] bg-[#22C55E]/50 animate-[blink-caret_1s_ease_infinite] rounded-full" />
                  )}
                  <p className="text-[9px] tracking-[0.2em] font-dm font-light uppercase text-[#4ADE80]/45 mb-0.5">To</p>
                  <input
                    ref={inputRef}
                    type="text"
                    value={toValue}
                    onChange={(e) => setToValue(e.target.value)}
                    onFocus={handleFocusInput}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Where to?"
                    className="w-full bg-transparent text-[17px] font-sora font-semibold text-[#F0FFF4] placeholder:text-[#2D4A33] outline-none"
                  />
                </div>
                {toValue.length > 0 && (
                  <button
                    onClick={() => { setToValue(''); setSuggestions([]); }}
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[#F0FFF4]"
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
                              <div className="w-[40px] h-[40px] rounded-full bg-[#101915] flex items-center justify-center flex-shrink-0">
                                <MapPin size={20} className="text-[#22C55E]" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-[17px] font-sora font-semibold text-[#F0FFF4] truncate">{s.placeName}</p>
                                <p className="text-[13px] font-dm font-normal text-[#16A34A] truncate">{s.placeAddress}</p>
                              </div>
                            </button>
                            {idx !== suggestions.length - 1 && (
                              <div className="h-[0.5px] bg-[#1A3322] mx-[16px] mt-[12px]" />
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
                              <div className="w-[40px] h-[40px] rounded-full bg-[#101915] flex items-center justify-center flex-shrink-0">
                                <Clock size={20} className="text-[#22C55E]" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="text-[17px] font-sora font-semibold text-[#F0FFF4] truncate">{loc.name}</p>
                                <p className="text-[13px] font-dm font-normal text-[#16A34A] truncate">{loc.address}</p>
                              </div>
                            </button>
                            {idx !== QUICK_LOCATIONS.length - 1 && (
                              <div className="h-[0.5px] bg-[#1A3322] mx-[16px] mt-[12px]" />
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
                className="w-full h-[54px] rounded-[16px] bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-[#F0FFF4] font-sora font-semibold text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-[0_8px_24px_rgba(34,197,94,0.35)] mt-4 mb-[24px]"
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
