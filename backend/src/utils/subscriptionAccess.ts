import { User } from '../models/User';
import { Subscription } from '../models/Subscription';

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

  // 2. Check subscription
  const subscription = await Subscription.findOne({
    userId,
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