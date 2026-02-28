import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DataExport from './components/DataExport';
import GDPRCompliance from './components/GDPRCompliance';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import './App.css';

function App() {
  const userId = localStorage.getItem('userId') || '11111111-1111-1111-1111-111111111111';

  return (
    <Router basename="/leaderboard">
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="logo">Transcendence Analytics</h1>
            <ul className="nav-links">
              <li>
                <Link to="/">Dashboard</Link>
              </li>
              <li>
                {/* <Link to="/data-export">Data Export</Link> */}
              </li>
              <li>
                {/* <Link to="/gdpr">GDPR &amp; Privacy</Link> */}
              </li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<AnalyticsDashboard />} />
            <Route path="/data-export" element={<DataExport />} />
            <Route path="/gdpr" element={<GDPRCompliance userId={userId} />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="footer-content">
            <p>&copy; 2026 Transcendence. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms-of-service">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
