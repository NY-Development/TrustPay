import { Request, Response } from 'express';
import { Branch } from '../../models/Branch';
import { asyncHandler } from '../../utils/asyncHandler';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/AppError';
import { ROLES } from '../../constants';

/**
 * @desc    Get all branches for a business
 * @route   GET /api/v1/branches
 * @access  Private
 */
export const getBranches = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user?.businessId || req.query.businessId;

  if (!businessId) {
    throw new BadRequestError('Business ID is required');
  }

  // Authorization: Only Super Admin or users of that business
  if (req.user?.role !== ROLES.SUPER_ADMIN && req.user?.businessId !== businessId) {
    throw new ForbiddenError();
  }

  const branches = await Branch.find({ businessId });

  res.status(200).json({
    success: true,
    data: branches,
  });
});

/**
 * @desc    Create branch
 * @route   POST /api/v1/branches
 * @access  Private (ADMIN, MANAGER)
 */
export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.user?.businessId || req.body.businessId;

  if (!businessId) {
    throw new BadRequestError('Business ID is required');
  }

  // Only allow Admin/Manager to create branch for their own business
  if (req.user?.role !== ROLES.SUPER_ADMIN && req.user?.businessId !== businessId) {
    throw new ForbiddenError();
  }

  const branch = await Branch.create({
    ...req.body,
    businessId,
  });

  res.status(201).json({
    success: true,
    data: branch,
  });
});

/**
 * @desc    Update branch
 * @route   PATCH /api/v1/branches/:id
 * @access  Private (ADMIN, MANAGER)
 */
export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  const branch = await Branch.findById(req.params.id);

  if (!branch) {
    throw new NotFoundError('Branch not found');
  }

  // Authorization
  if (req.user?.role !== ROLES.SUPER_ADMIN && req.user?.businessId !== branch.businessId.toString()) {
    throw new ForbiddenError();
  }

  Object.assign(branch, req.body);
  await branch.save();

  res.status(200).json({
    success: true,
    data: branch,
  });
});
