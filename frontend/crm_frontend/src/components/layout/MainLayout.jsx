import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Drawer, List, ListItem, ListItemText, CssBaseline } from '@mui/material';
import useAuth from '../../hooks/useAuth';

function MainLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const drawerWidth = 240;

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { text: 'Dashboard', path: '/dashboard' },
    { text: 'Leads', path: '/leads' },
    { text: 'Leads Duplicados', path: '/leads/duplicados' },
    { text: 'Citas', path: '/appointments' },
    { text: 'Carga CSV', path: '/csv-upload' },
    { text: 'Personal OPC', path: '/opc-personnel' },
    { text: 'Leads OPC', path: '/opc-leads' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            CRM Inmobiliario
          </Typography>
          {user && (
            <Typography variant="subtitle1" sx={{ mr: 2 }}>
              Hola, {user.username}
            </Typography>
          )}
          <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {navItems.map((item) => (
              // CORRECCIÓN: Usar item.path como key, que es garantizadamente único
              <ListItem button key={item.path} onClick={() => navigate(item.path)}>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default MainLayout;