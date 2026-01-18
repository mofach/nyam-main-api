const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes'); 
const userRoutes = require('./routes/user.routes');
const predictRoutes = require('./routes/predict.routes');
const trackerRoutes = require('./routes/tracker.routes');
const searchRoutes = require('./routes/search.routes');
const newsRoutes = require('./routes/news.routes');       // <-- Baru
const chatbotRoutes = require('./routes/chatbot.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'NYAM Backend API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/chat', chatbotRoutes);
module.exports = app;