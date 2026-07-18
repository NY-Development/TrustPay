import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { Employee } from '../../models/Employee';
import { Branch } from '../../models/Branch';
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
import { JwtRefreshPayload, JwtAccessPayload } from '../../types';
import { sendEmail } from '../../utils/email';
import { NotificationService } from '../../services/notification.service';

/* =========================================================
   OWNER REGISTER WIZARD (CONSOLIDATED FLOW)
========================================================= */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, companyInfo, initialBranch } = req.body;

  // 1. Check if email conflicts with User or Employee
  const existingUser = await User.findOne({ email });
  const existingEmployee = await Employee.findOne({ email });
  if (existingUser || existingEmployee) {
    throw new ConflictError('An account already exists with this email address.');
  }

  // 2. Set up Trial dates
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 5);

  // 3. Create Owner (User)
  const owner = new User({
    name,
    email,
    passwordHash: password, // will hash in pre-save hook
    role: 'OWNER',
    ownerStatus: 'PENDING_LICENSE',
    companyInfo: {
      companyName: companyInfo.companyName,
      companyType: companyInfo.companyType,
      website: companyInfo.website || '',
      country: companyInfo.country,
      region: companyInfo.region,
      city: companyInfo.city,
      address: companyInfo.address,
    },
    trialStartDate: now,
    trialEndDate: trialEnd,
    hasUsedTrial: true,
  });

  await owner.save();

  // 4. Create Initial Branch
  const branch = new Branch({
    ownerId: owner._id,
    branchName: initialBranch.branchName,
    country: initialBranch.country || 'Ethiopia',
    region: initialBranch.region,
    city: initialBranch.city,
    subCity: initialBranch.subCity || '',
    wereda: initialBranch.wereda || '',
    kebele: initialBranch.kebele || '',
    address: initialBranch.address,
    phone: initialBranch.phone,
    email: initialBranch.email,
    status: 'ACTIVE',
    isActive: true,
    accounts: initialBranch.accounts,
  });

  await branch.save();

  // 5. Relate Branch to Owner
  owner.branches.push(branch._id as any);
  await owner.save();

  // 6. Generate Contextual Tokens using the newly created branch ID
  const { accessToken, refreshToken } = generateTokens(owner, 'owner', branch._id.toString());

  owner.refreshToken = refreshToken;
  await owner.save();

  sendAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    message: 'Owner registered successfully with initial branch',
    data: {
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        ownerStatus: owner.ownerStatus,
        companyInfo: owner.companyInfo,
        branches: owner.branches,
        trial: {
          hasUsedTrial: owner.hasUsedTrial,
          trialStartDate: owner.trialStartDate,
          trialEndDate: owner.trialEndDate,
          daysLeft: owner.daysLeft,
        },
      },
      branch,
      accessToken,
      refreshToken,
    },
  });
});

/* =========================================================
   OWNER LOGIN
========================================================= */
export const loginOwner = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, branchCode } = req.body;

  const owner = await User.findOne({ email }).select('+passwordHash +isActive +tokenVersion');
  if (!owner || !owner.isActive) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isMatch = await owner.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Determine active branch context
  let activeBranch;
  if (branchCode) {
    activeBranch = await Branch.findOne({ ownerId: owner._id, branchCode });
    if (!activeBranch) {
      throw new BadRequestError(`Branch with code ${branchCode} not found for this owner.`);
    }
  } else {
    // Default to the first branch
    if (owner.branches.length === 0) {
      throw new BadRequestError('Account onboarding incomplete. No branches registered.');
    }
    activeBranch = await Branch.findById(owner.branches[0]);
    if (!activeBranch) {
      throw new NotFoundError('Owner branch not found.');
    }
  }

  const { accessToken, refreshToken } = generateTokens(owner, 'owner', activeBranch._id.toString());
  owner.refreshToken = refreshToken;
  await owner.save();

  sendAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Owner logged in successfully',
    data: {
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        ownerStatus: owner.ownerStatus,
        companyInfo: owner.companyInfo,
        branches: owner.branches,
        trial: {
          hasUsedTrial: owner.hasUsedTrial,
          trialStartDate: owner.trialStartDate,
          trialEndDate: owner.trialEndDate,
          daysLeft: owner.daysLeft,
        },
      },
      selectedBranch: activeBranch,
      accessToken,
      refreshToken,
    },
  });
});

