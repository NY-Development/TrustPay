import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { User } from '../../models/User';
import { Branch } from '../../models/Branch';
import { Employee } from '../../models/Employee';
import { Verification } from '../../models/Verification';
import { Subscription } from '../../models/Subscription';
import { AuditLog } from '../../models/AuditLog';
import Notification from '../../models/Notification';
import { NotFoundError, BadRequestError } from '../../utils/AppError';
import { NotificationService } from '../../services/notification.service';
import { sendEmail } from '../../utils/email';

export const adminController = {
  // ─── Owner Trading License Approval Management ──────────────────────

  getPendingLicenses: asyncHandler(async (req: Request, res: Response) => {
    const pendingOwners = await User.find({
      role: 'OWNER',
      ownerStatus: 'PENDING_LICENSE',
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pendingOwners,
    });
  }),

  approveLicense: asyncHandler(async (req: Request, res: Response) => {
    const { ownerId } = req.params;

    const owner = await User.findById(ownerId);
    if (!owner) throw new NotFoundError('Owner not found');
    if (owner.ownerStatus !== 'PENDING_LICENSE') {
      throw new BadRequestError(`Cannot approve owner in ${owner.ownerStatus} status.`);
    }

    owner.ownerStatus = 'ACTIVE';
    owner.isActive = true;
    await owner.save();

    // Log administrative action
    await AuditLog.create({
      action: 'APPROVE_LICENSE',
      actor: req.user?.userId,
      actorType: 'admin',
      metadata: { targetOwnerId: ownerId, email: owner.email, name: owner.name },
    });

    // Notify the owner
    try {
      await sendEmail(
        owner.email,
        'TrustPay: Trading License Approved',
        `Hello ${owner.name},\n\nWe are pleased to inform you that your trading license has been verified and approved. Your TrustPay business dashboard is now fully active!`
      );

      if (owner.pushToken) {
        await NotificationService.sendNotification(
          owner.pushToken,
          'Trading License Approved',
          'Your account is now fully active',
          { type: 'LICENSE_APPROVAL_SUCCESS' }
        );
      }
    } catch (err) {
      console.error('Failed to send license approval notifications:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Owner license approved and account activated successfully.',
      data: owner,
    });
  }),

  rejectLicense: asyncHandler(async (req: Request, res: Response) => {
    const { ownerId } = req.params;
    const { reason } = req.body;

    const owner = await User.findById(ownerId);
    if (!owner) throw new NotFoundError('Owner not found');
    if (owner.ownerStatus !== 'PENDING_LICENSE') {
      throw new BadRequestError(`Cannot reject owner in ${owner.ownerStatus} status.`);
    }

    owner.ownerStatus = 'REJECTED';
    owner.isActive = false;
    await owner.save();

    // Log administrative action
    await AuditLog.create({
      action: 'REJECT_LICENSE',
      actor: req.user?.userId,
      actorType: 'admin',
      metadata: { targetOwnerId: ownerId, email: owner.email, name: owner.name, reason },
    });

    // Notify the owner
    try {
      await sendEmail(
        owner.email,
        'TrustPay: Trading License Rejected',
        `Hello ${owner.name},\n\nYour trading license upload has been rejected for the following reason:\n\n${reason || 'Document was illegible or invalid.'}\n\nPlease log in to re-upload your valid credentials.`
      );

      if (owner.pushToken) {
        await NotificationService.sendNotification(
          owner.pushToken,
          'Trading License Rejected',
          reason || 'Document was illegible or invalid.',
          { type: 'LICENSE_APPROVAL_FAILURE' }
        );
      }
    } catch (err) {
      console.error('Failed to send license rejection notifications:', err);
    }

    res.status(200).json({
      success: true,
      message: 'Owner license rejected and notifications dispatched.',
      data: owner,
    });
  }),

  suspendOwner: asyncHandler(async (req: Request, res: Response) => {
    const { ownerId } = req.params;

    const owner = await User.findById(ownerId);
    if (!owner) throw new NotFoundError('Owner not found');

    owner.ownerStatus = 'SUSPENDED';
    owner.isActive = false;
    owner.tokenVersion += 1; // force logout
    await owner.save();

    // Cascade suspend to all this owner's branches
    await Branch.updateMany({ ownerId }, { status: 'SUSPENDED', isActive: false });

    // Cascade suspend to all this owner's employees
    await Employee.updateMany(
      { ownerId },
      { status: 'SUSPENDED', isActive: false, $inc: { tokenVersion: 1 } }
    );

    // Log administrative action
    await AuditLog.create({
      action: 'SUSPEND_OWNER',
      actor: req.user?.userId,
      actorType: 'admin',
      metadata: { targetOwnerId: ownerId, email: owner.email, name: owner.name },
    });

    res.status(200).json({
      success: true,
      message: 'Owner, associated branches, and employees suspended successfully.',
      data: owner,
    });
  }),

  restoreOwner: asyncHandler(async (req: Request, res: Response) => {
    const { ownerId } = req.params;

    const owner = await User.findById(ownerId);
    if (!owner) throw new NotFoundError('Owner not found');

    owner.ownerStatus = 'ACTIVE';
    owner.isActive = true;
    await owner.save();

    // Restore owner's branches and employees
    await Branch.updateMany({ ownerId }, { status: 'ACTIVE', isActive: true });
    await Employee.updateMany({ ownerId }, { status: 'ACTIVE', isActive: true });

    // Log administrative action
    await AuditLog.create({
      action: 'RESTORE_OWNER',
      actor: req.user?.userId,
      actorType: 'admin',
      metadata: { targetOwnerId: ownerId, email: owner.email, name: owner.name },
    });

    res.status(200).json({
      success: true,
      message: 'Owner, associated branches, and employees restored successfully.',
      data: owner,
    });
  }),

  // ─── Users ─────────────────────────────────────────────────────────

  getUsers: asyncHandler(async (req: Request, res: Response) => {
    const { role, isActive, search, ownerStatus } = req.query;
    const filter: any = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (ownerStatus) filter.ownerStatus = ownerStatus;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  }),

  getUserById: asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    res.status(200).json({
      success: true,
      data: user,
    });
  }),

  updateUser: asyncHandler(async (req: Request, res: Response) => {
    const { name, email, role, isActive, companyInfo, ownerStatus } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (companyInfo !== undefined) user.companyInfo = companyInfo;
    if (ownerStatus !== undefined) user.ownerStatus = ownerStatus;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  }),

  deleteUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    // Cascade delete any branches and employees associated
    await Branch.deleteMany({ ownerId: req.params.id });
    await Employee.deleteMany({ ownerId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'User and all associated assets permanently deleted from registry',
    });
  }),

  // ─── Verifications ──────────────────────────────────────────────────

  getVerifications: asyncHandler(async (req: Request, res: Response) => {
    const { status, severity, provider, source } = req.query;
    const filter: any = {};

    if (status) filter.processingStatus = status;
    if (severity) filter['verificationSummary.severity'] = severity;
    if (provider) filter.provider = provider;
    if (source) filter.source = source;

    const verifications = await Verification.find(filter)
      .populate('branchId', 'branchName branchCode')
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      data: verifications,
    });
  }),

  getVerificationById: asyncHandler(async (req: Request, res: Response) => {
    const verification = await Verification.findById(req.params.id).populate('branchId', 'branchName branchCode');
    if (!verification) throw new NotFoundError('Verification not found');

    res.status(200).json({
      success: true,
      data: verification,
    });
  }),

  // ─── Subscriptions ──────────────────────────────────────────────────

  getSubscriptions: asyncHandler(async (req: Request, res: Response) => {
    const { status, plan } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (plan) filter.plan = plan;

    // Populating branchId and ownerId instead of userId
    const subscriptions = await Subscription.find(filter)
      .populate('branchId', 'branchName branchCode')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  }),

  getSubscriptionById: asyncHandler(async (req: Request, res: Response) => {
    // Populating branchId and ownerId
    const subscription = await Subscription.findById(req.params.id)
      .populate('branchId', 'branchName branchCode')
      .populate('ownerId', 'name email');

    if (!subscription) throw new NotFoundError('Subscription not found');

    res.status(200).json({
      success: true,
      data: subscription,
    });
  }),

  updateSubscription: asyncHandler(async (req: Request, res: Response) => {
    const { status, fullyPaid, paidAmount, endDate } = req.body;
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) throw new NotFoundError('Subscription not found');

    if (status !== undefined) subscription.status = status;
    if (fullyPaid !== undefined) subscription.fullyPaid = fullyPaid;
    if (paidAmount !== undefined) subscription.paidAmount = paidAmount;
    if (endDate !== undefined) subscription.endDate = new Date(endDate);

    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: subscription,
    });
  }),

  // ─── Audit Trails & System Logs ──────────────────────────────────────

  getAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const { action, actorId } = req.query;
    const filter: any = {};

    if (action) filter.action = action;
    if (actorId) filter.actor = actorId;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // `actor` has no single ref (it's a User for owner/admin actions, an
    // Employee for employee actions), so resolve display names manually
    // instead of relying on Mongoose populate.
    const userIds = logs.filter((l) => l.actorType !== 'employee').map((l) => l.actor);
    const employeeIds = logs.filter((l) => l.actorType === 'employee').map((l) => l.actor);

    const [users, employees] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('name email'),
      Employee.find({ _id: { $in: employeeIds } }).select('name email'),
    ]);

    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
    const employeeMap = new Map(employees.map((e: any) => [e._id.toString(), e]));

    const enrichedLogs = logs.map((l: any) => {
      const actorDoc = l.actorType === 'employee' ? employeeMap.get(l.actor?.toString()) : userMap.get(l.actor?.toString());
      return {
        ...l,
        actorName: actorDoc?.name || null,
        actorEmail: actorDoc?.email || null,
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedLogs,
    });
  }),

  // ─── Comprehensive System aggregates ─────────────────────────────────

  getSystemStats: asyncHandler(async (req: Request, res: Response) => {
    const totalUsers = await User.countDocuments();
    const totalOwners = await User.countDocuments({ role: 'OWNER' });
    const pendingLicenses = await User.countDocuments({ role: 'OWNER', ownerStatus: 'PENDING_LICENSE' });
    const suspendedOwners = await User.countDocuments({ role: 'OWNER', ownerStatus: 'SUSPENDED' });
    const totalBranches = await Branch.countDocuments();
    const totalVerifications = await Verification.countDocuments();
    const successfulVerifications = await Verification.countDocuments({ verified: true });

    // Revenue calculations
    const activeSubs = await Subscription.find({ status: 'active', fullyPaid: true });
    const totalRevenue = activeSubs.reduce((acc: number, sub: any) => acc + (sub.paidAmount || sub.amount), 0);

    // Threat metrics
    const failedVerifications = await Verification.countDocuments({ processingStatus: 'failed' });
    const fraudThreats = await Verification.countDocuments({ 'verificationSummary.severity': 'fraud_risk' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalOwners,
        pendingLicenses,
        suspendedOwners,
        totalBranches,
        totalVerifications,
        successfulVerifications,
        failedVerifications,
        fraudThreats,
        totalRevenue,
      },
    });
  }),
};
export default adminController;
