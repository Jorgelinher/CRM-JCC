import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button // NUEVO: Importar Button para el botón "Borrar Filtros"
} from '@mui/material';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area
} from 'recharts';
import { ClearAll as ClearAllIcon } from '@mui/icons-material'; // NUEVO: Importar ClearAllIcon

import metricsService from '../../services/metrics';
import leadsService from '../../services/leads';
import moment from 'moment';

const COLORS = [
  '#1E3A8A', '#FBBF24', '#EF4444', '#34495E', '#BDC3C7',
  '#28A745', '#17A2B8', '#FFC107', '#DC3545', '#6C757D'
];

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [asesores, setAsesores] = useState([]);
  const [selectedAsesor, setSelectedAsesor] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const fetchAsesores = useCallback(async () => {
    try {
      const data = await leadsService.getUsers({ page_size: 1000 });
      setAsesores(data.results || []);
    } catch (err) {
      console.error('Error fetching asesores for filter:', err);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        asesor_id: selectedAsesor || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
      };
      const data = await metricsService.getDashboardMetrics(params);
      setMetrics(data);
    } catch (err) {
      setError('Error al cargar las métricas del dashboard.');
      console.error('Error fetching dashboard metrics:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  }, [selectedAsesor, fechaDesde, fechaHasta]);

  useEffect(() => {
    fetchAsesores();
  }, [fetchAsesores]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);


  const handleAsesorChange = (event) => {
    setSelectedAsesor(event.target.value);
  };

  const handleFechaDesdeChange = (event) => {
    setFechaDesde(event.target.value);
  };

  const handleFechaHastaChange = (event) => {
    setFechaHasta(event.target.value);
  };

  // NUEVO: Función para borrar todos los filtros
  const handleClearAllFilters = () => {
    setSelectedAsesor('');
    setFechaDesde('');
    setFechaHasta('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Panel de Métricas y Control de Equipos
      </Typography>

      {/* Filtros */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl variant="outlined" sx={{ minWidth: 150 }}>
          <InputLabel>Filtrar por Asesor</InputLabel>
          <Select
            value={selectedAsesor}
            onChange={handleAsesorChange}
            label="Filtrar por Asesor"
          >
            <MenuItem value="">Todos los Asesores</MenuItem>
            {asesores.map((asesor) => (
              <MenuItem key={asesor.id} value={asesor.id}>
                {asesor.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Fecha Desde"
          type="date"
          value={fechaDesde}
          onChange={handleFechaDesdeChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label="Fecha Hasta"
          type="date"
          value={fechaHasta}
          onChange={handleFechaHastaChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 180 }}
        />
        {/* NUEVO BOTÓN: Borrar Filtros */}
        {(selectedAsesor || fechaDesde || fechaHasta) && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearAllIcon />}
            onClick={handleClearAllFilters}
          >
            Borrar Filtros
          </Button>
        )}
      </Paper>

      {loading && <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {!loading && !error && metrics && (
        <Grid container spacing={3}>
          {/* Métricas en tarjetas */}
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography color="text.secondary" gutterBottom>
                  Leads Asignados
                </Typography>
                <Typography variant="h5" component="div">
                  {metrics.metricas_generales.total_leads_asignados}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography color="text.secondary" gutterBottom>
                  Citas Confirmadas
                </Typography>
                <Typography variant="h5" component="div">
                  {metrics.metricas_generales.citas_confirmadas_global}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography color="text.secondary" gutterBottom>
                  Presencias
                </Typography>
                <Typography variant="h5" component="div">
                  {metrics.metricas_generales.presencias_global}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography color="text.secondary" gutterBottom>
                  Tasa de Conversión
                </Typography>
                <Typography variant="h5" component="div">
                  {metrics.metricas_generales.tasa_conversion_global}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Gráfico de Anillos: Top 10 Distritos */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom align="center">
                Top 10 Distritos con Leads
              </Typography>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={metrics.distribucion_distritos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {metrics.distribucion_distritos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Gráfico de Fuente de Leads (Medio de Captación) */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom align="center">
                Fuente de Leads (Medio de Captación)
              </Typography>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={metrics.fuente_leads} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#1E3A8A" name="Cantidad de Leads" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Tabla de Rendimientos Porcentuales de Asesores */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom align="center">
                Rendimiento Porcentual de Asesores
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Asesor</TableCell>
                      <TableCell align="right">Leads Asignados</TableCell>
                      <TableCell align="right">Citas Confirmadas</TableCell>
                      <TableCell align="right">Presencias</TableCell>
                      <TableCell align="right">Tasa de Conversión (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics.rendimiento_asesores.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} align="center">No hay datos de rendimiento para el rango seleccionado.</TableCell>
                        </TableRow>
                    ) : (
                        metrics.rendimiento_asesores.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell component="th" scope="row">
                            {row.nombre}
                            </TableCell>
                            <TableCell align="right">{row.leads_asignados}</TableCell>
                            <TableCell align="right">{row.citas_confirmadas}</TableCell>
                            <TableCell align="right">{row.presencias}</TableCell>
                            <TableCell align="right">{row.tasa_conversion}</TableCell>
                        </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Gráfico de Embudo de Ventas (AreaChart como alternativa si no hay Recharts FunnelChart) */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" gutterBottom align="center">
                Embudo de Ventas (Leads a Presencias)
              </Typography>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={metrics.embudo_ventas} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#1E3A8A" fill="#1E3A8A" name="Cantidad" />
                </AreaChart>
              </ResponsiveContainer>
              <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 1 }}>
                *Este gráfico representa el progreso acumulado a través de las etapas del embudo.
              </Typography>
            </Paper>
          </Grid>

        </Grid>
      )}
    </Box>
  );
}

export default DashboardPage;