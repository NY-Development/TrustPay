import { AuditLog } from '../../models/AuditLog';
import { logger } from '../../config/logger';
import { DeviceInfo } from '../../types';

/**
 * Service to handle audit logging across the system
 */
export class AuditService {
  static async log(params: {
    action: string;
    actor: string;
    ip: string;
    device?: DeviceInfo;
    metadata?: any;
  }) {
    try {
      await AuditLog.create({
        action: params.action,
        actor: params.actor,
        ip: params.ip,
        deviceId: params.device?.deviceId,
        appVersion: params.device?.appVersion,
        userAgent: params.device?.userAgent,
        metadata: params.metadata || {},
      });
    } catch (error) {
      logger.error('Audit Log Error:', error);
    }
  }
}
