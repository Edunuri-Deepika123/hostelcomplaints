import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Bell, LogOut, Home, FileText, Activity, Shield } from 'lucide-react';
import NotificationModal from './NotificationModal';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.role === 'student' && user?.studentId) {
      const q = query(
        collection(db, 'complaints'),
        where('studentId', '==', user.studentId),
        where('unread', '==', true)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadCount(snapshot.docs.length);
      }, (error) => {
        console.error('Error fetching notifications:', error);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNavClick = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <Shield className="logo-icon" />
            <span>HostelCare</span>
          </Link>

          {/* Desktop Menu */}
          <div className="nav-menu desktop-menu">
            <button className={`nav-link ${location.pathname==='/' ? 'active' : ''}`} onClick={() => handleNavClick('/')}>
              <Home size={18} /> Home
            </button>
            
            {user?.role === 'student' && (
              <>
                <button className={`nav-link ${location.pathname==='/raise' ? 'active' : ''}`} onClick={() => handleNavClick('/raise')}>
                  <FileText size={18} /> Raise Complaint
                </button>
                <button className={`nav-link ${location.pathname==='/track' ? 'active' : ''}`} onClick={() => handleNavClick('/track')}>
                  <Activity size={18} /> Track Status
                </button>
              </>
            )}

            {user?.role === 'admin' && (
              <button className={`nav-link ${location.pathname==='/admin' ? 'active' : ''}`} onClick={() => handleNavClick('/admin')}>
                <Shield size={18} /> Admin Dashboard
              </button>
            )}
          </div>

          <div className="nav-actions desktop-menu">
            {user?.role === 'student' && (
              <button className="notification-btn" onClick={() => setShowNotifications(true)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>
            )}
            
            {user ? (
              <button className="btn btn-outline nav-logout" onClick={() => { onLogout(); setIsOpen(false); }}>
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => handleNavClick('/login')}>
                Login
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="mobile-toggle" onClick={toggleMenu}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="mobile-menu">
            <button className={`nav-link ${location.pathname==='/' ? 'active' : ''}`} onClick={() => handleNavClick('/')}>
              <Home size={18} /> Home
            </button>
            
            {user?.role === 'student' && (
              <>
                <button className={`nav-link ${location.pathname==='/raise' ? 'active' : ''}`} onClick={() => handleNavClick('/raise')}>
                  <FileText size={18} /> Raise Complaint
                </button>
                <button className={`nav-link ${location.pathname==='/track' ? 'active' : ''}`} onClick={() => handleNavClick('/track')}>
                  <Activity size={18} /> Track Status
                </button>
                <button className="nav-link" onClick={() => { setShowNotifications(true); setIsOpen(false); }}>
                  <Bell size={18} /> Notifications {unreadCount > 0 && `(${unreadCount})`}
                </button>
              </>
            )}

            {user?.role === 'admin' && (
              <button className={`nav-link ${location.pathname==='/admin' ? 'active' : ''}`} onClick={() => handleNavClick('/admin')}>
                <Shield size={18} /> Admin Dashboard
              </button>
            )}

            {user ? (
              <button className="btn btn-outline mt-4" style={{width: 'calc(100% - 2rem)', margin: '1rem'}} onClick={() => { onLogout(); setIsOpen(false); }}>
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <button className="btn btn-primary mt-4" style={{width: 'calc(100% - 2rem)', margin: '1rem'}} onClick={() => handleNavClick('/login')}>
                Login
              </button>
            )}
          </div>
        )}
      </nav>

      {showNotifications && user?.role === 'student' && (
        <NotificationModal 
          onClose={() => setShowNotifications(false)} 
          studentId={user.studentId} 
        />
      )}
    </>
  );
};

export default Navbar;
