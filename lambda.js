const serverless = require('serverless-http');
const app = require('./src/app.js');
exports.handler = serverless(app);
