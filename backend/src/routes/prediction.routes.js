const router = require('express').Router()

const {predict} = require('../controllers/prediction.controller')

router.post('/predict-diabetes', predict)

module.exports = router