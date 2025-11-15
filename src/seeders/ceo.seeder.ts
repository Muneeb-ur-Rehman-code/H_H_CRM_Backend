import mongoose from 'mongoose';
import User from '../models/User/User.model';
import { UserRole } from '../types/user.types';
import config from '../config/config';

const seedCEO = async (): Promise<void> => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongoUri);
    }

    const existingCEO = await User.findOne({ role: UserRole.CEO });

    if (existingCEO) {
      console.log('✅ CEO account already exists');
      return;
    }

    const ceo = await User.create({
      name: config.ceo.name,
      email: config.ceo.email,
      password: config.ceo.password,
      role: UserRole.CEO,
      isActive: true,
      isEmailVerified: true
    });

    console.log('✅ CEO account created successfully');
    console.log(`📧 Email: ${config.ceo.email}`);
    console.log(`🔑 Password: ${config.ceo.password}`);
    
  } catch (error) {
    console.error('❌ CEO Seeding error:', error);
    throw error;
  }
};

export default seedCEO;