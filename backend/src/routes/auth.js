const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, pin } = req.body;
  try {
    // check admins
    const [admins] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (admins.length > 0) {
      const admin = admins[0];
      const valid = await bcrypt.compare(pin, admin.pin);
      if (valid) {
        const token = jwt.sign(
          { id: admin.id, type: 'admin', email: admin.email },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({ token, user: { id: admin.id, type: 'admin', name: admin.name } });
      }
    }

    // check doctors
    const [doctors] = await pool.query('SELECT * FROM doctors WHERE email = ?', [email]);
    if (doctors.length > 0) {
      const doctor = doctors[0];
      const valid = await bcrypt.compare(pin, doctor.pin);
      if (valid) {
        const token = jwt.sign(
          { id: doctor.id, type: 'doctor', email: doctor.email },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({ token, user: { id: doctor.id, type: 'doctor', name: doctor.name } });
      }
    }

    res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;