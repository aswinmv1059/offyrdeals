const mongoose = require('mongoose');
const connectDb = require('../config/db');
const User = require('../models/User');
const { hashPassword } = require('../services/authService');

const seed = async () => {
  await connectDb();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@offeyr.com';
  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    console.log('Admin already exists');
    await mongoose.connection.close();
    return;
  }

  const user = await User.create({
    name: process.env.SEED_ADMIN_NAME || 'Initial Admin',
    email: adminEmail,
    phone: process.env.SEED_ADMIN_PHONE || '+10000000000',
    password: await hashPassword(process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'),
    role: 'ADMIN',
    otp: { verified: true },
    isVendorApproved: false
  });

  console.log('Created admin:', user.email);
  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
