import { useState, useEffect } from 'react';

export interface Location {
  lat: number;
  lng: number;
}

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [path, setPath] = useState<Location[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const newLoc = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      
      setLocation(prev => {
        if (prev && prev.lat === newLoc.lat && prev.lng === newLoc.lng) return prev;
        return newLoc;
      });

      setPath(prev => {
        const last = prev[prev.length - 1];
        if (last && last.lat === newLoc.lat && last.lng === newLoc.lng) return prev;
        return [...prev, newLoc];
      });
      setLoading(false);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn("Geolocation error:", error.message);
      setError(error.message);
      // Fallback to a default location if permission denied or other error
      const fallbackLoc = { lat: 22.6708, lng: 71.5724 }; // Gujarat default
      setLocation(fallbackLoc);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, path, error, loading };
}
