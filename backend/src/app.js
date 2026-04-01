require('dotenv').config();
const express = require('express')
const cors = require('cors')

const predictionRoutes = require('./routes/prediction.routes')
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admins');
const doctorRoutes = require('./routes/doctors');
const patientRoutes = require('./routes/patients');
const medicalRecordRoutes = require('./routes/medical_records');
const predictionRecordsRoutes = require('./routes/predictions');

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/prediction-service', predictionRoutes)
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/prediction-records', predictionRecordsRoutes);

app.get('/', (req, res) => {
    res.send('Diabecare backend running')
})

module.exports = app