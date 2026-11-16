// Função serverless da Netlify: expõe o mesmo app Express do servidor local.
// O netlify.toml redireciona /api/* para cá.
const serverless = require('serverless-http');
const app = require('../../app');

exports.handler = serverless(app);
