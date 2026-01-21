import api from './api';

const diagnosisService = {
  // Diagnose by symptoms (Forward Chaining or Certainty Factor)
  diagnoseBySymptoms: async (symptomIds, certaintyValues = null) => {
    try {
      const payload = {
        symptom_ids: symptomIds,
      };

      // Add certainty values if provided
      if (certaintyValues) {
        payload.certainty_values = certaintyValues;
      }

      const response = await api.post('/diagnosis/start', payload);
      if (response.data.success) {
        return response.data;
      }
      throw new Error(response.data.message || 'Diagnosis failed');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get diagnosis result
  getDiagnosisResult: async (historyId) => {
    try {
      const response = await api.get(`/diagnosis/result/${historyId}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch diagnosis result');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Export diagnosis result to PDF
  exportToPDF: async (historyId) => {
    try {
      const response = await api.get(`/history/${historyId}/pdf`, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `diagnosis_${historyId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default diagnosisService;
