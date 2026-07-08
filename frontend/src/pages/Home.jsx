import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Wrench, ShieldAlert, Zap, Droplet, Trees, Trash2, Shield, Calendar, Users, CheckCircle, Clock, FileText, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { TRANSLATIONS } from '../utils/translation';
import { DEPARTMENTS, DEPARTMENT_DESCRIPTIONS } from '../utils/departments';

const Home = ({ lang }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const [stats, setStats] = useState({
    total: 1240,
    resolved: 984,
    pending: 256,
    avgTime: "24.5 Hours"
  });

  // Map departments to Lucide icons
  const getDeptIcon = (dept) => {
    switch (dept) {
      case "Engineering Department":
        return <Wrench className="h-6 w-6 text-blue-500" />;
      case "Public Health & Sanitation Department":
        return <Trash2 className="h-6 w-6 text-green-500" />;
      case "Water Supply Department":
        return <Droplet className="h-6 w-6 text-cyan-500" />;
      case "Electrical Department":
        return <Zap className="h-6 w-6 text-amber-500" />;
      case "Parks & Horticulture Department":
        return <Trees className="h-6 w-6 text-emerald-500" />;
      case "Disaster Management":
        return <ShieldAlert className="h-6 w-6 text-red-500" />;
      default:
        return <Shield className="h-6 w-6 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/40 via-slate-950 to-slate-950 z-0" />
        
        {/* Animated grid lines pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] z-0 opacity-30" />

        <div className="relative max-w-5xl mx-auto z-10 text-center space-y-6">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-400 border border-primary-500/20">
            <span>✨</span>
            <span>Visakhapatnam Digital Grievance Portal</span>
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-sans bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            {t.heroTitle}
          </h1>
          <p className="text-lg sm:text-xl font-medium text-slate-300 max-w-2xl mx-auto">
            {t.heroSubtitle}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t.heroDesc}
          </p>

          <div className="pt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/report"
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-xl shadow-primary-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
            >
              <span>{t.reportBtn}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/track"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center"
            >
              {t.trackBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-10 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Complaints Logged", val: stats.total, icon: <Calendar className="h-5 w-5 text-blue-500" /> },
            { label: "Resolved Complaints", val: stats.resolved, icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
            { label: "Active Pending Cases", val: stats.pending, icon: <Users className="h-5 w-5 text-amber-500" /> },
            { label: "Avg Resolution Rate", val: stats.avgTime, icon: <Clock className="h-5 w-5 text-cyan-500" /> }
          ].map((s, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800 flex items-center space-x-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                {s.icon}
              </div>
              <div>
                <p className="text-xxs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{s.label}</p>
                <h4 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">{s.val}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-extrabold text-center text-slate-800 dark:text-white font-sans">{t.howItWorks}</h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mt-2 text-sm">Four simple steps to resolve civic matters without stepping out of your home.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
          {[
            { 
              step: "01", 
              title: "Report Issue", 
              desc: "Submit a complaint using text, your microphone voice, or media uploads.",
              icon: <FileText className="h-6 w-6 text-blue-500" />,
              bgClass: "from-blue-500/5 to-indigo-500/5 hover:border-blue-400 dark:hover:border-blue-900/50",
              numClass: "text-blue-500/10 dark:text-blue-500/5",
              ringColor: "ring-blue-100 dark:ring-blue-950/40"
            },
            { 
              step: "02", 
              title: "AI Analysis", 
              desc: "Gemini AI analyzes the complaint text, translating Telugu/Hindi, and mapping departments.",
              icon: <Sparkles className="h-6 w-6 text-purple-500 animate-pulse" />,
              bgClass: "from-purple-500/5 to-pink-500/5 hover:border-purple-400 dark:hover:border-purple-900/50",
              numClass: "text-purple-500/10 dark:text-purple-500/5",
              ringColor: "ring-purple-100 dark:ring-purple-950/40"
            },
            { 
              step: "03", 
              title: "GPS Zone Routing", 
              desc: "Grievance is mapped to the nearest GVMC Zone coordinates and routed to the department officer.",
              icon: <MapPin className="h-6 w-6 text-teal-500" />,
              bgClass: "from-teal-500/5 to-emerald-500/5 hover:border-teal-400 dark:hover:border-teal-900/50",
              numClass: "text-teal-500/10 dark:text-teal-500/5",
              ringColor: "ring-teal-100 dark:ring-teal-950/40"
            },
            { 
              step: "04", 
              title: "Swift Resolution", 
              desc: "Simulated officer resolves the case, uploading proof photographs as verification.",
              icon: <CheckCircle2 className="h-6 w-6 text-green-500" />,
              bgClass: "from-green-500/5 to-emerald-500/5 hover:border-green-400 dark:hover:border-green-900/50",
              numClass: "text-green-500/10 dark:text-green-500/5",
              ringColor: "ring-green-100 dark:ring-green-950/40"
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`relative p-6 bg-gradient-to-br ${item.bgClass} backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between h-60 group`}
            >
              {/* Number overlay */}
              <div className={`absolute top-4 right-6 text-6xl font-black ${item.numClass} select-none transition-transform duration-300 group-hover:scale-110`}>
                {item.step}
              </div>

              {/* Icon Container */}
              <div className={`w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-md ring-4 ${item.ringColor} transition-transform duration-300 group-hover:rotate-6`}>
                {item.icon}
              </div>

              <div className="mt-8 space-y-1">
                <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">{item.title}</h3>
                <p className="text-xxs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Departments Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200/50 dark:border-slate-800/50">
        <h2 className="text-3xl font-extrabold text-center text-slate-800 dark:text-white font-sans">Municipal Departments</h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mt-2 text-sm">Learn about the 14 GVMC departments dedicated to keeping Visakhapatnam smart and sustainable.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {DEPARTMENTS.slice(0, 6).map((dept, i) => (
            <div key={i} className="p-6 glass-card rounded-2xl border border-slate-200/40 dark:border-slate-800/60 hover:shadow-2xl transition-all duration-300 flex items-start space-x-4">
              <div className="p-3 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl shrink-0">
                {getDeptIcon(dept)}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{dept}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{DEPARTMENT_DESCRIPTIONS[dept]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
