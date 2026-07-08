import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MapPin, Navigation, Sparkles, Image, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translation';
import { DEPARTMENTS, DEPARTMENT_CATEGORIES } from '../utils/departments';
import { detectZone } from '../utils/zoneDetector';
import MapComponent from '../components/MapComponent';
import VoiceInput from '../components/VoiceInput';
import API from '../utils/api';

const ReportComplaint = ({ lang, user, setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;

  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Map & Location state
  const [latitude, setLatitude] = useState(17.7200);
  const [longitude, setLongitude] = useState(83.3150);
  const [detectedAddress, setDetectedAddress] = useState('');
  const [detectedZoneName, setDetectedZoneName] = useState('East Zone');

  // AI Classification Preview
  const [aiPreview, setAiPreview] = useState(null);

  // Media upload files
  const [mediaFiles, setMediaFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      title: '',
      description: '',
      department: 'Engineering Department',
      category: 'Road Damage / Potholes',
      priority: 'Medium',
      landmarkAddress: ''
    }
  });

  const watchDescription = watch('description');
  const watchDepartment = watch('department');

  // Update categories list when department changes manually
  const categoriesList = DEPARTMENT_CATEGORIES[watchDepartment] || [];

  // GPS geolocation detector
  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Run client-side zone detection immediately
        const matchedZone = detectZone(lat, lng);
        setDetectedZoneName(matchedZone.name);
        setDetectedAddress(`Located near GPS Coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      },
      (error) => {
        console.error("Geolocation error:", error);
        // Fallback standard Visakhapatnam coordinates
        setLatitude(17.7200);
        setLongitude(83.3150);
      },
      { enableHighAccuracy: true }
    );
  };

  // Called when dragging marker on Leaflet Map
  const handleMapMarkerMove = (newLat, newLng) => {
    setLatitude(newLat);
    setLongitude(newLng);
    const matchedZone = detectZone(newLat, newLng);
    setDetectedZoneName(matchedZone.name);
    setDetectedAddress(`Custom Location (${newLat.toFixed(5)}, ${newLng.toFixed(5)})`);
  };

  // Auto GPS trigger and autofill parameters on mount
  useEffect(() => {
    handleAutoLocate();
    
    // Parse query params to autofill from chatbot
    const titleParam = searchParams.get('title');
    const descParam = searchParams.get('desc');
    const deptParam = searchParams.get('dept');

    if (titleParam) setValue('title', titleParam);
    if (descParam) setValue('description', descParam);
    if (deptParam) {
      setValue('department', deptParam);
      // Wait minor frame to populate category
      setTimeout(() => {
        const list = DEPARTMENT_CATEGORIES[deptParam] || [];
        setValue('category', list[0] || 'General Civic Issue');
      }, 100);
    }
  }, [searchParams, setValue]);

  // Handle Speech-to-Text translation input
  const handleVoiceTranscript = (text) => {
    const currentDesc = watchDescription || '';
    setValue('description', currentDesc ? `${currentDesc} ${text}` : text);
  };

  // Run Gemini classification
  const handleAIAnalyze = async () => {
    const desc = watchDescription;
    if (!desc || desc.length < 10) {
      alert("Please provide a more descriptive complaint (at least 10 characters) for the AI to classify.");
      return;
    }

    setAiAnalyzing(true);
    try {
      const res = await API.post('/ai/classify', {
        text: desc,
        language: lang
      });

      const { category, department, priority, severity, keywords } = res.data;

      // Auto fill form fields matching AI response
      setValue('department', department);
      // Wait minor frame for React-hook-form to register category mapping
      setTimeout(() => {
        // Map category if match exists in sublist, else set default
        const list = DEPARTMENT_CATEGORIES[department] || [];
        const matchedCategory = list.find(c => c.toLowerCase().includes(category.toLowerCase())) || list[0];
        setValue('category', matchedCategory);
        setValue('priority', priority);
      }, 100);

      setAiPreview({
        category,
        department,
        priority,
        severity,
        keywords
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Handles multiple media file selections (photos, audio, videos)
  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);

    const previews = files.map(file => {
      if (file.type.startsWith('image/')) {
        return { type: 'image', url: URL.createObjectURL(file) };
      } else if (file.type.startsWith('video/')) {
        return { type: 'video', url: URL.createObjectURL(file) };
      } else {
        return { type: 'audio', name: file.name };
      }
    });
    setFilePreviews(previews);
  };

  // Submit form data
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('department', data.department);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('address', data.landmarkAddress || detectedAddress || 'Visakhapatnam');
      formData.append('priority', data.priority);
      formData.append('citizenName', data.fullName);
      formData.append('citizenPhone', data.phone);

      // Append media files
      mediaFiles.forEach(file => {
        formData.append('media', file);
      });

      const res = await API.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Save details to localStorage and update session to reflect custom name
      localStorage.setItem('citizenName', data.fullName);
      localStorage.setItem('citizenPhone', data.phone);
      if (setUser) {
        setUser(prev => ({
          ...prev,
          name: data.fullName,
          phone: data.phone
        }));
      }

      alert(`Grievance submitted successfully! Tracking ID: ${res.data.trackingId}`);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error submitting complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans">{t.navReport}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Fill out the form below. Use GPS auto-locate and speak through your microphone to file reports in English, Telugu, or Hindi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl p-6 sm:p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-xl space-y-6">
          <h3 className="text-md font-bold text-slate-800 dark:text-white border-b pb-3 mb-2 flex items-center">
            <span className="mr-2">📋</span> Grievance Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.fullName}</label>
              <input
                type="text"
                placeholder="Type your full name"
                {...register('fullName', { required: true })}
                className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 focus:ring-1 focus:ring-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.phone}</label>
              <input
                type="text"
                placeholder="Type your phone number"
                {...register('phone', { required: true })}
                className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 focus:ring-1 focus:ring-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Complaint Title */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.complaintTitle} *</label>
            <input
              type="text"
              placeholder="e.g. Broken pothole at MVP Colony Road"
              {...register('title', { required: true })}
              className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 focus:ring-1 focus:ring-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white"
            />
            {errors.title && <span className="text-red-500 text-xxs font-bold mt-1 block">Title is required.</span>}
          </div>

          {/* Complaint Description with voice input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.complaintDesc} *</label>
              <VoiceInput onTranscript={handleVoiceTranscript} lang={lang} />
            </div>
            <textarea
              rows="4"
              placeholder="Provide a detailed description of the issue. You can speak into your microphone to type automatically."
              {...register('description', { required: true, minLength: 10 })}
              className="block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 focus:ring-1 focus:ring-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white"
            />
            {errors.description && <span className="text-red-500 text-xxs font-bold mt-1 block">Description of at least 10 characters is required.</span>}

            {/* AI Classification trigger button */}
            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Let Gemini automatically route your department & category.</span>
              <button
                type="button"
                onClick={handleAIAnalyze}
                disabled={aiAnalyzing}
                className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-primary-600 hover:from-teal-600 hover:to-primary-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-primary-500/10 btn-hover-effect disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{aiAnalyzing ? 'Analyzing Complaint...' : 'AI Auto-Fill'}</span>
              </button>
            </div>
          </div>

          {/* AI Category / Department Mapping Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Department</label>
              <select
                {...register('department')}
                className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Category</label>
              <select
                {...register('category')}
                className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                {categoriesList.length > 0 ? (
                  categoriesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))
                ) : (
                  <option value="General Issue">General Civic Issue</option>
                )}
              </select>
            </div>
          </div>

          {/* Location inputs / address */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.landmarkAddress}</label>
            <input
              type="text"
              placeholder="e.g. Opposite Sai Baba Temple, Sector-4"
              {...register('landmarkAddress')}
              className="mt-1 block w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-750 focus:ring-1 focus:ring-primary-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.priority}</label>
            <div className="flex space-x-4 mt-2">
              {['Low', 'Medium', 'High'].map(p => (
                <label key={p} className="flex items-center space-x-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    value={p}
                    {...register('priority')}
                    className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                  />
                  <span>{p === 'Low' ? t.low : p === 'Medium' ? t.medium : t.high}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Media Attachments */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.mediaUpload}</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Image className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xxs text-slate-500 dark:text-slate-400 font-semibold">Click to upload photos, audio, or video files</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports images, MP4, MP3, WebM (Max 50MB)</p>
                </div>
                <input type="file" multiple onChange={handleMediaChange} className="hidden" accept="image/*,video/*,audio/*" />
              </label>
            </div>

            {/* Media previews */}
            {filePreviews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {filePreviews.map((p, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 flex items-center justify-center">
                    {p.type === 'image' && <img src={p.url} alt="Preview" className="w-full h-full object-cover" />}
                    {p.type === 'video' && <video src={p.url} className="w-full h-full object-cover" />}
                    {p.type === 'audio' && <div className="text-[10px] text-center text-slate-500 p-1 truncate leading-tight font-semibold">🎵<br />Audio</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-xl shadow-primary-600/10 transition-colors btn-hover-effect disabled:opacity-50 flex items-center justify-center"
          >
            <span>{loading ? t.submitting : t.submitComplaint}</span>
          </button>
        </form>

        {/* Map & Live Routing Sidebar Container */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Assist Sidebar */}
          {aiPreview && (
            <div className="bg-gradient-to-tr from-slate-900 to-primary-950 text-white p-5 rounded-2xl border border-primary-500/20 shadow-2xl space-y-3 animate-in slide-in-from-right-5 duration-300">
              <h4 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center">
                <Sparkles className="h-4.5 w-4.5 mr-2 animate-pulse" /> Gemini AI Classification
              </h4>
              <div className="text-xs space-y-2 text-slate-200">
                <p><strong>{t.aiSelectDept}:</strong> <span className="text-white font-semibold">{aiPreview.department}</span></p>
                <p><strong>Predicted Category:</strong> <span className="text-white font-semibold">{aiPreview.category}</span></p>
                <p><strong>Auto Priority:</strong> <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  aiPreview.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>{aiPreview.priority}</span></p>
                <p><strong>Severity Assessment:</strong> <span className="text-white font-semibold">{aiPreview.severity}</span></p>
                <div className="pt-2">
                  <p className="font-semibold text-slate-400 text-[10px] uppercase">Extracted Keywords:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aiPreview.keywords.map((k, i) => (
                      <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">{k}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Maps Geolocation card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 mb-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary-500" /> Location Mapping
              </h4>
              <button
                type="button"
                onClick={handleAutoLocate}
                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-200 rounded-xl flex items-center text-xs space-x-1.5 border border-slate-200 dark:border-slate-800"
                title="Locate via device GPS"
              >
                <Navigation className="h-3.5 w-3.5 text-primary-500" />
                <span className="font-bold">Locate Me</span>
              </button>
            </div>

            {/* Coordinates / Nearest Zone Info */}
            <div className="grid grid-cols-2 gap-2 text-xxs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200/30 dark:border-slate-850">
              <div>
                <p className="uppercase text-slate-400">Detected GVMC Zone</p>
                <p className="text-xs text-slate-800 dark:text-white font-extrabold mt-0.5">{detectedZoneName}</p>
              </div>
              <div>
                <p className="uppercase text-slate-400">GPS Coordinates</p>
                <p className="text-xs text-slate-800 dark:text-white font-extrabold mt-0.5">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
              </div>
            </div>

            {/* The interactive Leaflet Map Component */}
            <div className="h-72 w-full rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-750">
              <MapComponent lat={latitude} lng={longitude} setPosition={handleMapMarkerMove} />
            </div>

            <p className="text-[10px] text-slate-400 italic">
              ℹ️ Drag the blue pinpoint marker on the map to manually fine-tune the exact complaint spot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportComplaint;
