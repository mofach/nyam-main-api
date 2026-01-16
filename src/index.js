require('dotenv').config(); // Load environment variables dari .env
const app = require('./app'); // Import settingan app dari app.js

const PORT = process.env.PORT || 3000;

// --- Server Listener ---
const server = app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 NYAM Server running on PORT ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================`);
});

// Handle error kalau port dipakai atau error lain saat start
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
  } else {
    console.error('❌ Server error:', error);
  }
});