/* =========================================================
   EMPLOYEE LOGIN
========================================================= */
export const loginEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const employee = await Employee.findOne({ email }).select('+passwordHash +isActive +tokenVersion');
  if (!employee || !employee.isActive || employee.status !== 'ACTIVE') {
    throw new UnauthorizedError('Invalid credentials or account suspended');
  }

  const isMatch = await employee.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const branch = await Branch.findById(employee.branchId);
  if (!branch || branch.status !== 'ACTIVE') {
    throw new UnauthorizedError('Branch context is inactive or suspended');
  }

  const { accessToken, refreshToken } = generateTokens(employee, 'employee', branch._id.toString());
  employee.refreshToken = refreshToken;
  employee.lastLogin = new Date();
  await employee.save();

  sendAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    success: true,
    message: 'Employee logged in successfully',
    data: {
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
        branchId: employee.branchId,
        ownerId: employee.ownerId,
        lastLogin: employee.lastLogin,
      },
      branch,
      accessToken,
      refreshToken,
    },
  });
});

/* =========================================================
   REFRESH (DUAL-ACTOR FLOW)
========================================================= */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies[REFRESH_TOKEN_COOKIE] || req.body.refreshToken;

  if (!token) {
    throw new UnauthorizedError('No refresh token provided');
  }

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;

    // We don't know actorType from refresh payload alone, so let's look up User first then Employee.
    let actor: any = await User.findById(decoded.userId).select('+isActive +tokenVersion +refreshToken');
    let actorType: 'owner' | 'employee' = 'owner';

    if (!actor) {
      actor = await Employee.findById(decoded.userId).select('+isActive +tokenVersion +refreshToken');
      actorType = 'employee';
    }

    if (!actor || !actor.isActive) {
      throw new UnauthorizedError('Account not found or inactive');
    }

    // Sessions checking
    if (actor.tokenVersion !== decoded.tokenVersion || actor.refreshToken !== token) {
      actor.tokenVersion = (actor.tokenVersion ?? 0) + 1;
      actor.refreshToken = undefined;
      await actor.save();

      clearAuthCookies(res);
      throw new UnauthorizedError('Session invalid. Please login again.');
    }

    // Resolve branch selection context
    let selectedBranchId: string | undefined;
    if (actorType === 'owner') {
      // Determine what active branch was set in the access token, or use standard default
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer')) {
        try {
          const accessToken = authHeader.split(' ')[1];
          const decodedAccess = jwt.verify(accessToken, env.JWT_ACCESS_SECRET, { ignoreExpiration: true }) as JwtAccessPayload;
          selectedBranchId = decodedAccess.branchId;
        } catch {}
      }
      if (!selectedBranchId && actor.branches && actor.branches.length > 0) {
        selectedBranchId = actor.branches[0].toString();
      }
    } else {
      selectedBranchId = actor.branchId?.toString();
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(actor, actorType, selectedBranchId);

    actor.refreshToken = newRefreshToken;
    await actor.save();

    sendAuthCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });

  } catch (err) {
    clearAuthCookies(res);
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
});

/* =========================================================
   LOGOUT
========================================================= */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const actorType = req.user?.actorType;

  if (userId && actorType) {
    if (actorType === 'owner') {
      await User.findByIdAndUpdate(userId, {
        refreshToken: null,
        $inc: { tokenVersion: 1 }
      });
    } else {
      await Employee.findByIdAndUpdate(userId, {
        refreshToken: null,
        $inc: { tokenVersion: 1 }
      });
    }
  }

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

