const express = require('express');
const router = express.Router();
const { genAI, useMockAI, mockClassify, departments } = require('../config/gemini');

// @route   POST /api/ai/classify
// @desc    Analyze, translate, and classify grievance content
// @access  Public (or Citizen)
router.post('/classify', async (req, res) => {
  const { text, language } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'No text provided for analysis.' });
  }

  const userLang = language || 'English';

  // 1. Fallback Rule-Based Engine
  if (useMockAI()) {
    const classification = mockClassify(text);
    return res.json({
      translatedText: text, // in mock we just return same
      ...classification
    });
  }

  // 2. Gemini Live AI Engine
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are CivicMind AI, the official grievance classifier for Greater Visakhapatnam Municipal Corporation (GVMC).
      Analyze the citizen complaint listed below:
      "${text}"
      
      The citizen marked the complaint language as: "${userLang}".
      If the complaint is in Telugu or Hindi, translate it to English first.
      
      Determine:
      1. Category: A specific 2-3 word category (e.g. "Road Pothole", "Water Contamination", "Garbage Dump").
      2. Department: Assign the complaint to exactly ONE of the following valid GVMC departments:
         ${JSON.stringify(departments)}
      3. Priority: "Low", "Medium", or "High".
      4. Severity: "Minor", "Moderate", "Major", or "Critical".
      5. Keywords: 3-5 relevant search keywords.
      
      Return a JSON object matching this structure EXACTLY:
      {
        "translatedText": "English translation here",
        "category": "Category",
        "department": "Department Name",
        "priority": "Priority",
        "severity": "Severity",
        "keywords": ["key1", "key2", "key3"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    
    const classification = JSON.parse(jsonText);
    
    // Validate department
    if (!departments.includes(classification.department)) {
      // Find closest or set default
      classification.department = departments.find(d => 
        d.toLowerCase().includes(classification.department.toLowerCase())
      ) || "Information Technology Department";
    }

    res.json(classification);
  } catch (err) {
    console.error('Gemini Classification failed, falling back:', err);
    // Silent fallback to mock
    const fallbackClass = mockClassify(text);
    res.json({
      translatedText: text,
      ...fallbackClass,
      aiError: true
    });
  }
});

