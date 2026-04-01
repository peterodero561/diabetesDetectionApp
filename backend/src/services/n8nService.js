const axios = require('axios');

const N8N_WEBHOOK_URL = 'http://localhost:5678/https://devtech7.app.n8n.cloud/webhook-test/risk-result/risk-result';

async function sendToN8n(payload) {
  try {
    const response = await axios.post(N8N_WEBHOOK_URL, payload);
    return response.data;
  } catch (error) {
    console.error("Error sending to n8n:", error.message);
    return { message: "Failed to get recommendation" };
  }
}

module.exports = { sendToN8n };