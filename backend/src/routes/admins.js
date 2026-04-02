const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken, requireAdmin);

// GET all admins
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, created_at FROM admins');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create admin
router.post('/', async (req, res) => {
  const { name, email, pin } = req.body;
  try {
    const hashedPin = await bcrypt.hash(pin, 10);
    const [result] = await pool.query(
      'INSERT INTO admins (name, email, pin) VALUES (?, ?, ?)',
      [name, email, hashedPin]
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
});

// PUT update admin
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, pin } = req.body;
  try {
    let updateFields = [], values = [];
    if (name) { updateFields.push('name = ?'); values.push(name); }
    if (email) { updateFields.push('email = ?'); values.push(email); }
    if (pin) {
      const hashedPin = await bcrypt.hash(pin, 10);
      updateFields.push('pin = ?');
      values.push(hashedPin);
    }
    if (updateFields.length === 0) return res.status(400).json({ message: 'No fields to update' });
    values.push(id);
    const [result] = await pool.query(`UPDATE admins SET ${updateFields.join(', ')} WHERE id = ?`, values);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin updated' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
});

// DELETE admin
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM admins WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;