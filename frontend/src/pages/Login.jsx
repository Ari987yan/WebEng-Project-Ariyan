import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await axios.post('http://localhost:5007/api/auth/login', {
                email, password, role
            });
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            if (role === 'admin') navigate('/admin');
            else if (role === 'teacher') navigate('/teacher');
            else navigate('/student');
        } catch (err) {
            if (!err.response) {
                setError('Cannot connect to the server. Please make sure the backend is running.');
            } else {
                setError(err.response?.data?.message || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <div className="auth-header">
                    <h1>Welcome Back</h1>
                    <p>Login to your account</p>
                </div>
                
                {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" placeholder="Enter your email" required />
                    </div>
                    
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-control" placeholder="Enter your password" required />
                    </div>
                    
                    <div className="form-group">
                        <label>Login As</label>
                        <select value={role} onChange={e => setRole(e.target.value)} className="form-control" required>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                    
                    <div className="text-center mt-4">
                        <p style={{ color: 'var(--text-secondary)' }}>Don't have an account? <Link to="/signup" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Register here</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
