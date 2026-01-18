const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const generateReply = async (userMessage, userProfile) => {
    try {
        // Prompt Engineering: Membentuk Persona AI
        const prompt = `
            Bertindaklah sebagai 'NYAM Bot', asisten ahli gizi pribadi yang ramah dan profesional.
            
            Profil Pengguna:
            - Berat: ${userProfile.weight} kg
            - Tinggi: ${userProfile.height} cm
            - Umur: ${userProfile.age} tahun
            - Gender: ${userProfile.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
            
            Instruksi:
            1. Jawab pertanyaan pengguna terkait gizi, makanan, dan kesehatan.
            2. Gunakan data profil pengguna untuk memberikan saran yang lebih personal (misal menghitung kebutuhan kalori jika diminta).
            3. Jika pertanyaan melenceng jauh dari kesehatan (misal politik/game), tolak dengan sopan.
            4. Jawaban maksimal 3 paragraf pendek. Gunakan Bahasa Indonesia yang santai.
            
            User bertanya: "${userMessage}"
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error('Gemini AI Error:', error);
        throw new Error('Maaf, fitur konsultasi sedang gangguan. Coba lagi nanti.');
    }
};

module.exports = { generateReply };