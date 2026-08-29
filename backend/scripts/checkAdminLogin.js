import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

dotenv.config();

const checkAdminLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all admins
    const admins = await Admin.find({}).select('+password');
    console.log(`\n📊 Found ${admins.length} admin(s):`);
    
    for (const admin of admins) {
      console.log('\n---');
      console.log(`Name: ${admin.name}`);
      console.log(`User ID: ${admin.userId}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Is Verified: ${admin.isVerified}`);
      console.log(`Is Active: ${admin.isActive}`);
      console.log(`Has Password: ${!!admin.password}`);
      
      // Test password matching
      const testPassword = 'password123';
      const isMatch = await admin.matchPassword(testPassword);
      console.log(`Password 'password123' matches: ${isMatch}`);
    }

    // Test login logic
    console.log('\n\n🔍 Testing login logic:');
    const identifier = 'admin_user';
    const password = 'password123';
    
    const adminByUserId = await Admin.findOne({ userId: identifier.toLowerCase() }).select('+password');
    console.log(`Admin found by userId: ${!!adminByUserId}`);
    
    if (adminByUserId) {
      console.log(`Admin details:`, {
        id: adminByUserId._id,
        userId: adminByUserId.userId,
        email: adminByUserId.email,
        isActive: adminByUserId.isActive,
        role: adminByUserId.role
      });
      
      const passwordMatch = await adminByUserId.matchPassword(password);
      console.log(`Password matches: ${passwordMatch}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkAdminLogin();
