const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnected = false;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicmind';
    console.log(`Attempting to connect to MongoDB at: ${mongoURI}`);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // 3s timeout
    });
    isConnected = true;
    console.log('MongoDB Connected successfully.');
  } catch (error) {
    console.warn('\n⚠️ MongoDB connection failed. Falling back to local JSON database.');
    isConnected = false;
    global.useLocalDB = true;
    
    // Ensure the data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'local_db.json');
    if (!fs.existsSync(dbPath)) {
      // Seed initial mock data for GVMC zones, departments, admin, and a few officers
      const initialDb = {
        users: [
          {
            _id: "60c72b2f9b1d8a2c28654877",
            name: "Rama Rao",
            email: "citizen@civicmind.in",
            phone: "9876543210",
            passwordHash: "$2a$10$X8LdC4G80sP7tY.J8s95aO7.oB32sJ12L0uYpYQkG4e/Vd49xU61e", // "password123"
            role: "citizen",
            createdAt: new Date().toISOString()
          }
        ],
        officers: [
          {
            _id: "60c72b2f9b1d8a2c28654878",
            name: "Mr. K. Srinivasa Rao (East)",
            email: "engineering.east@gvmc.gov.in",
            phone: "9440812345",
            passwordHash: "$2a$10$X8LdC4G80sP7tY.J8s95aO7.oB32sJ12L0uYpYQkG4e/Vd49xU61e", // "password123"
            department: "Engineering Department",
            zone: "East Zone",
            role: "officer",
            status: "active",
            createdAt: new Date().toISOString()
          },
          {
            _id: "60c72b2f9b1d8a2c28654881",
            name: "Dr. B. Murali Krishna (East)",
            email: "health.east@gvmc.gov.in",
            phone: "9440854321",
            passwordHash: "$2a$10$X8LdC4G80sP7tY.J8s95aO7.oB32sJ12L0uYpYQkG4e/Vd49xU61e", // "password123"
            department: "Public Health & Sanitation Department",
            zone: "East Zone",
            role: "officer",
            status: "active",
            createdAt: new Date().toISOString()
          },
          {
            _id: "60c72b2f9b1d8a2c28654882",
            name: "Mr. P. Satyanarayana (Madhurawada)",
            email: "engineering.madhurawada@gvmc.gov.in",
            phone: "9440822222",
            passwordHash: "$2a$10$X8LdC4G80sP7tY.J8s95aO7.oB32sJ12L0uYpYQkG4e/Vd49xU61e", // "password123"
            department: "Engineering Department",
            zone: "Madhurawada Zone",
            role: "officer",
            status: "active",
            createdAt: new Date().toISOString()
          }
        ],
        admins: [
          {
            _id: "60c72b2f9b1d8a2c28654879",
            name: "GVMC Super Admin",
            email: "admin@gvmc.gov.in",
            phone: "9999999999",
            passwordHash: "$2a$10$X8LdC4G80sP7tY.J8s95aO7.oB32sJ12L0uYpYQkG4e/Vd49xU61e", // "password123"
            role: "admin",
            createdAt: new Date().toISOString()
          }
        ],
        complaints: [],
        notifications: [],
        chatHistories: []
      };
      fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2));
      console.log(`Local JSON Database initialized at: ${dbPath}`);
    }
  }
};

module.exports = { connectDB, isConnected: () => isConnected };
