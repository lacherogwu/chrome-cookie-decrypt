// src/database.ts
import { spawn } from "exec-utils";

// src/constants.ts
import os from "node:os";
var isMacOS = os.platform() === "darwin";
var CHROME_USER_DATA_PATH = `${os.homedir()}/Library/Application Support/Google/Chrome`;
var WINDOWS_EPOCH_TO_UNIX_EPOCH_SECONDS = 11644473600;

// src/utils.ts
import fs from "node:fs/promises";
function assertChromeInstalled() {
  if (!isMacOS) {
    throw new Error("This module only works on macOS");
  }
}
async function assertsChromeDirectoryAccess() {
  assertChromeInstalled();
  try {
    await fs.access(CHROME_USER_DATA_PATH);
  } catch (err) {
    throw new Error("Chrome user data directory not found");
  }
}
async function isProfileExists(profile = "Default") {
  return fs.access(`${CHROME_USER_DATA_PATH}/${profile}`).then(() => true).catch(() => false);
}

// src/database.ts
async function getRawCookies(domain, profile = "Default") {
  if (!await isProfileExists(profile)) {
    throw new Error(`Profile "${profile}" not found`);
  }
  const cookiesDbPath = getProfileCookiesDbPath(profile);
  let query = `
		SELECT host_key, name, hex(encrypted_value) as encrypted_value, path, expires_utc, is_secure, is_httponly, samesite
		FROM cookies
		`;
  if (domain) {
    query += `WHERE host_key LIKE '%${domain}'`;
  }
  const rawCookies = await executeSQL(cookiesDbPath, query);
  return rawCookies;
}
async function executeSQL(databasePath, query) {
  const { data, error } = await spawn("sqlite3", ["--json", "--readonly", databasePath, query]);
  if (error) {
    throw new Error(`sqlite3 exited with code ${error.code}: ${error.message}`);
  }
  return JSON.parse(data || "[]");
}
function getProfileCookiesDbPath(profile = "Default") {
  return `${CHROME_USER_DATA_PATH}/${profile}/Cookies`;
}

// src/keychain.ts
import { spawn as spawn2 } from "exec-utils";
async function getEncryptionKey() {
  const { data, error } = await spawn2("security", ["find-generic-password", "-s", "Chrome Safe Storage", "-a", "Chrome", "-w"]);
  if (error) {
    throw new Error(`Failed to get password: ${error.message}`);
  }
  const key = data.trim();
  if (!key) {
    throw new Error("Chrome Safe Storage password not found");
  }
  return key;
}

// src/crypto.ts
import crypto from "crypto";
var AESCBC_SALT = "saltysalt";
var AESCBC_IV = " ".repeat(16);
var AESCBC_ITERATIONS_MACOS = 1003;
var AESCBC_LENGTH = 16;
function decrypt(encryptedValue, password) {
  const key = crypto.pbkdf2Sync(password, Buffer.from(AESCBC_SALT), AESCBC_ITERATIONS_MACOS, AESCBC_LENGTH, "sha1");
  if (encryptedValue.length < 3) {
    throw new Error("Encrypted length less than 3");
  }
  const version = encryptedValue.subarray(0, 3).toString();
  if (version !== "v10") {
    throw new Error(`Unsupported encrypted value version: ${version}`);
  }
  const ciphertext = encryptedValue.subarray(3);
  const decipher = crypto.createDecipheriv("aes-128-cbc", key, Buffer.from(AESCBC_IV));
  decipher.setAutoPadding(false);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  if (decrypted.length === 0) {
    throw new Error("Not enough bits");
  }
  if (decrypted.length % AESCBC_LENGTH !== 0) {
    throw new Error(`Decrypted data block length is not a multiple of ${AESCBC_LENGTH}`);
  }
  const paddingLen = decrypted[decrypted.length - 1];
  if (paddingLen === void 0 || paddingLen > 16) {
    throw new Error(`Invalid last block padding length: ${paddingLen}`);
  }
  const value = decrypted.subarray(32, decrypted.length - paddingLen).toString();
  return value;
}

// src/chrome.ts
import fs2 from "node:fs/promises";
function parseRawCookie(cookie, password) {
  const encryptedValueBytes = Buffer.from(cookie.encrypted_value, "hex");
  const decryptedValue = decrypt(encryptedValueBytes, password);
  let expires = cookie.expires_utc;
  if (expires > 0) {
    expires = normalizeChromeTimestamp(cookie.expires_utc);
  }
  const sameSite = cookie.samesite === 0 ? "None" : cookie.samesite === 1 ? "Lax" : "Strict";
  return {
    domain: cookie.host_key,
    path: cookie.path,
    secure: cookie.is_secure === 1,
    expires,
    name: cookie.name,
    value: decryptedValue,
    httpOnly: cookie.is_httponly === 1,
    sameSite
  };
}
function normalizeChromeTimestamp(timestamp) {
  return Math.floor((timestamp / 1e6 - WINDOWS_EPOCH_TO_UNIX_EPOCH_SECONDS) * 1e3);
}
async function getLocalStateProfiles() {
  const localStatePath = `${CHROME_USER_DATA_PATH}/Local State`;
  const localStateData = await fs2.readFile(localStatePath, "utf8");
  const localState = JSON.parse(localStateData);
  const profiles = localState.profile.info_cache;
  return profiles;
}

// src/index.ts
async function getCookies(domain, profile) {
  assertChromeInstalled();
  const rawCookies = await getRawCookies(domain, profile);
  const password = await getEncryptionKey();
  const cookies = rawCookies.map((cookie) => parseRawCookie(cookie, password));
  return cookies;
}
async function getProfiles() {
  await assertsChromeDirectoryAccess();
  const localStateProfiles = await getLocalStateProfiles();
  const profiles = Object.entries(localStateProfiles).map(([directory, { name }]) => ({ directory, displayName: name }));
  return profiles;
}
export {
  getCookies,
  getProfiles
};
