import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Interceptores opcionales (puedes expandir esto luego)
API.interceptors.response.use(
  response => response,
  error => {
    console.error('API error:', error);
    return Promise.reject(error);
  }
);

export default API;
