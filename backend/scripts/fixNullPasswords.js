import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Admin from '../models/Admin.js';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';

dotenv.config();

const fixNullPasswords = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to database');
    console.log('\n🔧 Fixing null passwords in all collections...\n');

    const defaultPassword = 'Password123!'; // Default password for all users
    let fixedCount = 0;

    // Fix Admins
    const adminsWithNullPassword = await Admin.find({ password: null });
    for (const admin of adminsWithNullPassword) {
      admin.password = defaultPassword;
      await admin.save(); // This triggers the pre-save hook to hash the password
      console.log(`✓ Fixed admin: ${admin.userId} (${admin.email})`);
      fixedCount++;
    }

    // Fix Authorities  
    const authoritiesWithNullPassword = await Authority.find({ password: null });
    for (const authority of authoritiesWithNullPassword) {
      authority.password = defaultPassword;
      await authority.save(); // This triggers the pre-save hook to hash the password
      console.log(`✓ Fixed authority: ${authority.userId} (${authority.email})`);
      fixedCount++;
    }

    // Fix Citizens
    const citizensWithNullPassword = await Citizen.find({ password: null });
    for (const citizen of citizensWithNullPassword) {
      citizen.password = defaultPassword;
      await citizen.save(); // This triggers the pre-save hook to hash the password
      console.log(`✓ Fixed citizen: ${citizen.userId} (${citizen.email})`);
      fixedCount++;
    }

    console.log(`\n✅ Fixed ${fixedCount} user(s) with null passwords`);
    console.log(`\n⚠️  Default password set for all fixed users: ${defaultPassword}`);
    console.log('   Users should be advised to change their passwords on first login.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixNullPasswords();
