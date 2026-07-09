import axios from 'axios';

export const BACKEND_URL = import.meta.env.MODE === 'production'
  ? 'https://civicmindai-backend.onrender.com'
  : '';

const API = axios.create({
  baseURL: `${BACKEND_URL}/api`
});

// Interceptor to append Authorization Header automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND_URL}${url}`;
};

export default API;
