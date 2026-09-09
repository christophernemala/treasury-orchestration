import { randomBytes } from 'node:crypto';

const developmentSecret = randomBytes(32).toString('hex');

// Unset and unrecognized environments fail closed as well as production.
export function isDevelopment() {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
}

export function runtimeConfig() {
  const development = isDevelopment();
  const configuredSecret = process.env.AUTH_SECRET;
  if (process.env.JWT_SECRET) throw new Error('JWT_SECRET is unsupported; configure AUTH_SECRET instead');
  if ((!development || configuredSecret) && (!configuredSecret || configuredSecret.length < 32 || /\s|replace|example|change.?me/i.test(configuredSecret) || new Set(configuredSecret).size < 8)) {
    throw new Error('AUTH_SECRET must be a non-placeholder secret of at least 32 characters');
  }
  if (!development && process.env.DEV_OTP) throw new Error('DEV_OTP must not be configured outside development');
  const origins = (process.env.CLIENT_ORIGIN ?? (development ? 'http://127.0.0.1:5173,http://localhost:5173' : '')).split(',').map(value => value.trim());
  if (origins.some(origin => {
    try {
      const url = new URL(origin);
      return url.origin !== origin || url.username !== '' || url.password !== '' ||
        (development ? !['http:', 'https:'].includes(url.protocol) : url.protocol !== 'https:') ||
        origin.includes('*') || (!development && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
    } catch { return true; }
  })) throw new Error('CLIENT_ORIGIN must contain exact browser origins (HTTPS outside development), without paths or wildcards');
  return { development, secret: configuredSecret || developmentSecret, origins };
}
