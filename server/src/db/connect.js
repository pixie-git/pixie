import mongoose from 'mongoose';
import { seedUsers } from './seed.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pixie';

// --- Database Connection & Seeding ---
export const connectDB = async () => {
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