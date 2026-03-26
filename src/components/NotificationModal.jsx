import { X } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useEffect, useState } from 'react';
import './NotificationModal.css';

const NotificationModal = ({ onClose, studentId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // In actual implementation this is replaced by the onSnapshot in Navbar, which passes down or we fetch here on open.
  }, []);

  const fetchNotifications = async () => {
    try {
      const q = query(collection(db, 'complaints'), where('studentId', '==', studentId));
      const querySnapshot = await getDocs(q);
      const notifs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort to show latest first and unread first
      notifs.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (complaintId) => {
    try {
      const complaintRef = doc(db, 'complaints', complaintId);
      await updateDoc(complaintRef, { unread: false });
      
      setNotifications(prev => prev.map(notif => 
        notif.id === complaintId ? { ...notif, unread: false } : notif
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content notification-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Notifications</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body notifications-list">
          {loading ? (
            <p className="text-center text-muted">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-center text-muted">No notifications</p>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`notification-item ${notif.unread ? 'unread' : ''}`}
                onClick={() => notif.unread && markAsRead(notif.id)}
              >
                <div className="notif-header">
                  <span className="notif-category">{notif.category}</span>
                  <span className={`status-badge status-${notif.status.toLowerCase().replace(' ', '-')}`}>
                    {notif.status}
                  </span>
                </div>
                <p className="notif-desc">Complaint #{notif.complaintId}</p>
                {notif.adminComments && (
                  <div className="notif-comment">
                    <strong>Admin: </strong> {notif.adminComments}
                  </div>
                )}
                <small className="notif-time">{new Date(notif.timestamp?.toDate()).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
