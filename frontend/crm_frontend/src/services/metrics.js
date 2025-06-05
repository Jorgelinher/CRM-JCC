// frontend/crm_frontend/src/services/metrics.js (NUEVO ARCHIVO)
import apiClient from './api'; // Importa tu instancia de Axios configurada

const metricsService = {
  getDashboardMetrics: async (params = {}) => {
    try {
      // Los parámetros como asesor_id, fecha_desde, fecha_hasta se pasan directamente
      const response = await apiClient.get('/dashboard-metrics/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },
};

export default metricsService;