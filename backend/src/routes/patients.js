const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// Get all patients (admin sees all; doctor sees only their patients)
router.get('/', async (req, res) => {
  try {
    let query;
    let params = [];
    if (req.user.type === 'admin') {
      query = 'SELECT p.*, d.name as doctor_name FROM patients p LEFT JOIN doctors d ON p.doctor_id = d.id';
    } else {
      // doctor
      query = 'SELECT p.*, d.name as doctor_name FROM patients p LEFT JOIN doctors d ON p.doctor_id = d.id WHERE p.doctor_id = ?';
      params = [req.user.id];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a patient (only doctors can create)
router.post('/', async (req, res) => {
  if (req.user.type !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can create patients' });
  }
  const { name, email, phone, pin } = req.body;
  try {
    const hashedPin = await bcrypt.hash(pin, 10);
    const [result] = await pool.query(
      'INSERT INTO patients (name, email, phone, pin, doctor_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPin, req.user.id]
    );
    res.status(201).json({ id: result.insertId, name, email, doctor_id: req.user.id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Get a specific patient
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let query = 'SELECT p.*, d.name as doctor_name FROM patients p LEFT JOIN doctors d ON p.doctor_id = d.id WHERE p.id = ?';
    let params = [id];
    // if doctor, ensure patient belongs to them
    if (req.user.type === 'doctor') {
      query += ' AND p.doctor_id = ?';
      params.push(req.user.id);
    }
    const [rows] = await pool.query(query, params);
    if (rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update patient (only doctor who owns them can update)
router.put('/:id', async (req, res) => {
  if (req.user.type !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors can update patients' });
  }
  const { id } = req.params;
  const { name, email, phone, pin } = req.body;
  try {
    // first check if patient belongs to this doctor
    const [check] = await pool.query('SELECT id FROM patients WHERE id = ? AND doctor_id = ?', [id, req.user.id]);
    if (check.length === 0) return res.status(404).json({ message: 'Patient not found or not yours' });

    let updateFields = [];
    let values = [];
    if (name) { updateFields.push('name = ?'); values.push(name); }
    if (email) { updateFields.push('email = ?'); values.push(email); }
    if (phone) { updateFields.push('phone = ?'); values.push(phone); }
    if (pin) {
      const hashedPin = await bcrypt.hash(pin, 10);
      updateFields.push('pin = ?');
      values.push(hashedPin);
    }
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    values.push(id);
    await pool.query(`UPDATE patients SET ${updateFields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Patient updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Delete patient (only admin or doctor who owns them)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let query = 'DELETE FROM patients WHERE id = ?';
    let params = [id];
    if (req.user.type === 'doctor') {
      query += ' AND doctor_id = ?';
      params.push(req.user.id);
    } else if (req.user.type !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;