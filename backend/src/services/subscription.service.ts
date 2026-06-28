import { Subscription, ISubscription } from '../models/Subscription';
import { User } from '../models/User';
import { VerificationService } from './verification/verification.service';
import { Verification } from '../models/Verification';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import { SUBSCRIPTION_PRICING, SUBSCRIPTION_RECEIVER_NAME } from '../constants';
import { logger } from '../config/logger';

export interface SubscriptionResult {
  subscription: ISubscription;
  message: string;
  fullyPaid: boolean;
  remainingAmount: number;
}

export class SubscriptionService {
  /**
   * Check if a user currently has an active OR partial_payment subscription.
   * Auto-expires past subscriptions if they are still marked active.
   */
  static async checkActiveSubscription(userId: string): Promise<ISubscription | null> {
    // Check for active subscription first
    const activeSub = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'partial_payment'] },
    });

    if (!activeSub) {
      return null;
    }

    // Expiry check (only for active subscriptions, not partial_payment)
    if (activeSub.status === 'active' && new Date() > activeSub.endDate) {
      activeSub.status = 'expired';
      await activeSub.save();
      logger.info(`Subscription ${activeSub._id} for user ${userId} has expired.`);
      return null;
    }

    return activeSub;
  }

  /**
   * Verify subscription payment reference via Verify.ET, validate payee/payer,
   * and create subscription. Handles exact, partial, and over-payment.
   */
  static async verifySubscriptionPayment(
    userId: string,
    reference: string,
    plan: 'monthly' | 'yearly'
  ): Promise<SubscriptionResult> {
    // 1. Double check user
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    // 2. Prevent duplication of active subscription
    const currentActive = await SubscriptionService.checkActiveSubscription(userId);
    if (currentActive && currentActive.status === 'active') {
      throw new BadRequestError('You already have an active subscription.');
    }
    if (currentActive && currentActive.status === 'partial_payment') {
      throw new BadRequestError('You already have a pending partial payment. Please use the top-up option to complete your payment.');
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

    // 7. Make a standard Verification model record
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

    // 8. Determine payment status and create subscription accordingly
    const paidAmount = result.amount;
    const startDate = new Date(result.paymentDate);
    const endDate = new Date(startDate.getTime() + pricing.durationDays * 24 * 60 * 60 * 1000);

    if (paidAmount < expectedAmount) {
      // ── UNDERPAYMENT: Create partial_payment subscription ──
      const remainingAmount = expectedAmount - paidAmount;

      const subscription = await Subscription.create({
        userId: user._id,
        plan,
        amount: expectedAmount,
        paidAmount,
        requiredAmount: expectedAmount,
        fullyPaid: false,
        currency: result.currency,
        transactionId: result.transactionId.toUpperCase(),
        payerName: result.payerName,
        receiverName: result.receiverName,
        startDate,
        endDate,
        status: 'partial_payment',
        verificationId: verification._id,
      });

      logger.info(`Partial payment subscription created for User ID: ${userId}. Paid: ${paidAmount}, Remaining: ${remainingAmount}`);

      return {
        subscription,
        message: `Partial payment received. You paid ${paidAmount} ETB out of ${expectedAmount} ETB for the ${plan} plan. Please send the remaining ${remainingAmount} ETB to complete your subscription and use the "Complete Payment" option with the new transaction reference.`,
        fullyPaid: false,
        remainingAmount,
      };
    } else if (paidAmount > expectedAmount) {
      // ── OVERPAYMENT: Accept but warn about refund ──
      const overpaidAmount = paidAmount - expectedAmount;

      const subscription = await Subscription.create({
        userId: user._id,
        plan,
        amount: expectedAmount,
        paidAmount,
        requiredAmount: expectedAmount,
        fullyPaid: true,
        currency: result.currency,
        transactionId: result.transactionId.toUpperCase(),
        payerName: result.payerName,
        receiverName: result.receiverName,
        startDate,
        endDate,
        status: 'active',
        verificationId: verification._id,
      });

      logger.info(`Overpayment subscription created for User ID: ${userId}. Paid: ${paidAmount}, Expected: ${expectedAmount}, Excess: ${overpaidAmount}`);

      return {
        subscription,
        message: `Subscription activated successfully! However, you overpaid by ${overpaidAmount} ETB. Please contact us through the Contact screen if you would like to request a refund for the excess amount.`,
        fullyPaid: true,
        remainingAmount: 0,
      };
    } else {
      // ── EXACT PAYMENT ──
      const subscription = await Subscription.create({
        userId: user._id,
        plan,
        amount: expectedAmount,
        paidAmount,
        requiredAmount: expectedAmount,
        fullyPaid: true,
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

      return {
        subscription,
        message: 'Subscription payment verified and activated successfully.',
        fullyPaid: true,
        remainingAmount: 0,
      };
    }
  }

  /**
   * Top-up a partial_payment subscription with an additional payment reference.
   */
  static async topUpSubscriptionPayment(
    userId: string,
    reference: string
  ): Promise<SubscriptionResult> {
    // 1. Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    // 2. Find the partial_payment subscription
    const partialSub = await Subscription.findOne({
      userId,
      status: 'partial_payment',
    });

    if (!partialSub) {
      throw new BadRequestError('No pending partial payment subscription found. Please start a new subscription.');
    }

    // 3. Prevent duplicate reference usage
    const existingTx = await Subscription.findOne({ transactionId: reference.toUpperCase() });
    const existingTopUp = await Verification.findOne({ transactionId: reference.toUpperCase() });
    if (existingTx || existingTopUp) {
      throw new BadRequestError('This transaction reference has already been used.');
    }

    // 4. Resolve provider & verify
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

    // 5. Validate payer name
    const payerNameNormalized = result.payerName.replace(/\s+/g, ' ').trim().toLowerCase();
    const userNameNormalized = user.name.replace(/\s+/g, ' ').trim().toLowerCase();
    const matchesUser = payerNameNormalized.includes(userNameNormalized) || userNameNormalized.includes(payerNameNormalized);
    if (!matchesUser) {
      throw new BadRequestError(`Payer name verification failed. Transaction registered to '${result.payerName}', but your account name is '${user.name}'.`);
    }

    // 6. Validate receiver name
    const receiverNameNormalized = (result.receiverName || '').replace(/\s+/g, ' ').trim().toUpperCase();
    const expectedReceiver = SUBSCRIPTION_RECEIVER_NAME.toUpperCase();
    if (!receiverNameNormalized.includes(expectedReceiver)) {
      throw new BadRequestError(`Receiver name verification failed. Payment was sent to '${result.receiverName || 'Unknown'}', but must be sent to '${expectedReceiver}'.`);
    }

    // 7. Record the top-up verification
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

    // 8. Update the subscription
    const newPaidAmount = partialSub.paidAmount + result.amount;
    partialSub.paidAmount = newPaidAmount;
    partialSub.topUpVerificationIds.push(verification._id);

    if (newPaidAmount >= partialSub.requiredAmount) {
      // Fully paid — activate subscription
      partialSub.status = 'active';
      partialSub.fullyPaid = true;
      
      // Reset start/end dates from this completion point
      const now = new Date();
      const pricing = SUBSCRIPTION_PRICING[partialSub.plan];
      partialSub.startDate = now;
      partialSub.endDate = new Date(now.getTime() + pricing.durationDays * 24 * 60 * 60 * 1000);
      
      await partialSub.save();

      const overpaid = newPaidAmount - partialSub.requiredAmount;
      let message = 'Payment completed! Your subscription is now active.';
      if (overpaid > 0) {
        message = `Payment completed! Your subscription is now active. You overpaid by ${overpaid} ETB. Please contact us through the Contact screen if you would like to request a refund.`;
      }

      logger.info(`Subscription ${partialSub._id} fully paid and activated for user ${userId}. Total Paid: ${newPaidAmount}`);

      return {
        subscription: partialSub,
        message,
        fullyPaid: true,
        remainingAmount: 0,
      };
    } else {
      // Still partial
      const remainingAmount = partialSub.requiredAmount - newPaidAmount;
      await partialSub.save();

      logger.info(`Top-up received for subscription ${partialSub._id}. New total: ${newPaidAmount}. Still remaining: ${remainingAmount}`);

      return {
        subscription: partialSub,
        message: `Top-up payment of ${result.amount} ETB received. Total paid: ${newPaidAmount} ETB. You still need to send ${remainingAmount} ETB to activate your ${partialSub.plan} subscription.`,
        fullyPaid: false,
        remainingAmount,
      };
    }
  }
}
