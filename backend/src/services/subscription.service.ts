import { Subscription, ISubscription } from '../models/Subscription';
import { User } from '../models/User';
import { Branch } from '../models/Branch';
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

  static async checkActiveSubscription(branchId: string): Promise<ISubscription | null> {
    const activeSub = await Subscription.findOne({
      branchId,
      status: { $in: ['active', 'partial_payment'] },
    });

    if (!activeSub) return null;

    if (activeSub.status === 'active' && new Date() > activeSub.endDate) {
      activeSub.status = 'expired';
      await activeSub.save();
      logger.info(`Subscription ${activeSub._id} expired for branch ${branchId}`);
      return null;
    }

    return activeSub;
  }

  static async verifySubscriptionPayment(
    branchId: string,
    reference: string,
    plan: 'monthly' | 'yearly'
  ): Promise<SubscriptionResult> {

    const branch = await Branch.findById(branchId);
    if (!branch) throw new NotFoundError('Branch not found.');

    const owner = await User.findById(branch.ownerId);
    if (!owner) throw new NotFoundError('Branch owner not found.');

    const currentActive = await this.checkActiveSubscription(branchId);

    if (currentActive?.status === 'active') {
      throw new BadRequestError('This branch already has an active subscription.');
    }

    if (currentActive?.status === 'partial_payment') {
      throw new BadRequestError('Complete existing partial payment for this branch first.');
    }

    const existingTx = await Subscription.findOne({
      transactionId: reference.toUpperCase(),
    });

    if (existingTx) {
      throw new BadRequestError('Transaction already used for another subscription.');
    }

    const detectedProvider = VerificationService.detectProvider(reference);

    const matchingAccount = branch.accounts?.find(
      acc => acc.accountProvider === detectedProvider
    );

    const settlementAccount =
      matchingAccount?.accountNumber || branch.accounts?.[0]?.accountNumber;

    if (!settlementAccount) {
      throw new BadRequestError('No settlement account setup on this branch.');
    }

    const resolvedProvider =
      matchingAccount?.accountProvider || branch.accounts?.[0]?.accountProvider || 'cbe';

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

    logger.info(`Verifying subscription payment ${reference} for branch ${branch.branchCode} (${plan})`);

    const result = await VerificationService.verifyWithProvider({
      provider: resolvedProvider,
      reference,
      suffix: derivedSuffix,
      accountSuffix: derivedSuffix,
      settlementAccount,
    });

    if (!result.verified) {
      throw new BadRequestError('Verification with payment provider failed.');
    }

    // Payer name validation (should match owner's name)
    const payerNameNormalized = (result.senderName || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const ownerNameNormalized = owner.name
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const payerWords = payerNameNormalized.split(' ').filter((w: string) => w.length > 1);
    const ownerWords = ownerNameNormalized.split(' ').filter((w: string) => w.length > 1);

    const commonWords = payerWords.filter((w: string) =>
      ownerWords.includes(w)
    );

    const matchesOwner =
      payerNameNormalized.includes(ownerNameNormalized) ||
      ownerNameNormalized.includes(payerNameNormalized) ||
      commonWords.length >= 2;

    if (!matchesOwner) {
      throw new BadRequestError('Payer name mismatch with account owner.');
    }

    // Receiver validation
    const receiverNameNormalized = (result.receiverName || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();

    const expectedReceiver = SUBSCRIPTION_RECEIVER_NAME.toUpperCase();

    if (!receiverNameNormalized.includes(expectedReceiver)) {
      throw new BadRequestError('Receiver account name mismatch.');
    }

    // Create Verification record
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
      verifiedBy: owner._id,
      verifiedByType: 'owner',
      branchId: branch._id,
      source: 'manual',
      rawResponse: result,
      status: 'completed',
    });

    const paidAmount = result.amount;
    const startDate = new Date(result.timestamp);
    const endDate = new Date(
      startDate.getTime() + pricing.durationDays * 86400000
    );

    // Underpayment scenario
    if (paidAmount < expectedAmount) {
      const remainingAmount = expectedAmount - paidAmount;

      const subscription = await Subscription.create({
        branchId: branch._id,
        ownerId: owner._id,
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
        message: `Partial payment processed. Remaining due amount: Birr ${remainingAmount}`,
        fullyPaid: false,
        remainingAmount,
      };
    }

    // Overpayment/Exact Scenarios
    const isOverpayment = paidAmount > expectedAmount;
    const overpaid = paidAmount - expectedAmount;

    const subscription = await Subscription.create({
      branchId: branch._id,
      ownerId: owner._id,
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
      message: isOverpayment ? `Subscription activated (overpaid by Birr ${overpaid})` : 'Subscription activated successfully',
      fullyPaid: true,
      remainingAmount: 0,
    };
  }

  static async topUpSubscriptionPayment(
    branchId: string,
    reference: string
  ): Promise<SubscriptionResult> {
    const branch = await Branch.findById(branchId);
    if (!branch) throw new NotFoundError('Branch not found.');

    const owner = await User.findById(branch.ownerId);
    if (!owner) throw new NotFoundError('Branch owner not found.');

    const subscription = await Subscription.findOne({
      branchId,
      status: 'partial_payment',
    });

    if (!subscription) {
      throw new BadRequestError('No partial payment subscription found for this branch.');
    }

    const referenceUpper = reference.toUpperCase();

    // Prevent double verification
    if (subscription.transactionId === referenceUpper) {
      throw new BadRequestError('This reference was already used for the initial partial payment.');
    }

    const existingVerification = await Verification.findOne({
      transactionId: referenceUpper,
    });
    if (existingVerification) {
      throw new BadRequestError('This transaction reference has already been verified or used.');
    }

    const detectedProvider = VerificationService.detectProvider(reference);
    const matchingAccount = branch.accounts?.find(
      acc => acc.accountProvider === detectedProvider
    );

    const settlementAccount =
      matchingAccount?.accountNumber || branch.accounts?.[0]?.accountNumber;

    if (!settlementAccount) {
      throw new BadRequestError('No settlement account found on this branch.');
    }

    const resolvedProvider =
      matchingAccount?.accountProvider || branch.accounts?.[0]?.accountProvider || 'cbe';

    let derivedSuffix = '';
    if (resolvedProvider === 'cbe') {
      derivedSuffix = settlementAccount.slice(-8);
    } else if (resolvedProvider === 'boa') {
      derivedSuffix = settlementAccount.slice(-5);
    } else {
      derivedSuffix = settlementAccount.slice(-4);
    }

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

    // Payer name validation
    const payerNameNormalized = (result.senderName || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const ownerNameNormalized = owner.name
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const payerWords = payerNameNormalized.split(' ').filter((w: string) => w.length > 1);
    const ownerWords = ownerNameNormalized.split(' ').filter((w: string) => w.length > 1);

    const commonWords = payerWords.filter((w: string) =>
      ownerWords.includes(w)
    );

    const matchesOwner =
      payerNameNormalized.includes(ownerNameNormalized) ||
      ownerNameNormalized.includes(payerNameNormalized) ||
      commonWords.length >= 2;

    if (!matchesOwner) {
      throw new BadRequestError('Payer name mismatch.');
    }

    // Receiver validation
    const receiverNameNormalized = (result.receiverName || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const expectedReceiver = SUBSCRIPTION_RECEIVER_NAME.toLowerCase();
    if (!receiverNameNormalized.includes(expectedReceiver)) {
      throw new BadRequestError('Receiver mismatch.');
    }

    // Create Verification record
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
      verifiedBy: owner._id,
      verifiedByType: 'owner',
      branchId: branch._id,
      source: 'manual',
      rawResponse: result,
      status: 'completed',
    });

    // Update subscription balances
    const newPaidAmount = subscription.paidAmount + result.amount;
    subscription.paidAmount = newPaidAmount;
    
    if (subscription.topUpVerificationIds) {
      subscription.topUpVerificationIds.push(verification._id as any);
    } else {
      subscription.topUpVerificationIds = [verification._id as any];
    }

    if (newPaidAmount >= subscription.requiredAmount) {
      subscription.fullyPaid = true;
      subscription.status = 'active';
    }

    await subscription.save();

    return {
      subscription,
      message: subscription.status === 'active' ? 'Subscription fully activated' : `Partial top-up successful. Remaining due balance: Birr ${subscription.requiredAmount - newPaidAmount}`,
      fullyPaid: subscription.fullyPaid,
      remainingAmount: Math.max(0, subscription.requiredAmount - newPaidAmount),
    };
  }
}