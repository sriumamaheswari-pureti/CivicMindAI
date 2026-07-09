const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://civicmindai-frontend.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to Database (with automatic local file-based database fallback)
connectDB();

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    database: global.useLocalDB ? 'Local File DB' : 'MongoDB'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const host = process.env.NODE_ENV === 'production' ? 'https://civicmindai-backend.onrender.com' : `http://localhost:${PORT}`;
  console.log(`\n🚀 CivicMind AI server running on port ${PORT}`);
  console.log(`📂 Uploads directory served at ${host}/uploads`);
  console.log(`🔗 Health check endpoint: ${host}/api/health\n`);
});
