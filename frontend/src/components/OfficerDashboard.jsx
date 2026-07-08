import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import API from '../utils/api';
import { DEPARTMENTS } from '../utils/departments';
import { GVMC_ZONES } from '../utils/zoneDetector';

const OfficerDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulated Officer Session States
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedZone, setSelectedZone] = useState('All');

  const fetchAssignedComplaints = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/complaints/assigned?department=${selectedDept}&zone=${selectedZone}`);
      setComplaints(res.data);
      if (res.data.length > 0) {
        setSelectedComplaint(res.data[0]);
      } else {
        setSelectedComplaint(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedComplaints();
  }, [selectedDept, selectedZone]);

  const handleMarkAsSolved = async () => {
    if (!selectedComplaint) return;

    try {
      const mockOfficerHeaders = {
        'x-mock-officer-id': `mock_officer_${selectedDept.slice(0, 3)}_${selectedZone.split(' ')[0]}`,
        'x-mock-officer-dept': selectedDept,
        'x-mock-officer-zone': selectedZone
      };

      await API.patch(`/complaints/${selectedComplaint._id}/status`, { 
        status: 'Resolved',
        remarks: 'Issue resolved by municipal department officer.'
      }, {
        headers: mockOfficerHeaders
      });

      alert(`✅ Grievance Solved!\n\nAn automated SMS & Email resolution alert has been successfully dispatched to the citizen!`);
      fetchAssignedComplaints();
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      
      {/* Header Banner - Simulators only */}
      <div className="bg-gradient-to-r from-slate-900 to-primary-955 text-white p-6 rounded-2xl border border-slate-800 shadow-xl mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wide">GVMC Internal Service</span>
          <h1 className="text-xl font-black mt-1">Officer Dashboard Simulation</h1>
          <p className="text-xs text-slate-400 mt-1">Review active complaints and mark them as solved upon completion.</p>
        </div>
        
        {/* Dynamic drop-down selectors to filter role */}
        <div className="flex flex-wrap gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5 w-full md:w-auto">
          <div>
            <label className="block text-[9px] text-teal-400 font-bold uppercase mb-1">Simulated Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border-none rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
            >
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] text-teal-400 font-bold uppercase mb-1">Assigned Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border-none rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 font-semibold"
            >
              <option value="All">All Zones</option>
              {GVMC_ZONES.map(z => (
                <option key={z.name} value={z.name}>{z.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: Complaints queue */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 dark:text-white border-b pb-2.5 flex items-center justify-between uppercase tracking-wider">
            <span>Citizen Complaints ({complaints.length})</span>
          </h3>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : complaints.length === 0 ? (
            <p className="text-xs text-slate-500 py-10 text-center font-semibold">No complaints registered.</p>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {complaints.map(c => (
                <div
                  key={c._id}
                  onClick={() => setSelectedComplaint(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedComplaint?._id === c._id
                      ? 'bg-primary-50/70 border-primary-400 shadow-sm dark:bg-primary-950/20 dark:border-primary-855'
                      : 'bg-slate-5/50 hover:bg-slate-100/50 dark:bg-slate-900/20 dark:hover:bg-slate-900 border-slate-200/50 dark:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                    <span>{c.trackingId}</span>
                    <span className={`px-2 py-0.2 rounded-full font-black text-[9px] uppercase ${
                      c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>{c.status}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 mt-2 line-clamp-1">{c.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{c.location?.address}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Selected Complaint Details & Solve Button */}
        <div className="lg:col-span-8">
          {selectedComplaint ? (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6">
              
              {/* Header details */}
              <div className="border-b pb-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Grievance Ticket ID</span>
                <h2 className="text-lg font-black text-primary-600 dark:text-primary-400 mt-0.5">{selectedComplaint.trackingId}</h2>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-850 dark:text-white leading-snug">{selectedComplaint.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/30 dark:border-slate-800">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Simple action panel - direct Mark as Solved button only */}
              <div className="border-t pt-6">
                {selectedComplaint.status !== 'Resolved' ? (
                  <button
                    onClick={handleMarkAsSolved}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md transition-all duration-200 transform hover:scale-101 active:scale-99 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span>Mark as Solved</span>
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-450 font-bold flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>This grievance has been successfully resolved.</span>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-850 rounded-2xl p-16 text-center border border-slate-200/80 dark:border-slate-800 shadow-md text-slate-500 font-bold text-xs">
              Select an active grievance from the queue to view details and mark it as solved.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default OfficerDashboard;
