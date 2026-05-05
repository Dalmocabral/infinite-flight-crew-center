// src/component/AxiosInstance.jsx
import axios from 'axios';

const baseURL = import.meta.env.DEV
  ? 'http://localhost:8000/'
  : 'https://infinite-flight-crew-center.onrender.com/';

const AxiosInstance = axios.create({ baseURL });

// Adiciona o token ao cabeçalho de todas as requisições, exceto para /register/
AxiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.url.includes('/register/')) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Intercepta respostas com erro 401 para fazer logout automático
AxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('loginTimestamp');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default AxiosInstance;
