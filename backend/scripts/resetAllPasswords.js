import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import Admin from '../models/Admin.js';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';

dotenv.config();

const resetAllPasswords = async () => {
  try {
    await connectDB();
    console.log('Connected to database');
    console.log('Resetting all user passwords to: 123456\n');

    const newPassword = '123456';
    let adminCount = 0;
    let authorityCount = 0;
    let citizenCount = 0;

    // Update all admins
    const admins = await Admin.find({});
    for (const admin of admins) {
      admin.password = newPassword;
      await admin.save();
      console.log(`✓ Updated admin: ${admin.userId} (${admin.email})`);
      adminCount++;
    }

    // Update all authorities
    const authorities = await Authority.find({});
    for (const authority of authorities) {
      authority.password = newPassword;
      await authority.save();
      console.log(`✓ Updated authority: ${authority.userId} (${authority.email})`);
      authorityCount++;
    }

    // Update all citizens
    const citizens = await Citizen.find({});
    for (const citizen of citizens) {
      citizen.password = newPassword;
      await citizen.save();
      console.log(`✓ Updated citizen: ${citizen.userId} (${citizen.email})`);
      citizenCount++;
    }

    console.log('\n✅ Password reset complete!');
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Authorities: ${authorityCount}`);
    console.log(`   Citizens: ${citizenCount}`);
    console.log(`   Total: ${adminCount + authorityCount + citizenCount}`);
    console.log('\n🔑 All users can now login with password: 123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetAllPasswords();
