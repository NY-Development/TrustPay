import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Branch } from '../models/Branch';

export const getBranchAccessStatus = async (branchId: string) => {
  const branch = await Branch.findById(branchId);
  if (!branch) return { allowed: false };

  const owner = await User.findById(branch.ownerId);
  if (!owner) return { allowed: false };

  const now = new Date();

  // 1. Check Owner trial
  const inTrial =
    owner.trialEndDate &&
    now < new Date(owner.trialEndDate);

  if (inTrial) {
    return {
      allowed: true,
      source: 'trial',
      expiresAt: owner.trialEndDate,
    };
  }

  // 2. Check subscription for this branch
  const subscription = await Subscription.findOne({
    branchId,
    status: 'active',
    fullyPaid: true,
  });

  if (subscription) {
    return {
      allowed: true,
      source: 'subscription',
      subscription,
    };
  }

  return {
    allowed: false,
    source: 'none',
  };
};

export const getUserAccessStatus = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) return { allowed: false };

  const now = new Date();

  // 1. Check trial
  const inTrial =
    user.trialEndDate &&
    now < new Date(user.trialEndDate);

  if (inTrial) {
    return {
      allowed: true,
      source: 'trial',
      expiresAt: user.trialEndDate,
    };
  }

  // 2. Check if they have ANY branch with active subscription
  const subscription = await Subscription.findOne({
    ownerId: userId,
    status: 'active',
    fullyPaid: true,
  });

  if (subscription) {
    return {
      allowed: true,
      source: 'subscription',
      subscription,
    };
  }

  return {
    allowed: false,
    source: 'none',
  };
};