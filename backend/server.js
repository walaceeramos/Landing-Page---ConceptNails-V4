// Servidor local para desenvolvimento (npm start).
// Em produção, a Netlify usa netlify/functions/api.js com o mesmo app.
const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});
