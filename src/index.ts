import { decrypt } from './crypto';
import { getRawCookies } from './database';
import { getEncryptionKey } from './keychain';

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

export async function getCookies(domain?: string): Promise<Cookie[]> {
	const rawCookies = await getRawCookies(domain);

	const CHROME_SAFE_STORAGE_PASSWORD = await getEncryptionKey();

	const cookiesPromise = rawCookies.map(async cookie => {
		const encryptedValueBytes = Buffer.from(cookie.encrypted_value, 'hex');
		const decryptedValue = await decrypt(encryptedValueBytes, CHROME_SAFE_STORAGE_PASSWORD);

		// TODO: check what is -1 and 2
		const sameSite = cookie.samesite === 0 ? 'None' : cookie.samesite === 1 ? 'Lax' : 'Strict';

		return {
			domain: cookie.host_key,
			path: cookie.path,
			secure: cookie.is_secure === 1,
			expires: cookie.expires_utc,
			name: cookie.name,
			value: decryptedValue,
			httpOnly: cookie.is_httponly === 1,
			sameSite,
		} as Cookie;
	});

	const cookies = await Promise.all(cookiesPromise);
	return cookies;
}
