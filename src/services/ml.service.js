const axios = require('axios');

// Mengambil URL dari Environment Variable (disuntik via GitHub Secrets/Cloud Run)
const ML_BASE_URL = process.env.ML_API_URL;

/**
 * Mengirim data fisik user ke ML API (Python) untuk mendapatkan Skor BMR
 * @param {Object} payload - { gender, height, weight, bmi }
 * @returns {Promise<number|null>} predicted_index (0-5) atau null jika error
 */
const predictBmrScore = async (payload) => {
  try {
    // Validasi URL dulu biar gak silent error kalau env lupa diset
    if (!ML_BASE_URL) {
        console.warn('⚠️ ML_API_URL belum diset di environment variables!');
        return null;
    }

    const response = await axios.post(`${ML_BASE_URL}/bmr`, payload);
    
    // Cek struktur response dari Python:
    // { "prediction": { "predicted_index": 2, ... } }
    if (response.data && response.data.prediction) {
      return response.data.prediction.predicted_index;
    }
    
    return null;
  } catch (error) {
    console.error('❌ ML Service Error (BMR):', error.message);
    // Return null supaya aplikasi User tetap jalan meski ML mati
    return null; 
  }
};

module.exports = { predictBmrScore };