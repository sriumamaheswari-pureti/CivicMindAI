import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Folder, Clock, Bell, Settings, User, Phone, Mail, ArrowRight } from 'lucide-react';
import API from '../utils/api';

const CitizenDashboard = ({ user }) => {
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const cRes = await API.get('/complaints/my');
      
      // Filter complaints to only show the ones matching the citizen's custom name in localStorage
      const currentName = localStorage.getItem('citizenName');
      const filtered = currentName 
        ? cRes.data.filter(c => c.citizenName === currentName) 
        : cRes.data;

      setComplaints(filtered);

      // Simulate notification records or call API
      try {
        const nRes = await API.get('/auth/me'); // simple verify auth
        setNotifications([
          { _id: '1', title: 'Account Verified', message: 'Welcome to CivicMind! Your citizen profile is active.', createdAt: new Date().toISOString() },
          ...cRes.data.map(c => ({
            _id: c._id,
            title: `Update on ${c.trackingId}`,
            message: `Status is now: "${c.status}". Remarks: ${c.remarks || 'Grievance registered.'}`,
            createdAt: c.createdAt
          }))
        ]);
      } catch (err) {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Info Card */}
        <div className="w-full md:w-80 shrink-0 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800 shadow-lg text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-500 to-teal-500 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-md">{user?.name}</h3>
              <span className="text-[10px] bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Citizen Portal</span>
            </div>
            
            <div className="border-t pt-4 text-left text-xs text-slate-500 dark:text-slate-400 space-y-3">
              <p className="flex items-center space-x-2"><Phone className="h-4 w-4 text-slate-400" /> <span>{user?.phone || '9876543210'}</span></p>
              <p className="flex items-center space-x-2"><Mail className="h-4 w-4 text-slate-400 truncate" /> <span className="truncate">{user?.email}</span></p>
            </div>
          </div>

          {/* Quick link */}
          <Link
            to="/report"
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md transition-colors flex items-center justify-center space-x-2 btn-hover-effect text-xs"
          >
            <span>Report a New Issue</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Complaints and updates area */}
        <div className="flex-1 space-y-8">
          {/* Section: complaints history */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-slate-800/80 shadow-lg">
            <h3 className="text-md font-bold text-slate-800 dark:text-white border-b pb-3 mb-4 flex items-center">
              <Folder className="h-4.5 w-4.5 mr-2 text-primary-500" /> Grievance Report History
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 space-y-2">
                <p className="text-sm">You haven't reported any complaints yet.</p>
                <Link to="/report" className="text-xs text-primary-500 font-bold hover:underline">Click here to file your first grievance</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900 font-bold uppercase text-[10px] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Tracking ID</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {complaints.map(c => (
                      <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-4 font-bold text-primary-600 dark:text-primary-400">{c.trackingId}</td>
                        <td className="px-4 py-4 font-semibold text-slate-800 dark:text-white truncate max-w-[150px]">{c.title}</td>
                        <td className="px-4 py-4 truncate max-w-[120px]">{c.department}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            c.status === 'Closed' ? 'bg-green-100 text-green-800' :
                            c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                            c.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>{c.status}</span>
                        </td>
                        <td className="px-4 py-4 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-4 text-right">
                          <Link to={`/track?id=${c.trackingId}`} className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-bold hover:underline">Track status</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Notification Updates */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-slate-800/80 shadow-lg">
            <h3 className="text-md font-bold text-slate-800 dark:text-white border-b pb-3 mb-4 flex items-center">
              <Bell className="h-4.5 w-4.5 mr-2 text-primary-500" /> Notifications & Activity Logs
            </h3>

            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No alerts logged</p>
            ) : (
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {notifications.map(n => (
                  <div key={n._id} className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-start space-x-3 hover:border-primary-500/20 transition-all">
                    <Clock className="h-4 w-4 text-primary-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-slate-800 dark:text-white">{n.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 inline-block mt-1 font-semibold">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CitizenDashboard;
