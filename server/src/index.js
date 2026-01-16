import express from 'express';
import mongoose from 'mongoose';
import { seedUsers } from './db/seed.js';

// Configuration
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pixie';

// --- Database Connection & Seeding ---
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[INFO] MongoDB Connected successfully');

    await seedUsers();

  } catch (err) {
    console.error('[ERROR] MongoDB Connection Error:', err.message);
    console.log('[INFO] Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Initialize DB connection
connectDB();

// --- Basic Server Start ---
// TEMPORARY: Keeps the process alive for Docker
app.get('/', (req, res) => {
  res.send('Pixie Server is running. Database seeded.');
});

app.listen(PORT, () => {
  console.log(`[INFO] Server listening on port ${PORT}`);
});