import { Request, Response } from 'express';
import { VerificationService } from '../../services/verification/verification.service';
import { OcrService } from '../../services/verification/ocr.service';
import { Verification } from '../../models/Verification';
import { Branch } from '../../models/Branch';
import { Employee } from '../../models/Employee';
import { User } from '../../models/User';
import { AuditLog } from '../../models/AuditLog';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ForbiddenError
} from '../../utils/AppError';
import { VerifiedTransaction } from '../../types';
import { AUDIT_ACTIONS } from '../../constants';
import { logger } from '../../config/logger';
import { NotificationService } from '../../services/notification.service';
import { adminAlertService } from '../../services/adminAlert.service';

function safeVerificationPayload(result: any, fallbackProvider: string) {
  return {
    bank: result?.bank || fallbackProvider || 'unknown',
    requestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    verificationSummary: {
      severity: 'success',
      title: 'Verified Transaction',
      description: 'Transaction successfully verified'
    },
    verificationResult: {
      bankSpecific: result?.bankSpecific ?? {},
      settlementAccountMatch: result?.settlementAccountMatch ?? {},
      confirmationHistory: result?.confirmationHistory ?? {}
    }
  };
}

/**
 * Helper to retrieve verifier details and pushToken (User or Employee)
 */
async function getVerifierDetails(userId: string, actorType: string) {
  if (actorType === 'employee') {
    const emp = await Employee.findById(userId);
    return {
      email: emp?.email || 'N/A',
      pushToken: emp?.pushToken,
      name: emp?.name || 'Employee',
      role: emp?.role || 'employee'
    };
  } else {
    const owner = await User.findById(userId);
    return {
      email: owner?.email || 'N/A',
      pushToken: owner?.pushToken,
      name: owner?.name || 'Owner',
      role: owner?.role || 'owner'
    };
  }
}

/**
 * Resolves an existing Verification's original verifier + branch, for
 * admin alert emails — the alert is far more actionable naming the actual
 * person/branch than it is citing a bare Mongo ObjectId.
 */
async function getExistingVerificationContext(existing: { verifiedBy: any; verifiedByType: string; branchId: any; amount: number; currency: string; createdAt: Date }) {
  const [verifiedBy, existingBranch] = await Promise.all([
    getVerifierDetails(existing.verifiedBy?.toString(), existing.verifiedByType),
    Branch.findById(existing.branchId),
  ]);

  return {
    verifiedBy,
    branch: {
      branchName: existingBranch?.branchName || 'Unknown Branch',
      branchCode: existingBranch?.branchCode || 'N/A',
    },
    amount: existing.amount,
    currency: existing.currency,
    verifiedAt: existing.createdAt,
  };
}

/**
 * @desc    Verify payment manually
 * @route   POST /api/v1/verifications/verify
 */
