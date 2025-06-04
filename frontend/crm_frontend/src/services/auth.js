// frontend/src/services/auth.js
import apiClient from './api';
import axios from 'axios'; // Importa axios directamente para la petición de login/refresh sin el interceptor

const login = async (username, password) => {
  try {
    const response = await axios.post(`${apiClient.defaults.baseURL}/token/`, { // Usar baseURL de apiClient
      username,
      password,
    });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  // Opcional: invalidar token en el backend si tu JWT blacklisting lo soporta
};

// Puedes añadir una función para decodificar el token JWT si necesitas los datos del usuario en el frontend
const getUserFromToken = () => {
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      // Simplemente decodificar el payload (parte central) del JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.user_id, // Asume que user_id está en el payload
        username: payload.username, // Asume que username está en el payload
        // Otros datos que hayas configurado en tu token de Django
      };
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  }
  return null;
};


export { login, logout, getUserFromToken };