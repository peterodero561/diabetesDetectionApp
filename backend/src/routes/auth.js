const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/db');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.post('/login', async (req, res) => {
  const { email, pin } = req.body;
  try {
    // 1) Check admins
    const [admins] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (admins.length) {
      const admin = admins[0];
      if (await bcrypt.compare(pin, admin.pin)) {
        const token = jwt.sign(
          { id: admin.id, type: 'admin', email: admin.email },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({ token, user: { id: admin.id, type: 'admin', name: admin.name } });
      }
    }

    // 2) Check doctors
    const [doctors] = await pool.query('SELECT * FROM doctors WHERE email = ?', [email]);
    if (doctors.length) {
      const doctor = doctors[0];
      if (await bcrypt.compare(pin, doctor.pin)) {
        const token = jwt.sign(
          { id: doctor.id, type: 'doctor', email: doctor.email },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({ token, user: { id: doctor.id, type: 'doctor', name: doctor.name } });
      }
    }

    // 3) Check patients
    const [patients] = await pool.query('SELECT * FROM patients WHERE email = ?', [email]);
    if (patients.length) {
      const patient = patients[0];
      if (await bcrypt.compare(pin, patient.pin)) {
        const token = jwt.sign(
          { id: patient.id, type: 'patient', email: patient.email },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        return res.json({ token, user: { id: patient.id, type: 'patient', name: patient.name } });
      }
    }

    res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me – returns current user info from token
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    let user = null;
    if (userType === 'admin') {
      const [rows] = await pool.query('SELECT id, name, email, created_at FROM admins WHERE id = ?', [userId]);
      if (rows.length) user = { ...rows[0], type: 'admin' };
    } else if (userType === 'doctor') {
      const [rows] = await pool.query('SELECT id, name, email, phone, created_at FROM doctors WHERE id = ?', [userId]);
      if (rows.length) user = { ...rows[0], type: 'doctor' };
    } else if (userType === 'patient') {
      const [rows] = await pool.query('SELECT id, name, email, phone, doctor_id, created_at FROM patients WHERE id = ?', [userId]);
      if (rows.length) user = { ...rows[0], type: 'patient' };
    }

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;