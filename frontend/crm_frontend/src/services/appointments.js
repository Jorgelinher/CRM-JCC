// frontend/crm_frontend/src/services/appointments.js
import apiClient from './api';

const appointmentsService = {
  // Obtener todas las citas
  getAppointments: async (params) => {
    try {
      const response = await apiClient.get('/appointments/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  // Obtener una cita por su ID
  getAppointmentById: async (id) => {
    try {
      const response = await apiClient.get(`/appointments/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching appointment with ID ${id}:`, error);
      throw error;
    }
  },

  // Crear una nueva cita
  createAppointment: async (appointmentData) => {
    try {
      const response = await apiClient.post('/appointments/', appointmentData);
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  // Actualizar una cita existente
  updateAppointment: async (id, appointmentData) => {
    try {
      const response = await apiClient.put(`/appointments/${id}/`, appointmentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating appointment with ID ${id}:`, error);
      throw error;
    }
  },

  // Eliminar una cita
  deleteAppointment: async (id) => {
    try {
      const response = await apiClient.delete(`/appointments/${id}/`);
      return response.status;
    } catch (error) {
      console.error(`Error deleting appointment with ID ${id}:`, error);
      throw error;
    }
  },
};

export default appointmentsService;