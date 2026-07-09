import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import ReportComplaint from './pages/ReportComplaint';
import TrackComplaint from './pages/TrackComplaint';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import API from './utils/api';

const App = () => {
  const [lang, setLang] = useState('English');
  const [darkMode, setDarkMode] = useState(false);
  
  // Set default mock citizen context from localStorage
  const [user, setUser] = useState({
    id: '60c72b2f9b1d8a2c28654877',
    role: 'citizen',
    name: localStorage.getItem('citizenName') ,
    email: 'citizen@civicmind.in',
    phone: localStorage.getItem('citizenPhone') 
  });

  // Dark Mode mounting
  useEffect(() => {
    // Check system preferences theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-250">
        
        {/* Navigation bar */}
        <Navbar
          lang={lang}
          setLang={setLang}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          user={user}
          setUser={setUser}
        />

        {/* Core content views - All publicly accessible */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home lang={lang} />} />
            <Route path="/report" element={<ReportComplaint lang={lang} user={user} setUser={setUser} />} />
            <Route path="/track" element={<TrackComplaint lang={lang} />} />
            
            {/* Direct Dashboard Access without Authentication redirects */}
            <Route path="/dashboard" element={<CitizenDashboard user={user} />} />
            <Route path="/officer" element={<OfficerDashboard user={user} />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Catch-all redirects */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {/* Floating Chatbot widget */}
        <Chatbot lang={lang} />

        {/* Branding Footer */}
        <Footer />
        
      </div>
    </Router>
  );
};

export default App;
