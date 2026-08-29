import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';

dotenv.config();

const migrateUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to database');
    console.log('Starting migration of users to separate collections...\n');

    const users = await User.find().lean(); // .lean() returns plain JavaScript objects
    console.log(`Found ${users.length} users to migrate`);

    const admins = [];
    const authorities = [];
    const citizens = [];

    for (const user of users) {
      const userData = {
        _id: user._id,
        name: user.name,
        userId: user.userId,
        email: user.email,
        phone: user.phone,
        password: user.password, // Already hashed - copy as is
        isActive: user.isActive,
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        bio: user.bio,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      if (user.role === 'admin') {
        admins.push({
          ...userData,
          role: 'admin',
          department: user.department || 'admin',
        });
      } else if (user.role === 'authority') {
        authorities.push({
          ...userData,
          role: 'authority',
          department: user.department || 'police',
          location: user.location || { type: 'Point', coordinates: [0, 0] },
          address: user.address || '',
          incidentsAssigned: user.incidentsAssigned || [],
          createdBy: user.createdBy,
        });
      } else {
        citizens.push({
          ...userData,
          role: 'citizen',
          location: user.location || { type: 'Point', coordinates: [0, 0] },
          address: user.address || '',
          incidentsReported: user.incidentsReported || [],
        });
      }
    }

    let adminCount = 0;
    let authorityCount = 0;
    let citizenCount = 0;
    let errors = 0;

    // Insert admins
    if (admins.length > 0) {
      try {
        await Admin.collection.insertMany(admins, { ordered: false });
        adminCount = admins.length;
        console.log(`✓ Migrated ${adminCount} admin(s)`);
      } catch (error) {
        if (error.code === 11000) {
          // Duplicate key error - some already exist
          adminCount = admins.length - (error.writeErrors?.length || 0);
          console.log(`✓ Migrated ${adminCount} admin(s), ${error.writeErrors?.length || 0} already existed`);
        } else {
          console.error('✗ Error migrating admins:', error.message);
          errors++;
        }
      }
    }

    // Insert authorities
    if (authorities.length > 0) {
      try {
        await Authority.collection.insertMany(authorities, { ordered: false });
        authorityCount = authorities.length;
        console.log(`✓ Migrated ${authorityCount} authorities`);
      } catch (error) {
        if (error.code === 11000) {
          authorityCount = authorities.length - (error.writeErrors?.length || 0);
          console.log(`✓ Migrated ${authorityCount} authorities, ${error.writeErrors?.length || 0} already existed`);
        } else {
          console.error('✗ Error migrating authorities:', error.message);
          errors++;
        }
      }
    }

    // Insert citizens
    if (citizens.length > 0) {
      try {
        await Citizen.collection.insertMany(citizens, { ordered: false });
        citizenCount = citizens.length;
        console.log(`✓ Migrated ${citizenCount} citizens`);
      } catch (error) {
        if (error.code === 11000) {
          citizenCount = citizens.length - (error.writeErrors?.length || 0);
          console.log(`✓ Migrated ${citizenCount} citizens, ${error.writeErrors?.length || 0} already existed`);
        } else {
          console.error('✗ Error migrating citizens:', error.message);
          errors++;
        }
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Admins migrated: ${adminCount}`);
    console.log(`Authorities migrated: ${authorityCount}`);
    console.log(`Citizens migrated: ${citizenCount}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total: ${adminCount + authorityCount + citizenCount}`);
    
    console.log('\n⚠️  IMPORTANT: The old "users" collection is still intact.');
    console.log('After verifying migration, you can manually drop it using:');
    console.log('  db.users.drop()');
    console.log('\nOr run: node scripts/cleanupOldUserCollection.js');

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateUsers();
