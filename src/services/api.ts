import { isNative } from './nativeService';

// Using the local backend by default in the preview environment
const BACKEND_URL = ''; 

export const getApiUrl = (path: string) => {
  // Use VITE_API_URL if provided, otherwise fallback to the current origin (relative path)
  const baseUrl = import.meta.env.VITE_API_URL || BACKEND_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
