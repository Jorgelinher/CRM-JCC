import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme'; // Importa tu tema personalizado

// Páginas y Componentes de Layout
import LoginPage from './pages/Auth/LoginPage.jsx';
import LeadsPage from './pages/Leads/LeadsPage.jsx';
import LeadDetailPage from './pages/Leads/LeadDetailPage.jsx';
import AppointmentsPage from './pages/Appointments/AppointmentsPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import CsvUploadPage from './pages/CsvUpload/CsvUploadPage.jsx';
import MainLayout from './components/layout/MainLayout.jsx';

// Contexto de Autenticación y Hook
import { AuthProvider } from "./contexts/AuthContext.jsx";
import useAuth from "./hooks/useAuth.js";

// Componente para Rutas Protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Puedes mejorar esto con un spinner global o una pantalla de carga
    return <div>Cargando autenticación...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Punto de Entrada Principal de la Aplicación
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Aplica estilos base de MUI y tu tema */}
      <Router>
        <AuthProvider>
          <Routes>
            {/* Ruta para la página de Login (no protegida) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Agrupa rutas que usan el mismo layout y requieren autenticación */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout /> {/* Contenedor de layout para las rutas internas */}
                </ProtectedRoute>
              }
            >
              {/* Rutas Internas Protegidas */}
              <Route index element={<Navigate to="/dashboard" replace />} /> {/* Redirige '/' a '/dashboard' por defecto */}
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="leads/:id" element={<LeadDetailPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="csv-upload" element={<CsvUploadPage />} />
              {/* Añade más rutas protegidas aquí si las necesitas */}
            </Route>

            {/* Ruta para manejar cualquier URL no encontrada (404) */}
            <Route path="*" element={<div>404: Página no encontrada</div>} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  </React.StrictMode>,
);