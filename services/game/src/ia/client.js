const axios = require('axios');

const IA_URL = process.env.IA_SERVICE_URL || 'http://ia:8000';

async function interpret(payload) {
  const { data } = await axios.post(`${IA_URL}/interpret`, payload);
  return data;
}

async function narrate(payload) {
  const { data } = await axios.post(`${IA_URL}/narrate`, payload);
  return data;
}

module.exports = { interpret, narrate };