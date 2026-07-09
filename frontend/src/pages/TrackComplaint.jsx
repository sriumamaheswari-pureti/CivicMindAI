import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, User, Shield, CheckCircle, FileText, Play, Image as ImageIcon } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translation';
import API, { getMediaUrl } from '../utils/api';

const TrackComplaint = ({ lang }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('id') || '';

  const [query, setQuery] = useState(initialQuery);
  const [complaint, setComplaint] = useState(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);
    setComplaint(null);

    try {
      const res = await API.get(`/complaints/tracking/${query.trim()}`);
      setComplaint(res.data);
      setSearchParams({ id: query.trim() });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Complaint not found. Please verify the Tracking ID.');
    } finally {
      setLoading(false);
    }
  };

  // Run search on mount if ID is in URL
  React.useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [initialQuery]);

  // List of standard statuses to display in the resolution lifecycle
  const STATUSES = ['Submitted', 'Received', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

  // Check the highest active status reached
  const getStatusIndex = (currentStatus) => STATUSES.indexOf(currentStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans">{t.navTrack}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enter your unique GVMC Tracking ID (e.g., GVMC-2026-XXXXXX) to monitor real-time department routing, progress logs, and status updates.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mb-10 bg-white dark:bg-slate-850 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-850 shadow-md">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.trackingIdPlaceholder}
          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-xs px-4 text-slate-800 dark:text-white"
        />
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-all flex items-center space-x-1 shadow-md"
        >
          <Search className="h-4 w-4" />
          <span>{t.search}</span>
        </button>
      </form>

      {/* Loader */}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error details */}
      {error && !loading && (
        <div className="glass-card rounded-2xl border-red-200/30 p-6 text-center max-w-xl mx-auto space-y-2">
          <p className="text-red-500 font-bold text-sm">⚠️ {error}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Double check spelling. Example ID format: GVMC-2026-987456</p>
        </div>
      )}

      {/* Complaint Lifecycle Presentation */}
      {complaint && !loading && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Main Info Card */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-2 gap-2">
              <div>
                <span className="text-xxs font-bold uppercase tracking-wider text-slate-400">Tracking Number</span>
                <h2 className="text-lg sm:text-xl font-extrabold text-primary-600 dark:text-primary-400">{complaint.trackingId}</h2>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                complaint.status === 'Closed' ? 'bg-green-100 text-green-800' :
                complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 animate-pulse' :
                complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                'bg-amber-100 text-amber-800'
              }`}>{complaint.status}</span>
            </div>

            {/* Core details */}
            <div className="space-y-3">
              <h3 className="text-md sm:text-lg font-bold text-slate-800 dark:text-white leading-snug">{complaint.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">{complaint.description}</p>
            </div>

            {/* Details mapping metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xxs font-bold text-slate-400 uppercase pt-2">
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span>Category</span>
                <p className="text-xs text-slate-800 dark:text-white font-extrabold mt-0.5">{complaint.category}</p>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span>{t.department}</span>
                <p className="text-xs text-slate-800 dark:text-white font-extrabold mt-0.5 truncate">{complaint.department}</p>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span>GVMC Zone</span>
                <p className="text-xs text-slate-800 dark:text-white font-extrabold mt-0.5">{complaint.zone}</p>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <span>Priority</span>
                <p className="text-xs text-slate-800 dark:text-white font-extrabold mt-0.5">{complaint.priority}</p>
              </div>
            </div>

            {/* Officer & address details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="space-y-2">
                <p className="flex items-center space-x-2"><User className="h-4 w-4 text-primary-500" /> <span><strong>Citizen Name:</strong> {complaint.citizenName || 'Visakhapatnam Resident'}</span></p>
                <p className="flex items-center space-x-2"><Shield className="h-4 w-4 text-primary-500" /> <span><strong>{t.assignedOfficer}:</strong> {complaint.officerName || 'Reviewing Officers'}</span></p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center space-x-2"><MapPin className="h-4 w-4 text-primary-500 shrink-0" /> <span className="truncate"><strong>Location Address:</strong> {complaint.location?.address}</span></p>
                <p className="flex items-center space-x-2"><Calendar className="h-4 w-4 text-primary-500" /> <span><strong>Logged Date:</strong> {new Date(complaint.createdAt).toLocaleDateString()}</span></p>
              </div>
            </div>

            {/* Citizen media uploads */}
            {complaint.mediaUrls && complaint.mediaUrls.length > 0 && (
              <div className="border-t pt-6">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-1 text-slate-500" /> Files Submitted by Citizen
                </h4>
                <div className="flex flex-wrap gap-3">
                  {complaint.mediaUrls.map((url, idx) => {
                    const ext = url.split('.').pop().toLowerCase();
                    const isImg = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
                    const isVid = ['mp4', 'mov', 'webm', 'avi'].includes(ext);
                    
                    return (
                      <a
                        key={idx}
                        href={getMediaUrl(url)}
                        target="_blank"
                        rel="noreferrer"
                        className="relative w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 flex items-center justify-center hover:opacity-80 transition-opacity"
                      >
                        {isImg && <img src={getMediaUrl(url)} alt="Grievance file" className="w-full h-full object-cover" />}
                        {isVid && (
                          <div className="relative w-full h-full">
                            <video src={getMediaUrl(url)} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        {!isImg && !isVid && (
                          <div className="text-[10px] text-center text-slate-500 p-1 font-bold truncate">🔊<br />Voice clip</div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Officer progress photos */}
            {complaint.progressPhotos && complaint.progressPhotos.length > 0 && (
              <div className="border-t pt-6 bg-green-50/20 dark:bg-green-950/5 p-4 rounded-xl border border-green-100/50 dark:border-green-950/20">
                <h4 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase mb-3 flex items-center">
                  <ImageIcon className="h-4 w-4 mr-1.5" /> Resolution Proof Photos
                </h4>
                <div className="flex flex-wrap gap-3">
                  {complaint.progressPhotos.map((url, idx) => (
                    <a
                      key={idx}
                      href={getMediaUrl(url)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-24 h-24 rounded-xl border border-green-200 dark:border-green-900/50 overflow-hidden shadow"
                    >
                      <img src={getMediaUrl(url)} alt="Proof" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Animated Timeline Section */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl space-y-6">
            <h3 className="text-md font-bold text-slate-800 dark:text-white border-b pb-3 mb-2 flex items-center">
              <span className="mr-2">⌛</span> {t.statusTimeline}
            </h3>

            {/* Vertical Timeline Node Array */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
              {STATUSES.map((status, idx) => {
                const currentIdx = getStatusIndex(complaint.status);
                const isCompleted = idx <= currentIdx;
                const isActive = idx === currentIdx;

                // Find corresponding timeline remarks matching this status
                const details = complaint.timeline?.find(item => item.status === status);

                return (
                  <div key={status} className={`relative flex items-start space-x-4 ${isCompleted ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                    {/* Circle icon */}
                    <div className={`absolute left-[-21px] w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 z-10 ${
                      isActive ? 'bg-primary-600 text-white animate-pulse' :
                      isCompleted ? 'bg-green-500 text-white' :
                      'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />}
                    </div>

                    <div className="space-y-1 pl-2">
                      <h4 className={`text-xs font-bold ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`}>{status}</h4>
                      {details ? (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal space-y-0.5">
                          <p className="italic">"{details.remarks}"</p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            Updated by {details.updatedBy} &bull; {new Date(details.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Pending resolution workflow</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackComplaint;
