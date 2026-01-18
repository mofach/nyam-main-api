const chatbotService = require('../services/chatbot.service');
const userService = require('../services/user.service');

const chat = async (req, res) => {
    try {
        const { uid } = req.user; // Dari Token
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ status: 'fail', message: 'Message is required' });
        }

        // 1. Ambil data user dulu buat konteks AI
        const userProfile = await userService.getUserProfile(uid);
        
        // 2. Kirim ke Gemini
        const replyText = await chatbotService.generateReply(message, userProfile);

        res.status(200).json({
            status: 'success',
            data: {
                reply: replyText
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = { chat };