const {getPrediction} = require('../ml/mlClient')

async function predictDiabetes(patientData) {
    const result = await getPrediction(patientData)

    let risk = 'LOW'

    if (result.probability > 0.7) risk = 'HIGH'
    else if (result.probability > 0.4) risk = 'MODERATE'

    return{
        prediction: result.prediction,
        probability: result.probability,
        risk
    }
}

module.exports = {predictDiabetes}