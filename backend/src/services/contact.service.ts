import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { sendEmail } from '../utils/email';
import { ADMIN_EMAIL } from '../constants';
import { NotFoundError, BadRequestError } from '../utils/AppError';
import { logger } from '../config/logger';

interface ContactRequest {
  subject: string;
  message: string;
  category: 'refund' | 'support' | 'feedback' | 'other';
}

export class ContactService {
  /**
   * Submit a contact request. Sends a detailed email to the admin
   * with all user information and their subscription status.
   */
  static async submitContactRequest(userId: string, request: ContactRequest): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    if (!request.subject?.trim() || !request.message?.trim()) {
      throw new BadRequestError('Subject and message are required.');
    }

    // Fetch user's subscription info
    const subscriptions = await Subscription.find({ userId }).sort({ createdAt: -1 }).limit(5);
    const activeSub = subscriptions.find(s => s.status === 'active' || s.status === 'partial_payment');

    // Build detailed user info section
    const accountsList = user.accounts?.map(
      (acc, i) => `  Account ${i + 1}: ${acc.accountNumber} (${acc.accountProvider})`
    ).join('\n') || '  No accounts registered';

    const subscriptionInfo = activeSub
      ? `  Plan: ${activeSub.plan}
  Status: ${activeSub.status}
  Fully Paid: ${activeSub.fullyPaid ? 'Yes' : 'No'}
  Paid Amount: ${activeSub.paidAmount} ETB
  Required Amount: ${activeSub.requiredAmount} ETB
  ${activeSub.status === 'partial_payment' ? `Remaining: ${activeSub.requiredAmount - activeSub.paidAmount} ETB` : ''}
  Transaction ID: ${activeSub.transactionId}
  Payer Name: ${activeSub.payerName}
  Receiver Name: ${activeSub.receiverName}
  Start Date: ${activeSub.startDate?.toISOString() || 'N/A'}
  End Date: ${activeSub.endDate?.toISOString() || 'N/A'}
  Created: ${activeSub.createdAt?.toISOString() || 'N/A'}`
      : '  No active subscription';

    const subscriptionHistory = subscriptions
      .map((s, i) => `  ${i + 1}. [${s.status}] ${s.plan} — ${s.paidAmount}/${s.requiredAmount} ETB — Tx: ${s.transactionId} — ${s.createdAt?.toISOString() || 'N/A'}`)
      .join('\n') || '  No subscription history';

    const emailBody = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT REQUEST — ${request.category.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 REQUEST DETAILS
  Subject: ${request.subject}
  Category: ${request.category}
  Date: ${new Date().toISOString()}

💬 MESSAGE
${request.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 USER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  User ID: ${user._id}
  Full Name: ${user.name}
  Email: ${user.email}
  Role: ${user.role}
  Account Active: ${user.isActive ? 'Yes' : 'No'}
  Owner Status: ${user.ownerStatus || 'N/A'}
  Branches: ${user.branches?.join(', ') || 'None'}
  Push Token: ${user.pushToken || 'Not registered'}
  Registered: ${user.createdAt?.toISOString() || 'N/A'}
  Last Updated: ${user.updatedAt?.toISOString() || 'N/A'}

💳 SETTLEMENT ACCOUNTS
${accountsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 CURRENT SUBSCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${subscriptionInfo}

📜 SUBSCRIPTION HISTORY (Last 5)
${subscriptionHistory}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
End of Contact Request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    const emailSubject = `[TrustPay Contact] ${request.category.toUpperCase()}: ${request.subject}`;

    const sent = await sendEmail(ADMIN_EMAIL, emailSubject, emailBody);

    if (!sent) {
      logger.error(`Failed to send contact email for user ${userId}`);
      throw new BadRequestError('Failed to send your message. Please try again later.');
    }

    logger.info(`Contact request submitted by user ${userId}. Category: ${request.category}, Subject: ${request.subject}`);
  }
}
