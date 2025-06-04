

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from "./contexts/AuthContext.jsx";
import useAuth from "./hooks/useAuth.js";

// Páginas
import LoginPage from './pages/Auth/LoginPage.jsx';
import LeadsPage from './pages/Leads/LeadsPage.jsx';
import LeadDetailPage from './pages/Leads/LeadDetailPage.jsx';
// REMOVIDO: import LeadFormPage from './pages/Leads/LeadFormPage.jsx'; // Eliminar esta línea
import AppointmentsPage from './pages/Appointments/AppointmentsPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import CsvUploadPage from './pages/CsvUpload/CsvUploadPage.jsx';
import MainLayout from './components/layout/MainLayout.jsx';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>; // O un spinner global
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            {/* REMOVIDO: <Route path="leads/new" element={<LeadFormPage />} /> */}
            <Route path="leads/:id" element={<LeadDetailPage />} />
            {/* REMOVIDO: <Route path="leads/:id/edit" element={<LeadFormPage />} /> */}
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="csv-upload" element={<CsvUploadPage />} />
            {/* ... otras rutas protegidas ... */}
          </Route>

          {/* Rutas no encontradas */}
          <Route path="*" element={<div>404: Página no encontrada</div>} />
        </Routes>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);