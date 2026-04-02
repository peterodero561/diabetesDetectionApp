const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/db');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// GET all patients (admin: all; doctor: assigned; patient: only self)
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT p.id, p.name, p.email, p.phone, p.created_at,
             d.name as doctor_name, p.doctor_id
      FROM patients p
      LEFT JOIN doctors d ON p.doctor_id = d.id
    `;
    let params = [];

    if (req.user.type === 'doctor') {
      query += ' WHERE p.doctor_id = ?';
      params.push(req.user.id);
    } else if (req.user.type === 'patient') {
      query += ' WHERE p.id = ?';
      params.push(req.user.id);
    }
    // admin sees all – no extra condition

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single patient
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let query = `
      SELECT p.id, p.name, p.email, p.phone, p.created_at,
             d.name as doctor_name, p.doctor_id
      FROM patients p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      WHERE p.id = ?
    `;
    let params = [id];

    if (req.user.type === 'doctor') {
      query += ' AND p.doctor_id = ?';
      params.push(req.user.id);
    } else if (req.user.type === 'patient') {
      if (parseInt(id) !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    const [rows] = await pool.query(query, params);
    if (rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create patient – only doctors
router.post('/', async (req, res) => {
  if (req.user.type !== 'doctor') {
    return res.status(403).json({ message: 'Only doctors/patients can create patient profiles' });
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
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
});

// PUT update patient – patients can update themselves, doctors can update their patients
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, pin } = req.body;
  try {
    // Determine if user has permission
    let canUpdate = false;
    if (req.user.type === 'patient' && parseInt(id) === req.user.id) {
      canUpdate = true;
    } else if (req.user.type === 'doctor') {
      const [check] = await pool.query('SELECT id FROM patients WHERE id = ? AND doctor_id = ?', [id, req.user.id]);
      if (check.length) canUpdate = true;
    }
    if (!canUpdate) return res.status(403).json({ message: 'Access denied' });

    let updateFields = [], values = [];
    if (name) { updateFields.push('name = ?'); values.push(name); }
    if (email) { updateFields.push('email = ?'); values.push(email); }
    if (phone) { updateFields.push('phone = ?'); values.push(phone); }
    if (pin) {
      const hashedPin = await bcrypt.hash(pin, 10);
      updateFields.push('pin = ?');
      values.push(hashedPin);
    }
    if (updateFields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    values.push(id);
    await pool.query(`UPDATE patients SET ${updateFields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Patient updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
});

// DELETE patient – only admin (or optionally doctor, but let's keep admin only)
router.delete('/:id', async (req, res) => {
  if (req.user.type !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM patients WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;