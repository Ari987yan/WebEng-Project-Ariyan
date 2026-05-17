import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ teachers: 0, students: 0, attendanceToday: '0%' });
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const navigate = useNavigate();

    // States for dynamic data
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [classesList, setClassesList] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [settings, setSettings] = useState({ school_name: '', academic_year: '', system_email: '' });

    // States for forms
    const [showAddTeacher, setShowAddTeacher] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '' });
    
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });

    const [showAddClass, setShowAddClass] = useState(false);
    const [newClass, setNewClass] = useState({ name: '', teacher_id: '' });

    const [showAddEnrollment, setShowAddEnrollment] = useState(false);
    const [newEnrollment, setNewEnrollment] = useState({ student_id: '', class_id: '' });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!token || !storedUser || storedUser.role !== 'admin') {
            navigate('/');
            return;
        }
        setUser(storedUser);

        if (activeTab === 'dashboard') fetchStats();
        if (activeTab === 'teachers') fetchTeachers();
        if (activeTab === 'students') fetchStudents();
        if (activeTab === 'classes') { fetchClasses(); fetchTeachers(); } // need teachers for dropdown
        if (activeTab === 'enrollments') { fetchEnrollments(); fetchStudents(); fetchClasses(); } // need both for dropdowns
        if (activeTab === 'settings') fetchSettings();
    }, [activeTab, navigate]);

    // Data Fetching Functions
    const fetchStats = async () => {
        try {
            const response = await axios.get('http://localhost:5007/api/admin/stats', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
            if (error.response?.status === 401 || error.response?.status === 403) handleLogout();
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await axios.get('http://localhost:5007/api/admin/teachers', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setTeachers(response.data);
        } catch (error) {
            console.error("Error fetching teachers:", error);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await axios.get('http://localhost:5007/api/admin/students', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setStudents(response.data);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await axios.get('http://localhost:5007/api/admin/classes', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setClassesList(response.data);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchEnrollments = async () => {
        try {
            const response = await axios.get('http://localhost:5007/api/admin/student-classes', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setEnrollments(response.data);
        } catch (error) {
            console.error("Error fetching enrollments:", error);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await axios.get('http://localhost:5007/api/admin/settings', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data) setSettings(response.data);
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };

    // Form Handlers - Teachers & Students
    const handleAddTeacher = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('http://localhost:5007/api/admin/teachers', newTeacher, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Teacher added successfully!');
            setNewTeacher({ name: '', email: '', password: '' });
            setShowAddTeacher(false);
            fetchTeachers();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding teacher');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateTeacherStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:5007/api/admin/teachers/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchTeachers();
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('http://localhost:5007/api/admin/students', newStudent, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Student added successfully!');
            setNewStudent({ name: '', email: '', password: '' });
            setShowAddStudent(false);
            fetchStudents();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding student');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStudentStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:5007/api/admin/students/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchStudents();
        } catch (error) {
            alert('Error updating status');
        }
    };

    // Form Handlers - Classes & Enrollments
    const handleAddClass = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('http://localhost:5007/api/admin/classes', newClass, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Class created successfully!');
            setNewClass({ name: '', teacher_id: '' });
            setShowAddClass(false);
            fetchClasses();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding class');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm('Are you sure you want to delete this class? This will also remove all enrollments and attendance records.')) return;
        try {
            await axios.delete(`http://localhost:5007/api/admin/classes/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchClasses();
        } catch (error) {
            alert('Error deleting class');
        }
    };

    const handleAddEnrollment = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('http://localhost:5007/api/admin/student-classes', newEnrollment, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Student enrolled successfully!');
            setNewEnrollment({ student_id: '', class_id: '' });
            setShowAddEnrollment(false);
            fetchEnrollments();
        } catch (error) {
            alert(error.response?.data?.message || 'Error enrolling student');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEnrollment = async (id) => {
        if (!window.confirm('Are you sure you want to remove this student from the class?')) return;
        try {
            await axios.delete(`http://localhost:5007/api/admin/student-classes/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            fetchEnrollments();
        } catch (error) {
            alert('Error removing enrollment');
        }
    };

    // Settings Handler
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        try {
            await axios.put('http://localhost:5007/api/admin/settings', settings, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Settings saved successfully!');
            fetchSettings();
        } catch (error) {
            alert('Error saving settings');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const getStatusBadge = (status) => {
        if (status === 'Active') return 'badge-success';
        if (status === 'On Leave') return 'badge-warning';
        return 'badge-danger';
    };

    if (!user) return <div style={{color: 'white', padding: '2rem'}}>Loading...</div>;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <i className='bx bxs-graduation'></i> SAMS
                </div>
                <ul className="sidebar-nav">
                    <li><a href="#" className={activeTab === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}><i className='bx bxs-dashboard'></i> Dashboard</a></li>
                    <li><a href="#" className={activeTab === 'teachers' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('teachers'); }}><i className='bx bxs-user-detail'></i> Manage Teachers</a></li>
                    <li><a href="#" className={activeTab === 'students' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('students'); }}><i className='bx bxs-group'></i> Manage Students</a></li>
                    <li><a href="#" className={activeTab === 'classes' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('classes'); }}><i className='bx bxs-book-open'></i> Manage Classes</a></li>
                    <li><a href="#" className={activeTab === 'enrollments' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('enrollments'); }}><i className='bx bxs-user-check'></i> Enrollments</a></li>
                    <li><a href="#" className={activeTab === 'reports' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('reports'); }}><i className='bx bxs-report'></i> Reports</a></li>
                    <li><a href="#" className={activeTab === 'settings' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}><i className='bx bxs-cog'></i> Settings</a></li>
                    <li style={{ marginTop: 'auto' }}><a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}><i className='bx bx-log-out'></i> Logout</a></li>
                </ul>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h2 style={{ fontWeight: 600 }}>Admin Overview</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome back, {user.name}</p>
                    </div>
                    <div className="user-info">
                        <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <>
                        <div className="stats-grid">
                            <div className="glass-panel stat-card">
                                <div className="stat-icon">
                                    <i className='bx bxs-user-detail'></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Total Teachers</h3>
                                    <div className="value">{stats.teachers}</div>
                                </div>
                            </div>
                            <div className="glass-panel stat-card">
                                <div className="stat-icon">
                                    <i className='bx bxs-group'></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Total Students</h3>
                                    <div className="value">{stats.students}</div>
                                </div>
                            </div>
                            <div className="glass-panel stat-card">
                                <div className="stat-icon">
                                    <i className='bx bxs-check-circle'></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Today's Attendance</h3>
                                    <div className="value">{stats.attendanceToday}</div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel table-container">
                            <div className="table-header">
                                <h3>Recent System Activity</h3>
                                <button className="btn btn-glass" onClick={() => setActiveTab('reports')}>View All</button>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Action</th>
                                        <th>Time</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>System</td>
                                        <td>System</td>
                                        <td>Database Synchronized</td>
                                        <td>Just Now</td>
                                        <td><span className="badge badge-success">Completed</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'teachers' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>Manage Teachers</h3>
                            <button className="btn btn-primary" onClick={() => setShowAddTeacher(!showAddTeacher)}>
                                {showAddTeacher ? 'Cancel' : 'Add New Teacher'}
                            </button>
                        </div>
                        
                        {showAddTeacher && (
                            <form style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} onSubmit={handleAddTeacher}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" className="form-control" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="email" className="form-control" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Temporary Password</label>
                                        <input type="password" className="form-control" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Adding...' : 'Save Teacher'}</button>
                            </form>
                        )}

                        <table>
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Assigned Classes</th><th>Status</th><th>Update Status</th></tr>
                            </thead>
                            <tbody>
                                {teachers.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.name}</td>
                                        <td>{t.email}</td>
                                        <td>{t.assigned_classes}</td>
                                        <td><span className={`badge ${getStatusBadge(t.status)}`}>{t.status}</span></td>
                                        <td>
                                            <select 
                                                className="form-control" 
                                                style={{ width: 'auto', padding: '0.4rem', background: 'rgba(0,0,0,0.5)', fontSize: '0.85rem' }}
                                                value={t.status}
                                                onChange={(e) => handleUpdateTeacherStatus(t.id, e.target.value)}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="On Leave">On Leave</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {teachers.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No teachers found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>Manage Students</h3>
                            <button className="btn btn-primary" onClick={() => setShowAddStudent(!showAddStudent)}>
                                {showAddStudent ? 'Cancel' : 'Add New Student'}
                            </button>
                        </div>

                        {showAddStudent && (
                            <form style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} onSubmit={handleAddStudent}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" className="form-control" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="email" className="form-control" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Temporary Password</label>
                                        <input type="password" className="form-control" value={newStudent.password} onChange={e => setNewStudent({...newStudent, password: e.target.value})} required />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Adding...' : 'Save Student'}</button>
                            </form>
                        )}

                        <table>
                            <thead>
                                <tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Update Status</th></tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.id}>
                                        <td>STU{String(s.id).padStart(3, '0')}</td>
                                        <td>{s.name}</td>
                                        <td>{s.email}</td>
                                        <td><span className={`badge ${getStatusBadge(s.status)}`}>{s.status}</span></td>
                                        <td>
                                            <select 
                                                className="form-control" 
                                                style={{ width: 'auto', padding: '0.4rem', background: 'rgba(0,0,0,0.5)', fontSize: '0.85rem' }}
                                                value={s.status}
                                                onChange={(e) => handleUpdateStudentStatus(s.id, e.target.value)}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="On Leave">On Leave</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No students found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'classes' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>Manage Classes</h3>
                            <button className="btn btn-primary" onClick={() => setShowAddClass(!showAddClass)}>
                                {showAddClass ? 'Cancel' : 'Create Class'}
                            </button>
                        </div>
                        
                        {showAddClass && (
                            <form style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} onSubmit={handleAddClass}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group">
                                        <label>Class Name</label>
                                        <input type="text" className="form-control" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} required placeholder="e.g. Grade 10 - Mathematics" />
                                    </div>
                                    <div className="form-group">
                                        <label>Assign Teacher</label>
                                        <select className="form-control" value={newClass.teacher_id} onChange={e => setNewClass({...newClass, teacher_id: e.target.value})} required>
                                            <option value="">Select a Teacher</option>
                                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Creating...' : 'Save Class'}</button>
                            </form>
                        )}

                        <table>
                            <thead>
                                <tr><th>Class ID</th><th>Class Name</th><th>Assigned Teacher</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {classesList.map(c => (
                                    <tr key={c.id}>
                                        <td>CLS{String(c.id).padStart(3, '0')}</td>
                                        <td>{c.name}</td>
                                        <td>{c.teacher_name}</td>
                                        <td><button className="btn btn-glass" style={{color: '#ff6b6b'}} onClick={() => handleDeleteClass(c.id)}>Delete</button></td>
                                    </tr>
                                ))}
                                {classesList.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No classes found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'enrollments' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>Manage Enrollments</h3>
                            <button className="btn btn-primary" onClick={() => setShowAddEnrollment(!showAddEnrollment)}>
                                {showAddEnrollment ? 'Cancel' : 'Enroll Student'}
                            </button>
                        </div>
                        
                        {showAddEnrollment && (
                            <form style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }} onSubmit={handleAddEnrollment}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div className="form-group">
                                        <label>Select Student</label>
                                        <select className="form-control" value={newEnrollment.student_id} onChange={e => setNewEnrollment({...newEnrollment, student_id: e.target.value})} required>
                                            <option value="">Select a Student</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name} (STU{String(s.id).padStart(3, '0')})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Select Class</label>
                                        <select className="form-control" value={newEnrollment.class_id} onChange={e => setNewEnrollment({...newEnrollment, class_id: e.target.value})} required>
                                            <option value="">Select a Class</option>
                                            {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Enrolling...' : 'Save Enrollment'}</button>
                            </form>
                        )}

                        <table>
                            <thead>
                                <tr><th>Enrollment ID</th><th>Student Name</th><th>Class Name</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                {enrollments.map(e => (
                                    <tr key={e.id}>
                                        <td>ENR{String(e.id).padStart(3, '0')}</td>
                                        <td>{e.student_name}</td>
                                        <td>{e.class_name}</td>
                                        <td><button className="btn btn-glass" style={{color: '#ff6b6b'}} onClick={() => handleDeleteEnrollment(e.id)}>Remove</button></td>
                                    </tr>
                                ))}
                                {enrollments.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No enrollments found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>System Reports & Analytics</h3>
                            <button className="btn btn-primary" onClick={() => alert('Generating full report...')}>Generate PDF</button>
                        </div>
                        <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                            <p>Here you can view detailed attendance reports, user activity logs, and system performance metrics.</p>
                            <br />
                            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="glass-panel stat-card">
                                    <div className="stat-info">
                                        <h3>Average Weekly Attendance</h3>
                                        <div className="value" style={{ color: 'var(--success)' }}>92.5%</div>
                                    </div>
                                </div>
                                <div className="glass-panel stat-card">
                                    <div className="stat-info">
                                        <h3>Total Users</h3>
                                        <div className="value">{stats.teachers + stats.students + 1}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>System Settings</h3>
                            <button className="btn btn-primary" onClick={handleSaveSettings}>Save Changes</button>
                        </div>
                        <form style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }} onSubmit={handleSaveSettings}>
                            <div className="form-group">
                                <label>School Name</label>
                                <input type="text" className="form-control" value={settings.school_name} onChange={e => setSettings({...settings, school_name: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>Academic Year</label>
                                <input type="text" className="form-control" value={settings.academic_year} onChange={e => setSettings({...settings, academic_year: e.target.value})} required />
                            </div>
                            <div className="form-group">
                                <label>System Email</label>
                                <input type="email" className="form-control" value={settings.system_email} onChange={e => setSettings({...settings, system_email: e.target.value})} required />
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
