import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { logger } from '../../config/logger';

/**
 * Service to handle push notifications via Expo
 */
export class NotificationService {
  private static expo = new Expo();

  static async sendPushNotification(pushToken: string, title: string, body: string, data: any = {}) {
    if (!Expo.isExpoPushToken(pushToken)) {
      logger.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const messages: ExpoPushMessage[] = [{
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    }];

    try {
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];
      
      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }
      
      logger.info('Push notification sent successfully');
    } catch (error) {
      logger.error('Error sending push notification', error);
    }
  }
}