/* =========================================================
   ME (CONTEXT-AWARE)
========================================================= */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const actorType = req.user?.actorType;
  const userId = req.user?.userId;

  if (actorType === 'owner') {
    const owner = await User.findById(userId);
    if (!owner) throw new NotFoundError('Owner not found');

    const selectedBranchId = req.user?.branchId;
    const branch = selectedBranchId ? await Branch.findById(selectedBranchId) : null;

    res.status(200).json({
      success: true,
      data: {
        actorType: 'owner',
        user: {
          ...owner.toJSON(),
          trial: {
            hasUsedTrial: owner.hasUsedTrial,
            trialStartDate: owner.trialStartDate,
            trialEndDate: owner.trialEndDate,
            daysLeft: owner.daysLeft,
          },
        },
        branch,
      },
    });
  } else {
    const employee = await Employee.findById(userId);
    if (!employee) throw new NotFoundError('Employee not found');

    const branch = await Branch.findById(employee.branchId);

    res.status(200).json({
      success: true,
      data: {
        actorType: 'employee',
        employee,
        branch,
      },
    });
  }
});

/* =========================================================
   UPDATE PUSH TOKEN
========================================================= */
export const updatePushToken = asyncHandler(async (req: Request, res: Response) => {
  const { pushToken } = req.body;
  if (!pushToken) {
    throw new BadRequestError('Push token is required');
  }

  const actorType = req.user?.actorType;
  const userId = req.user?.userId;

  if (actorType === 'owner') {
    await User.findByIdAndUpdate(userId, { pushToken });
  } else {
    await Employee.findByIdAndUpdate(userId, { pushToken });
  }

  res.status(200).json({
    success: true,
    message: 'Push token updated successfully',
    data: null,
  });
});

/* =========================================================
   PROFILE & SECURITY
========================================================= */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, email } = req.body;
  const userId = req.user?.userId;
  const actorType = req.user?.actorType;

  if (actorType === 'owner') {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('Owner not found');

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      const existingEmployee = await Employee.findOne({ email });
      if (existing || existingEmployee) throw new ConflictError('Email already in use');
      user.email = email;
    }
    if (name) user.name = name;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } else {
    const employee = await Employee.findById(userId);
    if (!employee) throw new NotFoundError('Employee not found');

    if (email && email !== employee.email) {
      const existing = await User.findOne({ email });
      const existingEmployee = await Employee.findOne({ email });
      if (existing || existingEmployee) throw new ConflictError('Email already in use');
      employee.email = email;
    }
    if (name) employee.name = name;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: employee,
    });
  }
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.userId;
  const actorType = req.user?.actorType;

  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters');
  }

  if (actorType === 'owner') {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundError('Owner not found');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

    user.passwordHash = newPassword;
    user.tokenVersion += 1;
    user.refreshToken = undefined;
    await user.save();
  } else {
    const employee = await Employee.findById(userId).select('+passwordHash');
    if (!employee) throw new NotFoundError('Employee not found');

    const isMatch = await employee.comparePassword(currentPassword);
    if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

    employee.passwordHash = newPassword;
    employee.tokenVersion += 1;
    employee.refreshToken = undefined;
    await employee.save();
  }

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    data: null,
  });
});

/* =========================================================
   FORGOT / RESET PASSWORD (OWNER FOCUSED)
========================================================= */
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

  await sendEmail(email, 'TrustPay Password Reset', `Your OTP is: ${otp}`);

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
    data: null,
  });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const record = await Otp.findOne({ email });
  if (!record) throw new BadRequestError('OTP expired');

  const valid = await bcrypt.compare(otp, record.otp);
  if (!valid) throw new BadRequestError('Invalid OTP');

  const resetToken = jwt.sign({ email, purpose: 'password_reset' }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  await Otp.deleteMany({ email });

  res.status(200).json({
    success: true,
    message: 'OTP verified',
    data: { resetToken },
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken, password } = req.body;
  if (password.length < 6) {
    throw new BadRequestError('Password too short');
  }

  try {
    const decoded = jwt.verify(resetToken, env.JWT_ACCESS_SECRET) as any;
    if (decoded.purpose !== 'password_reset') {
      throw new BadRequestError('Invalid or expired reset token');
    }
    const user = await User.findOne({ email: decoded.email });
    if (!user) throw new NotFoundError('User not found');

    user.passwordHash = password;
    user.tokenVersion += 1;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: null,
    });
  } catch {
    throw new BadRequestError('Invalid or expired reset token');
  }
});

