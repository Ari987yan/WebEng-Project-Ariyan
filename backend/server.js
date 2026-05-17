const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5007;

// Full CORS Configuration to connect Frontend (React) with Backend (Node)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database Connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware for JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'No token provided' });
    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

// --- ROUTES ---

// 1. Register Route
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) return res.status(400).json({ message: 'All fields required' });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );
        res.status(201).json({ message: 'Registered successfully', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists' });
        res.status(500).json({ message: 'Server error' });
    }
});

// 2. Login Route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const [rows] = await pool.execute('SELECT * FROM Users WHERE email = ? AND role = ?', [email, role]);
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials or role' });
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 3. Admin Stats Route
app.get('/api/admin/stats', verifyToken, async (req, res) => {
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

// 4. Get Students Route (Teacher/Admin)
app.get('/api/students', verifyToken, async (req, res) => {
    if (req.userRole !== 'teacher' && req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const [students] = await pool.execute('SELECT id, name FROM Users WHERE role = "student"');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 5. Mark Attendance Route (Teacher)
app.post('/api/attendance/mark', verifyToken, async (req, res) => {
    if (req.userRole !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
    const { class_id, date, records } = req.body;
    // records is an array: [{student_id, status}]
    if (!records || !Array.isArray(records)) return res.status(400).json({ message: 'Invalid records format' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (const record of records) {
            await connection.execute(
                `INSERT INTO Attendance (student_id, class_id, date, status, recorded_by) 
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = ?, recorded_by = ?`,
                [record.student_id, class_id || 1, date || new Date().toISOString().slice(0,10), record.status, req.userId, record.status, req.userId]
            );
        }
        await connection.commit();
        res.status(201).json({ message: 'Attendance saved successfully' });
    } catch (error) {
        await connection.rollback();
        console.error("Attendance save error:", error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
});

app.get('/api/teacher/attendance/:class_id/:date', verifyToken, async (req, res) => {
    if (req.userRole !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
    try {
        const [records] = await pool.execute(
            'SELECT student_id, status FROM Attendance WHERE class_id = ? AND date = ?',
            [req.params.class_id, req.params.date]
        );
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 6. Admin Manage Teachers Routes
app.get('/api/admin/teachers', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const [teachers] = await pool.execute(`
            SELECT u.id, u.name, u.email, u.status, COUNT(c.id) as assigned_classes 
            FROM Users u 
            LEFT JOIN Classes c ON u.id = c.teacher_id 
            WHERE u.role = 'teacher' 
            GROUP BY u.id
        `);
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/teachers', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO Users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, 'teacher', 'Active']
        );
        res.status(201).json({ message: 'Teacher added successfully', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists' });
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/admin/teachers/:id/status', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { status } = req.body;
        await pool.execute('UPDATE Users SET status = ? WHERE id = ? AND role = "teacher"', [status, req.params.id]);
        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 7. Admin Manage Students Routes
app.get('/api/admin/students', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const [students] = await pool.execute(`
            SELECT u.id, u.name, u.email, u.status 
            FROM Users u 
            WHERE u.role = 'student'
        `);
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/students', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO Users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, 'student', 'Active']
        );
        res.status(201).json({ message: 'Student added successfully', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email already exists' });
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/admin/students/:id/status', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { status } = req.body;
        await pool.execute('UPDATE Users SET status = ? WHERE id = ? AND role = "student"', [status, req.params.id]);
        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 8. Admin Settings Routes
app.get('/api/admin/settings', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const [settings] = await pool.execute('SELECT * FROM Settings WHERE id = 1');
        res.json(settings[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/admin/settings', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { school_name, academic_year, system_email } = req.body;
        await pool.execute(
            'UPDATE Settings SET school_name = ?, academic_year = ?, system_email = ? WHERE id = 1',
            [school_name, academic_year, system_email]
        );
        res.json({ message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 9. Admin Manage Classes Routes
app.get('/api/admin/classes', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const [classes] = await pool.execute(`
            SELECT c.id, c.name, c.teacher_id, u.name as teacher_name 
            FROM Classes c 
            JOIN Users u ON c.teacher_id = u.id
        `);
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/classes', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { name, teacher_id } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO Classes (name, teacher_id) VALUES (?, ?)',
            [name, teacher_id]
        );
        res.status(201).json({ message: 'Class added successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/admin/classes/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        await pool.execute('DELETE FROM Classes WHERE id = ?', [req.params.id]);
        res.json({ message: 'Class deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 10. Admin Manage Student Enrollments Routes
app.get('/api/admin/student-classes', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const [enrollments] = await pool.execute(`
            SELECT sc.id, sc.student_id, u.name as student_name, sc.class_id, c.name as class_name 
            FROM StudentClasses sc
            JOIN Users u ON sc.student_id = u.id
            JOIN Classes c ON sc.class_id = c.id
        `);
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/admin/student-classes', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        const { student_id, class_id } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO StudentClasses (student_id, class_id) VALUES (?, ?)',
            [student_id, class_id]
        );
        res.status(201).json({ message: 'Student enrolled successfully', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Student already enrolled in this class' });
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/admin/student-classes/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
        await pool.execute('DELETE FROM StudentClasses WHERE id = ?', [req.params.id]);
        res.json({ message: 'Enrollment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 11. Teacher Fetch Assigned Classes Route
app.get('/api/teacher/classes', verifyToken, async (req, res) => {
    if (req.userRole !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
    try {
        const [classes] = await pool.execute(`
            SELECT id, name 
            FROM Classes 
            WHERE teacher_id = ?
        `, [req.userId]);
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// 12. Teacher Fetch Students for a Class Route
app.get('/api/teacher/classes/:id/students', verifyToken, async (req, res) => {
    if (req.userRole !== 'teacher') return res.status(403).json({ message: 'Forbidden' });
    try {
        // Verify this teacher actually owns the class
        const [classCheck] = await pool.execute('SELECT id FROM Classes WHERE id = ? AND teacher_id = ?', [req.params.id, req.userId]);
        if (classCheck.length === 0) return res.status(403).json({ message: 'Forbidden: Class does not belong to you' });

        const [students] = await pool.execute(`
            SELECT u.id as student_id, u.name 
            FROM Users u 
            JOIN StudentClasses sc ON u.id = sc.student_id 
            WHERE sc.class_id = ?
        `, [req.params.id]);
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Start Server
pool.getConnection()
    .then(connection => {
        console.log('Connected to MySQL database!');
        connection.release();
        app.listen(PORT, () => console.log(`NEW Backend running flawlessly on port ${PORT}`));
    })
    .catch(err => {
        console.error('MySQL Connection Error. Check XAMPP/WAMP:', err.message);
        app.listen(PORT, () => console.log(`NEW Backend running on port ${PORT} (Without DB)`));
    });