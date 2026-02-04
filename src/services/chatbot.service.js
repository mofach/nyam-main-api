const { GoogleGenerativeAI } = require("@google/generative-ai");

class ChatbotService {
  constructor() {
    // Inisialisasi API Key dari environment variables
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Menggunakan model gemini-1.5-flash untuk stabilitas chat kontinu
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Menghasilkan balasan chat dengan mempertimbangkan konteks profil dan riwayat pesan.
   * @param {string} userMessage - Pesan terbaru dari pengguna.
   * @param {Object} userProfile - Data profil pengguna dari Firestore.
   * @param {Array} chatHistory - Array berisi riwayat percakapan sebelumnya.
   */
  async generateReply(userMessage, userProfile, chatHistory = []) {
    try {
      // 1. Logic Fallback & Sanitasi Data Profil
      // Mengecek data di dalam object physicalData (pola OOP baru) atau langsung di root (pola lama)
      const weight = userProfile?.physicalData?.weight || userProfile?.weight || 'Tidak diketahui';
      const height = userProfile?.physicalData?.height || userProfile?.height || 'Tidak diketahui';
      const age = userProfile?.physicalData?.age || userProfile?.age || 'Tidak diketahui';
      
      // Handle gender: 0/male dianggap Laki-laki, selain itu Perempuan
      const genderValue = userProfile?.physicalData?.gender ?? userProfile?.gender;
      const gender = (genderValue === 0 || genderValue === 'male') ? 'Laki-laki' : 'Perempuan';

      // 2. Prompt Engineering: Membentuk Persona AI
      const systemInstruction = `
            Bertindaklah sebagai 'NYAM Bot', asisten ahli gizi pribadi yang ramah dan profesional.
            
            Profil Pengguna:
            - Berat: ${weight} kg
            - Tinggi: ${height} cm
            - Umur: ${age} tahun
            - Gender: ${gender}
            
            Instruksi:
            1. Jawab pertanyaan pengguna terkait gizi, makanan, dan kesehatan.
            2. Gunakan data profil pengguna untuk memberikan saran yang lebih personal.
            3. Jika pertanyaan melenceng jauh dari kesehatan, tolak dengan sopan.
            4. Jawaban maksimal 3 paragraf pendek. Gunakan Bahasa Indonesia yang santai.
        `;

      // 3. Validasi Chat History (Safety Net)
      // SDK Gemini mewajibkan elemen pertama dalam history memiliki role 'user'
      let sanitizedHistory = [...chatHistory];
      if (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== 'user') {
        sanitizedHistory.shift(); // Hapus pesan pertama jika role-nya bukan 'user' (misal: sambutan bot)
      }

      // 4. Inisialisasi Chat Session
      const chatSession = this.model.startChat({
        history: sanitizedHistory,
      });

      // 5. Penanganan Pesan Pertama vs Pesan Lanjutan
      // Jika history kosong, kita sertakan System Instruction sebagai konteks di pesan pertama
      const finalInput = sanitizedHistory.length === 0 
        ? `${systemInstruction}\n\nUser bertanya: "${userMessage}"` 
        : userMessage;

      // 6. Eksekusi Pengiriman Pesan
      const result = await chatSession.sendMessage(finalInput);
      const response = await result.response;
      
      return response.text();

    } catch (error) {
      // Log detail error agar bisa dianalisa di Google Cloud Run Console
      console.error('❌ Gemini API Detail Error:', error.message);
      
      // Memberikan pesan error yang ramah ke pengguna
      throw new Error('Maaf, fitur konsultasi sedang gangguan. Coba lagi nanti.');
    }
  }
}

module.exports = new ChatbotService();