// Shared configuration — single source of truth for auth/OIDC settings
export const getConfig = () => ({
  issuer: process.env.AUTHENTIK_ISSUER || 'https://auth.theflux.life/application/o/luby/',
  clientId: process.env.AUTHENTIK_CLIENT_ID || 'luby-api',
  clientSecret: process.env.AUTHENTIK_CLIENT_SECRET || '',
  apiBaseUrl: process.env.API_BASE_URL || 'http://10.0.110.27:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://10.0.110.27:3000',
});
