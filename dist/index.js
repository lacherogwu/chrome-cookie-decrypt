// src/crypto.ts
import crypto from "crypto";
var AESCBC_SALT = "saltysalt";
var AESCBC_IV = " ".repeat(16);
var AESCBC_ITERATIONS_MACOS = 1003;
var AESCBC_LENGTH = 16;
async function decrypt(encryptedValue, password) {
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
  let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  if (decrypted.length === 0) {
    throw new Error("Not enough bits");
  }
  if (decrypted.length % AESCBC_LENGTH !== 0) {
    throw new Error(`Decrypted data block length is not a multiple of ${AESCBC_LENGTH}`);
  }
  const paddingLen = decrypted[decrypted.length - 1];
  if (paddingLen > 16) {
    throw new Error(`Invalid last block padding length: ${paddingLen}`);
  }
  const value = decrypted.subarray(32, decrypted.length - paddingLen).toString();
  return value;
}

// src/database.ts
import { spawn } from "node:child_process";
import os from "node:os";
var COOKIES_DB_PATH = `${os.homedir()}/Library/Application Support/Google/Chrome/Default/Cookies`;
async function getRawCookies(domain) {
  let query = `
		SELECT *, hex(encrypted_value) as encrypted_value
		FROM cookies
		`;
  if (domain) {
    query += `WHERE host_key LIKE '%${domain}'`;
  }
  const rawCookies = await executeSQL(COOKIES_DB_PATH, query);
  return rawCookies;
}
function executeSQL(databasePath, query) {
  const ps = spawn("sqlite3", ["--json", "--readonly", databasePath, query]);
  return new Promise((resolve, reject) => {
    let data = "";
    let error = "";
    ps.stdout.on("data", (chunk) => {
      data += chunk;
    });
    ps.stderr.on("data", (chunk) => {
      error += chunk;
    });
    ps.on("close", (code) => {
      if (code === 0) {
        resolve(JSON.parse(data));
      } else {
        reject(new Error(`sqlite3 exited with code ${code}: ${error}`));
      }
    });
  });
}

// src/keychain.ts
import { spawn as spawn2 } from "node:child_process";
async function getEncryptionKey() {
  return new Promise((resolve, reject) => {
    const securityProcess = spawn2("security", ["find-generic-password", "-s", "Chrome Safe Storage", "-a", "Chrome", "-w"]);
    let password = "";
    let errorOutput = "";
    securityProcess.stdout.on("data", (data) => {
      password += data.toString();
    });
    securityProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });
    securityProcess.on("close", (code) => {
      if (code === 0) {
        const trimmedPassword = password.trim();
        if (trimmedPassword) {
          resolve(Buffer.from(trimmedPassword, "utf-8"));
        } else {
          reject(new Error("Chrome Safe Storage password not found"));
        }
      } else {
        reject(new Error(`Failed to get password: ${errorOutput}`));
      }
    });
    securityProcess.on("error", (err) => {
      reject(new Error(`Failed to spawn security process: ${err.message}`));
    });
  });
}

// src/index.ts
async function getCookies(domain) {
  const rawCookies = await getRawCookies(domain);
  const CHROME_SAFE_STORAGE_PASSWORD = await getEncryptionKey();
  const cookiesPromise = rawCookies.map(async (cookie) => {
    const encryptedValueBytes = Buffer.from(cookie.encrypted_value, "hex");
    const decryptedValue = await decrypt(encryptedValueBytes, CHROME_SAFE_STORAGE_PASSWORD);
    const sameSite = cookie.samesite === 0 ? "None" : cookie.samesite === 1 ? "Lax" : "Strict";
    return {
      domain: cookie.host_key,
      path: cookie.path,
      secure: cookie.is_secure === 1,
      expires: cookie.expires_utc,
      name: cookie.name,
      value: decryptedValue,
      httpOnly: cookie.is_httponly === 1,
      sameSite
    };
  });
  const cookies = await Promise.all(cookiesPromise);
  return cookies;
}
export {
  getCookies
};
