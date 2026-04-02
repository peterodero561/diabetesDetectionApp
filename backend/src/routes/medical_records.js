const express = require('express');
const pool = require('../db/db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// Helper: compute risk level based on medical record data
// Replace this with actual ML service call
function computeRiskLevel(record) {
  const { glucose, bmi, age, diabetes_pedigree_function } = record;
  let score = 0;
  if (glucose > 140) score++;
  if (bmi > 30) score++;
  if (age > 50) score++;
  if (diabetes_pedigree_function > 0.5) score++;
  if (score >= 3) return 'HIGH';
  if (score >= 2) return 'MEDIUM';
  return 'LOW';
}

// Middleware to block admins
const blockAdmin = (req, res, next) => {
  if (req.user.type === 'admin') return res.status(403).json({ message: 'Admins cannot access medical records' });
  next();
};
router.use(blockAdmin);

// GET all records (patient sees own; doctor sees assigned patients' records)
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT mr.*, p.name as patient_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
    `;
    let params = [];
    if (req.user.type === 'patient') {
      query += ' WHERE p.id = ?';
      params.push(req.user.id);
    } else if (req.user.type === 'doctor') {
      query += ' WHERE p.doctor_id = ?';
      params.push(req.user.id);
    }
    query += ' ORDER BY mr.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET records for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  const { patientId } = req.params;
  try {
    let query = 'SELECT * FROM medical_records WHERE patient_id = ? ORDER BY created_at DESC';
    let params = [patientId];

    // Authorization: patient can see own; doctor can see if patient assigned
    if (req.user.type === 'patient' && parseInt(patientId) !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.type === 'doctor') {
      const [check] = await pool.query('SELECT id FROM patients WHERE id = ? AND doctor_id = ?', [patientId, req.user.id]);
      if (check.length === 0) return res.status(403).json({ message: 'Access denied' });
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a medical record – patients (self) or doctors (their patients)
router.post('/', async (req, res) => {
  const {
    patient_id,
    pregnancies,
    glucose,
    blood_pressure,
    skin_thickness,
    insulin,
    bmi,
    diabetes_pedigree_function,
    age
  } = req.body;

  try {
    // Verify authorization
    let authorized = false;
    if (req.user.type === 'patient' && patient_id === req.user.id) {
      authorized = true;
    } else if (req.user.type === 'doctor') {
      const [check] = await pool.query('SELECT id FROM patients WHERE id = ? AND doctor_id = ?', [patient_id, req.user.id]);
      if (check.length) authorized = true;
    }
    if (!authorized) return res.status(403).json({ message: 'Access denied' });

    // Insert medical record
    const [result] = await pool.query(
      `INSERT INTO medical_records 
       (patient_id, pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age]
    );
    const recordId = result.insertId;

    // Compute risk level and store prediction
    const recordData = { glucose, bmi, age, diabetes_pedigree_function };
    const risk_level = computeRiskLevel(recordData);
    await pool.query(
      'INSERT INTO predictions (patient_id, risk_level) VALUES (?, ?)',
      [patient_id, risk_level]
    );

    res.status(201).json({ id: recordId, patient_id, risk_level });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update a record – patient (self) or doctor (their patient)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  try {
    // First, get the patient_id of this record
    const [record] = await pool.query('SELECT patient_id FROM medical_records WHERE id = ?', [id]);
    if (record.length === 0) return res.status(404).json({ message: 'Record not found' });
    const patientId = record[0].patient_id;

    let authorized = false;
    if (req.user.type === 'patient' && patientId === req.user.id) authorized = true;
    else if (req.user.type === 'doctor') {
      const [check] = await pool.query('SELECT id FROM patients WHERE id = ? AND doctor_id = ?', [patientId, req.user.id]);
      if (check.length) authorized = true;
    }
    if (!authorized) return res.status(403).json({ message: 'Access denied' });

    const updateFields = [], values = [];
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (updateFields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    values.push(id);
    await pool.query(`UPDATE medical_records SET ${updateFields.join(', ')} WHERE id = ?`, values);

    // Optionally re‑compute prediction after update – we'll do it for consistency
    // Fetch updated record
    const [updated] = await pool.query('SELECT * FROM medical_records WHERE id = ?', [id]);
    const newRisk = computeRiskLevel(updated[0]);
    // Insert new prediction (or update latest? We'll insert a new one to keep history)
    await pool.query('INSERT INTO predictions (patient_id, risk_level) VALUES (?, ?)', [patientId, newRisk]);

    res.json({ message: 'Record updated, new prediction generated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a record – patient (self) or doctor (their patient)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [record] = await pool.query('SELECT patient_id FROM medical_records WHERE id = ?', [id]);
    if (record.length === 0) return res.status(404).json({ message: 'Record not found' });
    const patientId = record[0].patient_id;

    let authorized = false;
    if (req.user.type === 'patient' && patientId === req.user.id) authorized = true;
    else if (req.user.type === 'doctor') {
      const [check] = await pool.query('SELECT id FROM patients WHERE id = ? AND doctor_id = ?', [patientId, req.user.id]);
      if (check.length) authorized = true;
    }
    if (!authorized) return res.status(403).json({ message: 'Access denied' });

    await pool.query('DELETE FROM medical_records WHERE id = ?', [id]);
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;