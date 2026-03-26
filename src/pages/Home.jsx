import { Link } from 'react-router-dom';
import { FileText, Activity, ShieldCheck, Clock } from 'lucide-react';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Hostel Complaint Portal</h1>
          <p className="hero-subtitle">
            A centralized platform for residents to report hostel issues ranging from maintenance to cleanliness, ensuring quick and efficient resolutions.
          </p>
          <div className="hero-buttons">
            <Link to="/raise" className="btn btn-primary btn-lg">
              <FileText size={20} /> Report Issue
            </Link>
            <Link to="/track" className="btn btn-outline btn-lg">
              <Activity size={20} /> Check Status
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section container">
        <h2 className="section-title">How It Works</h2>
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon icon-blue">
              <FileText size={32} />
            </div>
            <h3>Raise Issue</h3>
            <p>Select your category and provide details about the problem you are facing in the hostel.</p>
          </div>
          
          <div className="feature-card card">
            <div className="feature-icon icon-yellow">
              <Clock size={32} />
            </div>
            <h3>Track Status</h3>
            <p>Monitor the progress of your complaint in real-time through your personalized dashboard.</p>
          </div>
          
          <div className="feature-card card">
            <div className="feature-icon icon-green">
              <ShieldCheck size={32} />
            </div>
            <h3>Quick Resolution</h3>
            <p>Admins review and assign the right personnel to resolve your issue as quickly as possible.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
