import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { logger } from '../../config/logger';

const expo = new Expo();

export const NotificationService = {
  /**
   * Send a push notification to a specific user push token.
   */
  async sendPushNotification(pushToken: string, title: string, body: string, data?: any) {
    if (!Expo.isExpoPushToken(pushToken)) {
      logger.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const tickets = await expo.sendPushNotificationsAsync([message]);
      logger.info('Notification sent successfully:', tickets);
      return tickets;
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw error;
    }
  },

  /**
   * Send notifications to multiple tokens.
   */
  async sendMultiplePushNotifications(tokens: string[], title: string, body: string, data?: any) {
    const messages: ExpoPushMessage[] = [];
    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        logger.error(`Push token ${token} is not a valid Expo push token`);
        continue;
      }

      messages.push({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error('Error sending notification chunk:', error);
      }
    }

    return tickets;
  }
};