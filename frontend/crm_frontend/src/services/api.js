// frontend/src/services/api.js
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token de acceso a cada petición
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar tokens expirados y refrescarlos
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Si el error es 401 (Unauthorized) y no es la petición de refresh token y aún no se ha reintentado
    if (error.response?.status === 401 && originalRequest.url !== '/token/refresh/' && !originalRequest._retry) {
      originalRequest._retry = true; // Marca la petición original como reintentada
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No hay refresh token, redirigir al login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Petición para refrescar el token
        const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Falló el refresh, logout del usuario
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;