// @route   POST /api/ai/chat
// @desc    Interact with the CivicMind virtual assistant
// @access  Public
router.post('/chat', async (req, res) => {
  const { message, history, language } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'No message provided.' });
  }

  const userLang = language || 'English';

  // 1. Mock Chat Engine Fallback
  if (useMockAI()) {
    const msg = message.toLowerCase();
    let reply = "";

    if (userLang === 'Telugu' || userLang === 'తెలుగు') {
      if (msg.includes('నమస్కారం') || msg.includes('హలో') || msg.includes('hello')) {
        reply = "నమస్కారం! నేను జీవీఎంసీ సివిక్‌మైండ్ AI సహాయకుడిని. మీకు ఈరోజు నేను ఎలా సహాయపడగలను? రోడ్డు గుంతలు, తాగునీటి సరఫరా, విద్యుత్ దీపాల వంటి ఫిర్యాదులను మీరు ఇక్కడ నమోదు చేయవచ్చు.";
      } else if (msg.includes('ఫిర్యాదు') || msg.includes('నమోదు')) {
        reply = "ఫిర్యాదు చేయడానికి, పైన ఉన్న 'Report Complaint' బటన్‌ను క్లిక్ చేసి, మీ సమస్యను రాయండి లేదా మైక్రోఫోన్ ఉపయోగించి మాట్లాడండి. మా AI ఆటోమేటిక్‌గా మీ జోన్‌ను గుర్తించి సరైన విభాగానికి పంపుతుంది.";
      } else if (msg.includes('స్టేటస్') || msg.includes('ట్రాక్') || msg.includes('status')) {
        reply = "మీ ఫిర్యాదు స్థితిని తనిఖీ చేయడానికి, 'Track Complaint' పేజీకి వెళ్లి మీ ట్రాకింగ్ నంబర్ (ఉదా: GVMC-2026-000101) నమోదు చేయండి.";
      } else {
        reply = "సమాచారం ఇచ్చినందుకు ధన్యవాదాలు. జీవీఎంసీ అధికారులు మీ ఫిర్యాదులను పరిష్కరించడానికి సిద్ధంగా ఉన్నారు. దయచేసి 'Report Complaint' ద్వారా మీ సమస్యను తెలియజేయండి.";
      }
    } else if (userLang === 'Hindi' || userLang === 'हिन्दी') {
      if (msg.includes('नमस्ते') || msg.includes('हेलो') || msg.includes('hello')) {
        reply = "नमस्ते! मैं जीवीएमसी सिविकमाइंड एआई सहायक हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ? आप यहाँ सड़क, पानी, कचरा और स्ट्रीट लाइट जैसी शिकायतों को दर्ज कर सकते हैं।";
      } else if (msg.includes('शिकायत') || msg.includes('दर्ज')) {
        reply = "शिकायत दर्ज करने के लिए, ऊपर दिए गए 'Report Complaint' बटन पर जाएं, अपनी समस्या लिखें या बोलें। हमारी प्रणाली स्वचालित रूप से विभाग का चयन करेगी।";
      } else if (msg.includes('स्थिति') || msg.includes('ट्रैक') || msg.includes('status')) {
        reply = "अपनी शिकायत की स्थिति जानने के लिए, 'Track Complaint' पेज पर जाएँ और अपनी ट्रैकिंग आईडी दर्ज करें।";
      } else {
        reply = "जानकारी के लिए धन्यवाद। जीवीएमसी आपकी शिकायतों के त्वरित समाधान के लिए प्रतिबद्ध है। कृपया अपनी समस्या शिकायत फॉर्म के माध्यम से दर्ज करें।";
      }
    } else {
      // English Mock Replies
      if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
        reply = "Hello! I am the GVMC CivicMind AI Assistant. I can help you report civic issues (like potholes, drainage blockages, water leakage, or street lights), track complaint status, and understand GVMC zones and departments. How can I help you today?";
      } else if (msg.includes('report') || msg.includes('file') || msg.includes('complain')) {
        reply = "To report a complaint, click on 'Report Complaint' in the navbar. You can type, speak using your microphone, or upload pictures/videos. The system will auto-detect your location and route the complaint to the correct officer.";
      } else if (msg.includes('track') || msg.includes('status')) {
        reply = "To track an existing complaint, click on 'Track Complaint' and enter your tracking ID (e.g. GVMC-2026-000145). It will show you an animated timeline and the assigned officer's details.";
      } else if (msg.includes('department') || msg.includes('office')) {
        reply = "GVMC has 14 departments including Engineering (roads/drains), Public Health (garbage), Water Supply (leaks), Electrical (streetlights), and Disaster Management (floods). I can auto-assign your complaint to the correct department when you submit!";
      } else if (msg.includes('contact') || msg.includes('phone') || msg.includes('emergency')) {
        reply = "You can contact GVMC Head Office at Tenneti Bhavanam, Asilmetta Junction, Visakhapatnam. Emergency numbers: Toll-Free Grievance 1800-425-00009, Control Room 0891-2568585.";
      } else {
        reply = "Thank you for reaching out to GVMC CivicMind support. I can assist you with filing grievances, tracking status, or explaining municipal services. Please let me know how you'd like to proceed.";
      }
    }

    return res.json({ reply });
  }

  // 2. Gemini Live Chat Engine
  try {
    // Map history to Google Generative AI formats
    const contents = [];
    if (history && history.length) {
      history.forEach(h => {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.message }]
        });
      });
    }

    // Push current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const systemInstruction = `
      You are CivicMind AI, the official virtual assistant for Greater Visakhapatnam Municipal Corporation (GVMC), Visakhapatnam.
      Your primary role is to assist citizens with reporting grievances (roads, water, garbage, lighting, unauthorized constructions), tracking their grievance status, and providing information about GVMC departments, contact numbers, and zones.
      
      Respond in the language chosen by the user: "${userLang}".
      If the user speaks in Telugu (తెలుగు), respond in Telugu.
      If the user speaks in Hindi (हिन्दी), respond in Hindi.
      Otherwise, respond in English.
      
      Keep your answers helpful, polite, concise, and professional. Encourage citizens to use the 'Report Complaint' page if they have a specific municipal issue. Refer them to the toll-free number 1800-425-00009 for severe emergencies.
    `;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction
    });

    const chat = model.startChat({
      history: contents.slice(0, -1) // pass historical turns
    });

    const result = await chat.sendMessage(message);
    const replyText = result.response.text();

    res.json({ reply: replyText });
  } catch (err) {
    console.error('Gemini Chat failed, falling back:', err);
    res.status(500).json({ message: 'Failed to connect to AI server. Please try again later.' });
  }
});

module.exports = router;
