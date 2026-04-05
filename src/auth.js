/**
 * Microsoft Authentication Module
 * Handles Xbox Live and Minecraft token acquisition
 */

const fs = require('fs');
const path = require('path');
const { Authflow, Titles } = require('@xmcl/core');

const TOKENS_FILE = path.resolve(__dirname, '..', 'tokens.json');

/**
 * Get or create authentication tokens
 * @param {string} email - Microsoft account email
 * @param {string} password - Microsoft account password
 * @returns {Promise<object>} - Minecraft token and other auth data
 */
async function authenticate(email, password) {
  try {
    // Check if we have cached valid tokens
    const cachedTokens = loadCachedTokens();
    if (cachedTokens && isTokenValid(cachedTokens)) {
      console.log('[auth] Using cached tokens');
      return cachedTokens;
    }

    console.log('[auth] Authenticating with Microsoft account...');
    
    // Create new auth flow
    const authflow = new Authflow('', undefined, {
      // Suppress interactive prompts
      fetchOptions: {}
    });

    // Sign in with email/password
    const token = await authflow.getAccessToken(email, password);
    
    // Get Xbox Live token
    const xboxResponse = await getXboxToken(token);
    
    // Get Minecraft token
    const minecraftToken = await getMinecraftToken(xboxResponse.token, xboxResponse.xuid);

    const authData = {
      accessToken: token,
      xboxToken: xboxResponse.token,
      xuid: xboxResponse.xuid,
      minecraftToken: minecraftToken.access_token,
      uuid: minecraftToken.uuid,
      username: minecraftToken.name,
      expiresAt: Date.now() + (minecraftToken.expires_in || 3600) * 1000
    };

    // Save tokens for later use
    saveTokens(authData);
    
    console.log(`[auth] Authentication successful! Username: ${authData.username}`);
    return authData;

  } catch (error) {
    console.error('[auth] Authentication failed:', error.message);
    throw error;
  }
}

/**
 * Get Xbox Live token from Microsoft access token
 */
async function getXboxToken(accessToken) {
  const response = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT',
      Properties: {
        AuthMethod: 'RPS',
        SiteArgs: 'user@xbox.com',
        RpsTicket: `d=${accessToken}`
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Xbox auth failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    token: data.Token,
    xuid: data.DisplayClaims.xui[0].xid
  };
}

/**
 * Get Minecraft token from Xbox Live token
 */
async function getMinecraftToken(xboxToken, xuid) {
  const response = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      identityToken: `XBL3.0 x=${xuid};${xboxToken}`
    })
  });

  if (!response.ok) {
    throw new Error(`Minecraft auth failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    uuid: data.profile.id,
    name: data.profile.name,
    expires_in: 3600
  };
}

/**
 * Load cached tokens if they exist
 */
function loadCachedTokens() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const content = fs.readFileSync(TOKENS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('[auth] Could not load cached tokens:', error.message);
  }
  return null;
}

/**
 * Check if token is still valid
 */
function isTokenValid(tokenData) {
  if (!tokenData || !tokenData.expiresAt) {
    return false;
  }
  // Consider token valid if it expires in more than 5 minutes
  return tokenData.expiresAt > Date.now() + 5 * 60 * 1000;
}

/**
 * Save tokens to file
 */
function saveTokens(tokenData) {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokenData, null, 2), 'utf8');
    console.log('[auth] Tokens saved');
  } catch (error) {
    console.error('[auth] Failed to save tokens:', error.message);
  }
}

module.exports = {
  authenticate,
  loadCachedTokens,
  isTokenValid
};
