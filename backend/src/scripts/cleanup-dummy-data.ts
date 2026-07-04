import mongoose from 'mongoose';
import { env } from '../config/env';

// Models
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Verification } from '../models/Verification';
import { Branch } from '../models/Branch';
import { Business } from '../models/Business';
import { Otp } from '../models/Otp';
import { AuditLog } from '../models/AuditLog';

/**
 * ⚠️ WARNING:
 * This script deletes data.
 * Only run in development or staging unless you are 100% sure.
 */

const MONGO_URI = env.MONGODB_URI;

async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');
}

/**
 * MAIN CLEANUP FUNCTION
 */
async function cleanup() {
  console.log('🧹 Starting dummy data cleanup...');

  // OPTIONAL SAFETY FILTER:
  // Only delete users that look like test accounts
  const dummyEmailRegex = /test|demo|dummy|example/i;

  // 1. USERS
  const deletedUsers = await User.deleteMany({
    email: dummyEmailRegex,
  });
  console.log(`🗑️ Users deleted: ${deletedUsers.deletedCount}`);

  // 2. SUBSCRIPTIONS (orphan + test)
  const deletedSubs = await Subscription.deleteMany({});
  console.log(`🗑️ Subscriptions deleted: ${deletedSubs.deletedCount}`);

  // 3. VERIFICATIONS
  const deletedVerifications = await Verification.deleteMany({});
  console.log(`🗑️ Verifications deleted: ${deletedVerifications.deletedCount}`);

  // 4. OTPs (always safe to clear)
  const deletedOtps = await Otp.deleteMany({});
  console.log(`🗑️ OTPs deleted: ${deletedOtps.deletedCount}`);

  // 5. AUDIT LOGS (optional, usually safe in dev)
  const deletedLogs = await AuditLog.deleteMany({});
  console.log(`🗑️ Audit logs deleted: ${deletedLogs.deletedCount}`);

  // 6. BRANCHES (ONLY if dummy)
  const deletedBranches = await Branch.deleteMany({
    name: dummyEmailRegex,
  });
  console.log(`🗑️ Branches deleted: ${deletedBranches.deletedCount}`);

  // 7. BUSINESSES (ONLY if dummy)
  const deletedBusinesses = await Business.deleteMany({
    name: dummyEmailRegex,
  });
  console.log(`🗑️ Businesses deleted: ${deletedBusinesses.deletedCount}`);

  console.log('✅ Cleanup complete');
}

async function run() {
  try {
    await connectDB();
    await cleanup();
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 DB disconnected');
  }
}

run();