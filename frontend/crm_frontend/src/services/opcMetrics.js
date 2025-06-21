import api from './api';

const opcMetricsService = {
  // Obtener métricas de leads OPC
  getOPCLeadsMetrics: async (params = {}) => {
    try {
      const response = await api.get('/opc-leads-metrics/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching OPC leads metrics:', error);
      throw error;
    }
  },

  // Obtener rendimiento por personal OPC
  getOPCPersonnelPerformance: async (params = {}) => {
    try {
      const response = await api.get('/opc-leads-metrics/', { 
        params: { ...params, include_performance: true } 
      });
      return response.data.rendimiento_personal_opc || [];
    } catch (error) {
      console.error('Error fetching OPC personnel performance:', error);
      throw error;
    }
  },

  // Obtener distribución por proyectos
  getProjectDistribution: async (params = {}) => {
    try {
      const response = await api.get('/opc-leads-metrics/', { params });
      return response.data.distribucion_proyectos || [];
    } catch (error) {
      console.error('Error fetching project distribution:', error);
      throw error;
    }
  },

  // Obtener distribución por medios
  getMediumDistribution: async (params = {}) => {
    try {
      const response = await api.get('/opc-leads-metrics/', { params });
      return response.data.distribucion_medios || [];
    } catch (error) {
      console.error('Error fetching medium distribution:', error);
      throw error;
    }
  },

  // Obtener tipificaciones por asesor
  getAdvisorClassifications: async (params = {}) => {
    try {
      const response = await api.get('/opc-leads-metrics/', { params });
      return response.data.tipificaciones_por_asesor || [];
    } catch (error) {
      console.error('Error fetching advisor classifications:', error);
      throw error;
    }
  },
};

export default opcMetricsService; 