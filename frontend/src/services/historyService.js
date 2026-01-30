import api from './api';

const historyService = {
  // Get user diagnosis history with pagination
  getUserHistory: async (page = 1, perPage = 20) => {
    try {
      const response = await api.get('/history', {
        params: { page, per_page: perPage },
      });
      if (response.data.success) {
        return {
          data: response.data.data,
          pagination: response.data.pagination,
        };
      }
      throw new Error('Failed to fetch history');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get diagnosis history detail
  getHistoryDetail: async (historyId) => {
    try {
      const response = await api.get(`/history/${historyId}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch history detail');
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Export history to PDF
  exportHistoryToPDF: async (historyId) => {
    try {
      // Get the token for authentication
      const token = localStorage.getItem('token');

      // Open the PDF endpoint in a new window with auth token
      // The endpoint returns a printable HTML page
      const baseURL = import.meta.env.VITE_API_URL || '/api';
      const pdfUrl = `${baseURL}/history/${historyId}/pdf`;

      // Open in new window
      const pdfWindow = window.open('', '_blank');

      // Fetch the content with auth header
      const response = await api.get(`/history/${historyId}/pdf`);

      // Write the HTML content to the new window
      if (pdfWindow) {
        pdfWindow.document.write(response.data);
        pdfWindow.document.close();

        // Trigger print dialog after a short delay
        setTimeout(() => {
          pdfWindow.print();
        }, 500);
      }

      return true;
    } catch (error) {
      console.error('PDF export error:', error);
      throw error.response?.data || error;
    }
  },

  // Delete history (if implemented in backend)
  deleteHistory: async (historyId) => {
    try {
      const response = await api.delete(`/history/${historyId}`);
      if (response.data.success) {
        return true;
      }
      throw new Error('Failed to delete history');
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default historyService;
