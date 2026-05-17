import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TeacherDashboard = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const navigate = useNavigate();

    // Dynamic states
    const [schedule, setSchedule] = useState([]);
    const [currentMarkClassId, setCurrentMarkClassId] = useState(null);
    const [currentClassDetails, setCurrentClassDetails] = useState({ name: '' });
    
    // List of students to mark attendance for
    const [attendanceList, setAttendanceList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!token || !storedUser || storedUser.role !== 'teacher') {
            navigate('/');
            return;
        }
        setUser(storedUser);

        if (activeTab === 'dashboard' || activeTab === 'my_classes') fetchSchedule();
    }, [activeTab, navigate]);

    const fetchSchedule = async () => {
        try {
            const response = await axios.get('http://localhost:5007/api/teacher/classes', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // We format the response to match the dashboard's expected shape
            // (Assuming all assigned classes are "Today's Schedule" for simplicity in this demo)
            const formattedSchedule = response.data.map(cls => ({
                id: cls.id,
                time: '09:00 AM', // placeholder time
                class: cls.name,
                subject: 'Assigned Subject',
                status: 'Pending' // placeholder status
            }));
            setSchedule(formattedSchedule);
        } catch (error) {
            console.error("Error fetching schedule:", error);
            if (error.response?.status === 401 || error.response?.status === 403) handleLogout();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleMarkAttendance = async (id, className) => {
        setCurrentMarkClassId(id);
        setCurrentClassDetails({ name: className });
        setActiveTab('mark_attendance');
        setIsLoading(true);

        try {
            const today = new Date().toISOString().slice(0, 10);
            
            // 1. Fetch students for this class
            const studentsRes = await axios.get(`http://localhost:5007/api/teacher/classes/${id}/students`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const students = studentsRes.data;

            // 2. Fetch existing attendance for today
            const attendanceRes = await axios.get(`http://localhost:5007/api/teacher/attendance/${id}/${today}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const existingRecords = attendanceRes.data;

            // 3. Merge data
            const mergedList = students.map(student => {
                const existing = existingRecords.find(r => r.student_id === student.student_id);
                return {
                    student_id: student.student_id,
                    name: student.name,
                    status: existing ? existing.status : 'present' // default to present
                };
            });

            setAttendanceList(mergedList);
        } catch (error) {
            console.error("Error fetching students/attendance:", error);
            alert("Error loading class data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = (student_id, newStatus) => {
        setAttendanceList(prev => prev.map(student => 
            student.student_id === student_id ? { ...student, status: newStatus } : student
        ));
    };

    const handleSubmitAttendance = async () => {
        setIsLoading(true);
        try {
            const today = new Date().toISOString().slice(0, 10);
            await axios.post('http://localhost:5007/api/attendance/mark', {
                class_id: currentMarkClassId,
                date: today,
                records: attendanceList
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            
            alert('Attendance submitted successfully!');
            setActiveTab('dashboard');
        } catch (error) {
            console.error("Error submitting attendance:", error);
            alert('Failed to submit attendance');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate dynamic stats
    const totalClasses = schedule.length;
    const completedClasses = 0; // Dynamic completion logic would require an API endpoint to count completed classes per day

    if (!user) return <div style={{color: 'white', padding: '2rem'}}>Loading...</div>;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <i className='bx bxs-graduation'></i> SAMS
                </div>
                <ul className="sidebar-nav">
                    <li><a href="#" className={activeTab === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}><i className='bx bxs-dashboard'></i> Dashboard</a></li>
                    <li><a href="#" className={activeTab === 'mark_attendance' ? 'active' : ''} onClick={(e) => { e.preventDefault(); if(currentMarkClassId) setActiveTab('mark_attendance'); else alert('Please select a class from Dashboard first.'); }}><i className='bx bxs-edit'></i> Mark Attendance</a></li>
                    <li><a href="#" className={activeTab === 'my_classes' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('my_classes'); }}><i className='bx bxs-user-badge'></i> My Classes</a></li>
                    <li><a href="#" className={activeTab === 'class_reports' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('class_reports'); }}><i className='bx bxs-report'></i> Class Reports</a></li>
                    <li style={{ marginTop: 'auto' }}><a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}><i className='bx bx-log-out'></i> Logout</a></li>
                </ul>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h2 style={{ fontWeight: 600 }}>Teacher Portal</h2>
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
                                    <i className='bx bxs-book'></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Assigned Classes</h3>
                                    <div className="value">{totalClasses}</div>
                                </div>
                            </div>
                            <div className="glass-panel stat-card">
                                <div className="stat-icon">
                                    <i className='bx bxs-check-shield'></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Attendance Marked</h3>
                                    <div className="value">{completedClasses}/{totalClasses}</div>
                                </div>
                            </div>
                        </div>
                        <div className="glass-panel table-container">
                            <div className="table-header">
                                <h3>Today's Schedule</h3>
                                <button className="btn btn-glass" onClick={() => setActiveTab('my_classes')}>View All</button>
                            </div>
                            <table>
                                <thead>
                                    <tr><th>Class Name</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {schedule.map(cls => (
                                        <tr key={cls.id}>
                                            <td>{cls.class}</td>
                                            <td>
                                                <button className="btn btn-primary" onClick={() => handleMarkAttendance(cls.id, cls.class)}>Mark Attendance</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {schedule.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center' }}>No classes assigned to you</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'mark_attendance' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>{currentClassDetails.name} - Mark Attendance</h3>
                            <button className="btn btn-primary" onClick={handleSubmitAttendance} disabled={isLoading}>
                                {isLoading ? 'Saving...' : 'Save Attendance'}
                            </button>
                        </div>
                        {isLoading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading students...</div>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceList.map(student => (
                                        <tr key={student.student_id}>
                                            <td>STU{String(student.student_id).padStart(3, '0')}</td>
                                            <td>{student.name}</td>
                                            <td>
                                                <select 
                                                    className="form-control" 
                                                    style={{ width: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.5)' }}
                                                    value={student.status}
                                                    onChange={(e) => handleStatusChange(student.student_id, e.target.value)}
                                                >
                                                    <option value="present">Present</option>
                                                    <option value="absent">Absent</option>
                                                    <option value="late">Late</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                    {attendanceList.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No students enrolled in this class</td></tr>}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'my_classes' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>My Assigned Classes</h3>
                        </div>
                        <table>
                            <thead>
                                <tr><th>Class ID</th><th>Class Name</th></tr>
                            </thead>
                            <tbody>
                                {schedule.map(cls => (
                                    <tr key={cls.id}>
                                        <td>CLS{String(cls.id).padStart(3, '0')}</td>
                                        <td>{cls.class}</td>
                                    </tr>
                                ))}
                                {schedule.length === 0 && <tr><td colSpan="2" style={{ textAlign: 'center' }}>No classes assigned</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'class_reports' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>Monthly Class Attendance Reports</h3>
                            <button className="btn btn-primary" onClick={() => alert('Downloading all reports...')}>Export All</button>
                        </div>
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Select a class from the dashboard to generate an individual report.
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TeacherDashboard;

