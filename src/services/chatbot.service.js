const { GoogleGenerativeAI } = require("@google/generative-ai");

class ChatbotService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateReply(userMessage, userProfile, chatHistory = []) {
    try {
      // 1. Definisikan System Instruction (Persona)
      const systemInstruction = `
        Bertindaklah sebagai 'NYAM Bot', asisten ahli gizi pribadi yang ramah dan profesional.
        Profil Pengguna:
        - Berat: ${userProfile.physicalData?.weight || 'Tidak diketahui'} kg
        - Tinggi: ${userProfile.physicalData?.height || 'Tidak diketahui'} cm
        - Umur: ${userProfile.physicalData?.age || 'Tidak diketahui'} tahun
        - Gender: ${userProfile.physicalData?.gender === 0 ? 'Laki-laki' : 'Perempuan'}
        
        Instruksi:
        1. Jawab pertanyaan pengguna terkait gizi, makanan, dan kesehatan.
        2. Gunakan data profil untuk saran personal.
        3. Tolak pertanyaan non-kesehatan dengan sopan.
        4. Jawaban maksimal 3 paragraf pendek, santai, Bahasa Indonesia.
      `;

      // 2. Memulai Chat Session dengan History
      // History harus dalam format: [{ role: "user", parts: [{ text: "..." }] }, { role: "model", parts: [...] }]
      const chatSession = this.model.startChat({
        history: chatHistory,
        generationConfig: { maxOutputTokens: 500 },
      });

      // 3. Kirim pesan dengan instruksi sistem yang disematkan di awal jika history kosong
      const finalMessage = chatHistory.length === 0 
        ? `${systemInstruction}\n\nUser berkata: ${userMessage}` 
        : userMessage;

      const result = await chatSession.sendMessage(finalMessage);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Gemini AI Error:', error);
      throw new Error('Maaf, fitur konsultasi sedang gangguan.');
    }
  }
}

module.exports = new ChatbotService();