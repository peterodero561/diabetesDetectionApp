const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// Get all predictions (admin sees all; doctor sees their patients' predictions)
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT p.*, pt.name as patient_name
      FROM predictions p
      JOIN patients pt ON p.patient_id = pt.id
    `;
    let params = [];
    if (req.user.type === 'doctor') {
      query += ' WHERE pt.doctor_id = ?';
      params.push(req.user.id);
    }
    query += ' ORDER BY p.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get predictions for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  const { patientId } = req.params;
  try {
    if (req.user.type === 'doctor') {
      const [check] = await pool.query('SELECT id FROM patients WHERE id = ? AND doctor_id = ?', [patientId, req.user.id]);
      if (check.length === 0) return res.status(403).json({ message: 'Access denied' });
    }
    const [rows] = await pool.query('SELECT * FROM predictions WHERE patient_id = ? ORDER BY created_at DESC', [patientId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a prediction
router.post('/', async (req, res) => {
  if (req.user.type !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can create predictions' });
  }
  const { patient_id, risk_level } = req.body;
  try {
    const [check] = await pool.query('SELECT id FROM patients WHERE id = ? AND doctor_id = ?', [patient_id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Patient not found or not yours' });

    const [result] = await pool.query(
      'INSERT INTO predictions (patient_id, risk_level) VALUES (?, ?)',
      [patient_id, risk_level]
    );
    res.status(201).json({ id: result.insertId, patient_id, risk_level });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update prediction (only doctor who owns patient can update)
router.put('/:id', async (req, res) => {
  if (req.user.type !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can update predictions' });
  }
  const { id } = req.params;
  const { risk_level } = req.body;
  try {
    const [check] = await pool.query(
      `SELECT p.id FROM predictions p
       JOIN patients pt ON p.patient_id = pt.id
       WHERE p.id = ? AND pt.doctor_id = ?`,
      [id, req.user.id]
    );
    if (check.length === 0) return res.status(404).json({ message: 'Prediction not found or not yours' });

    await pool.query('UPDATE predictions SET risk_level = ? WHERE id = ?', [risk_level, id]);
    res.json({ message: 'Prediction updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete prediction
router.delete('/:id', async (req, res) => {
  if (req.user.type !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can delete predictions' });
  }
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      `DELETE p FROM predictions p
       JOIN patients pt ON p.patient_id = pt.id
       WHERE p.id = ? AND pt.doctor_id = ?`,
      [id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Prediction not found or not yours' });
    res.json({ message: 'Prediction deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;