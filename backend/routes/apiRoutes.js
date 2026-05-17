const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Get User Profile
router.get('/users/me', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, name, email, role FROM Users WHERE id = ?', [req.userId]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get total stats (Admin)
router.get('/admin/stats', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const [teacherCount] = await pool.execute('SELECT COUNT(*) as count FROM Users WHERE role = "teacher"');
        const [studentCount] = await pool.execute('SELECT COUNT(*) as count FROM Users WHERE role = "student"');
        res.json({
            teachers: teacherCount[0].count,
            students: studentCount[0].count,
            attendanceToday: "92%"
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
