export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.DEV ? "/api" : import.meta.env.VITE_API_URL)
  : "/api";
