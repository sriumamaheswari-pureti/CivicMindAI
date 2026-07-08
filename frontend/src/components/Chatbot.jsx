import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, User, HelpCircle, Mic, MicOff, Sparkles, FileText } from 'lucide-react';
import API from '../utils/api';

const Chatbot = ({ lang }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  const chatEndRef = useRef(null);

  // Initialize Speech Recognition for Chatbot
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;

      // Match locale code dynamically based on selected language
      if (lang === 'Telugu' || lang === 'తెలుగు') {
        rec.lang = 'te-IN';
      } else if (lang === 'Hindi' || lang === 'हिन्दी') {
        rec.lang = 'hi-IN';
      } else {
        rec.lang = 'en-IN';
      }

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = (e) => {
        console.error('STT Error in Chatbot:', e.error);
        setIsListening(false);
      };
      rec.onresult = (e) => {
        const spokenText = e.results[0][0].transcript;
        setInput(prev => prev ? `${prev} ${spokenText}` : spokenText);
      };

      setRecognition(rec);
    }
  }, [lang]);

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getWelcomeMessage = () => {
    if (lang === 'Telugu' || lang === 'తెలుగు') {
      return "నమస్కారం! నేను జీవీఎంసీ సివిక్‌మైండ్ AI సహాయకుడిని. నేను మీకు ఎలా సహాయం చేయగలను? మీరు తెలుగు, హిందీ లేదా ఇంగ్లీషులో నాతో మాట్లాడవచ్చు.";
    }
    if (lang === 'Hindi' || lang === 'हिन्दी') {
      return "नमस्ते! मैं जीवीएमसी सिविकमाइंड एआई सहायक हूँ। मैं आपकी क्या मदद कर सकता हूँ? आप मुझसे हिंदी, तेलुगु या अंग्रेजी में बातचीत कर सकते हैं।";
    }
    return "Hello! I am your GVMC CivicMind AI assistant. I can guide you on filing complaints, suggest departments, track statuses, and answer city-related questions. How can I help you today?";
  };

  useEffect(() => {
    setMessages([
      { sender: 'bot', message: getWelcomeMessage(), timestamp: new Date() }
    ]);
  }, [lang]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');

    // Append user message
    const userMsg = { sender: 'user', message: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // 1. Get reply from chatbot API
      const history = messages.slice(-5).map(m => ({
        sender: m.sender,
        message: m.message
      }));

      const res = await API.post('/ai/chat', {
        message: text,
        history,
        language: lang
      });

      const chatbotReply = res.data.reply;

      // 2. Proactive AI: Analyze text for complaints to offer the Autofill integration shortcut
      let classificationData = null;
      const lowerText = text.toLowerCase();
      
      const containsComplaintKeywords = [
        'pothole', 'road', 'garbage', 'waste', 'water', 'leak', 'drain',
        'light', 'lamp', 'wire', 'illegal', 'construction', 'tree', 'flood',
        'గుంతలు', 'రోడ్డు', 'నీరు', 'చెత్త', 'విద్యుత్', 'వరద',
        'सड़क', 'गड्ढा', 'पानी', 'कचरा', 'बिजली'
      ].some(k => lowerText.includes(k));

      if (containsComplaintKeywords && text.split(' ').length >= 3) {
        try {
          const classRes = await API.post('/ai/classify', {
            text,
            language: lang
          });
          classificationData = classRes.data;
        } catch (e) {
          console.error("Silent classification fail inside chatbot:", e);
        }
      }

      setMessages(prev => [
        ...prev, 
        {
          sender: 'bot',
          message: chatbotReply,
          timestamp: new Date(),
          // Embed classification details and action button if detected
          ...(classificationData && {
            suggestion: {
              department: classificationData.department,
              category: classificationData.category,
              title: classificationData.category || "Reported Issue",
              desc: text
            }
          })
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'bot',
        message: "Sorry, I am having trouble connecting to the GVMC servers. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillForm = (sugg) => {
    setIsOpen(false); // Close chatbot panel
    // Redirect to report complaint route with query params
    const query = `?title=${encodeURIComponent(sugg.title)}&desc=${encodeURIComponent(sugg.desc)}&dept=${encodeURIComponent(sugg.department)}`;
    navigate(`/report${query}`);
  };

  const quickQuestions = [
    { label: "📍 GVMC Address", query: "Where is the GVMC Head Office located?" },
    { label: "📝 How to report?", query: "How do I report a civic issue on this website?" },
    { label: "🔍 Track complaint", query: "Where do I track my reported complaints?" },
    { label: "🚨 Emergency Nos", query: "List GVMC emergency helpline numbers." }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full bg-gradient-to-tr from-primary-600 to-teal-500 hover:from-primary-700 hover:to-teal-600 text-white shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center border border-white/10"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
          </span>
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="w-[380px] h-[550px] glass-card rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-gov-blue to-primary-700 p-4 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5 text-teal-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">CivicMind AI Assistant</h3>
                <p className="text-[10px] text-teal-300 font-semibold uppercase tracking-wider">Multilingual Live Helper</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/40">
            {messages.map((m, idx) => (
              <div key={idx} className="space-y-2">
                <div className={`flex items-start space-x-2.5 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${
                    m.sender === 'user' ? 'bg-primary-500' : 'bg-gov-blue dark:bg-slate-700'
                  }`}>
                    {m.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  
                  <div className={`p-3 rounded-2xl max-w-[78%] text-xs shadow-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700/50'
                  }`}>
                    <p className="whitespace-pre-line">{m.message}</p>
                  </div>
                </div>

                {/* Dynamic autofill suggestion panel if complaint was auto-detected */}
                {m.suggestion && (
                  <div className="ml-9 p-3 bg-gradient-to-r from-teal-500/10 to-primary-500/10 rounded-2xl border border-teal-500/20 dark:border-teal-500/30 text-xs space-y-2.5 max-w-[78%] animate-in fade-in slide-in-from-left-2 duration-300">
                    <p className="font-bold text-slate-700 dark:text-slate-250 flex items-center">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5 text-teal-500 animate-pulse" />
                      Auto-detected Grievance!
                    </p>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      <p><strong>Department:</strong> {m.suggestion.department}</p>
                      <p><strong>Category:</strong> {m.suggestion.category}</p>
                    </div>
                    <button
                      onClick={() => handleAutofillForm(m.suggestion)}
                      className="w-full py-2 bg-gradient-to-r from-teal-500 to-primary-600 hover:from-teal-600 hover:to-primary-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-sm transform active:scale-95 transition-all text-[11px]"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Autofill Complaint Form</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
            
            {/* Animated Typing Indicator */}
            {loading && (
              <div className="flex items-start space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-gov-blue flex items-center justify-center text-white shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700/50 flex space-x-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-duration:1s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions Suggestions */}
          {messages.length === 1 && (
            <div className="p-3 border-t border-slate-150 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center">
                <HelpCircle className="h-3.5 w-3.5 mr-1" /> Quick Guidance Queries
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q.query)}
                    className="text-[10px] px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-xxs font-medium"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form with Voice Button */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-2"
          >
            {/* Microphone Button inside input bar */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2 rounded-xl flex items-center justify-center border transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse border-red-600 shadow shadow-red-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-none dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
              }`}
              title={isListening ? "Stop listening" : "Speak your message"}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening... Speak now" : "Type a message or click mic..."}
              disabled={isListening}
              className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-white"
            />
            
            <button
              type="submit"
              disabled={isListening}
              className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-md disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
