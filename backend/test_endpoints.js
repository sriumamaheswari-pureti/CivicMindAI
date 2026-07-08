const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 5555; // Use dedicated test port to avoid conflicts
process.env.PORT = PORT;
process.env.JWT_SECRET = 'test_gvmc_secret_key_2026';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/civicmind_test_nonexistent'; // force fallback

console.log('Starting CivicMind Test server...');
const server = spawn('node', [path.join(__dirname, 'server.js')], {
  env: { 
    ...process.env, 
    PORT,
    GEMINI_API_KEY: 'mock' // force mock to prevent API key errors
  },
  shell: true // required for spawning on Windows shells
});

let serverOutput = '';
server.stdout.on('data', (data) => {
  const str = data.toString();
  serverOutput += str;
  // Print server logs with indent to distinguish from test logs
  console.log(`  [Server]: ${str.trim()}`);
});

server.stderr.on('data', (data) => {
  console.error('  [Server Error]:', data.toString().trim());
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTests = async () => {
  // Give server 3 seconds to spin up and load the JSON file fallback
  await sleep(3500);

  const baseURL = `http://localhost:${PORT}/api`;
  
  // Custom fetch helper to simplify requests
  const request = async (endpoint, options = {}) => {
    const url = `${baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      ...(options.body && { body: JSON.stringify(options.body) })
    };
    
    const res = await fetch(url, fetchOptions);
    const data = await res.json();
    if (!res.ok) {
      throw { response: { data }, message: data.message || 'Request failed' };
    }
    return { data };
  };

  console.log('\n=========================================');
  console.log('🚨 CIVICMIND AI BACKEND TESTING SUITE 🚨');
  console.log('=========================================\n');

  let citizenToken = '';
  let adminToken = '';
  let testComplaintId = '';

  // Test 1: Health Check Endpoint
  try {
    const res = await request('/health');
    console.log('✅ Health Check Endpoint: SUCCESS');
    console.log(`   Running mode: ${res.data.status}, Database: ${res.data.database}`);
  } catch (err) {
    console.error('❌ Health Check Endpoint: FAILED', err.message);
  }

  // Test 2: Citizen Account Registration
  try {
    const email = `test_citizen_${Date.now()}@visakhapatnam.in`;
    const res = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'Srinivas Rao',
        email,
        phone: '9848022338',
        password: 'password123'
      }
    });
    citizenToken = res.data.token;
    console.log('✅ Citizen Signup Integration: SUCCESS');
    console.log(`   Created User: ${res.data.user.name}, Role: ${res.data.user.role}`);
  } catch (err) {
    console.error('❌ Citizen Signup Integration: FAILED', err.response?.data || err.message);
  }

  // Test 3: Admin Authentication Login
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@gvmc.gov.in',
        password: 'admin123'
      }
    });
    adminToken = res.data.token;
    console.log('✅ GVMC Super Admin Login: SUCCESS');
    console.log(`   Session Token generated for user: ${res.data.user.name}`);
  } catch (err) {
    console.error('❌ GVMC Super Admin Login: FAILED', err.response?.data || err.message);
  }

  // Test 4: AI Engine Classification & Translation routing
  try {
    const res = await request('/ai/classify', {
      method: 'POST',
      body: {
        text: 'Heavy leakage in the main pipeline of water supply near Gajuwaka junction, wasting hundreds of liters of drinking water.',
        language: 'English'
      }
    });
    console.log('✅ Gemini AI Classification Route: SUCCESS');
    console.log(`   Parsed Category: "${res.data.category}"`);
    console.log(`   Auto Selected Dept: "${res.data.department}"`);
    console.log(`   Priority Class: "${res.data.priority}", Severity: "${res.data.severity}"`);
  } catch (err) {
    console.error('❌ Gemini AI Classification Route: FAILED', err.response?.data || err.message);
  }

  // Test 5: Complaint Submission & Nearest Zone Detection Auto-Routing
  try {
    const res = await request('/complaints', {
      method: 'POST',
      body: {
        title: 'Broken pipeline near Gajuwaka',
        description: 'Water is gushing out of the road pipeline.',
        category: 'Pipeline Leakage / Burst',
        department: 'Water Supply Department',
        latitude: '17.6900', // Gajuwaka coordinates
        longitude: '83.2100',
        address: 'Gajuwaka Highway, Visakhapatnam',
        priority: 'High'
      },
      headers: { Authorization: `Bearer ${citizenToken}` }
    });

    testComplaintId = res.data._id;
    console.log('✅ Complaint Submit & Zone Routing: SUCCESS');
    console.log(`   Generated ID: ${res.data.trackingId}`);
    console.log(`   Auto Routed Zone: ${res.data.zone}`);
    console.log(`   Assigned Officer: ${res.data.officerName}, Current Status: ${res.data.status}`);
  } catch (err) {
    console.error('❌ Complaint Submit & Zone Routing: FAILED', err.response?.data || err.message);
  }

  // Test 6: Admin Dashboard Aggregation Analytics
  try {
    const res = await request('/admin/analytics', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Super Admin Analytics Dashboard: SUCCESS');
    console.log(`   Total Grid Complaints: ${res.data.total}`);
    console.log(`   Dashboard Resolved count: ${res.data.resolved}, Pending count: ${res.data.pending}`);
    console.log(`   Average municipal resolution speed: ${res.data.averageResolutionTimeHours} hours`);
  } catch (err) {
    console.error('❌ Super Admin Analytics Dashboard: FAILED', err.response?.data || err.message);
  }

  console.log('\n=========================================');
  console.log('🎉 ALL INTEGRATION TESTS COMPLETED 🎉');
  console.log('=========================================\n');

  // Terminate test server instance
  server.kill();
  process.exit(0);
};

runTests();
