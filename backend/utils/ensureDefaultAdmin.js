import Admin from '../models/Admin.js';

const ensureDefaultAdmin = async () => {
  const defaultAdmin = {
    name: process.env.DEFAULT_ADMIN_NAME || 'System Administrator',
    userId: (process.env.DEFAULT_ADMIN_USERID || 'admin_user').toLowerCase(),
    email: (process.env.DEFAULT_ADMIN_EMAIL || 'admin@demo.com').toLowerCase(),
    phone: process.env.DEFAULT_ADMIN_PHONE || '9999999999',
    password: process.env.DEFAULT_ADMIN_PASSWORD || '123456',
    department: process.env.DEFAULT_ADMIN_DEPARTMENT || 'admin',
  };

  const existingDefaultAdmin = await Admin.findOne({
    $or: [{ email: defaultAdmin.email }, { userId: defaultAdmin.userId }],
  });

  if (existingDefaultAdmin) {
    let needsUpdate = false;

    if (!existingDefaultAdmin.isVerified) {
      existingDefaultAdmin.isVerified = true;
      needsUpdate = true;
    }

    if (!existingDefaultAdmin.isActive) {
      existingDefaultAdmin.isActive = true;
      needsUpdate = true;
    }

    if (existingDefaultAdmin.department !== defaultAdmin.department) {
      existingDefaultAdmin.department = defaultAdmin.department;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await existingDefaultAdmin.save();
      console.log('[seed] Default admin account refreshed');
    } else {
      console.log('[seed] Default admin account already present');
    }

    return existingDefaultAdmin;
  }

  const adminExists = await Admin.exists({});
  if (adminExists) {
    console.log('[seed] Admin account already exists. Skipping default admin creation.');
    return null;
  }

  const adminUser = new Admin({
    name: defaultAdmin.name,
    userId: defaultAdmin.userId,
    email: defaultAdmin.email,
    phone: defaultAdmin.phone,
    password: defaultAdmin.password,
    department: defaultAdmin.department,
    isVerified: true,
    isActive: true,
  });

  await adminUser.save();
  console.log(`[seed] Default admin account created (${adminUser.userId})`);
  return adminUser;
};

export default ensureDefaultAdmin;
