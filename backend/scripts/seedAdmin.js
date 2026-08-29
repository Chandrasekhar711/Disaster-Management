import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import ensureDefaultAdmin from '../utils/ensureDefaultAdmin.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();
    await ensureDefaultAdmin();
    console.log('Default admin seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed default admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
