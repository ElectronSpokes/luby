/**
 * Vault Integration - Load secrets from HashiCorp Vault
 * Pattern follows dogfood.band (AppRole auth, fallback to env vars)
 * Vault path: secret/data/luby/api
 */

interface VaultResponse {
  data: {
    data: Record<string, string>;
  };
}

interface VaultAuthResponse {
  auth: {
    client_token: string;
  };
}

const SECRET_MAPPING: Record<string, string> = {
  database_url: 'DATABASE_URL',
  gemini_api_key: 'GEMINI_API_KEY',
  authentik_issuer: 'AUTHENTIK_ISSUER',
  authentik_client_id: 'AUTHENTIK_CLIENT_ID',
  authentik_client_secret: 'AUTHENTIK_CLIENT_SECRET',
  session_secret: 'SESSION_SECRET',
};

async function authenticateWithAppRole(
  vaultAddr: string,
  roleId: string,
  secretId: string
): Promise<string> {
  const response = await fetch(`${vaultAddr}/v1/auth/approle/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role_id: roleId, secret_id: secretId }),
  });

  if (!response.ok) {
    throw new Error(`AppRole login failed: ${response.status}`);
  }

  const data: VaultAuthResponse = await response.json();
  return data.auth.client_token;
}

export async function loadSecretsFromVault(): Promise<boolean> {
  if (process.env.VAULT_SKIP_VERIFY === 'true') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const vaultAddr = process.env.VAULT_ADDR;
  const vaultPath = process.env.VAULT_SECRET_PATH || 'secret/data/luby/api';

  let vaultToken = process.env.VAULT_TOKEN;
  const roleId = process.env.VAULT_APPROLE_ROLE_ID;
  const secretId = process.env.VAULT_APPROLE_SECRET_ID;

  if (!vaultAddr) {
    console.log('No Vault config - using environment variables');
    return false;
  }

  if (!vaultToken && (!roleId || !secretId)) {
    console.log('No Vault credentials - using environment variables');
    return false;
  }

  try {
    if (!vaultToken && roleId && secretId) {
      console.log(`Authenticating with Vault AppRole: ${vaultAddr}`);
      vaultToken = await authenticateWithAppRole(vaultAddr, roleId, secretId);
    }

    console.log(`Loading secrets from Vault: ${vaultAddr}`);

    const response = await fetch(`${vaultAddr}/v1/${vaultPath}`, {
      headers: { 'X-Vault-Token': vaultToken! },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Vault path not found: ${vaultPath} - using env fallback`);
        return false;
      }
      throw new Error(`Vault returned ${response.status}: ${await response.text()}`);
    }

    const data: VaultResponse = await response.json();
    const secrets = data.data.data;

    let loadedCount = 0;
    for (const [vaultKey, envKey] of Object.entries(SECRET_MAPPING)) {
      if (secrets[vaultKey]) {
        process.env[envKey] = secrets[vaultKey];
        loadedCount++;
      }
    }

    console.log(`Loaded ${loadedCount} secrets from Vault`);
    return true;
  } catch (error) {
    console.error('Vault error:', error instanceof Error ? error.message : error);
    console.log('Falling back to environment variables');
    return false;
  }
}
