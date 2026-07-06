import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { User } from '../../models/User';
import { Verification } from '../../models/Verification';
import { Subscription } from '../../models/Subscription';
import { AuditLog } from '../../models/AuditLog';
import Notification from '../../models/Notification';
import { NotFoundError, AppError } from '../../utils/AppError';

export const adminController = {
  // ─── Users ─────────────────────────────────────────────────────────
  
  getUsers: asyncHandler(async (req: Request, res: Response) => {
    const { role, isActive, search } = req.query;
    const filter: any = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
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
    const { name, email, role, isActive, accounts } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (accounts !== undefined) user.accounts = accounts;

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

    res.status(200).json({
      success: true,
      message: 'User permanently deleted from registry',
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
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: verifications,
    });
  }),

  getVerificationById: asyncHandler(async (req: Request, res: Response) => {
    const verification = await Verification.findById(req.params.id)
      .populate('verifiedBy', 'name email');
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

    const subscriptions = await Subscription.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  }),

  getSubscriptionById: asyncHandler(async (req: Request, res: Response) => {
    const subscription = await Subscription.findById(req.params.id)
      .populate('userId', 'name email');
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
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      data: logs,
    });
  }),

  // ─── Comprehensive System aggregates ─────────────────────────────────

  getSystemStats: asyncHandler(async (req: Request, res: Response) => {
    const totalUsers = await User.countDocuments();
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
