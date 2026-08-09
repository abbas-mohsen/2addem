/* Loaded with --import, so it runs before src/config/env.js reads
   process.env. dotenv does not overwrite variables that are already set,
   which is what lets these win over server/.env. */

process.env.NODE_ENV = 'test';

// Always a separate database. Never fall through to whatever MONGODB_URI the
// developer has in .env — these tests drop collections.
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/joinclone_test';

// No Ethereal inbox, no SMTP connection: side effects must not need a network.
process.env.EMAIL_ENABLED = 'false';
process.env.SMTP_HOST = '';

// A suite signs in far more often than a person does. This is the knob the
// rate limiter exists to expose; sleeping between requests is not the fix.
process.env.AUTH_RATE_LIMIT = '100000';

process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-not-for-production';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-not-for-production';
process.env.UPLOAD_DIR ??= 'uploads/test';
