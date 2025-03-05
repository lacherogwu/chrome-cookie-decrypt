import { getRawCookies } from './database';
import { getEncryptionKey } from './keychain';
import { parseRawCookie, type Cookie } from './chrome';
export type { Cookie } from './chrome';

export async function getCookies(domain?: string): Promise<Cookie[]> {
	const rawCookies = await getRawCookies(domain);

	const CHROME_SAFE_STORAGE_PASSWORD = await getEncryptionKey();
	const cookiesPromise = rawCookies.map(async cookie => await parseRawCookie(cookie, CHROME_SAFE_STORAGE_PASSWORD));

	const cookies = await Promise.all(cookiesPromise);

	return cookies;
}
