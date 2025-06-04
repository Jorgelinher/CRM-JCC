// frontend/crm_frontend/src/pages/Auth/LoginPage.jsx
import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth'; // Importa el hook de autenticación
import { TextField, Button, Paper, Typography, Box, Alert } from '@mui/material'; // Importa Alert de MUI

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Estado para mensajes de error
  const [loading, setLoading] = useState(false); // Estado para el indicador de carga
  const { login } = useAuth(); // Obtiene la función login del contexto de autenticación

  const handleSubmit = async (event) => {
    event.preventDefault(); // Evita que la página se recargue
    setError(''); // Limpia cualquier error previo
    setLoading(true); // Muestra indicador de carga

    try {
      // Llama a la función login del contexto, que a su vez llama a auth.js
      await login(username, password);
      // Si el login es exitoso, el hook useAuth (a través de AuthContext)
      // ya debería redirigir a /dashboard.
    } catch (err) {
      // Manejo de errores de la API
      if (err.response && err.response.status === 401) {
        setError('Usuario o contraseña incorrectos.');
      } else {
        setError('Ocurrió un error al intentar iniciar sesión. Por favor, inténtalo de nuevo más tarde.');
      }
      console.error("Error al iniciar sesión:", err); // Para depuración
    } finally {
      setLoading(false); // Oculta el indicador de carga
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Iniciar Sesión en CRM
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Usuario"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading} // Deshabilita el campo durante la carga
          />
          <TextField
            label="Contraseña"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading} // Deshabilita el campo durante la carga
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3, mb: 2 }}
            disabled={loading} // Deshabilita el botón durante la carga
          >
            {loading ? 'Iniciando...' : 'Entrar'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default LoginPage;