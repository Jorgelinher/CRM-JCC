// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { login as authLogin, logout as authLogout, getUserFromToken } from '../services/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Intentar cargar el usuario desde el token al iniciar
    const storedUser = getUserFromToken();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authLogin(username, password);
      const decodedUser = getUserFromToken(); // Obtener datos del usuario del nuevo token
      setUser(decodedUser);
      navigate('/dashboard'); // Redirigir al dashboard o página principal
      return data;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    authLogout();
    setUser(null);
    navigate('/login'); // Redirigir al login
  };

  if (loading) {
    return <div>Cargando autenticación...</div>; // O un spinner
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;