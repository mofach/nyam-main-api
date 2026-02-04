const chatbotService = require('../services/chatbot.service');
const userService = require('../services/user.service');

class ChatbotController {
  constructor(service, userSvc) {
    this.service = service;
    this.userService = userSvc;
  }

  chat = async (req, res) => {
    try {
      const { uid } = req.user;
      const { message, history } = req.body; // Terima history dari frontend

      if (!message) {
        return res.status(400).json({ status: 'fail', message: 'Message is required' });
      }

      const userProfile = await this.userService.getUserProfile(uid);
      
      // Kirim message dan history ke service
      const replyText = await this.service.generateReply(message, userProfile, history || []);

      res.status(200).json({
        status: 'success',
        data: {
          reply: replyText
        }
      });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
}

module.exports = new ChatbotController(chatbotService, userService);