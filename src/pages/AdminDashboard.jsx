import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Eye, Edit, X, Search, RefreshCw, Filter } from 'lucide-react';
import Toast from '../components/Toast';
import './AdminDashboard.css';

const STATUS_OPTIONS = ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Solved'];

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, data: null });
  const [updateModal, setUpdateModal] = useState({ isOpen: false, data: null });
  const [updateForm, setUpdateForm] = useState({ status: '', adminComments: '' });
  const [toast, setToast] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'complaints'));
      const querySnapshot = await getDocs(q);
      const complaintsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort in client
      complaintsData.sort((a, b) => b.timestamp - a.timestamp);
      
      setComplaints(complaintsData);
    } catch (error) {
      console.error("Error fetching complaints: ", error);
      setToast({ message: 'Failed to fetch complaints', type: 'danger' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const openUpdateModal = (complaint) => {
    setUpdateForm({
      status: complaint.status,
      adminComments: complaint.adminComments || ''
    });
    setUpdateModal({ isOpen: true, data: complaint });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const complaintId = updateModal.data.id;
    
    try {
      const complaintRef = doc(db, 'complaints', complaintId);
      await updateDoc(complaintRef, {
        status: updateForm.status,
        adminComments: updateForm.adminComments,
        unread: true // Notify student
      });

      setToast({ message: `Complaint #${updateModal.data.complaintId} updated!`, type: 'success' });
      setUpdateModal({ isOpen: false, data: null });
      fetchComplaints(); // Refresh data

    } catch (error) {
      console.error('Update error:', error);
      setToast({ message: 'Failed to update complaint', type: 'danger' });
    }
  };

  // Filtering
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.complaintId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? c.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container admin-wrapper">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <div className="admin-controls">
          <div className="search-box">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search Student ID, Name or Complaint ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="filter-box">
            <Filter size={18} className="text-muted" />
            <select 
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <button className="btn btn-outline" onClick={fetchComplaints}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="text-center py-4 text-muted border-top">
            <RefreshCw className="spinner" size={32} />
            <p className="mt-2">Loading complaints data...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="text-center py-4 text-muted border-top">
            <p>No complaints found matching your criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Student Info</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(complaint => (
                  <tr key={complaint.id}>
                    <td className="font-medium">{complaint.complaintId}</td>
                    <td>
                      <div>{complaint.studentName}</div>
                      <div className="text-sm text-muted">{complaint.studentId}</div>
                    </td>
                    <td>
                      <span className="category-tag">{complaint.category}</span>
                    </td>
                    <td className="text-sm">{new Date(complaint.timestamp?.toDate()).toLocaleDateString() || complaint.date}</td>
                    <td>
                      <span className={`status-badge status-${complaint.status.toLowerCase().replace(' ', '-')}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-view" 
                          title="View Details"
                          onClick={() => setDetailsModal({ isOpen: true, data: complaint })}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="btn-icon btn-edit" 
                          title="Update Status"
                          onClick={() => openUpdateModal(complaint)}
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.data && (
        <div className="modal-overlay" onClick={() => setDetailsModal({ isOpen: false, data: null })}>
          <div className="modal-content admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Complaint Details</h3>
              <button className="close-btn" onClick={() => setDetailsModal({ isOpen: false, data: null })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body p-4">
              <div className="detail-grid">
                <div className="detail-col">
                  <strong>Complaint ID:</strong> {detailsModal.data.complaintId}
                </div>
                <div className="detail-col">
                  <strong>Date:</strong> {detailsModal.data.date}
                </div>
                <div className="detail-col">
                  <strong>Student Name:</strong> {detailsModal.data.studentName}
                </div>
                <div className="detail-col">
                  <strong>Student ID:</strong> {detailsModal.data.studentId}
                </div>
                <div className="detail-col">
                  <strong>Hostel/Wing:</strong> {detailsModal.data.hostel} - {detailsModal.data.wing}
                </div>
                <div className="detail-col">
                  <strong>Category:</strong> {detailsModal.data.category}
                </div>
                <div className="detail-col">
                  <strong>Status:</strong> 
                  <span className={`status-badge status-${detailsModal.data.status.toLowerCase().replace(' ', '-')} ml-2`}>
                    {detailsModal.data.status}
                  </span>
                </div>
                
                {Object.entries(detailsModal.data.details).map(([key, value]) => {
                  if (!value) return null;
                  const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                  return (
                    <div key={key} className="detail-col">
                      <strong>{formattedKey}:</strong> {value}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <strong>Description:</strong>
                <p className="mt-2 text-muted detail-desc">{detailsModal.data.description}</p>
              </div>

              {detailsModal.data.adminComments && (
                <div className="mt-4 admin-note">
                  <strong>Admin Comments:</strong>
                  <p className="mt-1 mb-0">{detailsModal.data.adminComments}</p>
                </div>
              )}

              {detailsModal.data.fileUrl && (
                <div className="mt-4">
                  <strong>Uploaded Image:</strong>
                  <div className="admin-img-preview mt-2">
                    <img src={detailsModal.data.fileUrl} alt="Complaint Evidence" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {updateModal.isOpen && updateModal.data && (
        <div className="modal-overlay" onClick={() => setUpdateModal({ isOpen: false, data: null })}>
          <div className="modal-content update-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Complaint #{updateModal.data.complaintId}</h3>
              <button className="close-btn" onClick={() => setUpdateModal({ isOpen: false, data: null })}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="modal-body p-4">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select 
                  className="form-input"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                  required
                >
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Admin Comments</label>
                <textarea 
                  className="form-input"
                  rows="4"
                  value={updateForm.adminComments}
                  onChange={(e) => setUpdateForm({...updateForm, adminComments: e.target.value})}
                  placeholder="Leave a note for the student..."
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setUpdateModal({ isOpen: false, data: null })}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
