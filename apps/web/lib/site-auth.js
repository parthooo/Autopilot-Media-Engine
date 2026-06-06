export const COOKIE_NAME = "ame_session";

/**
 * Derive a session token from the site password (Edge + Node compatible).
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function getSessionToken(password) {
  const data = new TextEncoder().encode(`ame-session:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * @param {string | undefined} cookieValue
 * @param {string | undefined} password
 * @returns {Promise<boolean>}
 */
export async function isValidSession(cookieValue, password) {
  if (!password || !cookieValue) return false;
  const expected = await getSessionToken(password);
  return cookieValue === expected;
}
