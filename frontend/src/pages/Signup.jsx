import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await axios.post('http://localhost:5007/api/auth/register', {
                name, email, password, role
            });
            alert('Registration successful! Please login.');
            navigate('/');
        } catch (err) {
            if (!err.response) {
                setError('Cannot connect to the server. Please make sure the backend is running.');
            } else {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join the system today</p>
                </div>
                
                {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSignup}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-control" placeholder="Enter your full name" required />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-control" placeholder="Enter your email" required />
                    </div>
                    
                    <div className="form-group">
                        <label>Register As</label>
                        <select value={role} onChange={e => setRole(e.target.value)} className="form-control" required>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-control" placeholder="Create a password" required />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                    
                    <div className="text-center mt-4">
                        <p style={{ color: 'var(--text-secondary)' }}>Already have an account? <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Login here</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
