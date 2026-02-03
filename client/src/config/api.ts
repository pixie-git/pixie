/**
 * Determines the API origin based on environment variables and build mode.
 * 
 * Logic:
 * 1. If VITE_API_URL is set and not empty, use it.
 * 2. If PROD, default to relative path ('') to allow same-domain proxying.
 * 3. If DEV, default to 'http://localhost:3000'.
 * 
 * This prevents dev builds from accidentally adhering to production relative path logic
 * if the env var is present but empty.
 */
export const getApiOrigin = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }
  return import.meta.env.PROD ? '' : 'http://localhost:3000';
};
