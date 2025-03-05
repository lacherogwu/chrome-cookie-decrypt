import { decrypt } from './crypto';
import type { RawCookie } from './database';

const WINDOWS_EPOCH_TO_UNIX_EPOCH_SECONDS = 11644473600;

export type Cookie = {
	domain: string;
	path: string;
	secure: boolean;
	expires: number;
	name: string;
	value: string;
	httpOnly: boolean;
	sameSite: 'None' | 'Lax' | 'Strict';
};

export async function parseRawCookie(cookie: RawCookie, password: Buffer): Promise<Cookie> {
	const encryptedValueBytes = Buffer.from(cookie.encrypted_value, 'hex');
	const decryptedValue = await decrypt(encryptedValueBytes, password);

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
