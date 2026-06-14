import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { env } from '../../config/env';
import { asyncHandler } from '../../utils/asyncHandler';
import { generateTokens, sendAuthCookies, clearAuthCookies } from '../../utils/auth';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../utils/AppError';
import { REFRESH_TOKEN_COOKIE } from '../../constants';
import { JwtRefreshPayload } from '../../types';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, businessId, branchId } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('User already exists with this email');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    passwordHash: password, // Model hashes it in pre-save
    role,
    businessId,
    branchId,
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save();

  // Send cookies
  sendAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ email }).select('+passwordHash +isActive');
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Update refresh token in DB
  user.refreshToken = refreshToken;
  await user.save();

  // Send cookies
  sendAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { user },
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (requires refresh token cookie)
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies[REFRESH_TOKEN_COOKIE] || req.body.refreshToken;

  if (!token) {
    throw new UnauthorizedError('No refresh token provided');
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;

    // Find user
    const user = await User.findById(decoded.userId).select('+isActive +tokenVersion +refreshToken');
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User no longer exists or is inactive');
    }

    // Check if token version matches or if the token is even allowed (revocation)
    if (user.tokenVersion !== decoded.tokenVersion || user.refreshToken !== token) {
      // Token version mismatch suggests token theft or old session
      user.tokenVersion += 1; // Revoke all old tokens
      user.refreshToken = undefined;
      await user.save();
      clearAuthCookies(res);
      throw new UnauthorizedError('Token is no longer valid. Please login again.');
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in DB (rotation)
    user.refreshToken = newRefreshToken;
    await user.save();

    // Send new cookies
    sendAuthCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    clearAuthCookies(res);
    throw new UnauthorizedError('Invalid refresh token');
  }
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});
