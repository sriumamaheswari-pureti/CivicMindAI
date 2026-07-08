const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let useMockAI = true;

const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    useMockAI = false;
    console.log('Gemini AI Client successfully initialized.');
  } catch (err) {
    console.error('Error initializing Gemini AI, falling back to mock AI:', err);
    useMockAI = true;
  }
} else {
  console.warn('\n⚠️ GEMINI_API_KEY is not set. Using rule-based mock AI service for classification and chatbot.');
  useMockAI = true;
}

// Lists of GVMC departments and categories for fallback classification
const departments = [
  "Engineering Department",
  "Public Health & Sanitation Department",
  "Town Planning Department",
  "Water Supply Department",
  "Electrical Department",
  "Parks & Horticulture Department",
  "Revenue Department",
  "Health Department",
  "Urban Community Development",
  "Estate Department",
  "Finance & Accounts",
  "Information Technology Department",
  "Urban Biodiversity & Environment",
  "Disaster Management"
];

// Helper rules for mock classification
const mockClassify = (text = '') => {
  const t = text.toLowerCase();
  
  let category = "General Civic Issue";
  let department = "Information Technology Department";
  let priority = "Medium";
  let severity = "Moderate";
  let keywords = ["gvmc", "civic"];

  // Engineering
  if (t.includes('pothole') || t.includes('road') || t.includes('tarmac') || t.includes('bridge') || t.includes('footpath') || t.includes('drainage') || t.includes('drain')) {
    department = "Engineering Department";
    if (t.includes('pothole') || t.includes('road')) {
      category = "Road Damage";
      priority = "High";
      severity = "Major";
      keywords.push("road", "pothole", "pavement");
    } else if (t.includes('drain')) {
      category = "Drainage Overflow";
      priority = "High";
      severity = "Major";
      keywords.push("drain", "waterlogging", "sewage");
    } else {
      category = "Infrastructure Maintenance";
      keywords.push("bridge", "footpath");
    }
  }
  // Public Health & Sanitation
  else if (t.includes('garbage') || t.includes('trash') || t.includes('waste') || t.includes('dump') || t.includes('mosquito') || t.includes('toilet') || t.includes('sweep') || t.includes('filth')) {
    department = "Public Health & Sanitation Department";
    if (t.includes('garbage') || t.includes('trash') || t.includes('dump')) {
      category = "Garbage Pile-up";
      priority = "High";
      severity = "Major";
      keywords.push("garbage", "hygiene", "refuse");
    } else if (t.includes('mosquito')) {
      category = "Mosquito Control / Fogging";
      priority = "Medium";
      keywords.push("mosquitoes", "malaria", "fogging");
    } else {
      category = "Sanitation & Cleaning";
      keywords.push("toilet", "dirty", "sweeping");
    }
  }
  // Water Supply
  else if (t.includes('water') || t.includes('pipe') || t.includes('leak') || t.includes('drinking') || t.includes('supply') || t.includes('tap') || t.includes('contamination')) {
    department = "Water Supply Department";
    if (t.includes('leak') || t.includes('burst')) {
      category = "Pipeline Leakage";
      priority = "High";
      severity = "Major";
      keywords.push("water leak", "pipeline", "wastage");
    } else if (t.includes('contamination') || t.includes('dirty') || t.includes('smell')) {
      category = "Water Quality Issues";
      priority = "High";
      severity = "Critical";
      keywords.push("contamination", "dirty water", "health hazard");
    } else {
      category = "Drinking Water Scarcity";
      priority = "Medium";
      keywords.push("water supply", "tanker", "shortage");
    }
  }
  // Electrical
  else if (t.includes('street light') || t.includes('pole') || t.includes('dark') || t.includes('lamp') || t.includes('wire') || t.includes('current') || t.includes('electricity')) {
    department = "Electrical Department";
    if (t.includes('wire') || t.includes('spark') || t.includes('hanging')) {
      category = "Hazardous Live Wires";
      priority = "High";
      severity = "Critical";
      keywords.push("electrical wire", "danger", "hazard");
    } else {
      category = "Street Light Breakdown";
      priority = "Medium";
      keywords.push("street light", "darkness", "safety");
    }
  }
  // Town Planning
  else if (t.includes('illegal') || t.includes('construction') || t.includes('building') || t.includes('permission') || t.includes('encroachment') || t.includes('layout')) {
    department = "Town Planning Department";
    if (t.includes('encroach') || t.includes('road side')) {
      category = "Public Space Encroachment";
      priority = "Medium";
      keywords.push("encroachment", "obstruction");
    } else {
      category = "Unauthorized Construction";
      priority = "Medium";
      keywords.push("illegal building", "violations");
    }
  }
  // Parks & Horticulture
  else if (t.includes('park') || t.includes('tree') || t.includes('branch') || t.includes('garden') || t.includes('plantation')) {
    department = "Parks & Horticulture Department";
    if (t.includes('fallen') || t.includes('blocked') || t.includes('crash')) {
      category = "Fallen Tree Obstruction";
      priority = "High";
      severity = "Major";
      keywords.push("tree fall", "road block");
    } else {
      category = "Park Upkeep";
      priority = "Low";
      keywords.push("park", "garden", "plantation");
    }
  }
  // Disaster Management
  else if (t.includes('flood') || t.includes('cyclone') || t.includes('storm') || t.includes('inundat') || t.includes('rescue')) {
    department = "Disaster Management";
    category = "Disaster / Emergency Assistance";
    priority = "High";
    severity = "Critical";
    keywords.push("flood", "cyclone", "emergency", "storm");
  }

  return {
    category,
    department,
    priority,
    severity,
    keywords
  };
};

module.exports = {
  genAI,
  useMockAI: () => useMockAI,
  mockClassify,
  departments
};
