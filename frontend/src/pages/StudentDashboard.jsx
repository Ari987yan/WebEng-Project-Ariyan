import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        
        if (!token || !storedUser || storedUser.role !== 'student') {
            navigate('/');
            return;
        }
        setUser(storedUser);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    if (!user) return <div style={{color: 'white', padding: '2rem'}}>Loading...</div>;

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <i className='bx bxs-graduation'></i> SAMS
                </div>
                <ul className="sidebar-nav">
                    <li><a href="#" className={activeTab === 'dashboard' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}><i className='bx bxs-dashboard'></i> My Dashboard</a></li>
                    <li><a href="#" className={activeTab === 'schedule' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('schedule'); }}><i className='bx bx-calendar'></i> Schedule</a></li>
                    <li><a href="#" className={activeTab === 'history' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('history'); }}><i className='bx bxs-report'></i> Attendance History</a></li>
                    <li style={{ marginTop: 'auto' }}><a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}><i className='bx bx-log-out'></i> Logout</a></li>
                </ul>
            </aside>

            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h2 style={{ fontWeight: 600 }}>Student Portal</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome back, {user.name}</p>
                    </div>
                    <div className="user-info">
                        <span className="avatar" style={{ background: 'var(--secondary-color)' }}>{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <>
                        <div className="stats-grid">
                            <div className="glass-panel stat-card">
                                <div className="stat-icon">
                                    <i className='bx bxs-bar-chart-alt-2'></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Overall Attendance</h3>
                                    <div className="value" style={{ color: 'var(--success)' }}>95%</div>
                                </div>
                            </div>
                            <div className="glass-panel stat-card">
                                <div className="stat-icon">
                                    <i className='bx bxs-x-circle'></i>
                                </div>
                                <div className="stat-info">
                                    <h3>Total Absences</h3>
                                    <div className="value">2</div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel table-container">
                            <div className="table-header">
                                <h3>Recent Attendance Records</h3>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Subject</th>
                                        <th>Teacher</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>May 15, 2026</td><td>Mathematics</td><td>Prof. Smith</td><td><span className="badge badge-success">Present</span></td></tr>
                                    <tr><td>May 15, 2026</td><td>Physics</td><td>Dr. Banner</td><td><span className="badge badge-success">Present</span></td></tr>
                                    <tr><td>May 14, 2026</td><td>Chemistry</td><td>Dr. Foster</td><td><span className="badge badge-danger">Absent</span></td></tr>
                                    <tr><td>May 14, 2026</td><td>English</td><td>Mrs. Davis</td><td><span className="badge badge-success">Present</span></td></tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'schedule' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>Weekly Class Schedule</h3>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Day</th>
                                    <th>Time</th>
                                    <th>Subject</th>
                                    <th>Teacher</th>
                                    <th>Room</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Monday</td><td>09:00 AM</td><td>Mathematics</td><td>Prof. Smith</td><td>Room 101</td></tr>
                                <tr><td>Monday</td><td>10:30 AM</td><td>Physics</td><td>Dr. Banner</td><td>Lab 2</td></tr>
                                <tr><td>Tuesday</td><td>09:00 AM</td><td>Chemistry</td><td>Dr. Foster</td><td>Lab 1</td></tr>
                                <tr><td>Tuesday</td><td>11:00 AM</td><td>English</td><td>Mrs. Davis</td><td>Room 105</td></tr>
                                <tr><td>Wednesday</td><td>09:00 AM</td><td>Mathematics</td><td>Prof. Smith</td><td>Room 101</td></tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="glass-panel table-container">
                        <div className="table-header">
                            <h3>Full Attendance History</h3>
                            <button className="btn btn-primary" onClick={() => alert('Downloading Report...')}>Download Report</button>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Subject</th>
                                    <th>Teacher</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>May 15, 2026</td><td>Mathematics</td><td>Prof. Smith</td><td><span className="badge badge-success">Present</span></td></tr>
                                <tr><td>May 15, 2026</td><td>Physics</td><td>Dr. Banner</td><td><span className="badge badge-success">Present</span></td></tr>
                                <tr><td>May 14, 2026</td><td>Chemistry</td><td>Dr. Foster</td><td><span className="badge badge-danger">Absent</span></td></tr>
                                <tr><td>May 14, 2026</td><td>English</td><td>Mrs. Davis</td><td><span className="badge badge-success">Present</span></td></tr>
                                <tr><td>May 13, 2026</td><td>Mathematics</td><td>Prof. Smith</td><td><span className="badge badge-success">Present</span></td></tr>
                                <tr><td>May 13, 2026</td><td>Physics</td><td>Dr. Banner</td><td><span className="badge badge-success">Present</span></td></tr>
                                <tr><td>May 12, 2026</td><td>Chemistry</td><td>Dr. Foster</td><td><span className="badge badge-danger">Absent</span></td></tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;
