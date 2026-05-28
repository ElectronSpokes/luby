import * as jose from 'jose';
import { getConfig } from '../config';
import { getJwks } from '../middleware/auth';

const TOKEN_ENDPOINT = 'https://auth.theflux.life/application/o/token/';

export interface TokenExchangeResult {
  accessToken: string;
  idToken: string;
  expiresIn: number;
  claims: jose.JWTPayload;
}

export class TokenExchangeError extends Error {
  constructor(message: string, public readonly upstreamBody?: string) {
    super(message);
    this.name = 'TokenExchangeError';
  }
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<TokenExchangeResult> {
  const config = getConfig();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
  });
  if (codeVerifier) body.set('code_verifier', codeVerifier);

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenResponse.ok) {
    const errBody = await tokenResponse.text();
    throw new TokenExchangeError(
      `Token exchange failed: ${tokenResponse.status}`,
      errBody,
    );
  }

  const tokens = (await tokenResponse.json()) as {
    access_token: string;
    id_token: string;
    expires_in: number;
  };

  const jwks = await getJwks();
  const { payload } = await jose.jwtVerify(tokens.id_token, jwks, {
    issuer: config.issuer,
    audience: config.clientId,
  });

  return {
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    expiresIn: tokens.expires_in,
    claims: payload,
  };
}
