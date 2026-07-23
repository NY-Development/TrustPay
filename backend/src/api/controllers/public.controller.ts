import { Request, Response } from 'express';
import { User } from '../../models/User';
import { Branch } from '../../models/Branch';
import { Verification } from '../../models/Verification';
import { asyncHandler } from '../../utils/asyncHandler';
import { ROLES } from '../../constants';

/**
 * A short-lived in-memory cache for the public stats payload. This endpoint
 * has no auth and is meant to be hit from the marketing site/app on every
 * page load, so it's worth avoiding a half-dozen aggregation queries per
 * request — the numbers only need to be "roughly live", not real-time.
 */
let cache: { data: any; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

/**
 * @desc    Public, unauthenticated platform statistics — powers the
 *          marketing site (landing/about) and the auth screens' stats panel.
 * @route   GET /api/v1/public/stats
 * @access  Public
 */
export const getPublicStats = asyncHandler(async (_req: Request, res: Response) => {
  if (cache && cache.expiresAt > Date.now()) {
    res.status(200).json({ success: true, message: 'Public stats retrieved successfully', data: cache.data });
    return;
  }

  const [
    companies,
    branches,
    totalVerifications,
    verifiedCount,
    volumeAgg,
    countries,
    companiesByTypeAgg,
    verificationsByProviderAgg,
    trustedCompanies,
    earliestOwner,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.OWNER }),
    Branch.countDocuments({ status: 'ACTIVE' }),
    Verification.countDocuments({}),
    Verification.countDocuments({ verified: true }),
    Verification.aggregate([
      { $match: { verified: true } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Branch.distinct('country'),
    User.aggregate([
      { $match: { role: ROLES.OWNER, 'companyInfo.companyType': { $exists: true, $ne: null } } },
      { $group: { _id: '$companyInfo.companyType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Verification.aggregate([
      { $group: { _id: '$provider', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    User.find({
      role: ROLES.OWNER,
      ownerStatus: 'ACTIVE',
      'companyInfo.companyName': { $exists: true, $ne: '' },
    })
      .sort({ createdAt: 1 })
      .limit(12)
      .select('companyInfo.companyName companyInfo.companyType companyInfo.city companyInfo.region'),
    User.findOne({ role: ROLES.OWNER }).sort({ createdAt: 1 }).select('createdAt'),
  ]);

  const verifiedAmount = volumeAgg[0]?.total || 0;
  const successRate = totalVerifications > 0 ? Math.round((verifiedCount / totalVerifications) * 1000) / 10 : 0;

  const data = {
    companies,
    branches,
    verifications: totalVerifications,
    verifiedAmount,
    successRate,
    countriesServed: countries.filter(Boolean).length,
    companiesByType: companiesByTypeAgg.map((c) => ({ type: c._id, count: c.count })),
    verificationsByProvider: verificationsByProviderAgg.map((v) => ({ provider: v._id, count: v.count })),
    trustedCompanies: trustedCompanies.map((u: any) => ({
      name: u.companyInfo?.companyName,
      type: u.companyInfo?.companyType,
      city: u.companyInfo?.city,
      region: u.companyInfo?.region,
    })),
    platformLaunchYear: earliestOwner?.createdAt ? new Date(earliestOwner.createdAt).getFullYear() : new Date().getFullYear(),
  };

  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };

  res.status(200).json({ success: true, data });
});
