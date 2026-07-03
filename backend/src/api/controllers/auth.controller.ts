import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { Otp } from '../../models/Otp';
import { env } from '../../config/env';
import { asyncHandler } from '../../utils/asyncHandler';
import { generateTokens, sendAuthCookies, clearAuthCookies } from '../../utils/auth';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError
} from '../../utils/AppError';
import { REFRESH_TOKEN_COOKIE } from '../../constants';
import { JwtRefreshPayload } from '../../types';
import { sendEmail } from '../../utils/email';
import { NotificationService } from '../../services/notification.service';

/* =========================================================
   REGISTER
========================================================= */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, accounts, businessId, branchId } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ConflictError('User already exists with this email');

  const user = await User.create({
    name,
    email,
    passwordHash: password,
    role,
    accounts,
    businessId,
    branchId,
  });

  const { accessToken, refreshToken } = generateTokens(user);

  user.refreshToken = refreshToken;
  user.tokenVersion = user.tokenVersion ?? 0;
  await user.save();

  sendAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
});

/* =========================================================
   LOGIN
========================================================= */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash +isActive +tokenVersion');
  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const { accessToken, refreshToken } = generateTokens(user);

  user.refreshToken = refreshToken;
  await user.save();

  sendAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
});

/* =========================================================
   REFRESH (MOBILE OPTIMIZED)
========================================================= */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies[REFRESH_TOKEN_COOKIE] || req.body.refreshToken;

  if (!token) {
    throw new UnauthorizedError('No refresh token provided');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;

    const user = await User.findById(decoded.userId).select(
      '+isActive +tokenVersion +refreshToken'
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // 🔐 Token reuse detection
    if (
      user.tokenVersion !== decoded.tokenVersion ||
      user.refreshToken !== token
    ) {
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      user.refreshToken = undefined;
      await user.save();

      clearAuthCookies(res);

      throw new UnauthorizedError('Session invalid. Please login again.');
    }

    const { accessToken, refreshToken: newRefreshToken } =
      generateTokens(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    sendAuthCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user,
        accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (err) {
    clearAuthCookies(res);
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
});

/* =========================================================
   LOGOUT (SECURE + MULTI-DEVICE SAFE)
========================================================= */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (userId) {
    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
      $inc: { tokenVersion: 1 } // invalidate all sessions
    });
  }

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null
  });
});

/* =========================================================
   ME
========================================================= */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId);

  if (!user) throw new NotFoundError('User not found');

  res.status(200).json({
    success: true,
    data: { user }
  });
});

/* =========================================================
   PUSH TOKEN
========================================================= */
export const updatePushToken = asyncHandler(async (req: Request, res: Response) => {
  const { pushToken } = req.body;

  if (!pushToken) {
    throw new BadRequestError('Push token is required');
  }

  const user = await User.findById(req.user?.userId);
  if (!user) throw new NotFoundError('User not found');

  user.pushToken = pushToken;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Push token updated successfully',
    data: null
  });
});

/* =========================================================
   FORGOT PASSWORD
========================================================= */
// (UNCHANGED — kept stable)
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) throw new BadRequestError('Email is required');

  const user = await User.findOne({ email });
  if (!user) throw new NotFoundError('No account found');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await Otp.deleteMany({ email });

  await Otp.create({
    email,
    otp: hashedOtp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendEmail(
    email,
    'TrustPay Password Reset',
    `Your OTP is: ${otp}`
  );

  if (user.pushToken) {
    await NotificationService.sendNotification(
      user.pushToken,
      'Password Reset OTP',
      'Check your email for the OTP',
      { type: 'PASSWORD_RESET' }
    );
  }

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: null
  });
});

/* =========================================================
   VERIFY OTP
========================================================= */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const record = await Otp.findOne({ email });
  if (!record) throw new BadRequestError('OTP expired');

  const valid = await bcrypt.compare(otp, record.otp);
  if (!valid) throw new BadRequestError('Invalid OTP');

  const resetToken = jwt.sign(
    { email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  await Otp.deleteMany({ email });

  res.status(200).json({
    success: true,
    message: 'OTP verified',
    data: { resetToken }
  });
});

/* =========================================================
   RESET PASSWORD
========================================================= */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken, password } = req.body;

  if (password.length < 6) {
    throw new BadRequestError('Password too short');
  }

  try {
    const decoded = jwt.verify(resetToken, env.JWT_ACCESS_SECRET) as any;

    const user = await User.findOne({ email: decoded.email });
    if (!user) throw new NotFoundError('User not found');

    user.passwordHash = password;
    user.tokenVersion += 1; // invalidate old sessions
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: null
    });

  } catch {
    throw new BadRequestError('Invalid or expired reset token');
  }
});