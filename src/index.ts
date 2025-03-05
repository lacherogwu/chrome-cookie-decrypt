import { getRawCookies } from './database';
import { getEncryptionKey } from './keychain';
import { parseRawCookie, getLocalStateProfiles } from './chrome';
import { assertChromeInstalled, assertsChromeDirectoryAccess } from './utils';
import type { Cookie, Profile } from './types';
export type { Cookie, Profile } from './types';

export async function getCookies(domain?: string, profile?: string): Promise<Cookie[]> {
	assertChromeInstalled();
	const rawCookies = await getRawCookies(domain, profile);

	const CHROME_SAFE_STORAGE_PASSWORD = await getEncryptionKey();
	const cookiesPromise = rawCookies.map(async cookie => await parseRawCookie(cookie, CHROME_SAFE_STORAGE_PASSWORD));

	const cookies = await Promise.all(cookiesPromise);

	return cookies;
}

export async function getProfiles(): Promise<Profile[]> {
	await assertsChromeDirectoryAccess();

	const localStateProfiles = await getLocalStateProfiles();
	const profiles = Object.entries(localStateProfiles).map(([directory, { name }]) => ({ directory, displayName: name }));

	return profiles;
}
