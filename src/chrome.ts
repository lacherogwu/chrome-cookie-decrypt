import { decrypt } from './crypto';
import type { RawCookie } from './types';
import { CHROME_USER_DATA_PATH, WINDOWS_EPOCH_TO_UNIX_EPOCH_SECONDS } from './constants';
import fs from 'node:fs/promises';
import type { Cookie } from './types';

export function parseRawCookie(cookie: RawCookie, password: string): Cookie {
	const encryptedValueBytes = Buffer.from(cookie.encrypted_value, 'hex');
	const decryptedValue = decrypt(encryptedValueBytes, password);

	let expires = cookie.expires_utc;
	if (expires > 0) {
		expires = normalizeChromeTimestamp(cookie.expires_utc);
	}

	const sameSite = cookie.samesite === 0 ? 'None' : cookie.samesite === 1 ? 'Lax' : 'Strict';

	return {
		domain: cookie.host_key,
		path: cookie.path,
		secure: cookie.is_secure === 1,
		expires,
		name: cookie.name,
		value: decryptedValue,
		httpOnly: cookie.is_httponly === 1,
		sameSite,
	};
}

function normalizeChromeTimestamp(timestamp: number) {
	return Math.floor((timestamp / 1e6 - WINDOWS_EPOCH_TO_UNIX_EPOCH_SECONDS) * 1000);
}

export async function getLocalStateProfiles() {
	const localStatePath = `${CHROME_USER_DATA_PATH}/Local State`;
	const localStateData = await fs.readFile(localStatePath, 'utf8');
	const localState = JSON.parse(localStateData);
	const profiles = localState.profile.info_cache as Record<string, { name: string }>;

	return profiles;
}
