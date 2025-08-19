const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the server's .env file
const env = dotenv.config({ path: path.resolve(__dirname, 'server', '.env') }).parsed;

module.exports = {
  apps: [{
    name: 'apothecary-pos',
    script: 'server/server.js',
    env: {
      NODE_ENV: 'production',
      ...env 
    }
  }]
};