import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.CORS_PORT || 3001;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock API endpoint for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'CORS server is working', port: PORT });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('CORS Server Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 CORS server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
}); 