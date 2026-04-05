/**
 * Authentication Module
 * Uses bedrock-protocol's built-in authentication
 */

const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.resolve(__dirname, '..', 'tokens.json');

/**
 * Load cached authentication from file
 * @returns {object|null} - Cached auth data or null
 */
function loadCachedAuth() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf8');
      const data = JSON.parse(content);
      console.log('[auth] Loaded cached authentication');
      return data;
    }
  } catch (error) {
    console.warn('[auth] Could not load cached auth:', error.message);
  }
  return null;
}

/**
 * Save authentication data to cache
 * @param {object} authData - Auth data to save
 */
function saveAuth(authData) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(authData, null, 2), 'utf8');
    console.log('[auth] Saved authentication to cache');
  } catch (error) {
    console.error('[auth] Failed to save auth:', error.message);
  }
}

/**
 * Check if cached auth is still valid
 * @param {object} authData - Auth data to check
 * @returns {boolean} - True if valid
 */
function isAuthValid(authData) {
  if (!authData || !authData.profile) {
    return false;
  }
  // Consider valid if we have profile data
  return true;
}

module.exports = {
  loadCachedAuth,
  saveAuth,
  isAuthValid
};
