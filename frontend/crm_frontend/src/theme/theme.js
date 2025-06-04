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
    // Usaremos el color 'warning' de MUI como nuestro color de 'Acento'
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
    fontFamily: [ // Fuentes para un look moderno y limpio (ej. Montserrat o Roboto si está disponible)
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600, // Semi-negrita para títulos importantes
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
      textTransform: 'none', // Botones con texto normal, no mayúsculas por defecto
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Bordes ligeramente redondeados para botones
        },
        containedPrimary: {
          boxShadow: 'none', // Sombra sutil o ninguna para un look minimalista
          '&:hover': {
            backgroundColor: '#142960', // Un poco más oscuro en hover
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: '#BDC3C7',
          color: '#34495E',
          '&:hover': {
            borderColor: '#1E3A8A',
            color: '#1E3A8A',
            backgroundColor: 'rgba(30, 58, 138, 0.04)', // Ligero fondo primario en hover
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
            borderRadius: 8, // Bordes ligeramente redondeados para campos de texto
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)', // Sombra sutil para papel/tarjetas
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8F9FA', // Fondo para la cabecera de la tabla
          '& .MuiTableCell-root': {
            fontWeight: 600, // Negrita para encabezados de columna
            color: '#34495E', // Color de texto para encabezados de columna
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': { // Efecto cebra para filas impares
            backgroundColor: '#FFFFFF',
          },
          '&:nth-of-type(even)': { // Efecto cebra para filas pares (gris muy claro)
            backgroundColor: '#F8F9FA',
          },
          '&:hover': { // Sutil hover para filas
            backgroundColor: '#E0E0E0 !important',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#1E3A8A', // Enlaces en color primario
          textDecoration: 'none', // Sin subrayado por defecto
          '&:hover': {
            textDecoration: 'underline', // Subrayado en hover
          },
        },
      },
    },
    MuiAppBar: { // Ajustes para la barra de navegación superior (Header)
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF', // Fondo blanco para la AppBar
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)', // Sombra sutil
          color: '#34495E', // Color de texto por defecto
        },
      },
    },
    MuiDrawer: { // Ajustes para el Drawer lateral (Sidebar)
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF', // Fondo blanco para el Drawer
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)', // Sombra sutil
        },
      },
    },
    MuiListItemButton: { // Botones en el sidebar (ej. en MainLayout)
        styleOverrides: {
            root: {
                '&.Mui-selected': { // Estilo para el item de navegación activo/seleccionado
                    backgroundColor: 'rgba(30, 58, 138, 0.1)', // Fondo ligeramente azulado
                    color: '#1E3A8A', // Color de texto primario
                    '&:hover': {
                        backgroundColor: 'rgba(30, 58, 138, 0.15)',
                    },
                },
                '&:hover': {
                    backgroundColor: '#E0E0E0', // Gris muy claro en hover
                },
            },
        },
    },
  }
});

export default theme;