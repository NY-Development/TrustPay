import { Request, Response } from 'express';
import { VerificationService } from '../../services/verification/verification.service';
import { OcrService } from '../../services/verification/ocr.service';
import { Verification } from '../../models/Verification';
import { AuditLog } from '../../models/AuditLog';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  BadRequestError,
  ConflictError,
  NotFoundError
} from '../../utils/AppError';

import { VerifiedTransaction } from '../../types';
import { AUDIT_ACTIONS } from '../../constants';
import { logger } from '../../config/logger';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/User';

/**
 * @desc    Verify payment manually
 * @route   POST /api/v1/verifications/verify
 */
export const verifyManual = asyncHandler(async (req: Request, res: Response) => {
  const { reference, provider: clientProvider, amountExpected, branchId } = req.body;
  const userId = req.user?.userId;

  const existing = await Verification.findOne({
    transactionId: reference.toUpperCase()
  });

  if (existing) {
    throw new ConflictError('This transaction reference has already been verified.');
  }

  const verifier = await User.findById(userId);

  const resolvedProvider =
    clientProvider || VerificationService.detectProvider(reference);

  const matchingAccount = verifier?.accounts?.find(
    acc => acc.accountProvider === resolvedProvider
  );

  if (!matchingAccount) {
    throw new BadRequestError(
      `No registered payment account found for provider '${resolvedProvider}'.`
    );
  }

  const settlementAccount = matchingAccount.accountNumber;

  let derivedSuffix = '';
  if (resolvedProvider === 'cbe') {
    derivedSuffix = settlementAccount.slice(-8);
  } else if (resolvedProvider === 'boa') {
    derivedSuffix = settlementAccount.slice(-5);
  } else {
    derivedSuffix = settlementAccount.slice(-4);
  }

  const result: VerifiedTransaction = await VerificationService.verifyWithProvider({
    provider: resolvedProvider,
    reference,
    suffix: derivedSuffix,
    accountSuffix: derivedSuffix,
    settlementAccount
  });

  if (!result.verified) {
    throw new BadRequestError('Payment verification failed.');
  }

  // ✅ Settlement check (NEW STRUCTURE)
  if (result.settlementAccountMatch?.matched === false) {
    throw new BadRequestError(
      `Settlement mismatch. Expected ${settlementAccount}`
    );
  }

  if (amountExpected && result.amount < amountExpected) {
    throw new BadRequestError(
      `Amount mismatch. Expected ${amountExpected}, got ${result.amount}`
    );
  }

  const verification = await Verification.create({
    transactionId: result.referenceNumber.toUpperCase(),
    referenceNumber: result.referenceNumber,
    provider: result.bank,
    amount: result.amount,
    currency: result.currency,
    payerName: result.senderName,
    receiverName: result.receiverName,
    receiverAccount: result.bankSpecific?.receiverAccount,
    paymentDate: result.timestamp,
    verified: true,
    verifiedBy: userId,
    businessId: req.user?.businessId,
    branchId: branchId || req.user?.branchId,
    source: 'manual',
    rawResponse: result,
    status: 'completed'
  });

  await AuditLog.create({
    action: AUDIT_ACTIONS.VERIFY_PAYMENT,
    actor: userId,
    metadata: { verificationId: verification._id }
  });

  if (verifier?.pushToken) {
    NotificationService.sendNotification(
      verifier.pushToken,
      'Payment Verified',
      `Transaction ${result.referenceNumber} verified.`
    ).catch(err => logger.error(err));
  }

  res.status(200).json({
    success: true,
    message: 'Transaction successfully verified',
    data: verification
  });
});

/**
 * @desc    Verify payment from OCR text
 * @route   POST /api/v1/verifications/verify-ocr
 */
export const verifyOcr = asyncHandler(async (req: Request, res: Response) => {
  const { rawText, branchId } = req.body;
  const userId = req.user?.userId;

  const extracted = await OcrService.extract(rawText);

  if (!extracted.transactionId) {
    throw new BadRequestError('Could not extract transaction ID.');
  }

  const existing = await Verification.findOne({
    transactionId: extracted.transactionId.toUpperCase()
  });

  if (existing) {
    throw new ConflictError('Transaction already processed.');
  }

  const verifier = await User.findById(userId);

  const detectedProvider =
    extracted.provider || VerificationService.detectProvider(extracted.transactionId);

  const matchingAccount = verifier?.accounts?.find(
    acc => acc.accountProvider === detectedProvider
  );

  const settlementAccount =
    matchingAccount?.accountNumber || verifier?.accounts?.[0]?.accountNumber;

  if (!settlementAccount) {
    throw new BadRequestError('No settlement account found.');
  }

  let derivedSuffix = settlementAccount.slice(-4);

  const result: VerifiedTransaction = await VerificationService.verifyWithProvider({
    provider: detectedProvider,
    reference: extracted.transactionId,
    suffix: derivedSuffix,
    accountSuffix: derivedSuffix,
    settlementAccount
  });

  if (!result.verified) {
    throw new BadRequestError('Verification failed.');
  }

  if (result.settlementAccountMatch?.matched === false) {
    throw new BadRequestError('Settlement mismatch detected.');
  }

  const verification = await Verification.create({
    transactionId: result.referenceNumber.toUpperCase(),
    provider: result.bank,
    amount: result.amount,
    currency: result.currency,
    payerName: result.senderName,
    receiverName: result.receiverName,
    receiverAccount: result.bankSpecific?.receiverAccount,
    paymentDate: result.timestamp,
    verified: true,
    verifiedBy: userId,
    businessId: req.user?.businessId,
    branchId: branchId || req.user?.branchId,
    source: 'screenshot',
    rawOcrText: rawText,
    rawResponse: result,
    status: 'completed'
  });

  res.status(200).json({
    success: true,
    data: verification,
    extracted
  });
});

/**
 * @desc Get my history
 */
export const getMyVerifications = asyncHandler(async (req: Request, res: Response) => {
  const verifications = await Verification.find({
    verifiedBy: req.user?.userId
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: verifications
  });
});

/**
 * @desc Get by ID
 */
export const getVerificationById = asyncHandler(async (req: Request, res: Response) => {
  const verification = await Verification.findById(req.params.id);

  if (!verification) {
    throw new NotFoundError('Not found');
  }

  res.json({
    success: true,
    data: verification
  });
});