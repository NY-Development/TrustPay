const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const transports = [
  // Always log to the console (Safe everywhere, including Serverless)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  })
];

// ⚠️ ONLY add file-based rotation when running locally, NOT in production/serverless
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new DailyRotateFile({
      filename: path.join(__dirname, '../../logs/application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: transports,
});