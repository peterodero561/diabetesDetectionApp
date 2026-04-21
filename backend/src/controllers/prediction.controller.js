const {predictDiabetes} = require('../services/prediction.service')

async function predict(req, res){
    try{
        // Get patient data
        const patientData = req.body

        // Prediction of risk
        const result = await predictDiabetes(patientData)

        res.json({
            "risk": result.risk,
            "probability": result.probability,
            "prediction": result.prediction
        })
    }catch (err){
        console.error(err)
        res.status(500).json({error: 'Prediction failed'})
    }
}

module.exports = {predict}