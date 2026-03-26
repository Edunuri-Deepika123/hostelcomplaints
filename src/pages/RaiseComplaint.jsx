import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Upload, X } from 'lucide-react';
import Toast from '../components/Toast';
import './RaiseComplaint.css';

const HOSTELS = ['Boy\'s Hostel 1', 'Boy\'s Hostel 2', 'Girl\'s Hostel 1', 'Girl\'s Hostel 2'];
const WINGS = ['North', 'South', 'East', 'West'];
const CATEGORIES = ['Food', 'Water', 'Wi-Fi', 'Electricity', 'Washrooms', 'Cleanliness', 'Other'];

export default function RaiseComplaint({ user }) {
  const [formData, setFormData] = useState({
    hostel: '',
    wing: '',
    category: '',
    roomNumber: '',
    mealType: '',
    issueTitle: '',
    description: ''
  });
  
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const needsRoomNumber = ['Electricity', 'Water', 'Wi-Fi', 'Washrooms', 'Cleanliness'].includes(formData.category);
  const needsImageUpload = true; // The UI logic allows image for any category technically, or specifically these if preferred.
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
        setToast({ message: 'Only JPG and PNG images are allowed', type: 'danger' });
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setToast({ message: 'File size must be less than 5MB', type: 'danger' });
        return;
      }
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const generateComplaintId = () => {
    return 'COMP-' + Math.floor(10000 + Math.random() * 90000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fileUrl = null;

      // Ensure dummy environment doesn't crash real Storage upload if configured
      if (file && storage) {
        try {
          const storageRef = ref(storage, `complaints/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          fileUrl = await getDownloadURL(snapshot.ref);
        } catch (err) {
          console.warn("Storage upload failed, likely due to missing config rules. Saving without image.", err);
        }
      }

      const complaintId = generateComplaintId();

      const complaintData = {
        complaintId,
        studentName: user.name,
        studentId: user.studentId,
        hostel: formData.hostel,
        wing: formData.wing,
        category: formData.category,
        description: formData.description,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        adminComments: '',
        unread: false,
        timestamp: new Date(),
        details: {
          roomNumber: formData.roomNumber || null,
          mealType: formData.mealType || null,
          issueTitle: formData.issueTitle || null
        }
      };

      if (fileUrl) {
        complaintData.fileUrl = fileUrl;
      }

      await addDoc(collection(db, 'complaints'), complaintData);

      setToast({ message: `Complaint ${complaintId} submitted successfully!`, type: 'success' });
      
      // Reset Form
      setFormData({
        hostel: '',
        wing: '',
        category: '',
        roomNumber: '',
        mealType: '',
        issueTitle: '',
        description: ''
      });
      clearFile();

    } catch (error) {
      console.error('Submission error:', error);
      setToast({ message: 'Failed to submit complaint. Try again.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container raise-complaint-wrapper">
      <div className="card form-card">
        <div className="form-header">
          <h2>Raise a Complaint</h2>
          <p className="text-muted">Fill out the details below to report an issue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-input" value={user?.name || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Student ID</label>
              <input type="text" className="form-input" value={user?.studentId || ''} disabled />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Select Hostel</label>
              <select name="hostel" className="form-input" value={formData.hostel} onChange={handleChange} required>
                <option value="">-- Choose Hostel --</option>
                {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Select Wing</label>
              <select name="wing" className="form-input" value={formData.wing} onChange={handleChange} required>
                <option value="">-- Choose Wing --</option>
                {WINGS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <select name="category" className="form-input" value={formData.category} onChange={handleChange} required>
              <option value="">-- Choose Category --</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Conditional Fields */}
          {needsRoomNumber && (
            <div className="form-group animate-slide-down">
              <label className="form-label">Room Number</label>
              <input type="text" name="roomNumber" className="form-input" value={formData.roomNumber} onChange={handleChange} required placeholder="e.g. 101" />
            </div>
          )}

          {formData.category === 'Food' && (
            <div className="form-group animate-slide-down">
              <label className="form-label">Meal Type</label>
              <select name="mealType" className="form-input" value={formData.mealType} onChange={handleChange} required>
                <option value="">-- Select Meal --</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Snacks">Snacks</option>
                <option value="Dinner">Dinner</option>
              </select>
            </div>
          )}

          {formData.category === 'Other' && (
            <div className="form-group animate-slide-down">
              <label className="form-label">Issue Title</label>
              <input type="text" name="issueTitle" className="form-input" value={formData.issueTitle} onChange={handleChange} required placeholder="Brief title of the issue" />
            </div>
          )}

          <div className="form-group mb-4">
            <label className="form-label">Description</label>
            <textarea 
              name="description" 
              className="form-input" 
              rows="4" 
              value={formData.description} 
              onChange={handleChange} 
              required 
              placeholder="Describe the issue in detail..."
            ></textarea>
          </div>

          {/* File Upload */}
          <div className="form-group mb-4">
            <label className="form-label">Upload Image Reference (Optional)</label>
            {!filePreview ? (
              <label className="file-upload-box">
                <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden-file-input" />
                <div className="upload-content">
                  <Upload size={24} className="text-muted" />
                  <span className="text-muted">Click to upload JPG or PNG</span>
                </div>
              </label>
            ) : (
              <div className="file-preview-box">
                <img src={filePreview} alt="Preview" className="preview-img" />
                <button type="button" className="clear-file-btn" onClick={clearFile}>
                  <X size={16} /> Remove
                </button>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
      
      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
