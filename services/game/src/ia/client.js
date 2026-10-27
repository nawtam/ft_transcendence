const axios = require('axios');

const IA_URL = process.env.IA_SERVICE_URL || 'http://ia:8000';
const IA_TIMEOUT_MS = Number(process.env.IA_TIMEOUT_MS || 25000);

const iaHttp = axios.create({
  baseURL: IA_URL,
  timeout: IA_TIMEOUT_MS,
});

async function interpret(payload) {
  const { data } = await iaHttp.post('/interpret', payload);
  return data;
}

async function narrate(payload) {
  const { data } = await iaHttp.post('/narrate', payload);
  return data;
}

module.exports = { interpret, narrate };