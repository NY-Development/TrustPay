import { Subscription, ISubscription } from '../models/Subscription';
import { User } from '../models/User';
import { VerificationService } from './verification/verification.service';
import { Verification } from '../models/Verification';
import { BadRequestError, NotFoundError } from '../utils/AppError';
import { SUBSCRIPTION_PRICING, SUBSCRIPTION_RECEIVER_NAME } from '../constants';
import { logger } from '../config/logger';
import { VerifiedTransaction } from '../types';

export interface SubscriptionResult {
  subscription: ISubscription;
  message: string;
  fullyPaid: boolean;
  remainingAmount: number;
}

export class SubscriptionService {

  static async checkActiveSubscription(userId: string): Promise<ISubscription | null> {
    const activeSub = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'partial_payment'] },
    });

    if (!activeSub) return null;

    if (activeSub.status === 'active' && new Date() > activeSub.endDate) {
      activeSub.status = 'expired';
      await activeSub.save();
      logger.info(`Subscription ${activeSub._id} expired for user ${userId}`);
      return null;
    }

    return activeSub;
  }

  static async verifySubscriptionPayment(
    userId: string,
    reference: string,
    plan: 'monthly' | 'yearly'
  ): Promise<SubscriptionResult> {

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found.');

    const currentActive = await this.checkActiveSubscription(userId);

    if (currentActive?.status === 'active') {
      throw new BadRequestError('You already have an active subscription.');
    }

    if (currentActive?.status === 'partial_payment') {
      throw new BadRequestError('Complete existing partial payment first.');
    }

    const existingTx = await Subscription.findOne({
      transactionId: reference.toUpperCase(),
    });

    if (existingTx) {
      throw new BadRequestError('Transaction already used.');
    }

    const detectedProvider = VerificationService.detectProvider(reference);

    const matchingAccount = user.accounts?.find(
      acc => acc.accountProvider === detectedProvider
    );

    const settlementAccount =
      matchingAccount?.accountNumber || user.accounts?.[0]?.accountNumber;

    if (!settlementAccount) {
      throw new BadRequestError('No settlement account found.');
    }

    const resolvedProvider =
      matchingAccount?.accountProvider || user.accounts?.[0]?.accountProvider || 'cbe';

    let derivedSuffix = '';

    if (resolvedProvider === 'cbe') {
      derivedSuffix = settlementAccount.slice(-8);
    } else if (resolvedProvider === 'boa') {
      derivedSuffix = settlementAccount.slice(-5);
    } else {
      derivedSuffix = settlementAccount.slice(-4);
    }

    const pricing = SUBSCRIPTION_PRICING[plan];
    const expectedAmount = pricing.amount;

    logger.info(`Verifying subscription ${reference} for ${plan}`);

    const result = await VerificationService.verifyWithProvider({
      provider: resolvedProvider,
      reference,
      suffix: derivedSuffix,
      accountSuffix: derivedSuffix,
      settlementAccount,
    });

    if (!result.verified) {
      throw new BadRequestError('Verification failed.');
    }

    // =========================
    // FIXED: use senderName only
    // =========================
    const payerNameNormalized = (result.senderName || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const userNameNormalized = user.name
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const payerWords = payerNameNormalized.split(' ').filter((w: string) => w.length > 1);
    const userWords = userNameNormalized.split(' ').filter((w: string) => w.length > 1);

    const commonWords = payerWords.filter((w: string) =>
      userWords.includes(w)
    );

    const matchesUser =
      payerNameNormalized.includes(userNameNormalized) ||
      userNameNormalized.includes(payerNameNormalized) ||
      commonWords.length >= 2;

    if (!matchesUser) {
      throw new BadRequestError('Payer name mismatch.');
    }

    // =========================
    // FIXED receiver validation
    // =========================
    const receiverNameNormalized = (result.receiverName || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    const expectedReceiver = SUBSCRIPTION_RECEIVER_NAME.toUpperCase();

    if (!receiverNameNormalized.includes(expectedReceiver)) {
      throw new BadRequestError('Receiver mismatch.');
    }

    // =========================
    // FIXED: Mongo Verification model
    // =========================
    const verification = await Verification.create({
      transactionId: result.referenceNumber.toUpperCase(),
      referenceNumber: result.referenceNumber?.toUpperCase() || reference.toUpperCase(),
      provider: result.bank,
      amount: result.amount,
      currency: result.currency,
      payerName: result.senderName,
      receiverName: result.receiverName,
      receiverAccount: result.bankSpecific?.receiverAccount,
      paymentDate: result.timestamp,
      verified: true,
      verifiedBy: user._id,
      businessId: user.businessId,
      branchId: user.branchId,
      source: 'manual',
      rawResponse: result,
      status: 'completed',
    });

    const paidAmount = result.amount;
    const startDate = new Date(result.timestamp);
    const endDate = new Date(
      startDate.getTime() + pricing.durationDays * 86400000
    );

    // =========================
    // UNDERPAYMENT
    // =========================
    if (paidAmount < expectedAmount) {
      const remainingAmount = expectedAmount - paidAmount;

      const subscription = await Subscription.create({
        userId: user._id,
        plan,
        amount: expectedAmount,
        paidAmount,
        requiredAmount: expectedAmount,
        fullyPaid: false,
        currency: result.currency,
        transactionId: result.referenceNumber.toUpperCase(),
        payerName: result.senderName,
        receiverName: result.receiverName,
        startDate,
        endDate,
        status: 'partial_payment',
        verificationId: verification._id,
      });

      return {
        subscription,
        message: `Partial payment. Remaining ${remainingAmount}`,
        fullyPaid: false,
        remainingAmount,
      };
    }

    // =========================
    // OVERPAYMENT
    // =========================
    if (paidAmount > expectedAmount) {
      const overpaid = paidAmount - expectedAmount;

      const subscription = await Subscription.create({
        userId: user._id,
        plan,
        amount: expectedAmount,
        paidAmount,
        requiredAmount: expectedAmount,
        fullyPaid: true,
        currency: result.currency,
        transactionId: result.referenceNumber.toUpperCase(),
        payerName: result.senderName,
        receiverName: result.receiverName,
        startDate,
        endDate,
        status: 'active',
        verificationId: verification._id,
      });

      return {
        subscription,
        message: `Overpaid by ${overpaid}`,
        fullyPaid: true,
        remainingAmount: 0,
      };
    }

    // =========================
    // EXACT PAYMENT
    // =========================
    const subscription = await Subscription.create({
      userId: user._id,
      plan,
      amount: expectedAmount,
      paidAmount,
      requiredAmount: expectedAmount,
      fullyPaid: true,
      currency: result.currency,
      transactionId: result.referenceNumber.toUpperCase(),
      payerName: result.senderName,
      receiverName: result.receiverName,
      startDate,
      endDate,
      status: 'active',
      verificationId: verification._id,
    });

    return {
      subscription,
      message: 'Subscription activated',
      fullyPaid: true,
      remainingAmount: 0,
    };
  }
}