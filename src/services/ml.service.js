const axios = require('axios');
const FormData = require('form-data');

class MlService {
  constructor() {
    this.baseUrl = process.env.ML_API_URL;
  }

  async predictBmrScore(payload) {
    try {
      if (!this.baseUrl) {
        console.warn('⚠️ ML_API_URL belum diset!');
        return null;
      }

      const response = await axios.post(`${this.baseUrl}/bmr`, payload);
      
      if (response.data && response.data.prediction) {
        return response.data.prediction.predicted_index;
      }
      return null;
    } catch (error) {
      console.error('❌ ML Service Error (BMR):', error.message);
      return null; 
    }
  }

  async predictFood(imageBuffer, filename) {
    try {
      if (!this.baseUrl) return null;

      const form = new FormData();
      form.append('file', imageBuffer, filename);

      const response = await axios.post(`${this.baseUrl}/food`, form, {
        headers: { ...form.getHeaders() }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error(error.response.data.message || error.response.data.error || 'Bad Request from ML');
        }
        throw new Error('ML Service Error');
      }
      throw new Error('Connection to ML Service failed');
    }
  }
}

module.exports = new MlService();