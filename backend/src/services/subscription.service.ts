import { Subscription, ISubscription } from '../models/Subscription';
import { User } from '../models/User';
import { VerificationService } from './verification/verification.service';
import { Verification } from '../models/Verification';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import { SUBSCRIPTION_PRICING, SUBSCRIPTION_RECEIVER_NAME } from '../constants';
import { logger } from '../config/logger';

export class SubscriptionService {
  /**
   * Check if a user currently has an active subscription.
   * Auto-expires past subscriptions if they are still marked active.
   */
  static async checkActiveSubscription(userId: string): Promise<ISubscription | null> {
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
    });

    if (!subscription) {
      return null;
    }

    // Expiry check
    if (new Date() > subscription.endDate) {
      subscription.status = 'expired';
      await subscription.save();
      logger.info(`Subscription ${subscription._id} for user ${userId} has expired.`);
      return null;
    }

    return subscription;
  }

  /**
   * Verify subscription payment reference via Verify.ET, validate payee/payer, and create active subscription.
   */
  static async verifySubscriptionPayment(
    userId: string,
    reference: string,
    plan: 'monthly' | 'yearly'
  ): Promise<ISubscription> {
    // 1. Double check user
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    // 2. Prevent duplication of active subscription
    const currentActive = await SubscriptionService.checkActiveSubscription(userId);
    if (currentActive) {
      throw new BadRequestError('You already have an active subscription.');
    }

    // 3. Prevent duplicate use of transaction Reference ID across ALL subscriptions
    const existingTx = await Subscription.findOne({ transactionId: reference.toUpperCase() });
    if (existingTx) {
      throw new BadRequestError('This transaction reference has already been used for subscription.');
    }

    // 4. Resolve the user's settlement details for the provider (or default)
    const detectedProvider = VerificationService.detectProvider(reference);
    const matchingAccount = user.accounts?.find(acc => acc.accountProvider === detectedProvider);
    const settlementAccount = matchingAccount?.accountNumber || user.accounts?.[0]?.accountNumber;

    if (!settlementAccount) {
      throw new BadRequestError('You must register at least one settlement account first.');
    }

    const resolvedProvider = matchingAccount?.accountProvider || user.accounts?.[0]?.accountProvider || 'cbe';
    
    let derivedSuffix = '';
    if (resolvedProvider === 'cbe') {
      derivedSuffix = settlementAccount.length >= 8 ? settlementAccount.slice(-8) : settlementAccount;
    } else if (resolvedProvider === 'boa') {
      derivedSuffix = settlementAccount.length >= 5 ? settlementAccount.slice(-5) : settlementAccount;
    } else {
      derivedSuffix = settlementAccount.length >= 4 ? settlementAccount.slice(-4) : settlementAccount;
    }

    const derivedPhone = (resolvedProvider === 'cbebirr' || resolvedProvider === 'kaafiebirr') ? settlementAccount : undefined;

    // 5. Submit verification request to Verify.ET
    const pricing = SUBSCRIPTION_PRICING[plan];
    const expectedAmount = pricing.amount;

    logger.info(`Verifying subscription payment for plan: ${plan}. Reference: ${reference}. Expected Amount: ${expectedAmount}`);

    const result = await VerificationService.verifyWithProvider({
      provider: resolvedProvider,
      reference,
      suffix: derivedSuffix,
      accountSuffix: derivedSuffix,
      phoneNumber: derivedPhone,
      settlementAccount,
    });

    if (!result.verified) {
      throw new BadRequestError('Payment verification failed. Invalid reference ID.');
    }

    // 6. Name Validation
    // Rule: Payer name must match registered user's name
    const payerNameNormalized = result.payerName.replace(/\s+/g, ' ').trim().toLowerCase();
    const userNameNormalized = user.name.replace(/\s+/g, ' ').trim().toLowerCase();
    
    // Substring verification for convenience (e.g. middle/grand-father name formatting differences)
    const matchesUser = payerNameNormalized.includes(userNameNormalized) || userNameNormalized.includes(payerNameNormalized);
    if (!matchesUser) {
      throw new BadRequestError(`Payer name verification failed. Transaction registered to '${result.payerName}', but your account name is '${user.name}'.`);
    }

    // Rule: Receiver name must exactly be 'YAMLAK NEGASH DUGO'
    const receiverNameNormalized = (result.receiverName || '').replace(/\s+/g, ' ').trim().toUpperCase();
    const expectedReceiver = SUBSCRIPTION_RECEIVER_NAME.toUpperCase();
    
    // Perform substring/exact match (to allow common suffix variations like 'YAMLAK NEGASH DUGO - CBE')
    if (!receiverNameNormalized.includes(expectedReceiver)) {
      throw new BadRequestError(`Receiver name verification failed. Payment was sent to '${result.receiverName || 'Unknown'}', but must be sent to '${expectedReceiver}'.`);
    }

    // Rule: Verify amount is correct
    if (result.amount < expectedAmount) {
      throw new BadRequestError(`Incorrect amount paid. Expected ${expectedAmount} ETB, but received ${result.amount} ETB.`);
    }

    // 7. Make a standard Verification model record first
    const verification = await Verification.create({
      transactionId: result.transactionId.toUpperCase(),
      referenceNumber: result.referenceNumber || reference.toUpperCase(),
      provider: result.provider,
      amount: result.amount,
      currency: result.currency,
      payerName: result.payerName,
      receiverName: result.receiverName,
      receiverAccount: result.receiverAccount,
      paymentDate: result.paymentDate,
      verified: true,
      verifiedBy: user._id,
      businessId: user.businessId,
      branchId: user.branchId,
      source: 'manual',
      rawResponse: result.raw,
      status: 'completed',
    });

    // 8. Create Subscription
    const startDate = new Date(result.paymentDate);
    const endDate = new Date(startDate.getTime() + pricing.durationDays * 24 * 60 * 60 * 1000);

    const subscription = await Subscription.create({
      userId: user._id,
      plan,
      amount: result.amount,
      currency: result.currency,
      transactionId: result.transactionId.toUpperCase(),
      payerName: result.payerName,
      receiverName: result.receiverName,
      startDate,
      endDate,
      status: 'active',
      verificationId: verification._id,
    });

    logger.info(`Subscription successfully created for User ID: ${userId}, Plan: ${plan}, Reference: ${reference}`);
    return subscription;
  }
}