export const verifyManual = asyncHandler(async (req: Request, res: Response) => {
  const { reference, provider: clientProvider, amountExpected } = req.body;
  const userId = req.user?.userId;
  const branchId = req.user?.branchId;
  const actorType = req.user?.actorType || 'owner';

  if (!userId || !branchId) {
    throw new BadRequestError('Authentication context missing branch identifier or user ID.');
  }

  // 1. Fetch active Branch settlement accounts
  const branch = await Branch.findById(branchId);
  if (!branch) {
    throw new NotFoundError('Branch context not found.');
  }

  // 2. Look up the verifier (Owner or Employee)
  const verifierInfo = await getVerifierDetails(userId, actorType);

  // 3. Check for duplicate (Idempotency)
  const existing = await Verification.findOne({ transactionId: reference.toUpperCase() });
  if (existing) {
    getExistingVerificationContext(existing).then((existingVerification) =>
      adminAlertService.sendSuspiciousActivityAlert({
        activityType: 'Double Verification Attempt',
        reference,
        attemptedBy: verifierInfo,
        branch: { branchName: branch.branchName, branchCode: branch.branchCode },
        existingVerification,
      })
    ).catch(err => logger.error('Alert failed', err));
    throw new ConflictError('This transaction reference has already been verified.');
  }

  const resolvedProvider = clientProvider || VerificationService.detectProvider(reference);
  const matchingAccount = branch.accounts?.find(acc => acc.accountProvider === resolvedProvider);
  if (!matchingAccount) {
    throw new BadRequestError(`No registered payment account found for provider '${resolvedProvider}' on this branch.`);
  }

  const settlementAccount = matchingAccount.accountNumber;

  let derivedSuffix = '';
  if (resolvedProvider === 'cbe') {
    derivedSuffix = settlementAccount.length >= 8 ? settlementAccount.slice(-8) : settlementAccount;
  } else if (resolvedProvider === 'boa') {
    derivedSuffix = settlementAccount.length >= 5 ? settlementAccount.slice(-5) : settlementAccount;
  } else {
    derivedSuffix = settlementAccount.length >= 4 ? settlementAccount.slice(-4) : settlementAccount;
  }

  const derivedPhone = (resolvedProvider === 'cbebirr' || resolvedProvider === 'kaafiebirr') ? settlementAccount : undefined;

  // 4. Perform Verification via Verify.ET
  const result: VerifiedTransaction = await VerificationService.verifyWithProvider({
    provider: resolvedProvider,
    reference,
    suffix: derivedSuffix,
    accountSuffix: derivedSuffix,
    phoneNumber: derivedPhone,
    settlementAccount,
  });

  if (!result.verified) {
    await logAudit(req, AUDIT_ACTIONS.VERIFY_PAYMENT_FAILED, { reference, provider: resolvedProvider, error: 'Provider reported invalid reference', branchId });
    adminAlertService.sendVerificationFailedAlert({
      referenceNumber: reference,
      reason: 'Provider reported invalid reference',
      amount: amountExpected || 0,
      provider: resolvedProvider,
      branch: { branchName: branch.branchName, branchCode: branch.branchCode },
      attemptedBy: verifierInfo,
    }).catch(err => logger.error('Alert failed', err));
    throw new BadRequestError('Payment verification failed. Invalid reference.');
  }

  // 5. Settlement Account Match Check
  if (result.settlementAccountMatch && !result.verified) {
    await logAudit(req, AUDIT_ACTIONS.VERIFY_PAYMENT_FAILED, {
      reference,
      provider: resolvedProvider,
      error: `Settlement account mismatch: ${result.settlementAccountMatch.reason}`,
      settlementAccountMatch: result.settlementAccountMatch,
      branchId
    });
    adminAlertService.sendVerificationFailedAlert({
      referenceNumber: reference,
      reason: `Settlement account mismatch: ${result.settlementAccountMatch.reason}`,
      amount: result.amount || 0,
      provider: resolvedProvider,
      branch: { branchName: branch.branchName, branchCode: branch.branchCode },
      attemptedBy: verifierInfo,
    }).catch(err => logger.error('Alert failed', err));
    throw new BadRequestError(
      `Settlement account mismatch. Reason: ${result.settlementAccountMatch.reason}`
    );
  }

  // 6. Amount Validation
  if (amountExpected && result.amount < amountExpected) {
    throw new BadRequestError(`Amount mismatch. Expected: ${amountExpected}, Verified: ${result.amount}`);
  }

  // 7. Save and return
  const safe = safeVerificationPayload(result, resolvedProvider);

  const verification = await Verification.create({
    transactionId: result.referenceNumber.toUpperCase(),
    referenceNumber: result.referenceNumber.toUpperCase(),
    requestId: safe.requestId,
    bank: safe.bank,
    provider: resolvedProvider,
    amount: result.amount || 0,
    currency: result.currency || 'ETB',
    senderName: result.senderName || 'Unknown',
    receiverName: result.receiverName || 'Unknown',
    receiverAccount: result?.bankSpecific?.receiverAccount || undefined,
    accountSuffix: result.accountSuffix || '',
    paymentDate: result.timestamp || new Date(),
    verified: true,
    processingStatus: 'completed',
    verificationStatus: 'success',
    source: 'manual',
    verificationSummary: safe.verificationSummary,
    verificationResult: safe.verificationResult,
    providerResponse: result?.raw || {},
    verifiedBy: userId,
    verifiedByType: actorType,
    branchId: branchId
  });

  await logAudit(req, AUDIT_ACTIONS.VERIFY_PAYMENT, { verificationId: verification._id, reference, branchId });

  // Send Push Notification
  if (verifierInfo.pushToken) {
    NotificationService.sendNotification(
      verifierInfo.pushToken,
      'Payment Verified',
      `Transaction ${result.referenceNumber} of ${result.amount} ${result.currency} was successful.`
    ).catch(err => logger.error('Push notification failed', err));
  }

  res.status(200).json({
    success: true,
    message: 'Transaction successfully verified',
    data: verification
  });
});

/**
 * @desc    Verify payment from OCR text (Screenshot Capture)
 * @route   POST /api/v1/verifications/verify-ocr
 */
