/**
 * Get API URL without /api suffix for admin endpoints
 * This ensures we don't have double /api in URLs
 */
export const getAdminApiUrl = () => {
  // Use production URL by default, fallback to localhost for development
  let API_URL = import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : 'https://mubarakway-backend.onrender.com/api');

  // Remove /api suffix if present since we'll add it manually
  return API_URL.replace(/\/api$/, '');
};

/**
 * Get API URL with /api suffix for regular endpoints
 */
export const getApiUrl = () => {
  // Use production URL by default, fallback to localhost for development
  let API_URL = import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : 'https://mubarakway-backend.onrender.com/api');

  // Ensure /api suffix is present
  if (!API_URL.endsWith('/api')) {
    API_URL = API_URL + '/api';
  }
  return API_URL;
};
