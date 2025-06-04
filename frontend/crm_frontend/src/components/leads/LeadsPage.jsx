// frontend/crm_frontend/src/pages/Leads/LeadsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  TablePagination,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Add as AddIcon }
  from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import leadsService from '../../services/leads'; // Tu servicio de leads

// Opciones de tipificación (debe coincidir con tu modelo de Django)
const TIPIFICACION_CHOICES = [
  { value: '', label: 'Todas las Tipificaciones' },
  { value: 'Nuevo', label: 'Nuevo' },
  { value: 'Contactado', label: 'Contactado' },
  { value: 'Interesado', label: 'Interesado' },
  { value: 'No Contesta', label: 'No Contesta' },
  { value: 'Descartado', label: 'Descartado' },
  { value: 'Cita Agendada', label: 'Cita Agendada' },
  { value: 'Cita Confirmada', label: 'Cita Confirmada' },
  { value: 'Cita Realizada', label: 'Cita Realizada' },
  { value: 'Seguimiento', label: 'Seguimiento' },
];

function LeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipificacion, setFilterTipificacion] = useState('');
  const [filterAsesor, setFilterAsesor] = useState('');
  const [asesores, setAsesores] = useState([]); // Para el filtro de asesores

  // Paginación
  const [page, setPage] = useState(0); // Página actual (0-indexed)
  const [rowsPerPage, setRowsPerPage] = useState(10); // Elementos por página
  const [totalLeads, setTotalLeads] = useState(0); // Total de leads (para paginación)

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: page + 1, // Django usa paginación 1-indexed
        page_size: rowsPerPage, // Parámetro para el tamaño de página
        search: searchTerm,
        tipificacion: filterTipificacion,
        asesor: filterAsesor,
        ordering: '-fecha_creacion', // Ordenar por fecha de creación descendente por defecto
      };
      const data = await leadsService.getLeads(params);
      setLeads(data.results); // Asume que la API devuelve un objeto con 'results'
      setTotalLeads(data.count); // Asume que la API devuelve un 'count'
    } catch (err) {
      setError('Error al cargar los leads.');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filterTipificacion, filterAsesor]);

  const fetchAsesores = useCallback(async () => {
    try {
      const data = await leadsService.getUsers({ page_size: 1000 }); // Obtener una lista grande de asesores
      setAsesores(data.results || []);
    } catch (err) {
      console.error('Error fetching asesores:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchAsesores();
  }, [fetchAsesores]);


  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Resetear a la primera página al buscar
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0); // Resetear a la primera página al limpiar
  };

  const handleFilterTipificacionChange = (event) => {
    setFilterTipificacion(event.target.value);
    setPage(0); // Resetear a la primera página al filtrar
  };

  const handleFilterAsesorChange = (event) => {
    setFilterAsesor(event.target.value);
    setPage(0); // Resetear a la primera página al filtrar
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Resetear a la primera página al cambiar tamaño
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este lead?')) {
      try {
        await leadsService.deleteLead(id);
        fetchLeads(); // Recargar leads después de eliminar
      } catch (err) {
        setError('Error al eliminar el lead.');
        console.error('Error deleting lead:', err);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Leads
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Buscar Leads"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 250 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {searchTerm ? (
                  <IconButton onClick={handleClearSearch} edge="end">
                    <ClearIcon />
                  </IconButton>
                ) : (
                  <SearchIcon />
                )}
              </InputAdornment>
            ),
          }}
        />
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>Tipificación</InputLabel>
          <Select
            value={filterTipificacion}
            onChange={handleFilterTipificacionChange}
            label="Tipificación"
          >
            {TIPIFICACION_CHOICES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>Asesor</InputLabel>
          <Select
            value={filterAsesor}
            onChange={handleFilterAsesorChange}
            label="Asesor"
          >
            <MenuItem value="">Todos los Asesores</MenuItem>
            {asesores.map((asesor) => (
              <MenuItem key={asesor.id} value={asesor.id}>
                {asesor.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/leads/new')}
          sx={{ ml: 'auto' }}
        >
          Nuevo Lead
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && leads.length === 0 && (
        <Typography variant="body1" align="center" sx={{ mt: 3 }}>
          No se encontraron leads.
        </Typography>
      )}

      {!loading && !error && leads.length > 0 && (
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Celular</TableCell>
                  <TableCell>Proyecto</TableCell>
                  <TableCell>Tipificación</TableCell>
                  <TableCell>Asesor</TableCell>
                  <TableCell>Última Actualización</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.nombre}</TableCell>
                    <TableCell>{lead.celular}</TableCell>
                    <TableCell>{lead.proyecto}</TableCell>
                    <TableCell>{lead.tipificacion}</TableCell>
                    <TableCell>{lead.asesor ? lead.asesor.username : 'N/A'}</TableCell>
                    <TableCell>{new Date(lead.ultima_actualizacion).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver Detalles">
                        <IconButton onClick={() => navigate(`/leads/${lead.id}`)}>
                          <ViewIcon color="info" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar Lead">
                        <IconButton onClick={() => navigate(`/leads/${lead.id}/edit`)}>
                          <EditIcon color="warning" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar Lead">
                        <IconButton onClick={() => handleDeleteLead(lead.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalLeads}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      )}
    </Box>
  );
}

export default LeadsPage;