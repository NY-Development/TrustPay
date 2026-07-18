import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Send an email using Brevo SMTP (configured in .env) with nodemailer
 */
export const sendEmail = async (to: string, subject: string, text: string): Promise<boolean> => {
  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SENDER_EMAIL } = env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SENDER_EMAIL) {
      logger.warn('[Email Service] SMTP configuration missing. Fallback log email to console:');
      logger.info(`[MOCK EMAIL TO: ${to}] SUBJECT: ${subject} \nCONTENT: ${text}`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false, // 587 is STARTTLS
      requireTLS: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Verify SMTP connection
    await transporter.verify();
    logger.info('[Email Service] Brevo SMTP connection verified successfully.');

    // Escape user-controlled content (subject/text may originate from the
    // contact form) before interpolating into HTML — otherwise a submitter
    // could inject markup/script into the email rendered for ADMIN_EMAIL.
    const safeSubject = escapeHtml(subject);
    const safeText = escapeHtml(text);

    // Beautiful HTML template utilizing TrustPay color palette (HSL-equivalent hex codes)
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeSubject}</title>
      </head>
      <body style="margin:0; padding:0; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color:#f8fafc; color:#0f172a;">
        <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; border: 1px solid #e2e8f0; box-shadow:0 10px 25px rgba(0,0,0,0.03);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #003ec7 0%, #3b82f6 100%); padding:30px 20px; text-align:center;">
            <h1 style="margin:0; font-size:28px; font-weight:800; color:#ffffff; letter-spacing: -0.5px;">TrustPay</h1>
            <p style="margin:5px 0 0 0; color:rgba(255,255,255,0.8); font-size:14px; font-weight:500;">Secure Settlement & Verification</p>
          </div>

          <!-- Body -->
          <div style="padding:40px 30px;">
            <h2 style="font-size:22px; font-weight:700; margin-top:0; margin-bottom:20px; color:#0f172a;">${safeSubject}</h2>
            <div style="font-size:16px; line-height:1.6; color:#334155; margin-bottom:30px;">
              ${safeText.split('\n').map(paragraph => `<p style="margin:0 0 16px 0;">${paragraph}</p>`).join('')}
            </div>
            
            <table style="width:100%; border-collapse:collapse; margin-top:30px; margin-bottom:10px;">
              <tr>
                <td style="padding:15px; border-radius:12px; background-color:#f1f5f9; border: 1px solid #e2e8f0; text-align:center;">
                  <span style="font-size:13px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Need support?</span>
                  <br/>
                  <a href="mailto:support@trustpay.et" style="color:#003ec7; text-decoration:none; font-weight:700; font-size:15px;">support@trustpay.et</a>
                </td>
              </tr>
            </table>
          </div>

          <!-- Footer -->
          <div style="background-color:#fafafa; border-top: 1px solid #f1f5f9; padding:24px 30px; text-align:center; font-size:12px; color:#94a3b8; line-height: 1.5;">
            <p style="margin:0 0 8px 0; font-weight:600;">TrustPay Inc.</p>
            <p style="margin:0;">&copy; ${new Date().getFullYear()} TrustPay Platform. All rights reserved.</p>
            <p style="margin:8px 0 0 0; font-size:11px; color:#cbd5e1;">If you did not request this email, you can safely ignore this safety alert.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"TrustPay Support" <${SENDER_EMAIL}>`,
      to,
      subject,
      text, // Plain text fallback
      html: htmlTemplate,
    });

    logger.info(`[Email Service] Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('[Email Service] Error sending email via SMTP:', error);
    // Return true for sandbox testing context so login/registration flows don't crash
    return false;
  }
};
