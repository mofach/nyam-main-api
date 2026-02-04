require('dotenv').config();
const app = require('./app');

class Server {
  constructor(app) {
    this.app = app;
    this.port = process.env.PORT || 3000;
    this.env = process.env.NODE_ENV || 'development';
  }

  start() {
    const server = this.app.listen(this.port, () => {
      console.log(`=================================`);
      console.log(`🚀 NYAM Server running on PORT ${this.port}`);
      console.log(`   Environment: ${this.env}`);
      console.log(`=================================`);
    });

    server.on('error', (error) => this.handleError(error));
  }

  handleError(error) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${this.port} is already in use.`);
    } else {
      console.error('❌ Server error:', error);
    }
  }
}

const serverInstance = new Server(app);
serverInstance.start();