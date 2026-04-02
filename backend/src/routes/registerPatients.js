const express = require('express')
const router = express.Router();
const pool = require('../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// POST /api/auth/register - Public patient signup
router.post('/register', async (req, res) => {
  const { name, email, phone, pin, doctorEmail } = req.body;
  try {
    // Check if patient already exists
    const [existing] = await pool.query('SELECT id FROM patients WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Optionally find doctor by email (if provided)
    let doctorId = null;
    if (doctorEmail) {
      const [doctors] = await pool.query('SELECT id FROM doctors WHERE email = ?', [doctorEmail]);
      if (doctors.length) doctorId = doctors[0].id;
      else return res.status(400).json({ message: 'Doctor not found' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    const [result] = await pool.query(
      'INSERT INTO patients (name, email, phone, pin, doctor_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, hashedPin, doctorId]
    );

    // Generate token and return user data (like after login)
    const token = jwt.sign(
      { id: result.insertId, type: 'patient', email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        name,
        email,
        phone,
        type: 'patient',
        doctor_id: doctorId,
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router