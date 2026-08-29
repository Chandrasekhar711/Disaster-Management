import Admin from '../models/Admin.js';
import Authority from '../models/Authority.js';
import Citizen from '../models/Citizen.js';
import { generateToken } from '../utils/tokenUtils.js';

// Helper function to check if email or userId exists across all collections
const checkExistingUser = async (email, userId) => {
  const normalizedEmail = email.toLowerCase();
  const normalizedUserId = userId.toLowerCase();

  const [adminByEmail, authorityByEmail, citizenByEmail] = await Promise.all([
    Admin.findOne({ email: normalizedEmail }),
    Authority.findOne({ email: normalizedEmail }),
    Citizen.findOne({ email: normalizedEmail }),
  ]);

  if (adminByEmail || authorityByEmail || citizenByEmail) {
    throw new Error('User with this email already exists');
  }

  const [adminByUserId, authorityByUserId, citizenByUserId] = await Promise.all([
    Admin.findOne({ userId: normalizedUserId }),
    Authority.findOne({ userId: normalizedUserId }),
    Citizen.findOne({ userId: normalizedUserId }),
  ]);

  if (adminByUserId || authorityByUserId || citizenByUserId) {
    throw new Error('User ID is already taken');
  }
};

export const registerUser = async (userData) => {
  const { name, userId, email, phone, password, role, department } = userData;

  // Check if user exists across all collections
  await checkExistingUser(email, userId);

  // Citizens can only register as citizens
  const userRole = role === 'citizen' || !role ? 'citizen' : 'citizen';
  
  const citizen = new Citizen({
    name,
    userId: userId.toLowerCase(),
    email,
    phone,
    password,
  });

  await citizen.save();

  const token = generateToken(citizen._id);
  return {
    user: {
      id: citizen._id,
      name: citizen.name,
      userId: citizen.userId,
      email: citizen.email,
      role: citizen.role,
    },
    token,
  };
};

export const loginUser = async (emailOrUserId, password) => {
  // Detect if input is email (contains @) or userId
  const isEmail = emailOrUserId.includes('@');
  const identifier = emailOrUserId.toLowerCase();
  
  let user = null;
  let userRole = null;

  // Search across all three collections
  if (isEmail) {
    const [admin, authority, citizen] = await Promise.all([
      Admin.findOne({ email: identifier }).select('+password'),
      Authority.findOne({ email: identifier }).select('+password'),
      Citizen.findOne({ email: identifier }).select('+password'),
    ]);
    
    if (admin) {
      user = admin;
      userRole = 'admin';
    } else if (authority) {
      user = authority;
      userRole = 'authority';
    } else if (citizen) {
      user = citizen;
      userRole = 'citizen';
    }
  } else {
    const [admin, authority, citizen] = await Promise.all([
      Admin.findOne({ userId: identifier }).select('+password'),
      Authority.findOne({ userId: identifier }).select('+password'),
      Citizen.findOne({ userId: identifier }).select('+password'),
    ]);
    
    if (admin) {
      user = admin;
      userRole = 'admin';
    } else if (authority) {
      user = authority;
      userRole = 'authority';
    } else if (citizen) {
      user = citizen;
      userRole = 'citizen';
    }
  }

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.isActive) {
    throw new Error('Your account has been deactivated');
  }

  const isPasswordValid = await user.matchPassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  const token = generateToken(user._id, userRole);

  return {
    user: {
      id: user._id,
      name: user.name,
      userId: user.userId,
      email: user.email,
      role: userRole,
      isVerified: user.isVerified,
      department: user.department,
    },
    token,
  };
};

export const getUserById = async (userId, userRole = null) => {
  let user = null;

  // If role is provided, search in specific collection
  if (userRole === 'admin') {
    user = await Admin.findById(userId);
  } else if (userRole === 'authority') {
    user = await Authority.findById(userId)
      .populate('incidentsAssigned', 'title type status createdAt');
  } else if (userRole === 'citizen') {
    user = await Citizen.findById(userId)
      .populate('incidentsReported', 'title type status createdAt');
  } else {
    // Search across all collections
    const [admin, authority, citizen] = await Promise.all([
      Admin.findById(userId),
      Authority.findById(userId).populate('incidentsAssigned', 'title type status createdAt'),
      Citizen.findById(userId).populate('incidentsReported', 'title type status createdAt'),
    ]);
    user = admin || authority || citizen;
  }

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export const updateUserProfile = async (userId, updateData, userRole) => {
  let user = null;

  // Remove fields that shouldn't be updated
  delete updateData.password;
  delete updateData.role;
  delete updateData.email;
  delete updateData.userId;

  if (userRole === 'admin') {
    user = await Admin.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
  } else if (userRole === 'authority') {
    user = await Authority.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
  } else if (userRole === 'citizen') {
    user = await Citizen.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });
  }

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

export default {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
};
