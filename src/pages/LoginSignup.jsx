import { useState } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Eye, EyeOff, Shield, User } from 'lucide-react';
import './LoginSignup.css';

export default function LoginSignup({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    mobile: '',
    password: '',
    adminUsername: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const clearForm = () => {
    setFormData({ studentId: '', name: '', mobile: '', password: '', adminUsername: '' });
    setError('');
    setSuccess('');
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    clearForm();
  };

  const handleToggleRole = (role) => {
    setIsAdmin(role === 'admin');
    setIsLogin(true); // Admin only has login
    clearForm();
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (formData.adminUsername === 'deepu@admin' && formData.password === 'deepu@rgukt') {
      onLogin({ role: 'admin', name: 'Admin User' });
    } else {
      setError('Invalid admin credentials');
    }
    setLoading(false);
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Offline fallback
      const storedUsers = JSON.parse(localStorage.getItem('hostel_users') || '[]');
      const user = storedUsers.find(
        (u) => u.studentId === formData.studentId.toUpperCase() && u.password === formData.password
      );

      if (user) {
        onLogin({ role: 'student', ...user });
      } else {
        // Only try firebase if there is a real key
        if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'mock_key') {
          const q = query(
            collection(db, 'users'), 
            where('studentId', '==', formData.studentId.toUpperCase()),
            where('password', '==', formData.password)
          );
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            setError('Invalid Student ID or Password');
          } else {
            const userData = querySnapshot.docs[0].data();
            onLogin({ role: 'student', ...userData });
            return;
          }
        } else {
            setError('Invalid Student ID or Password');
        }
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleStudentSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validations
    const stId = formData.studentId.toUpperCase();
    if (!stId.startsWith('B')) {
      setError('Student ID must start with "B"');
      setLoading(false);
      return;
    }
    if (formData.mobile.length < 10) {
      setError('Please enter a valid mobile number');
      setLoading(false);
      return;
    }

    try {
      // Offline fallback handling
      const storedUsers = JSON.parse(localStorage.getItem('hostel_users') || '[]');
      const isDuplicateLocal = storedUsers.some((u) => u.studentId === stId);

      if (isDuplicateLocal) {
        setError('Account with this Student ID already exists');
        setLoading(false);
        return;
      }

      let isDuplicateFirebase = false;

      // Only attempt firebase if key is not mock
      if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'mock_key') {
        const q = query(collection(db, 'users'), where('studentId', '==', stId));
        const querySnapshot = await getDocs(q);
        isDuplicateFirebase = !querySnapshot.empty;
      }

      if (isDuplicateFirebase) {
        setError('Account with this Student ID already exists');
      } else {
        const newUser = {
          studentId: stId,
          name: formData.name,
          mobile: formData.mobile,
          password: formData.password,
          role: 'student',
          createdAt: new Date()
        };

        // Create user in firebase if real config exists
        if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'mock_key') {
           await addDoc(collection(db, 'users'), newUser);
        } else {
           // Save locally if mock config
           storedUsers.push(newUser);
           localStorage.setItem('hostel_users', JSON.stringify(storedUsers));
        }

        setSuccess('Account created successfully! Please login.');
        setTimeout(() => {
          setIsLogin(true);
          clearForm();
        }, 2000);
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <div className="auth-header">
          <h2>{isAdmin ? 'Admin Portal' : (isLogin ? 'Student Login' : 'Student Registration')}</h2>
          <p className="text-muted">
            {isAdmin 
              ? 'Login to manage hostel complaints' 
              : (isLogin ? 'Welcome back! Please login to your account.' : 'Create an account to raise complaints.')}
          </p>
        </div>

        {/* Role Toggle */}
        <div className="role-toggle">
          <button 
            type="button"
            className={`role-btn ${!isAdmin ? 'active' : ''}`} 
            onClick={() => handleToggleRole('student')}
          >
            <User size={18} /> Student
          </button>
          <button 
            type="button"
            className={`role-btn ${isAdmin ? 'active' : ''}`} 
            onClick={() => handleToggleRole('admin')}
          >
            <Shield size={18} /> Admin
          </button>
        </div>

        {error && <div className="alert-box danger">{error}</div>}
        {success && <div className="alert-box success">{success}</div>}

        <form onSubmit={isAdmin ? handleAdminLogin : (isLogin ? handleStudentLogin : handleStudentSignup)}>
          
          {/* Admin Fields */}
          {isAdmin && (
            <div className="form-group">
              <label className="form-label">Admin Username</label>
              <input 
                type="text" 
                name="adminUsername"
                className="form-input" 
                value={formData.adminUsername}
                onChange={handleChange}
                placeholder="Enter admin username"
                required 
              />
            </div>
          )}

          {/* Student Fields */}
          {!isAdmin && !isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                name="name"
                className="form-input" 
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required 
              />
            </div>
          )}

          {!isAdmin && (
            <div className="form-group">
              <label className="form-label">Student ID</label>
              <input 
                type="text" 
                name="studentId"
                className="form-input" 
                value={formData.studentId}
                onChange={handleChange}
                placeholder="e.g., B123456"
                style={{ textTransform: 'uppercase' }}
                required 
              />
            </div>
          )}

          {!isAdmin && !isLogin && (
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input 
                type="tel" 
                name="mobile"
                className="form-input" 
                value={formData.mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
                required 
              />
            </div>
          )}

          {/* Password Field (Common) */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                className="form-input" 
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                required 
              />
              <button 
                type="button" 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        {!isAdmin && (
          <div className="auth-footer text-center mt-4">
            <p className="text-muted">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" className="text-link" onClick={handleToggleMode}>
                {isLogin ? 'Sign up here' : 'Login here'}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
