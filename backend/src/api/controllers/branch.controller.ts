import { Request, Response } from 'express';
import { Branch } from '../../models/Branch';
import { User } from '../../models/User';
import { Employee } from '../../models/Employee';
import { Subscription } from '../../models/Subscription';
import { asyncHandler } from '../../utils/asyncHandler';
import { generateTokens, sendAuthCookies } from '../../utils/auth';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError
} from '../../utils/AppError';

/**
 * Create a new Branch (Owner Only)
 */
export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.user?.userId;

  const owner = await User.findById(ownerId);
  if (!owner) {
    throw new NotFoundError('Owner not found.');
  }

  // Create the branch - prefix generation is handled inside mongoose pre-save hook
  const branch = new Branch({
    ...req.body,
    ownerId,
    status: 'ACTIVE',
    isActive: true,
  });

  await branch.save();

  // Push branch reference to owner document
  owner.branches.push(branch._id as any);
  await owner.save();

  res.status(201).json({
    success: true,
    message: 'Branch created successfully',
    data: branch,
  });
});

/**
 * List branches under caller's context
 */
export const getBranches = asyncHandler(async (req: Request, res: Response) => {
  const { actorType, userId, branchId } = req.user || {};

  if (actorType === 'owner') {
    // Owner sees all their branches
    const branches = await Branch.find({ ownerId: userId }).sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      data: branches,
    });
  } else {
    // Employee is restricted to their assigned branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new NotFoundError('Branch not found.');
    }
    res.status(200).json({
      success: true,
      data: [branch],
    });
  }
});

/**
 * Get single branch details with count of employees and subscription info
 */
export const getBranchDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { actorType, userId, branchId } = req.user || {};

  const branch = await Branch.findById(id);
  if (!branch) {
    throw new NotFoundError('Branch not found.');
  }

  // Authorization check
  if (actorType === 'owner') {
    if (branch.ownerId.toString() !== userId) {
      throw new ForbiddenError('Access denied: You do not own this branch.');
    }
  } else {
    if (branch._id.toString() !== branchId) {
      throw new ForbiddenError('Access denied: You are not assigned to this branch.');
    }
  }

  // Gather additional stats
  const employeeCount = await Employee.countDocuments({ branchId: branch._id });
  const activeSubscription = await Subscription.findOne({
    branchId: branch._id,
    status: 'active',
  });

  // Calculate remaining trial days
  const owner = await User.findById(branch.ownerId);
  const trialDaysLeft = owner?.trialEndDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(owner.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  res.status(200).json({
    success: true,
    data: {
      ...branch.toJSON(),
      employeeCount,
      subscription: activeSubscription,
      trialDaysLeft,
    },
  });
});

/**
 * Update Branch (Owner Only)
 */
export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ownerId = req.user?.userId;

  const branch = await Branch.findById(id);
  if (!branch) {
    throw new NotFoundError('Branch not found.');
  }

  if (branch.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: You do not own this branch.');
  }

  Object.assign(branch, req.body);
  await branch.save();

  res.status(200).json({
    success: true,
    message: 'Branch updated successfully',
    data: branch,
  });
});

/**
 * Deactivate Branch, cascading to all assigned employees (Owner Only)
 */
export const deactivateBranch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const ownerId = req.user?.userId;

  const branch = await Branch.findById(id);
  if (!branch) {
    throw new NotFoundError('Branch not found.');
  }

  if (branch.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: You do not own this branch.');
  }

  branch.status = 'INACTIVE';
  branch.isActive = false;
  await branch.save();

  // Deactivate all employees assigned to this branch and invalidate logout sessions
  await Employee.updateMany(
    { branchId: branch._id },
    { status: 'INACTIVE', isActive: false, $inc: { tokenVersion: 1 } }
  );

  res.status(200).json({
    success: true,
    message: 'Branch and all associated employees deactivated successfully',
    data: branch,
  });
});

/**
 * Switch Branch Context (Owner Only)
 * Returns new Access/Refresh tokens containing updated selected branch context
 */
export const switchBranch = asyncHandler(async (req: Request, res: Response) => {
  const { branchId } = req.body;
  const ownerId = req.user?.userId;

  const owner = await User.findById(ownerId);
  if (!owner) {
    throw new NotFoundError('Owner not found.');
  }

  // Verify owner owns this branch
  const hasBranch = owner.branches.some((bId) => bId.toString() === branchId.toString());
  if (!hasBranch) {
    throw new ForbiddenError('Access denied: You do not own this branch.');
  }

  const selectedBranch = await Branch.findById(branchId);
  if (!selectedBranch || !selectedBranch.isActive || selectedBranch.status !== 'ACTIVE') {
    throw new BadRequestError('Target branch is currently deactivated or suspended.');
  }

  // Generate tokens with the new branch context
  const { accessToken, refreshToken } = generateTokens(owner, 'owner', branchId);
  owner.refreshToken = refreshToken;
  await owner.save();

  sendAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: `Switched context to branch ${selectedBranch.branchCode} successfully`,
    data: {
      selectedBranch,
      accessToken,
      refreshToken,
    },
  });
});

/* =========================================================
   BRANCH PRIVATE ACCOUNT MANAGEMENT (OWNER DIRECT CRUD)
========================================================= */
export const addBranchAccount = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { accountNumber, accountProvider } = req.body;
  const ownerId = req.user?.userId;

  const branch = await Branch.findById(id);
  if (!branch) {
    throw new NotFoundError('Branch not found.');
  }

  if (branch.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: You do not own this branch.');
  }

  const exists = branch.accounts.some(
    (acc) => acc.accountNumber === accountNumber && acc.accountProvider === accountProvider
  );

  if (exists) {
    throw new BadRequestError('Account already exists on this branch.');
  }

  branch.accounts.push({ accountNumber, accountProvider });
  await branch.save();

  res.status(200).json({
    success: true,
    message: 'Payment account added successfully',
    data: branch.accounts,
  });
});

export const updateBranchAccount = asyncHandler(async (req: Request, res: Response) => {
  const { id, accountId } = req.params;
  const { accountNumber, accountProvider } = req.body;
  const ownerId = req.user?.userId;

  const branch = await Branch.findById(id);
  if (!branch) {
    throw new NotFoundError('Branch not found.');
  }

  if (branch.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: You do not own this branch.');
  }

  const account = branch.accounts.find(
    (acc: any) => acc._id?.toString() === accountId
  );
  if (!account) {
    throw new NotFoundError('Payment account not found on this branch.');
  }

  if (accountNumber) account.accountNumber = accountNumber;
  if (accountProvider) account.accountProvider = accountProvider;

  await branch.save();

  res.status(200).json({
    success: true,
    message: 'Payment account updated successfully',
    data: branch.accounts,
  });
});

export const deleteBranchAccount = asyncHandler(async (req: Request, res: Response) => {
  const { id, accountId } = req.params;
  const ownerId = req.user?.userId;

  const branch = await Branch.findById(id);
  if (!branch) {
    throw new NotFoundError('Branch not found.');
  }

  if (branch.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Access denied: You do not own this branch.');
  }

  const accountIndex = branch.accounts.findIndex(
    (acc: any) => acc._id?.toString() === accountId
  );
  if (accountIndex === -1) {
    throw new NotFoundError('Payment account not found on this branch.');
  }

  branch.accounts.splice(accountIndex, 1);
  await branch.save();

  res.status(200).json({
    success: true,
    message: 'Payment account deleted successfully',
    data: branch.accounts,
  });
});
