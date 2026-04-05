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
          className="w-full h-full flex flex-col relative"
          animate={{ height: panelHeight }}
          transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          style={{
            borderRadius: '28px 28px 0 0',
            background: 'rgba(10, 14, 12, 0.95)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.10)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 -24px 60px rgba(0, 0, 0, 0.8), inset 0 2px 20px rgba(0, 0, 0, 0.3)',
            padding: '16px 20px',
          }}
        >
          {/* Inner Highlight Layer */}
          <div className="absolute inset-0 rounded-[28px_28px_0_0] pointer-events-none z-[-1]" style={{ background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 60%)' }} />
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
              className="w-[36px] h-[4px] rounded-full transition-colors duration-200"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            />
          </div>

          {/* ── Panel Content ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden flex flex-col gap-4">

            {/* Location Inputs Container */}
            <div 
              className="relative flex flex-col px-[16px] py-[14px] rounded-[18px]"
              style={{
                background: 'rgba(18, 25, 20, 0.80)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
              }}
            >
              {/* Connecting Wire */}
              <svg className="absolute left-[24px] top-[40px] w-[2px] h-[24px] z-0" style={{ strokeDasharray: "4 4", animation: "line-flow 1.5s linear infinite" }}>
                <line x1="1" y1="0" x2="1" y2="24" stroke="rgba(34, 197, 94, 0.15)" strokeWidth="1" />
              </svg>
              
              {/* From Row */}
              <div className="flex items-center gap-4 relative z-10">
                <div 
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.20)' }}
                >
                  <div className="w-[8px] h-[8px] rounded-full bg-[#22C55E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] tracking-[0.2em] font-dm uppercase mb-0.5" style={{ color: '#4ADE80', opacity: 0.8 }}>From</p>
                  <p className="text-[17px] font-sora font-semibold truncate" style={{ color: 'rgba(255, 255, 255, 0.92)' }}>
                    {location ? 'Current Location' : 'Locating…'}
                  </p>
                </div>
                <button 
                  onClick={() => navigate(-1)} 
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80 group"
                  style={{
                    background: 'rgba(0, 0, 0, 0.50)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.10)'
                  }}
                >
                  <X size={16} strokeWidth={2} style={{ color: 'rgba(255, 255, 255, 0.50)' }} />
                </button>
              </div>

              {/* 16px gap area for wire */}
              <div className="h-[20px]" />

              {/* To Row */}
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-[18px] flex justify-center items-center flex-shrink-0">
                  <div 
                    className="w-[9px] h-[9px] animate-[breathe_2.5s_ease_infinite]"
                    style={{ border: '1px solid rgba(255, 255, 255, 0.35)', borderRadius: '1px' }}
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center relative">
                  <p className="text-[9px] tracking-[0.2em] font-dm uppercase mb-0.5" style={{ color: '#4ADE80', opacity: 0.8 }}>To</p>
                  <input
                    ref={inputRef}
                    type="text"
                    value={toValue}
                    onChange={(e) => setToValue(e.target.value)}
                    onFocus={handleFocusInput}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Where to?"
                    className="w-full bg-transparent text-[17px] font-sora font-semibold outline-none placeholder-[#2D4A33]"
                    style={{ color: 'rgba(255, 255, 255, 0.92)' }}
                  />
                </div>
                {toValue.length > 0 && (
                  <button
                    onClick={() => { setToValue(''); setSuggestions([]); }}
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ color: 'rgba(255, 255, 255, 0.50)' }}
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
                      <p className="text-[10px] tracking-[0.3em] font-dm uppercase px-4 pb-2" style={{ color: '#4ADE80', opacity: 0.6 }}>
                        Results
                      </p>
                      <div className="flex flex-col gap-[8px]">
                        {suggestions.map((s, idx) => (
                          <div key={s.id}>
                            <button
                              onClick={() => {
                                setToValue(s.placeName);
                                setSuggestions([]);
                                snapTo(false);
                              }}
                              className="w-full text-left transition-all hover:scale-[0.98] active:scale-[0.96]"
                              style={{
                                background: 'rgba(18, 25, 20, 0.60)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.07)',
                                borderRadius: '14px',
                                padding: '14px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                              }}
                            >
                              <div
                                style={{
                                  background: 'rgba(0, 0, 0, 0.50)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  borderRadius: '10px',
                                  width: '40px',
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <MapPin size={20} style={{ color: 'rgba(255, 255, 255, 0.40)' }} />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="font-sora font-semibold truncate" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '15px' }}>{s.placeName}</p>
                                <p className="font-dm font-normal truncate mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '12px' }}>{s.placeAddress}</p>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : toValue.length === 0 ? (
                    /* Quick locations when input is empty */
                    <>
                      <p className="text-[10px] tracking-[0.3em] font-dm uppercase px-4 pb-2 pt-2" style={{ color: '#4ADE80', opacity: 0.6 }}>
                        Recent & Nearby
                      </p>
                      <div className="flex flex-col gap-[8px]">
                        {QUICK_LOCATIONS.map((loc, idx) => (
                          <div key={loc.id}>
                            <button
                              onClick={() => {
                                setToValue(loc.name);
                                snapTo(false);
                              }}
                              className="w-full text-left transition-all hover:scale-[0.98] active:scale-[0.96]"
                              style={{
                                background: 'rgba(18, 25, 20, 0.60)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.07)',
                                borderRadius: '14px',
                                padding: '14px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                              }}
                            >
                              <div
                                style={{
                                  background: 'rgba(0, 0, 0, 0.50)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  borderRadius: '10px',
                                  width: '40px',
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                <Clock size={20} style={{ color: 'rgba(255, 255, 255, 0.40)' }} />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <p className="font-sora font-semibold truncate" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '15px' }}>{loc.name}</p>
                                <p className="font-dm font-normal truncate mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '12px' }}>{loc.address}</p>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* Searching state */
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Search size={28} style={{ color: 'rgba(255, 255, 255, 0.40)' }} />
                      <p className="text-[10px] tracking-[0.35em] font-dm font-bold uppercase mt-2" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
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
                className="w-full h-[54px] rounded-[16px] text-white font-sora font-semibold text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center mt-4 mb-[24px]"
                style={{ background: '#22C55E' }}
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
