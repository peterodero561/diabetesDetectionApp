const axios = require('axios')

const ML_URL = process.env.ML_URL || 'http://localhost:8000/predict'

async function getPrediction(data) {
    const response = await axios.post(ML_URL, data)

    return response.data
}

module.exports = {getPrediction}