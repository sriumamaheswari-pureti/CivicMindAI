import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Globe, Sun, Moon, Bell, User, LogOut } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translation';
import API from '../utils/api';

const Navbar = ({ lang, setLang, darkMode, setDarkMode, user, setUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      // Create a dummy endpoint helper or catch gracefully
      const res = await API.get('/auth/me'); // will check user status
      // We can also make a notifications fetch, if fails, set mock
      try {
        const notifRes = await API.get('/complaints/my');
        const activeComplaints = notifRes.data || [];

        // Check if any status has changed compared to localStorage cache
        const cachedStatusesStr = localStorage.getItem('complaint_statuses');
        const cachedStatuses = cachedStatusesStr ? JSON.parse(cachedStatusesStr) : {};

        activeComplaints.forEach(c => {
          const prevStatus = cachedStatuses[c.trackingId];
          if (prevStatus && prevStatus !== c.status) {
            // Popup alert window
            alert(`🔔 CivicMind Update!\n\nYour grievance (ID: ${c.trackingId}) status has been updated from "${prevStatus}" to "${c.status}" by the GVMC officer!`);
          }
        });

        // Save new states
        const newStatuses = {};
        activeComplaints.forEach(c => {
          newStatuses[c.trackingId] = c.status;
        });
        localStorage.setItem('complaint_statuses', JSON.stringify(newStatuses));

        setNotifications([
          { _id: '1', title: 'Welcome to CivicMind', message: 'Report issues and track them in real-time!', isRead: false },
          ...(activeComplaints.map(c => ({
            _id: c._id,
            title: `Complaint ${c.status}`,
            message: `Grievance ID ${c.trackingId} is currently: ${c.status}`,
            isRead: false
          })))
        ]);
      } catch (err) {
        setNotifications([
          { _id: '1', title: 'Welcome to CivicMind', message: 'Report issues and track them in real-time!', isRead: false }
        ]);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setShowProfileMenu(false);
    navigate('/');
  };

  const activeLink = (path) => {
    return location.pathname === path
      ? "text-primary-500 font-semibold border-b-2 border-primary-500 pb-1 dark:text-primary-400"
      : "text-slate-600 hover:text-primary-500 dark:text-slate-300 dark:hover:text-primary-400 transition-colors";
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-gov-blue to-primary-600 dark:from-primary-400 dark:to-teal-400 bg-clip-text text-transparent flex items-center">
                <span className="mr-1.5">🏙️</span>CivicMind AI
              </span>
            </Link>
            <div className="hidden md:flex space-x-6 ml-10">
              <Link to="/" className={activeLink("/")}>{t.navHome}</Link>
              <Link to="/report" className={activeLink("/report")}>{t.navReport}</Link>
              <Link to="/track" className={activeLink("/track")}>{t.navTrack}</Link>
              <Link to="/dashboard" className={activeLink("/dashboard")}>Citizen Dashboard</Link>
              <Link to="/officer" className={activeLink("/officer")}>{t.navOfficerDashboard}</Link>
              <Link to="/admin" className={activeLink("/admin")}>{t.navAdminDashboard}</Link>
            </div>
          </div>

          {/* Right menu controls */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative flex items-center space-x-1">
              <Globe className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 border-none focus:ring-0 cursor-pointer pr-5 py-1"
              >
                <option value="English" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">English</option>
                <option value="Telugu" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">తెలుగు</option>
                <option value="Hindi" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white">हिन्दी</option>
              </select>
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-2xl p-4 z-50 max-h-96 overflow-y-auto">
                    <h3 className="text-sm font-bold border-b pb-2 mb-2 text-slate-800 dark:text-slate-100">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No new notifications</p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map(n => (
                          <div key={n._id} className="text-xs border-b border-slate-100 dark:border-slate-700/50 pb-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 p-1.5 rounded transition-colors">
                            <p className="font-bold text-slate-700 dark:text-slate-200">{n.title}</p>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wide">
              Public Portal
            </div>

            {/* Mobile menu toggle */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          <Link to="/" className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200" onClick={() => setIsOpen(false)}>{t.navHome}</Link>
          <Link to="/report" className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200" onClick={() => setIsOpen(false)}>{t.navReport}</Link>
          <Link to="/track" className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200" onClick={() => setIsOpen(false)}>{t.navTrack}</Link>
          <Link to="/dashboard" className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200" onClick={() => setIsOpen(false)}>Citizen Dashboard</Link>
          <Link to="/officer" className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200" onClick={() => setIsOpen(false)}>{t.navOfficerDashboard}</Link>
          <Link to="/admin" className="block px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200" onClick={() => setIsOpen(false)}>{t.navAdminDashboard}</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
