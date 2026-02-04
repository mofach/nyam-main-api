const { GoogleGenerativeAI } = require("@google/generative-ai");

class ChatbotService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  }

  async generateReply(userMessage, userProfile, chatHistory = []) {
    try {
      // Logic Fallback: Cek di physicalData (OOP), jika tidak ada cek di root (Old Code)
      const weight = userProfile.physicalData?.weight || userProfile.weight || 'Tidak diketahui';
      const height = userProfile.physicalData?.height || userProfile.height || 'Tidak diketahui';
      const age = userProfile.physicalData?.age || userProfile.age || 'Tidak diketahui';
      
      // Handle gender (Old code pakai string 'male', OOP pakai integer 0)
      const genderValue = userProfile.physicalData?.gender ?? userProfile.gender;
      const gender = (genderValue === 0 || genderValue === 'male') ? 'Laki-laki' : 'Perempuan';

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

      // Gunakan startChat untuk memperbaiki bug "lupa konteks"
      const chatSession = this.model.startChat({
        history: chatHistory,
      });

      // Untuk pesan pertama, kita sertakan System Instruction sebagai konteks awal
      const finalMessage = chatHistory.length === 0 
        ? `${systemInstruction}\n\nUser bertanya: "${userMessage}"` 
        : userMessage;

      const result = await chatSession.sendMessage(finalMessage);
      const response = await result.response;
      return response.text();

    } catch (error) {
      // Log error asli ke console cloud agar kamu bisa baca detailnya
      console.error('❌ Gemini API Detail Error:', error);
      throw new Error('Maaf, fitur konsultasi sedang gangguan. Coba lagi nanti.');
    }
  }
}

module.exports = new ChatbotService();