export const verifyOcr = asyncHandler(async (req: Request, res: Response) => {
  const { rawText, amountExpected } = req.body;
  const userId = req.user?.userId;
  const branchId = req.user?.branchId;
  const actorType = req.user?.actorType || 'owner';

  if (!userId || !branchId) {
    throw new BadRequestError('Authentication context missing branch identifier or user ID.');
  }

  // 1. Extract transaction info
  const extracted = await OcrService.extract(rawText);
  if (!extracted.transactionId) {
    throw new BadRequestError('Could not extract transaction ID from the text. Please enter manually.');
  }

  // 2. Fetch active Branch settlement accounts
  const branch = await Branch.findById(branchId);
  if (!branch) {
     throw new NotFoundError('Branch context not found.');
  }

  // 3. Look up the verifier (Owner or Employee)
  const verifierInfo = await getVerifierDetails(userId, actorType);

  // 4. Check for duplicate
  const existing = await Verification.findOne({ transactionId: extracted.transactionId.toUpperCase() });
  if (existing) {
    getExistingVerificationContext(existing).then((existingVerification) =>
      adminAlertService.sendSuspiciousActivityAlert({
        activityType: 'Double OCR Verification Attempt',
        reference: extracted.transactionId!,
        attemptedBy: verifierInfo,
        branch: { branchName: branch.branchName, branchCode: branch.branchCode },
        existingVerification,
      })
    ).catch(err => logger.error('Alert failed', err));
    throw new ConflictError('Transaction already processed.');
  }

  const detectedProvider = extracted.provider || VerificationService.detectProvider(extracted.transactionId);
  const matchingAccount = branch.accounts?.find(acc => acc.accountProvider === detectedProvider);
  const settlementAccount = matchingAccount?.accountNumber || branch.accounts?.[0]?.accountNumber;

  if (!settlementAccount) {
    throw new BadRequestError('No registered payment account found on this branch.');
  }

  const resolvedProvider = matchingAccount?.accountProvider || detectedProvider;

  let derivedSuffix = '';
  if (resolvedProvider === 'cbe') {
    derivedSuffix = settlementAccount.length >= 8 ? settlementAccount.slice(-8) : settlementAccount;
  } else if (resolvedProvider === 'boa') {
    derivedSuffix = settlementAccount.length >= 5 ? settlementAccount.slice(-5) : settlementAccount;
  } else {
    derivedSuffix = settlementAccount.length >= 4 ? settlementAccount.slice(-4) : settlementAccount;
  }

  const derivedPhone = (resolvedProvider === 'cbebirr' || resolvedProvider === 'kaafiebirr') ? settlementAccount : undefined;

  // 5. Perform Verification via Verify.ET
  const result = await VerificationService.verifyWithProvider({
    provider: resolvedProvider,
    reference: extracted.transactionId,
    suffix: derivedSuffix,
    accountSuffix: derivedSuffix,
    phoneNumber: derivedPhone,
    settlementAccount
  });

  if (!result.verified) {
    adminAlertService.sendVerificationFailedAlert({
      referenceNumber: extracted.transactionId!,
      reason: 'OCR verification reported invalid on provider check',
      amount: extracted.amount || amountExpected || 0,
      provider: resolvedProvider,
      branch: { branchName: branch.branchName, branchCode: branch.branchCode },
      attemptedBy: verifierInfo,
    }).catch(err => logger.error('Alert failed', err));
    throw new BadRequestError('Extracted reference is invalid or could not be verified.');
  }

  // 6. Settlement Account Match Check
  if (result.settlementAccountMatch && !result.verified) {
    adminAlertService.sendVerificationFailedAlert({
      referenceNumber: extracted.transactionId!,
      reason: `OCR settlement account mismatch: ${result.settlementAccountMatch.reason}`,
      amount: result.amount || 0,
      provider: resolvedProvider,
      branch: { branchName: branch.branchName, branchCode: branch.branchCode },
      attemptedBy: verifierInfo,
    }).catch(err => logger.error('Alert failed', err));
    throw new BadRequestError(
      `Settlement account mismatch. Reason: ${result.settlementAccountMatch.reason}`
    );
  }

  // 7. Save and return
  const safe = safeVerificationPayload(result, resolvedProvider);

  const verification = await Verification.create({
    transactionId: result.referenceNumber.toUpperCase(),
    referenceNumber: result.referenceNumber.toUpperCase(),
    requestId: safe.requestId,
    bank: safe.bank,
    provider: resolvedProvider,
    amount: result.amount || 0,
    currency: result.currency || 'ETB',
    senderName: result.senderName || 'Unknown',
    receiverName: result.receiverName || 'Unknown',
    receiverAccount: result?.bankSpecific?.receiverAccount || undefined,
    accountSuffix: result.accountSuffix || '',
    paymentDate: result.timestamp || new Date(),
    verified: true,
    processingStatus: 'completed',
    verificationStatus: 'success',
    source: 'ocr',
    rawText: rawText,
    verificationSummary: safe.verificationSummary,
    verificationResult: safe.verificationResult,
    providerResponse: result?.raw || {},
    verifiedBy: userId,
    verifiedByType: actorType,
    branchId: branchId
  });

  await logAudit(req, AUDIT_ACTIONS.VERIFY_PAYMENT, { verificationId: verification._id, reference: extracted.transactionId, branchId });

  // Send Push Notification
  if (verifierInfo.pushToken) {
    NotificationService.sendNotification(
      verifierInfo.pushToken,
      'OCR Verification Success',
      `Transaction ${result.referenceNumber} verified for ${result.amount} ${result.currency}.`
    ).catch(err => logger.error('Push notification failed', err));
  }

  res.status(200).json({ success: true, data: verification, extracted });
});

