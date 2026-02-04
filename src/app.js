const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes'); 
const userRoutes = require('./routes/user.routes');
const predictRoutes = require('./routes/predict.routes');
const trackerRoutes = require('./routes/tracker.routes');
const searchRoutes = require('./routes/search.routes');
const newsRoutes = require('./routes/news.routes');
const chatbotRoutes = require('./routes/chatbot.routes');

class App {
  constructor() {
    this.app = express();
    this.setMiddlewares();
    this.setRoutes();
  }

  setMiddlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setRoutes() {
    this.app.get('/', (req, res) => {
      res.status(200).json({
        status: 'success',
        message: 'NYAM Backend API is running',
        timestamp: new Date().toISOString()
      });
    });

    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/predict', predictRoutes);
    this.app.use('/api/tracker', trackerRoutes);
    this.app.use('/api/search', searchRoutes);
    this.app.use('/api/news', newsRoutes);
    this.app.use('/api/chat', chatbotRoutes);
  }

  getApp() {
    return this.app;
  }
}

module.exports = new App().getApp();