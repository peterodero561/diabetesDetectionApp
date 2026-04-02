const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// All doctor management is admin-only
router.use(verifyToken, requireAdmin);

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, created_at FROM doctors');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a doctor
router.post('/', async (req, res) => {
  const { name, email, phone, pin } = req.body;
  try {
    const hashedPin = await bcrypt.hash(pin, 10);
    const [result] = await pool.query(
      'INSERT INTO doctors (name, email, phone, pin) VALUES (?, ?, ?, ?)',
      [name, email, phone, hashedPin]
    );
    res.status(201).json({ id: result.insertId, name, email, phone });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
});

// Update doctor
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, pin } = req.body;
  try {
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
    const [result] = await pool.query(`UPDATE doctors SET ${updateFields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
});

// Delete doctor
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM doctors WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Doctor not found' });
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;