/**
 * @desc    Get verification history for a branch context.
 *          Owner: all owned branches, or a single owned branch via ?branchId=.
 *          Employee: always restricted to their assigned branch.
 * @route   GET /api/v1/verifications/business-history
 */
export const getBusinessVerifications = asyncHandler(async (req: Request, res: Response) => {
  const { actorType, userId, branchId } = req.user || {};

  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 15;
  const provider = req.query.provider as string;
  const requestedBranchId = req.query.branchId as string | undefined;
  const skipIndex = (page - 1) * limit;

  const query: any = {};

  if (actorType === 'owner') {
    // Owner queries their owned branches (all, or a single selected branch)
    const branches = await Branch.find({ ownerId: userId }).select('_id');
    const ownedIds = branches.map(b => b._id.toString());

    if (requestedBranchId && requestedBranchId !== 'all') {
      if (!ownedIds.includes(requestedBranchId)) {
        throw new ForbiddenError('Access Denied: You do not own this branch.');
      }
      query.branchId = requestedBranchId;
    } else {
      query.branchId = { $in: branches.map(b => b._id) };
    }
  } else {
    // Employees are always restricted to their branch context (param ignored)
    query.branchId = branchId;
  }

  if (provider && provider !== 'all') {
    query.provider = provider.toLowerCase();
  }

  const totalCount = await Verification.countDocuments(query);
  const verifications = await Verification.find(query)
    .sort({ createdAt: -1 })
    .skip(skipIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: verifications,
    pagination: {
      totalItems: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skipIndex + verifications.length < totalCount
    }
  });
});

/**
 * @desc    Get verification history for the authenticated user only (with server pagination and filters)
 * @route   GET /api/v1/verifications/my-history
 */
export const getMyVerifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 15;
  const provider = req.query.provider as string;
  const skipIndex = (page - 1) * limit;

  const filterQuery: any = {
    verifiedBy: req.user?.userId
  };

  if (provider && provider !== 'all') {
    filterQuery.provider = provider.toLowerCase();
  }

  const totalCount = await Verification.countDocuments(filterQuery);
  const verifications = await Verification.find(filterQuery)
    .sort({ createdAt: -1 })
    .skip(skipIndex)
    .limit(limit);

  res.status(200).json({
    success: true,
    data: verifications,
    pagination: {
      totalItems: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skipIndex + verifications.length < totalCount
    }
  });
});

/**
 * @desc    Get verification details by ID
 * @route   GET /api/v1/verifications/:id
 */
export const getVerificationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { actorType, userId, branchId } = req.user || {};

  const verification = await Verification.findById(id);
  if (!verification) {
    throw new NotFoundError('Verification record not found.');
  }

  // Permission validation
  if (actorType === 'owner') {
    const branch = await Branch.findById(verification.branchId);
    if (!branch || branch.ownerId.toString() !== userId) {
      throw new ForbiddenError('Access Denied: You do not own the branch associated with this verification.');
    }
  } else {
    if (verification.branchId.toString() !== branchId) {
      throw new ForbiddenError('Access Denied: You are not assigned to the branch associated with this verification.');
    }
  }

  res.status(200).json({
    success: true,
    data: verification
  });
});

// Helper for audit logging
async function logAudit(req: Request, action: string, metadata: any) {
  try {
    await AuditLog.create({
      action,
      actor: req.user?.userId,
      actorType: req.user?.actorType || 'owner',
      branchId: req.user?.branchId,
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      appVersion: req.headers['x-app-version'],
      userAgent: req.headers['user-agent'],
      metadata
    });
  } catch (err) {
    logger.error('Failed to save audit log', err);
  }
}