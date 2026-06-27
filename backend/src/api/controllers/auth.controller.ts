import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { Otp } from '../../models/Otp';
import { env } from '../../config/env';
import { asyncHandler } from '../../utils/asyncHandler';
import { generateTokens, sendAuthCookies, clearAuthCookies } from '../../utils/auth';
import { UnauthorizedError, ConflictError, NotFoundError, BadRequestError } from '../../utils/AppError';
import { REFRESH_TOKEN_COOKIE } from '../../constants';
import { JwtRefreshPayload } from '../../types';
import { sendEmail } from '../../utils/email';
import { NotificationService } from '../../services/notification.service';

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, accounts, businessId, branchId } = req.body;

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
    accounts,
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
    data: { user, accessToken, refreshToken },
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
    data: { user, accessToken, refreshToken },
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
      accessToken,
      refreshToken: newRefreshToken,
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

/**
 * @desc    Update push token
 * @route   PATCH /api/v1/auth/push-token
 * @access  Private
 */
export const updatePushToken = asyncHandler(async (req: Request, res: Response) => {
  const { pushToken } = req.body;

  if (!pushToken) {
    throw new NotFoundError('Push token is required');
  }

  const user = await User.findById(req.user?.userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  user.pushToken = pushToken;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Push token updated successfully',
  });
});

/**
 * @desc    Request a password reset OTP
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError('Email address is required.');
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError('No account found with this email address.');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Clear existing OTP tokens for this email
  await Otp.deleteMany({ email });

  // Store new OTP
  await Otp.create({
    email,
    otp: hashedOtp,
    expiresAt,
  });

  // Dispatch OTP email
  await sendEmail(
    email,
    'Reset Your TrustPay Password',
    `Hello ${user.name},\n\nYou requested a password reset on TrustPay. Use the recovery OTP below to verify your identity:\n\n${otp}\n\nThis verification code is valid for 10 minutes.`
  );

  // Also send push notification if user has a registered push token
  if (user.pushToken) {
    await NotificationService.sendNotification(
      user.pushToken,
      '🔐 Password Reset Requested',
      `A password reset OTP has been sent to ${email}. Check your email for the 6-digit code.`,
      { type: 'PASSWORD_RESET' }
    );
  }

  res.status(200).json({
    success: true,
    message: 'Verification OTP has been sent to your email address.',
  });
});

/**
 * @desc    Verify password reset OTP
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new BadRequestError('Email and verification OTP are required.');
  }

  const record = await Otp.findOne({ email });
  if (!record) {
    throw new BadRequestError('Verification code expired or invalid.');
  }

  const isMatch = await bcrypt.compare(otp, record.otp);
  if (!isMatch) {
    throw new BadRequestError('Invalid verification OTP.');
  }

  // Create recovery JWT
  const resetToken = jwt.sign({ email }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

  // Delete validated OTP to refuse reuse
  await Otp.deleteMany({ email });

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully.',
    resetToken,
  });
});

/**
 * @desc    Reset password using reset token
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken, password } = req.body;

  if (!resetToken || !password) {
    throw new BadRequestError('Reset token and new password are required.');
  }

  if (password.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters.');
  }

  try {
    const decoded = jwt.verify(resetToken, env.JWT_ACCESS_SECRET) as { email: string };
    
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      throw new NotFoundError('Target user not found.');
    }

    user.passwordHash = password; // pre-save hooks will bcrypt this automatically
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. Please login with your new credentials.',
    });
  } catch (error) {
    throw new BadRequestError('Password reset link is invalid or expired.');
  }
});
