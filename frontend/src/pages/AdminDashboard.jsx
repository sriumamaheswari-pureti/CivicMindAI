import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { UserCheck, UserX, PlusCircle, Activity, BarChart2, List, Shield, UserPlus, Map } from 'lucide-react';
import { DEPARTMENTS } from '../utils/departments';
import { GVMC_ZONES } from '../utils/zoneDetector';
import MapComponent from '../components/MapComponent';
import API from '../utils/api';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs: 'analytics', 'officers', 'complaints'
  const [activeTab, setActiveTab] = useState('analytics');

  // Add Officer Form State
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Engineering Department',
    zone: 'East Zone',
    password: ''
  });
  const [registering, setRegistering] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const aRes = await API.get('/admin/analytics');
      setAnalytics(aRes.data);

      const oRes = await API.get('/admin/officers');
      setOfficers(oRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleOfficerStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await API.patch(`/admin/officers/${id}/status`, { status: nextStatus });
      alert(`Officer status updated successfully to: ${nextStatus}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert('Error updating officer status.');
    }
  };

  const handleRegisterOfficer = async (e) => {
    e.preventDefault();
    setRegistering(true);
    try {
      await API.post('/admin/officers', newOfficer);
      alert('Officer account created successfully!');
      setNewOfficer({
        name: '',
        email: '',
        phone: '',
        department: 'Engineering Department',
        zone: 'East Zone',
        password: ''
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error registering officer.');
    } finally {
      setRegistering(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3'];

  // Markers mapping for density heatmap
  const heatmapMarkers = analytics?.heatmapPoints?.map(pt => ({
    lat: pt.lat,
    lng: pt.lng,
    popupText: pt.title,
    trackingId: pt.trackingId,
    status: pt.status
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Banner */}
      <div className="flex justify-between items-center border-b pb-4 mb-8">
        <div>
          <span className="text-[10px] text-primary-500 font-extrabold uppercase tracking-wide">GVMC Administrative Portal</span>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans mt-0.5">Super Admin Dashboard</h1>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors ${
              activeTab === 'analytics' ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Metrics</span>
          </button>
          <button
            onClick={() => setActiveTab('officers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors ${
              activeTab === 'officers' ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Officers</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Section: Core statistics numbers */}
          {activeTab === 'analytics' && analytics && (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[
                { label: "Total complaints", val: analytics.total, color: "text-blue-500" },
                { label: "Cases resolved", val: analytics.resolved, color: "text-emerald-500" },
                { label: "Pending queue", val: analytics.pending, color: "text-amber-500" },
                { label: "Resolution (Hrs)", val: analytics.averageResolutionTimeHours, color: "text-cyan-500" },
                { label: "Citizens", val: analytics.citizensCount, color: "text-indigo-500" },
                { label: "Officers", val: analytics.officersCount, color: "text-teal-500" }
              ].map((c, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800 text-center">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{c.label}</span>
                  <span className={`text-2xl font-black mt-1 block ${c.color}`}>{c.val}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content: Analytics graphs & Heatmap */}
          {activeTab === 'analytics' && analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Department Statistics Chart (Left Col) */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-855 dark:text-white uppercase flex items-center">
                  <Activity className="h-4.5 w-4.5 mr-2 text-primary-500" /> Department workload distribution
                </h3>
                <div className="h-80 w-full text-xxs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.deptStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0E93EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Zone Load Pie Chart (Right Col) */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl space-y-4 flex flex-col justify-between">
                <h3 className="text-sm font-bold text-slate-855 dark:text-white uppercase flex items-center">
                  <Activity className="h-4.5 w-4.5 mr-2 text-primary-500" /> Zone load metrics
                </h3>
                <div className="h-56 w-full text-xxs flex justify-center items-center">
                  {analytics.zoneStats.filter(z => z.value > 0).length === 0 ? (
                    <p className="text-slate-400 italic">No complaint reports mapped</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.zoneStats.filter(z => z.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {analytics.zoneStats.filter(z => z.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {/* Custom Legends list */}
                <div className="flex flex-wrap gap-2 justify-center py-2">
                  {analytics.zoneStats.filter(z => z.value > 0).map((z, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-slate-500 flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{z.name} ({z.value})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Density Map (Full Width) */}
              <div className="lg:col-span-12 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-855 dark:text-white uppercase flex items-center">
                  <Map className="h-4.5 w-4.5 mr-2 text-primary-500" /> Complaint Geographic Distribution Heatmap
                </h3>
                <div className="h-96 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/60 shadow-inner">
                  <MapComponent readOnly={true} markers={heatmapMarkers} />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Officers lists and registry panel */}
          {activeTab === 'officers' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Officers Directory */}
              <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-855 dark:text-white uppercase flex items-center">
                  <List className="h-4.5 w-4.5 mr-2 text-primary-500" /> Department Heads Directory ({officers.length})
                </h3>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left text-slate-650 dark:text-slate-350">
                    <thead className="bg-slate-50 dark:bg-slate-900 uppercase font-bold text-[9px] text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Officer Name</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Zone Region</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {officers.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-slate-800 dark:text-white">{o.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{o.email} &bull; {o.phone}</p>
                          </td>
                          <td className="px-4 py-3.5 truncate max-w-[150px] font-semibold">{o.department}</td>
                          <td className="px-4 py-3.5 font-semibold">{o.zone}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              o.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>{o.status}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => handleToggleOfficerStatus(o.id, o.status)}
                              className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center space-x-1 text-[10px] font-bold ml-auto ${
                                o.status === 'active'
                                  ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400'
                                  : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-900/40 dark:text-green-400'
                              }`}
                            >
                              {o.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                              <span>{o.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add New Officer Form */}
              <form onSubmit={handleRegisterOfficer} className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-855 dark:text-white uppercase flex items-center">
                  <UserPlus className="h-4.5 w-4.5 mr-2 text-primary-500" /> Add New Officer
                </h3>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase">Officer Name</label>
                  <input
                    type="text"
                    required
                    value={newOfficer.name}
                    onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                    placeholder="e.g. Dr. A. K. Rao"
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newOfficer.email}
                    onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                    placeholder="e.g. sanitation.gajuwaka@gvmc.gov.in"
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newOfficer.phone}
                    onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                    placeholder="e.g. 9440801010"
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase">Department</label>
                  <select
                    value={newOfficer.department}
                    onChange={(e) => setNewOfficer({ ...newOfficer, department: e.target.value })}
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2.5 text-xs text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase">Zone Region</label>
                  <select
                    value={newOfficer.zone}
                    onChange={(e) => setNewOfficer({ ...newOfficer, zone: e.target.value })}
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2.5 text-xs text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {GVMC_ZONES.map(z => (
                      <option key={z.name} value={z.name}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-400 uppercase">Account Password</label>
                  <input
                    type="password"
                    required
                    value={newOfficer.password}
                    onChange={(e) => setNewOfficer({ ...newOfficer, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl px-3.5 py-2.5 text-xs text-slate-855 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={registering}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5 btn-hover-effect"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{registering ? 'Creating...' : 'Register Officer'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