/* =========================================================
   BRANCH-LEVEL PAYMENT ACCOUNTS (CONTEXT-AWARE)
========================================================= */
export const getAccounts = asyncHandler(async (req: Request, res: Response) => {
  const branchId = req.user?.branchId;
  if (!branchId) {
    throw new BadRequestError('No active branch context selected.');
  }

  const branch = await Branch.findById(branchId);
  if (!branch) throw new NotFoundError('Branch not found');

  res.status(200).json({
    success: true,
    data: branch.accounts,
  });
});

export const addAccount = asyncHandler(async (req: Request, res: Response) => {
  const { accountNumber, accountProvider } = req.body;
  const branchId = req.user?.branchId;

  if (!accountNumber || !accountProvider) {
    throw new BadRequestError('Account number and provider are required');
  }

  if (!branchId) {
    throw new BadRequestError('No active branch context selected.');
  }

  const branch = await Branch.findById(branchId);
  if (!branch) throw new NotFoundError('Branch not found');

  const exists = branch.accounts.some(
    (acc) => acc.accountNumber === accountNumber && acc.accountProvider === accountProvider
  );

  if (exists) {
    throw new ConflictError('Account already exists for this branch');
  }

  branch.accounts.push({ accountNumber, accountProvider });
  await branch.save();

  res.status(200).json({
    success: true,
    message: 'Account added to branch successfully',
    data: branch.accounts,
  });
});

export const updateAccount = asyncHandler(async (req: Request, res: Response) => {
  const { accountNumber, accountProvider, newAccountNumber, newAccountProvider } = req.body;
  const branchId = req.user?.branchId;

  if (!accountNumber || !accountProvider) {
    throw new BadRequestError('Current accountNumber and accountProvider are required');
  }

  if (!branchId) {
    throw new BadRequestError('No active branch context selected.');
  }

  const branch = await Branch.findById(branchId);
  if (!branch) throw new NotFoundError('Branch not found');

  const accountIndex = branch.accounts.findIndex(
    (acc) => acc.accountNumber === accountNumber && acc.accountProvider === accountProvider
  );

  if (accountIndex === -1) {
    throw new NotFoundError('Account not found');
  }

  const duplicate = branch.accounts.some((acc, idx) => {
    if (idx === accountIndex) return false;
    return (
      acc.accountNumber === (newAccountNumber || accountNumber) &&
      acc.accountProvider === (newAccountProvider || accountProvider)
    );
  });

  if (duplicate) {
    throw new ConflictError('Another account on this branch already uses these details');
  }

  branch.accounts[accountIndex] = {
    accountNumber: newAccountNumber || accountNumber,
    accountProvider: newAccountProvider || accountProvider,
  };

  await branch.save();

  res.status(200).json({
    success: true,
    message: 'Account updated successfully',
    data: branch.accounts,
  });
});

export const removeAccount = asyncHandler(async (req: Request, res: Response) => {
  const { accountNumber, accountProvider } = req.body;
  const branchId = req.user?.branchId;

  if (!branchId) {
    throw new BadRequestError('No active branch context selected.');
  }

  const branch = await Branch.findById(branchId);
  if (!branch) throw new NotFoundError('Branch not found');

  const initialLength = branch.accounts.length;
  branch.accounts = branch.accounts.filter(
    (acc) => !(acc.accountNumber === accountNumber && acc.accountProvider === accountProvider)
  );

  if (branch.accounts.length === initialLength) {
    throw new NotFoundError('Account not found');
  }

  await branch.save();

  res.status(200).json({
    success: true,
    message: 'Account removed successfully',
    data: branch.accounts,
  });
});