/**
 * Get API URL without /api suffix for admin endpoints
 * This ensures we don't have double /api in URLs
 */
export const getAdminApiUrl = () => {
  let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  // Remove /api suffix if present since we'll add it manually
  return API_URL.replace(/\/api$/, '');
};

/**
 * Get API URL with /api suffix for regular endpoints
 */
export const getApiUrl = () => {
  let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  // Ensure /api suffix is present
  if (!API_URL.endsWith('/api')) {
    API_URL = API_URL + '/api';
  }
  return API_URL;
};
