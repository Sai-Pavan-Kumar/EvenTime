export const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  httpOnly: process.env.NODE_ENV === 'production', // local: false, production: true
};