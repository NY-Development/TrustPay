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
/* =========================================================
   REGISTER
========================================================= */
export const register = asyncHandler(async (req: Request, res: Response) => {
  let { name, email, password, role, accounts, businessId, branchId } = req.body;

  // 🛡️ Intercept and force Super Admin profile if the email matches the environment variable
  const isSuperAdminEmail = email?.trim().toLowerCase() === env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  
  if (isSuperAdminEmail) {
    name = 'Yamlak Negash';
    role = 'SUPER_ADMIN';
    // Any other specialized fields for the super admin can go here
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ConflictError('User already exists with this email');

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 5);

  const user = await User.create({
    name,
    email,
    passwordHash: password, // The model hook handles hashing automatically
    role,
    accounts,
    businessId,
    branchId,
    trialStartDate: now,
    trialEndDate: trialEnd,
    hasUsedTrial: true,
  });

  const { accessToken, refreshToken } = generateTokens(user);

  user.refreshToken = refreshToken;
  user.tokenVersion = user.tokenVersion ?? 0;
  await user.save();

  sendAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    message: isSuperAdminEmail ? 'Super Admin registered successfully' : 'User registered successfully',
    data: {
      user: {
        ...user.toJSON(),
        trial: {
          hasUsedTrial: user.hasUsedTrial,
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate,
          daysLeft: user.daysLeft,
        },
      },
      accessToken,
      refreshToken,
    },
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
      user: {
        ...user.toJSON(),
        trial: {
          hasUsedTrial: user.hasUsedTrial,
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate,
          daysLeft: user.daysLeft,
        },
      },
      accessToken,
      refreshToken,
    },
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
    data: {
      user: {
        ...user.toJSON(),
        trial: {
          hasUsedTrial: user.hasUsedTrial,
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate,
          daysLeft: user.daysLeft,
        },
      },
    },
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

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const userId = req.user?.userId;

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) throw new ConflictError('Email already in use');
    user.email = email;
  }

  if (name) user.name = name;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.userId;

  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters');
  }

  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new NotFoundError('User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  user.passwordHash = newPassword;

  // invalidate all sessions
  user.tokenVersion += 1;
  user.refreshToken = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    data: null
  });
});

export const addAccount = asyncHandler(async (req: Request, res: Response) => {
  const { accountNumber, accountProvider } = req.body;
  const userId = req.user?.userId;

  if (!accountNumber || !accountProvider) {
    throw new BadRequestError('Account number and provider are required');
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const exists = user.accounts.some(
    (acc) =>
      acc.accountNumber === accountNumber &&
      acc.accountProvider === accountProvider
  );

  if (exists) {
    throw new ConflictError('Account already exists');
  }

  user.accounts.push({
    accountNumber,
    accountProvider
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Account added successfully',
    data: user.accounts
  });
});

export const updateAccount = asyncHandler(async (req: Request, res: Response) => {
  const { accountNumber, accountProvider, newAccountNumber, newAccountProvider } = req.body;
  const userId = req.user?.userId;

  if (!accountNumber || !accountProvider) {
    throw new BadRequestError('Current accountNumber and accountProvider are required');
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const accountIndex = user.accounts.findIndex(
    (acc) =>
      acc.accountNumber === accountNumber &&
      acc.accountProvider === accountProvider
  );

  if (accountIndex === -1) {
    throw new NotFoundError('Account not found');
  }

  // Prevent duplicates if updating
  const duplicate = user.accounts.some((acc, idx) => {
    if (idx === accountIndex) return false;

    return (
      acc.accountNumber === (newAccountNumber || accountNumber) &&
      acc.accountProvider === (newAccountProvider || accountProvider)
    );
  });

  if (duplicate) {
    throw new ConflictError('Another account already uses these details');
  }

  user.accounts[accountIndex] = {
    accountNumber: newAccountNumber || accountNumber,
    accountProvider: newAccountProvider || accountProvider,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Account updated successfully',
    data: user.accounts,
  });
});

export const removeAccount = asyncHandler(async (req: Request, res: Response) => {
  const { accountNumber, accountProvider } = req.body;
  const userId = req.user?.userId;

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  const initialLength = user.accounts.length;

  user.accounts = user.accounts.filter(
    (acc) =>
      !(
        acc.accountNumber === accountNumber &&
        acc.accountProvider === accountProvider
      )
  );

  if (user.accounts.length === initialLength) {
    throw new NotFoundError('Account not found');
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Account removed successfully',
    data: user.accounts
  });
});

export const getAccounts = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId);

  if (!user) throw new NotFoundError('User not found');

  res.status(200).json({
    success: true,
    data: user.accounts
  });
});