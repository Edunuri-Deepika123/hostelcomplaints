import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import LoginSignup from './pages/LoginSignup'
import RaiseComplaint from './pages/RaiseComplaint'
import TrackComplaints from './pages/TrackComplaints'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('hostelcare_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('hostelcare_user', JSON.stringify(userData));
    if (userData.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/track');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hostelcare_user');
    navigate('/login');
  };

  // Protected Routes Wrapper
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" />; // fallback to home if unauthorized
    }
    return children;
  };

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="main-content" style={{ marginTop: '60px', padding: '2rem 1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginSignup onLogin={handleLogin} />} />
          
          <Route path="/raise" element={
            <ProtectedRoute allowedRoles={['student']}>
              <RaiseComplaint user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/track" element={
            <ProtectedRoute allowedRoles={['student']}>
              <TrackComplaints user={user} />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  )
}

export default App
