import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';

// Páginas y Componentes de Layout
import LoginPage from './pages/Auth/LoginPage.jsx';
import LeadsPage from './pages/Leads/LeadsPage.jsx';
import LeadDetailPage from './pages/Leads/LeadDetailPage.jsx';
import AppointmentsPage from './pages/Appointments/AppointmentsPage.jsx';
import AppointmentDetailPage from './pages/Appointments/AppointmentDetailPage.jsx';
import DashboardPage from './pages/Dashboard/DashboardPage.jsx';
import CsvUploadPage from './pages/CsvUpload/CsvUploadPage.jsx';
import OPCPersonnelPage from './pages/OPCPersonnel/OPCPersonnelPage.jsx';
import OPCLeadsPage from './pages/OPCLeads/OPCLeadsPage.jsx'; // Asegúrate de que esta línea exista
import MainLayout from './components/layout/MainLayout.jsx';

// Contexto de Autenticación y Hook
import { AuthProvider } from "./contexts/AuthContext.jsx";
import useAuth from "./hooks/useAuth.js";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Cargando autenticación...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

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
              <Route path="leads/:id" element={<LeadDetailPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="appointments/:id" element={<AppointmentDetailPage />} />
              <Route path="csv-upload" element={<CsvUploadPage />} />
              <Route path="opc-personnel" element={<OPCPersonnelPage />} />
              <Route path="opc-leads" element={<OPCLeadsPage />} /> {/* Asegúrate de que esta ruta exista */}
            </Route>

            <Route path="*" element={<div>404: Página no encontrada</div>} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  </React.StrictMode>,
);