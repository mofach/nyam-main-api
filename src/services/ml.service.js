const axios = require('axios');
const FormData = require('form-data');

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

/**
 * Mengirim gambar ke ML API untuk ditebak
 * @param {Buffer} imageBuffer - Binary data dari gambar
 * @param {string} filename - Nama file asli
 * @returns {Promise<Object>} { class: "ayam", prob: 0.95 }
 */
const predictFood = async (imageBuffer, filename) => {
  try {
    if (!ML_BASE_URL) return null;

    // 1. Siapkan Form Data (Seolah-olah kita postman)
    const form = new FormData();
    form.append('file', imageBuffer, filename); // Key 'file' sesuai permintaan ML API

    // 2. Tembak ke ML API (/food)
    // Penting: Sertakan header dari form-data agar boundary-nya terbaca
    const response = await axios.post(`${ML_BASE_URL}/food`, form, {
      headers: {
        ...form.getHeaders()
      }
    });

    // 3. Return Data Sukses (200 OK)
    return response.data;

  } catch (error) {
    // 4. Handle Error Spesifik dari ML API
    if (error.response) {
      // Jika ML API balas 400 (Makanan tidak dikenali / No file)
      if (error.response.status === 400) {
        throw new Error(error.response.data.message || error.response.data.error || 'Bad Request form ML');
      }
      // Error Server ML (500)
      console.error('❌ ML API Error (Food 500):', error.response.data);
      throw new Error('ML Service Error');
    }
    
    console.error('❌ Network Error to ML:', error.message);
    throw new Error('Connection to ML Service failed');
  }
};

module.exports = { predictBmrScore, predictFood };