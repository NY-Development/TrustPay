import { sendEmail } from '../utils/email';
import { ADMIN_EMAIL } from '../constants';

export const adminAlertService = {
  sendVerificationFailedAlert: async (
    verificationId: string,
    referenceNumber: string,
    reason: string,
    amount: number,
    provider: string
  ) => {
    const subject = `⚠️ TrustPay Alert: Verification Failure - Reference #${referenceNumber}`;
    const text = `A payment verification check failed in the system.\n\nVerification Database ID: ${verificationId}\nReference Number: ${referenceNumber}\nAmount: ${amount} ETB\nProvider: ${provider}\nReason/Outcome: ${reason}\n\nTime of Event: ${new Date().toISOString()}\n\nThis is an automated alert dispatched to admin contacts.`;
    await sendEmail(ADMIN_EMAIL, subject, text);
  },

  sendSuspiciousActivityAlert: async (
    activityType: string,
    details: string
  ) => {
    const subject = `🚨 TrustPay Alert: Suspicious Activity - ${activityType}`;
    const text = `Suspicious activity was captured by the threat monitoring middleware.\n\nEvent Type: ${activityType}\nEvent Details:\n${details}\n\nTime of Event: ${new Date().toISOString()}\n\nPlease verify system logs for trace details immediately.`;
    await sendEmail(ADMIN_EMAIL, subject, text);
  }
};
export default adminAlertService;
