import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Clock, CheckCircle, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import './TrackComplaints.css';

export default function TrackComplaints({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'complaints'), 
        where('studentId', '==', user.studentId)
      );
      const querySnapshot = await getDocs(q);
      const complaintsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in client side if composite index is not created
      complaintsData.sort((a, b) => b.timestamp - a.timestamp);
      
      setComplaints(complaintsData);
    } catch (error) {
      console.error("Error fetching complaints: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Resolved':
      case 'Solved':
        return <CheckCircle size={20} className="text-success" />;
      case 'In Progress':
        return <RefreshCw size={20} className="text-primary" />;
      case 'Under Review':
        return <AlertCircle size={20} className="text-warning" />;
      default:
        return <Clock size={20} className="text-muted" />;
    }
  };

  if (loading) {
    return (
      <div className="container track-wrapper text-center mt-4">
        <RefreshCw className="spinner" size={32} />
        <p className="mt-4 text-muted">Loading your complaints...</p>
      </div>
    );
  }

  return (
    <div className="container track-wrapper">
      <div className="track-header">
        <h2>My Complaints</h2>
        <button className="btn btn-outline" onClick={fetchComplaints}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {complaints.length === 0 ? (
        <div className="empty-state card">
          <CheckCircle size={48} className="text-muted mb-4" />
          <h3>No Complaints Found</h3>
          <p className="text-muted">You haven't raised any complaints yet.</p>
        </div>
      ) : (
        <div className="complaints-grid">
          {complaints.map(complaint => (
            <div key={complaint.id} className="card complaint-card">
              <div className="complaint-header">
                <div>
                  <span className="complaint-id">{complaint.complaintId}</span>
                  <p className="complaint-date">{complaint.date}</p>
                </div>
                <div className={`status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}`}>
                  {getStatusIcon(complaint.status)}
                  <span>{complaint.status}</span>
                </div>
              </div>

              <div className="complaint-body">
                <h4 className="complaint-category">{complaint.category}</h4>
                <p className="complaint-desc">{complaint.description}</p>
                
                {Object.entries(complaint.details).map(([key, value]) => {
                  if (!value) return null;
                  const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  return (
                    <div key={key} className="detail-item">
                      <strong>{formattedKey}:</strong> {value}
                    </div>
                  );
                })}

                {complaint.fileUrl && (
                  <div className="attachment-preview mt-4">
                    <strong>Attachment:</strong>
                    <div className="img-wrapper mt-2">
                      <img src={complaint.fileUrl} alt="Complaint Attachment" />
                    </div>
                  </div>
                )}
              </div>

              {complaint.adminComments && (
                <div className="admin-comment-box">
                  <div className="comment-header">
                    <MessageSquare size={16} /> <strong>Admin Comment</strong>
                  </div>
                  <p>{complaint.adminComments}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
