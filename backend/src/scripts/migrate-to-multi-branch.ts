import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User';
import { Branch } from '../models/Branch';
import { Subscription } from '../models/Subscription';
import { Verification } from '../models/Verification';
import { AuditLog } from '../models/AuditLog';
import { logger } from '../config/logger';

const DRY_RUN = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run');

async function connectDB() {
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment config.');
  }
  await mongoose.connect(uri);
  logger.info('Connected to MongoDB successfully.');
}

async function runMigration() {
  logger.info(`========================================================================`);
  logger.info(`STARTING MULTI-BRANCH DB MIGRATION [DRY_RUN = ${DRY_RUN}]`);
  logger.info(`========================================================================`);

  // 1. Retrieve all users from User model
  const users = await User.find({});
  logger.info(`Successfully retrieved ${users.length} user records.`);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not established.');
  }
  // Access legacy businesses collection directly via driver to avoid compilation errors
  const legacyBusinessesColl = db.collection('businesses');

  for (const user of users) {
    logger.info(`------------------------------------------------------------------------`);
    logger.info(`Processing User: ${user.name} | Email: ${user.email} | Current Role: ${user.role}`);

    // If role is MERCHANT or USER, promote to OWNER
    const isLegacyMerchant = (user.role as any) === 'MERCHANT' || (user.role as any) === 'USER' || !user.role;
    const targetRole = isLegacyMerchant ? 'OWNER' : user.role;

    if ((targetRole as any) !== 'OWNER') {
      logger.info(`User role is ${user.role} (Non-Merchant/System Admin). No branch migration needed.`);
      if (!DRY_RUN && user.role !== targetRole) {
        user.role = targetRole;
        await user.save();
        logger.info(`Updated user role to ${targetRole}.`);
      }
      continue;
    }

    // Check if branch already exists
    const existingBranchCount = await Branch.countDocuments({ ownerId: user._id });
    if (existingBranchCount > 0) {
      logger.info(`Owner ${user.name} already has ${existingBranchCount} branches. Skipping branch creation.`);
      continue;
    }

    // Try to lookup legacy business
    let legacyBusiness: any = null;
    const legacyBusinessId = (user as any).businessId;
    if (legacyBusinessId) {
      try {
        legacyBusiness = await legacyBusinessesColl.findOne({ _id: new mongoose.Types.ObjectId(legacyBusinessId) });
      } catch (err: any) {
        logger.warn(`Could not find legacy business with ID: ${legacyBusinessId}. Error: ${err.message}`);
      }
    }

    // Prepare default metadata fields
    const companyName = legacyBusiness?.companyName || legacyBusiness?.name || `${user.name} Company`;
    const companyType = legacyBusiness?.companyType || 'SOLE_PROPRIETORSHIP';
    const address = legacyBusiness?.address || 'N/A';
    const branchName = legacyBusiness?.name || 'Main Branch';

    logger.info(`Migration action details planned:`);
    logger.info(`  * Promote User role to OWNER | ownerStatus: ACTIVE`);
    logger.info(`  * Set Company Info: Name="${companyName}" | Type="${companyType}"`);
    logger.info(`  * Create Branch Name: "${branchName}" with owner accounts`);

    if (DRY_RUN) {
      // Analyze mock counts
      const subCount = await Subscription.countDocuments({ userId: user._id });
      const verCount = await Verification.countDocuments({ verifiedBy: user._id });
      logger.info(`  * [Dry-Run] Subscriptions to migrate: ${subCount}`);
      logger.info(`  * [Dry-Run] Verifications to migrate: ${verCount}`);
    } else {
      // 1. Update user fields
      user.role = 'OWNER';
      user.ownerStatus = 'ACTIVE';
      user.companyInfo = {
        companyName,
        companyType: companyType as any,
        address,
        country: legacyBusiness?.country || 'Ethiopia',
        region: legacyBusiness?.region || 'Addis Ababa',
        city: legacyBusiness?.city || 'Addis Ababa',
      };

      // 2. Insert Branch
      const branch = new Branch({
        ownerId: user._id,
        branchName: branchName,
        branchNumber: 1,
        status: 'ACTIVE',
        address,
        country: legacyBusiness?.country || 'Ethiopia',
        region: legacyBusiness?.region || 'Addis Ababa',
        city: legacyBusiness?.city || 'Addis Ababa',
        accounts: user.accounts || [], // fallback settlement accounts
      });

      // Save branch (triggers sequential branchCode pre-save hooks)
      await branch.save();

      // Set owner branches link
      user.branches = [branch._id as any];
      await user.save();

      logger.info(`  -> Created default branch ${branch.branchCode} (${branch.branchName}) successfully.`);

      // 3. Migrate subscriptions associate with this owner
      const subResult = await Subscription.updateMany(
        { userId: user._id },
        { $set: { branchId: branch._id, ownerId: user._id } }
      );
      logger.info(`  -> Migrated ${subResult.modifiedCount} subscriptions to branch schema context.`);

      // 4. Migrate verifications processed by this owner
      const verResult = await Verification.updateMany(
        { verifiedBy: user._id },
        { $set: { branchId: branch._id, verifiedByType: 'owner' } }
      );
      logger.info(`  -> Migrated ${verResult.modifiedCount} manual verifications to branch schema context.`);

      // 5. AuditLogs migration
      const auditResult = await AuditLog.updateMany(
        { actor: user._id },
        { $set: { branchId: branch._id, actorType: 'owner' } }
      );
      logger.info(`  -> Migrated ${auditResult.modifiedCount} audit logs to branch context.`);
    }
  }

  logger.info(`========================================================================`);
  logger.info(`DB MIGRATION PROCESS COMPLETE [DRY_RUN = ${DRY_RUN}]`);
  logger.info(`========================================================================`);
}

async function run() {
  try {
    await connectDB();
    await runMigration();
  } catch (err: any) {
    logger.error(`Migration Script aborted: ${err.message}`, err);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB.');
  }
}

run();
