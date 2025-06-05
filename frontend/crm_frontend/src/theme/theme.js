// frontend/crm_frontend/src/theme/theme.js

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1E3A8A', // Azul Zafiro Profundo (Confianza, Profesionalismo)
      light: '#4C609B', // Un tono más claro del primario
      dark: '#142960',  // Un tono más oscuro del primario
      contrastText: '#FFFFFF', // Texto blanco sobre el primario
    },
    secondary: {
      main: '#F8F9FA', // Gris Ultra-Claro (Fondos, Espacios)
      light: '#FFFFFF', // Blanco puro para superficies
      dark: '#E0E0E0',  // Un gris más oscuro para bordes o divisores
      contrastText: '#34495E', // Texto oscuro sobre el secundario
    },
    warning: {
      main: '#FBBF24', // Amarillo Ámbar Vibrante (Interacción, Énfasis)
      light: '#FFD700',
      dark: '#E0A300',
      contrastText: '#34495E', // Texto oscuro sobre el acento
    },
    error: {
      main: '#EF4444', // Rojo Vibrante (Errores, Alertas)
      light: '#FF6347',
      dark: '#CC0000',
      contrastText: '#FFFFFF', // Texto blanco sobre el error
    },
    text: {
      primary: '#34495E', // Gris Carbón Oscuro (Texto principal, alta legibilidad)
      secondary: '#BDC3C7', // Gris Medio (Texto secundario, detalles)
    },
    background: {
      default: '#F8F9FA', // Fondo general de la aplicación
      paper: '#FFFFFF',   // Fondo de tarjetas, modales, etc.
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600,
      color: '#34495E',
    },
    h6: {
      fontWeight: 500,
      color: '#34495E',
    },
    body1: {
      color: '#34495E',
    },
    button: {
      textTransform: 'none',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#142960',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: '#BDC3C7',
          color: '#34495E',
          '&:hover': {
            borderColor: '#1E3A8A',
            color: '#1E3A8A',
            backgroundColor: 'rgba(30, 58, 138, 0.04)',
          },
        },
        text: {
          color: '#1E3A8A',
          '&:hover': {
            backgroundColor: 'rgba(30, 58, 138, 0.04)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    // AJUSTE PARA EL ENCABEZADO DE LA APLICACIÓN (AppBar) - ¡REVERTIDO A BLANCO!
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF', // <-- Fondo blanco (o tu color secundario)
          color: '#34495E', // <-- Texto oscuro para contraste
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)', // Sombra sutil
        },
      },
    },
    // AJUSTE PARA EL ENCABEZADO DE LAS TABLAS (TableHead) - ¡ESTO SE MANTIENE AZUL OSCURO!
MuiTableHead: {
  styleOverrides: {
    root: {
      backgroundColor: '#1E3A8A', // <-- Fondo azul oscuro (Tu color Primario)
      '& .MuiTableCell-root': {
        fontWeight: 600,
        color: '#FFFFFF', // <-- Texto blanco para contraste
        padding: '12px 16px', // Ajusta el padding para un mejor espaciado en encabezados
      },
    },
  },
},
MuiTableCell: { // Ajustes generales para todas las celdas de tabla (head y body)
      styleOverrides: {
        root: {
          padding: '10px 16px', // Padding uniforme para todas las celdas
          borderColor: '#E0E0E0', // Color de borde suave para las celdas
        },
        head: { // <--- ¡NUEVA REGLA ESPECÍFICA PARA LAS CELDAS DE LA CABECERA!
          backgroundColor: '#1E3A8A', // <-- Fondo azul oscuro para las celdas de la cabecera
          color: '#FFFFFF', // <-- Texto blanco para contraste
          fontWeight: 600,
          padding: '12px 16px', // Ajusta el padding para un mejor espaciado en encabezados
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: '#FFFFFF',
          },
          '&:nth-of-type(even)': {
            backgroundColor: '#F8F9FA', // Alterna con el gris ultra-claro
          },
          '&:hover': {
            backgroundColor: '#E0E0E0 !important', // Gris claro en hover
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#1E3A8A',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiListItemButton: {
        styleOverrides: {
            root: {
                '&.Mui-selected': {
                    backgroundColor: 'rgba(30, 58, 138, 0.1)',
                    color: '#1E3A8A',
                    '&:hover': {
                        backgroundColor: 'rgba(30, 58, 138, 0.15)',
                    },
                },
                '&:hover': {
                    backgroundColor: '#E0E0E0',
                },
            },
        },
    },
  }
});

export default theme;