export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '') || '';

export const API_URL = `${API_BASE_URL}/api`;

export const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim().replace(/\/+$/, '') ||
  API_BASE_URL ||
  window.location.origin;

export default API_URL;