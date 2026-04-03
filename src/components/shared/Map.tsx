import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, Target, Plus, Minus } from 'lucide-react';

interface MapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ id: string; lat: number; lng: number; type: 'pickup' | 'dropoff' | 'driver' | 'user'; title?: string }>;
  path?: Array<{ lat: number; lng: number }>;
  onMarkerClick?: (marker: any) => void;
}

// Custom SVG Markers for a professional look
const createCustomIcon = (type: string, color: string) => {
  let svg = '';
  if (type === 'driver') {
    svg = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${color}" fill-opacity="0.2"/>
      <circle cx="20" cy="20" r="12" fill="${color}"/>
      <path d="M20 14L23 23H17L20 14Z" fill="white"/>
    </svg>`;
  } else if (type === 'pickup') {
    svg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="${color}"/>
    </svg>`;
  } else if (type === 'dropoff') {
    svg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="20" height="20" rx="4" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
      <rect x="12" y="12" width="8" height="8" rx="1" fill="${color}"/>
    </svg>`;
  } else {
    svg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="${color}"/>
    </svg>`;
  }

  return L.divIcon({
    className: 'custom-map-marker',
    html: svg,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

function ChangeView({ center, zoom, isAutoCenter, setIsAutoCenter }: { 
  center: [number, number], 
  zoom: number, 
  isAutoCenter: boolean, 
  setIsAutoCenter: (v: boolean) => void 
}) {
  const map = useMap();
  const lastZoomRef = useRef(zoom);

  useMapEvents({
    dragstart: () => setIsAutoCenter(false),
    zoomstart: () => setIsAutoCenter(false),
    mousedown: () => setIsAutoCenter(false),
  });

  useEffect(() => {
    if (isAutoCenter) {
      const currentZoom = map.getZoom();
      const targetZoom = lastZoomRef.current !== zoom ? zoom : currentZoom;
      map.setView(center, targetZoom, { animate: true, duration: 1 });
      lastZoomRef.current = zoom;
    }
  }, [center, zoom, map, isAutoCenter]);

  return null;
}

function MapControls({ isAutoCenter, setIsAutoCenter }: { isAutoCenter: boolean, setIsAutoCenter: (v: boolean) => void }) {
  const map = useMap();

  return (
    <div className="absolute right-6 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-3 pointer-events-auto">
      <button 
        onClick={() => {
          setIsAutoCenter(true);
        }}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-2xl border border-white/20 backdrop-blur-xl ${
          isAutoCenter 
            ? 'bg-emerald-500 text-white' 
            : 'bg-white/80 text-zinc-900 hover:bg-white'
        }`}
        title="Recenter Map"
      >
        <Target size={20} />
      </button>
      <div className="flex flex-col bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
        <button 
          className="w-12 h-12 flex items-center justify-center text-zinc-900 hover:bg-white transition-all active:scale-90 border-b border-white/10"
          onClick={() => {
            setIsAutoCenter(false);
            map.zoomIn();
          }}
        >
          <Plus size={20} />
        </button>
        <button 
          className="w-12 h-12 flex items-center justify-center text-zinc-900 hover:bg-white transition-all active:scale-90"
          onClick={() => {
            setIsAutoCenter(false);
            map.zoomOut();
          }}
        >
          <Minus size={20} />
        </button>
      </div>
    </div>
  );
}

export default function Map({ center, zoom = 15, markers = [], path = [], onMarkerClick }: MapProps) {
  const [isAutoCenter, setIsAutoCenter] = useState(true);
  const polylinePositions = useMemo(() => 
    path
      .filter(p => p && typeof p.lat === 'number' && typeof p.lng === 'number')
      .map(p => [p.lat, p.lng] as [number, number]), 
    [path]
  );

  if (!center || typeof center.lat !== 'number' || typeof center.lng !== 'number') {
    return (
      <div className="h-full w-full bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-500 flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest">Initializing Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-zinc-100 overflow-hidden relative group">
      <MapContainer 
        center={[center.lat, center.lng]} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        zoomControl={false}
        attributionControl={false}
      >
        <ChangeView 
          center={[center.lat, center.lng]} 
          zoom={zoom} 
          isAutoCenter={isAutoCenter}
          setIsAutoCenter={setIsAutoCenter}
        />
        <MapControls isAutoCenter={isAutoCenter} setIsAutoCenter={setIsAutoCenter} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-natural"
        />
        
        {markers.map((marker) => {
          if (!marker || typeof marker.lat !== 'number' || typeof marker.lng !== 'number') return null;
          
          let color = '#3b82f6'; // Default blue
          if (marker.type === 'pickup') color = '#10b981'; // Emerald
          else if (marker.type === 'dropoff') color = '#ef4444'; // Red
          else if (marker.type === 'driver') color = '#f59e0b'; // Amber
          else if (marker.type === 'user') color = '#8b5cf6'; // Violet

          return (
            <Marker 
              key={marker.id} 
              position={[marker.lat, marker.lng]}
              icon={createCustomIcon(marker.type, color)}
              eventHandlers={{
                click: () => onMarkerClick?.(marker)
              }}
            >
              {marker.title && (
                <Popup className="premium-popup">
                  <div className="px-2 py-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-0.5">{marker.type}</p>
                    <p className="text-xs font-bold text-zinc-900">{marker.title}</p>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}

        {polylinePositions.length > 1 && (
          <>
            {/* Outer glow for polyline */}
            <Polyline 
              positions={polylinePositions} 
              color="#10b981" 
              weight={8} 
              opacity={0.15}
            />
            {/* Main polyline */}
            <Polyline 
              positions={polylinePositions} 
              color="#10b981" 
              weight={4} 
              opacity={0.9}
              dashArray="1, 8"
              className="animate-dash"
            />
          </>
        )}
      </MapContainer>

      <style>{`
        .map-tiles-natural {
          filter: none;
        }
        .leaflet-container {
          background: #f8fafc !important;
        }
        .premium-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          color: #18181b;
          padding: 0;
        }
        .premium-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
        .animate-dash {
          stroke-dasharray: 10, 20;
          animation: dash 20s linear infinite;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
        .custom-map-marker {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-map-marker:hover {
          transform: scale(1.2);
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
}
