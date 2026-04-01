const {predictDiabetes} = require('../services/prediction.service')

async function predict(res, req){
    try{
        // Get patient data
        const patientData = req.body

        // Prediction of risk
        const result = await predictDiabetes(patientData)

        // 2. Send to n8n for automation
        const n8nResponse = await sendToN8n({
            ...userData,
            result
        });

        res.json({
            result,
            advice : n8nResponse.message
        })
    }catch (err){
        console.error(err)
        res.status(500).json({error: 'Prediction failed'})
    }
}

module.exports = {predict}