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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ClearAll as ClearAllIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom'; // CORRECCIÓN: Importar useNavigate
import { useForm } from 'react-hook-form';

import opcPersonnelService from '../../services/opcPersonnel';
import leadsService from '../../services/leads';

// Opciones de rol para el personal OPC
const ROLES_OPC_CHOICES = [
    { value: '', label: 'Seleccionar Rol' },
    { value: 'OPC', label: 'Personal OPC' },
    { value: 'SUPERVISOR', label: 'Supervisor OPC' },
];

// Estructura base para el horario semanal
const horario_base = {
    'Lunes': '',
    'Martes': '',
    'Miércoles': '',
    'Jueves': '',
    'Viernes': '',
    'Sábado': '',
    'Domingo': ''
};

function OPCPersonnelPage() {
  const navigate = useNavigate();
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterSupervisorOPC, setFilterSupervisorOPC] = useState('');
  const [filterFechaCaptacionDesde, setFilterFechaCaptacionDesde] = useState('');
  const [filterFechaCaptacionHasta, setFilterFechaCaptacionHasta] = useState('');


  const [opcSupervisorsList, setOpcSupervisorsList] = useState([]);


  const [openPersonnelModal, setOpenPersonnelModal] = useState(false);
  const [editingPersonnelId, setEditingPersonnelId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPersonnel, setTotalPersonnel] = useState(0);

  const { register, handleSubmit, reset, formState: { errors }, watch, getValues, setValue } = useForm({
    defaultValues: {
      nombre: '', telefono: '', email: '', rol: '', supervisor: '', user: '',
      horario_semanal: horario_base
    }
  });

  const watchedRol = watch('rol');
  const watchedSupervisorId = watch('supervisor');


  const fetchPersonnel = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        search: searchTerm,
        rol: filterRole || undefined,
        supervisor: filterSupervisorOPC || undefined,
        'fecha_captacion_after': filterFechaCaptacionDesde || undefined,
        'fecha_captacion_before': filterFechaCaptacionHasta || undefined,
        ordering: 'nombre',
      };
      const data = await opcPersonnelService.getPersonnel(params);
      setPersonnel(data.results || []);
      setTotalPersonnel(data.count || 0);
    } catch (err) {
      setError('Error al cargar el personal OPC.');
      console.error('Error fetching OPC personnel:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filterRole, filterSupervisorOPC, filterFechaCaptacionDesde, filterFechaCaptacionHasta]);

  const fetchFilterData = useCallback(async () => {
    try {
      const supervisorsData = await opcPersonnelService.getPersonnel({ rol: 'SUPERVISOR', page_size: 1000 });
      setOpcSupervisorsList(supervisorsData.results || []);
    } catch (err) {
      console.error('Error fetching supervisors for filter:', err);
    }
  }, []);

  const fetchModalData = useCallback(async () => {
    try {
      const [usersData, supervisorsData] = await Promise.all([
        leadsService.getUsers({ page_size: 1000 }),
        opcPersonnelService.getPersonnel({ rol: 'SUPERVISOR', page_size: 1000 }),
      ]);
      setAllUsers(usersData.results || []);
      setSupervisors(supervisorsData.results || []);
    } catch (err) {
      console.error('Error fetching modal data:', err);
    }
  }, []);

  useEffect(() => {
    fetchPersonnel();
    fetchFilterData();
  }, [fetchPersonnel, fetchFilterData]);

  const handleOpenNewPersonnelModal = () => {
    setEditingPersonnelId(null);
    reset({
      nombre: '', telefono: '', email: '', rol: '', supervisor: '', user: '',
      horario_semanal: horario_base
    });
    fetchModalData();
    setOpenPersonnelModal(true);
  };

  const handleOpenEditPersonnelModal = async (id) => {
    setEditingPersonnelId(id);
    fetchModalData();
    setOpenPersonnelModal(true);
    setLoading(true);
    try {
        const personnelData = await opcPersonnelService.getPersonnelById(id);
        reset({
            ...personnelData,
            user: personnelData.user ? personnelData.user.id : '',
            supervisor: personnelData.supervisor ? personnelData.supervisor.id : '',
            horario_semanal: personnelData.horario_semanal || horario_base
        });
    } catch (err) {
        setError('Error al cargar datos del personal para edición.');
        console.error('Error fetching personnel for edit:', err);
    } finally {
        setLoading(false);
    }
  };

  const handleClosePersonnelModal = () => {
    setOpenPersonnelModal(false);
    setEditingPersonnelId(null);
    setError('');
  };

  const handlePersonnelSave = async (data) => {
    setLoading(true);
    setError('');
    const payload = {
        ...data,
        user: data.user ? Number(data.user) : null,
        supervisor: data.supervisor ? Number(data.supervisor) : null,
        horario_semanal: data.horario_semanal || {},
    };

    try {
      if (editingPersonnelId) {
        await opcPersonnelService.updatePersonnel(editingPersonnelId, payload);
      } else {
        await opcPersonnelService.createPersonnel(payload);
      }
      handleClosePersonnelModal();
      fetchPersonnel();
    } catch (err) {
      setError('Error al guardar el personal: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message));
      console.error('Error saving OPC personnel:', err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePersonnel = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar a este miembro del personal OPC?')) {
      setLoading(true);
      try {
        await opcPersonnelService.deletePersonnel(id);
        fetchPersonnel();
      } catch (err) {
        setError('Error al eliminar el personal OPC.');
        console.error('Error deleting OPC personnel:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(0);
  };

  const handleFilterRoleChange = (event) => {
    setFilterRole(event.target.value);
    setPage(0);
  };

  const handleFilterSupervisorOPCChange = (event) => {
    setFilterSupervisorOPC(event.target.value);
    setPage(0);
  };

  const handleFilterFechaCaptacionDesdeChange = (event) => {
    setFilterFechaCaptacionDesde(event.target.value);
    setPage(0);
  };

  const handleFilterFechaCaptacionHastaChange = (event) => {
    setFilterFechaCaptacionHasta(event.target.value);
    setPage(0);
  };


  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterSupervisorOPC('');
    setFilterFechaCaptacionDesde('');
    setFilterFechaCaptacionHasta('');
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Personal OPC
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Buscar Personal (Nombre, Teléfono, Email)"
          variant="outlined"
          fullWidth={false}
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ minWidth: 250 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {searchTerm ? (
                  <IconButton onClick={() => setSearchTerm('')} edge="end">
                    <ClearIcon />
                  </IconButton>
                ) : (
                  <SearchIcon />
                )}
              </InputAdornment>
            ),
          }}
        />
        <FormControl variant="outlined" sx={{ minWidth: 150 }}>
          <InputLabel>Filtrar por Rol</InputLabel>
          <Select
            value={filterRole}
            onChange={handleFilterRoleChange}
            label="Filtrar por Rol"
          >
            {ROLES_OPC_CHOICES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel>Supervisor OPC</InputLabel>
          <Select
            value={filterSupervisorOPC}
            onChange={handleFilterSupervisorOPCChange}
            label="Supervisor OPC"
          >
            <MenuItem value="">Todos</MenuItem>
            {opcSupervisorsList.map((sup) => (
              <MenuItem key={sup.id} value={sup.id}>
                {sup.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Fecha Captación Desde"
          type="date"
          value={filterFechaCaptacionDesde}
          onChange={handleFilterFechaCaptacionDesdeChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label="Fecha Captación Hasta"
          type="date"
          value={filterFechaCaptacionHasta}
          onChange={handleFilterFechaCaptacionHastaChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        {(searchTerm || filterRole || filterSupervisorOPC || filterFechaCaptacionDesde || filterFechaCaptacionHasta) && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearAllIcon />}
            onClick={handleClearAllFilters}
          >
            Borrar Filtros
          </Button>
        )}
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenNewPersonnelModal}
          sx={{ ml: 'auto' }}
        >
          Nuevo Personal OPC
        </Button>
      </Box>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && personnel.length === 0 && (
        <Typography variant="body1" align="center" sx={{ mt: 3 }}>
          No se encontró personal OPC.
        </Typography>
      )}

      {!loading && !error && personnel.length > 0 && (
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Supervisor</TableCell>
                  <TableCell>Usuario Sistema</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {personnel.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>{p.telefono || 'N/A'}</TableCell>
                    <TableCell>{p.email || 'N/A'}</TableCell>
                    <TableCell>{p.rol}</TableCell>
                    <TableCell>{p.supervisor_name || 'N/A'}</TableCell>
                    <TableCell>{p.user_username || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar Personal">
                        <IconButton onClick={() => handleOpenEditPersonnelModal(p.id)}>
                          <EditIcon color="warning" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar Personal">
                        <IconButton onClick={() => handleDeletePersonnel(p.id)}>
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
            count={totalPersonnel}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      )}

      {/* Modal de Creación/Edición de Personal OPC */}
      <Dialog open={openPersonnelModal} onClose={handleClosePersonnelModal} fullWidth maxWidth="sm">
        <DialogTitle>{editingPersonnelId ? 'Editar Personal OPC' : 'Nuevo Personal OPC'}</DialogTitle>
        <DialogContent dividers>
          {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', my: 2 }} />}
          {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit(handlePersonnelSave)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  variant="outlined"
                  fullWidth
                  {...register('nombre', { required: 'El nombre es requerido.' })}
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teléfono"
                  variant="outlined"
                  fullWidth
                  {...register('telefono')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  variant="outlined"
                  fullWidth
                  {...register('email', { pattern: { value: /^\S+@\S+$/i, message: 'Formato de email inválido.' } })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.rol}>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    label="Rol"
                    {...register('rol', { required: 'El rol es requerido.' })}
                    value={watchedRol}
                    onChange={(e) => {
                      setValue('rol', e.target.value);
                    }}
                    InputLabelProps={{ shrink: true }}
                  >
                    {ROLES_OPC_CHOICES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.rol && <Typography color="error" variant="caption">{errors.rol.message}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={watchedRol !== 'OPC'}>
                  <InputLabel>Supervisor</InputLabel>
                  <Select
                    label="Supervisor"
                    {...register('supervisor')}
                    value={watchedRol === 'OPC' ? (watchedSupervisorId || '') : ''}
                    onChange={(e) => {
                      setValue('supervisor', e.target.value);
                    }}
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="">Sin Supervisor</MenuItem>
                    {supervisors.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Usuario del Sistema (Opcional)</InputLabel>
                  <Select
                    label="Usuario del Sistema (Opcional)"
                    {...register('user')}
                    value={watch('user') || ''}
                    onChange={(e) => {
                      setValue('user', e.target.value);
                    }}
                    InputLabelProps={{ shrink: true }}
                  >
                    <MenuItem value="">Sin Usuario</MenuItem>
                    {allUsers.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.username} ({u.first_name} {u.last_name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Horario Semanal</Typography>
                <Grid container spacing={2}>
                  {Object.keys(horario_base).map(day => (
                    <Grid item xs={12} sm={6} md={4} key={day}>
                      <TextField
                        label={day}
                        variant="outlined"
                        fullWidth
                        {...register(`horario_semanal.${day}`)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          {editingPersonnelId && (
            <Button onClick={() => handleDeletePersonnel(editingPersonnelId)} color="error">
              Eliminar
            </Button>
          )}
          <Button onClick={handleClosePersonnelModal} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleSubmit(handlePersonnelSave)} color="primary" variant="contained">
            {editingPersonnelId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OPCPersonnelPage;