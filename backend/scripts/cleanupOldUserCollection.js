import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';

dotenv.config();

const cleanupOldCollection = async () => {
  try {
    await connectDB();
    console.log('Connected to database');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    const usersCollection = collections.find(col => col.name === 'users');
    
    if (!usersCollection) {
      console.log('✓ Old "users" collection does not exist. Nothing to clean up.');
      process.exit(0);
    }

    console.log('\n⚠️  WARNING: This will permanently delete the old "users" collection.');
    console.log('Make sure you have verified that the migration was successful.');
    console.log('\nTo proceed, you must manually run this command in MongoDB:');
    console.log('  use your_database_name');
    console.log('  db.users.drop()');
    console.log('\nThis script will not automatically drop the collection for safety.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

cleanupOldCollection();
