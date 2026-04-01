const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// Get all medical records (admin sees all; doctor sees only their patients' records)
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT mr.*, p.name as patient_name
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
    `;
    let params = [];
    if (req.user.type === 'doctor') {
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

// Get records for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  const { patientId } = req.params;
  try {
    // Check access: if doctor, ensure patient belongs to them
    if (req.user.type === 'doctor') {
      const [check] = await pool.query('SELECT id FROM patients WHERE id = ? AND doctor_id = ?', [patientId, req.user.id]);
      if (check.length === 0) return res.status(403).json({ message: 'Access denied' });
    }
    const [rows] = await pool.query('SELECT * FROM medical_records WHERE patient_id = ? ORDER BY created_at DESC', [patientId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new medical record (only doctor can add for their patient)
router.post('/', async (req, res) => {
  if (req.user.type !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can create medical records' });
  }
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
    // Check patient belongs to this doctor
    const [check] = await pool.query('SELECT id FROM patients WHERE id = ? AND doctor_id = ?', [patient_id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Patient not found or not yours' });

    const [result] = await pool.query(
      `INSERT INTO medical_records 
       (patient_id, pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, pregnancies, glucose, blood_pressure, skin_thickness, insulin, bmi, diabetes_pedigree_function, age]
    );
    res.status(201).json({ id: result.insertId, patient_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a medical record (only doctor who owns the patient can update)
router.put('/:id', async (req, res) => {
  if (req.user.type !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can update records' });
  }
  const { id } = req.params;
  const fields = req.body;
  try {
    // verify the record belongs to a patient of this doctor
    const [check] = await pool.query(
      `SELECT mr.id FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       WHERE mr.id = ? AND p.doctor_id = ?`,
      [id, req.user.id]
    );
    if (check.length === 0) return res.status(404).json({ message: 'Record not found or not yours' });

    const updateFields = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (updateFields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    values.push(id);
    await pool.query(`UPDATE medical_records SET ${updateFields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Record updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a medical record (only doctor who owns the patient can delete)
router.delete('/:id', async (req, res) => {
  if (req.user.type !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can delete records' });
  }
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      `DELETE mr FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       WHERE mr.id = ? AND p.doctor_id = ?`,
      [id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Record not found or not yours' });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;