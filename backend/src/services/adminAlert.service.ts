import { sendEmail } from '../utils/email';
import { ADMIN_EMAIL } from '../constants';

interface ActorInfo {
  name: string;
  email: string;
  role: string;
}

interface BranchInfo {
  branchName: string;
  branchCode: string;
}

const formatActor = (actor: ActorInfo) => `${actor.name} (${actor.email}) — ${actor.role}`;
const formatBranch = (branch: BranchInfo) => `${branch.branchName} (${branch.branchCode})`;

export const adminAlertService = {
  sendVerificationFailedAlert: async (params: {
    referenceNumber: string;
    reason: string;
    amount: number;
    provider: string;
    branch: BranchInfo;
    attemptedBy: ActorInfo;
  }) => {
    const { referenceNumber, reason, amount, provider, branch, attemptedBy } = params;

    const subject = `⚠️ TrustPay Alert: Verification Failure - Reference #${referenceNumber}`;
    const text = `A payment verification check failed in the system.

Reference Number: ${referenceNumber}
Amount: ${amount} ETB
Provider: ${provider}
Reason/Outcome: ${reason}

Attempted By: ${formatActor(attemptedBy)}
Branch: ${formatBranch(branch)}

Time of Event: ${new Date().toISOString()}

This is an automated alert dispatched to admin contacts.`;
    await sendEmail(ADMIN_EMAIL, subject, text);
  },

  sendSuspiciousActivityAlert: async (params: {
    activityType: string;
    reference: string;
    attemptedBy: ActorInfo;
    branch: BranchInfo;
    existingVerification: {
      verifiedAt: Date;
      amount: number;
      currency: string;
      verifiedBy: ActorInfo;
      branch: BranchInfo;
    };
  }) => {
    const { activityType, reference, attemptedBy, branch, existingVerification } = params;

    const subject = `🚨 TrustPay Alert: Suspicious Activity - ${activityType}`;
    const text = `Suspicious activity was captured by the threat monitoring middleware.

Event Type: ${activityType}
Reference Number: ${reference}

Attempted By: ${formatActor(attemptedBy)}
Attempted From Branch: ${formatBranch(branch)}

This reference was already verified previously:
  Originally Verified By: ${formatActor(existingVerification.verifiedBy)}
  Original Branch: ${formatBranch(existingVerification.branch)}
  Original Amount: ${existingVerification.amount} ${existingVerification.currency}
  Originally Verified At: ${existingVerification.verifiedAt.toISOString()}

Time of Event: ${new Date().toISOString()}

Please verify system logs for trace details immediately.`;
    await sendEmail(ADMIN_EMAIL, subject, text);
  }
};
export default adminAlertService;
