import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Admin from '../models/Admin.js';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';

dotenv.config();

const verifyCollections = async () => {
  try {
    await connectDB();
    console.log('Connected to database\n');
    console.log('=== Checking Separate Collections ===\n');
    
    const adminCount = await Admin.countDocuments();
    const authorityCount = await Authority.countDocuments();
    const citizenCount = await Citizen.countDocuments();
    
    console.log(`📊 Collection Counts:`);
    console.log(`  Admins: ${adminCount}`);
    console.log(`  Authorities: ${authorityCount}`);
    console.log(`  Citizens: ${citizenCount}`);
    console.log(`  Total: ${adminCount + authorityCount + citizenCount}\n`);
    
    if (adminCount > 0) {
      console.log('👤 Sample Admin:');
      const admin = await Admin.findOne().select('-password');
      console.log(`  Name: ${admin.name}`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  Department: ${admin.department}\n`);
    }
    
    if (authorityCount > 0) {
      console.log('👮 Sample Authority:');
      const authority = await Authority.findOne().select('-password');
      console.log(`  Name: ${authority.name}`);
      console.log(`  Email: ${authority.email}`);
      console.log(`  Role: ${authority.role}`);
      console.log(`  Department: ${authority.department}`);
      console.log(`  Verified: ${authority.isVerified}\n`);
    }
    
    if (citizenCount > 0) {
      console.log('👨 Sample Citizen:');
      const citizen = await Citizen.findOne().select('-password');
      console.log(`  Name: ${citizen.name}`);
      console.log(`  Email: ${citizen.email}`);
      console.log(`  Role: ${citizen.role}\n`);
    }
    
    console.log('✅ All collections verified successfully!');
    console.log('\nYou can now:');
    console.log('1. Test login with existing credentials');
    console.log('2. Create new authority officers from admin panel');
    console.log('3. Register new citizens');
    
    process.exit(0);
  } catch (error) {
    console.error('Verification error:', error);
    process.exit(1);
  }
};

verifyCollections();
