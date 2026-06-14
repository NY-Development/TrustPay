import { Request, Response } from 'express';
import { Business } from '../../models/Business';
import { asyncHandler } from '../../utils/asyncHandler';
import { NotFoundError, ForbiddenError } from '../../utils/AppError';
import { ROLES } from '../../constants';

/**
 * @desc    Get all businesses (Super Admin only)
 * @route   GET /api/v1/businesses
 * @access  Private (SUPER_ADMIN)
 */
export const getBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const businesses = await Business.find();

  res.status(200).json({
    success: true,
    data: businesses,
  });
});

/**
 * @desc    Get single business
 * @route   GET /api/v1/businesses/:id
 * @access  Private
 */
export const getBusiness = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.params.id;

  // Authorization: Only Super Admin or users belonging to this business can see it
  if (req.user?.role !== ROLES.SUPER_ADMIN && req.user?.businessId !== businessId) {
    throw new ForbiddenError();
  }

  const business = await Business.findById(businessId);
  if (!business) {
    throw new NotFoundError('Business not found');
  }

  res.status(200).json({
    success: true,
    data: business,
  });
});

/**
 * @desc    Create business
 * @route   POST /api/v1/businesses
 * @access  Private (SUPER_ADMIN)
 */
export const createBusiness = asyncHandler(async (req: Request, res: Response) => {
  const business = await Business.create(req.body);

  res.status(201).json({
    success: true,
    data: business,
  });
});

/**
 * @desc    Update business
 * @route   PATCH /api/v1/businesses/:id
 * @access  Private (SUPER_ADMIN or ADMIN)
 */
export const updateBusiness = asyncHandler(async (req: Request, res: Response) => {
  const businessId = req.params.id;

  // Authorization
  if (req.user?.role !== ROLES.SUPER_ADMIN && 
     (req.user?.role !== ROLES.ADMIN || req.user?.businessId !== businessId)) {
    throw new ForbiddenError();
  }

  const business = await Business.findByIdAndUpdate(businessId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!business) {
    throw new NotFoundError('Business not found');
  }

  res.status(200).json({
    success: true,
    data: business,
  });
});
