import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // This is proxied by Vite during development
  headers: {
    'Content-Type': 'application/json',
  },
});

// We set the token in AuthContext, but this is a failsafe
// and useful for requests made outside the React component lifecycle.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;