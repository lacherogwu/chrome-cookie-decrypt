import { getRawCookies } from './database';
import { getEncryptionKey } from './keychain';
import { parseRawCookie, getLocalStateProfiles } from './chrome';
import { assertChromeInstalled, assertsChromeDirectoryAccess } from './utils';
import type { Cookie, Profile } from './types';
export type { Cookie, Profile } from './types';

/**
 * Retrieves cookies from the Chrome browser.
 *
 * @param domain - The domain to filter cookies by (e.g., 'google.com')
 * @param profile - The Chrome profile directory name to retrieve cookies from
 * @returns A promise that resolves to an array of parsed Cookie objects
 * @throws {Error} If Chrome is not installed or if access to cookie data fails
 *
 * @example
 * // Get all Chrome cookies from the default profile
 * const allCookies = await getCookies();
 * console.log(allCookies);
 *
 * // Get cookies for a specific domain
 * const googleCookies = await getCookies('google.com');
 * console.log(googleCookies);
 *
 * // Get cookies for a specific domain from a specific profile
 * const profileCookies = await getCookies('example.com', 'Profile 1');
 * console.log(profileCookies);
 */
export async function getCookies(domain?: string, profile?: string): Promise<Cookie[]> {
	assertChromeInstalled();
	const rawCookies = await getRawCookies(domain, profile);

	const password = await getEncryptionKey();
	const cookies = rawCookies.map(cookie => parseRawCookie(cookie, password));

	return cookies;
}

/**
 * Retrieves all available Chrome browser profiles.
 *
 * @returns A promise that resolves to an array of Profile objects
 * @throws {Error} If Chrome is not installed or if access to Chrome directory fails
 *
 * @example
 * // Get all Chrome profiles
 * const profiles = await getProfiles();
 * console.log(profiles);
 *
 * // Use profile information to get cookies for a specific profile
 * const firstProfile = profiles[0];
 * const profileCookies = await getCookies(undefined, firstProfile.directory);
 * console.log(`Cookies for ${firstProfile.displayName}:`, profileCookies);
 */
export async function getProfiles(): Promise<Profile[]> {
	await assertsChromeDirectoryAccess();

	const localStateProfiles = await getLocalStateProfiles();
	const profiles = Object.entries(localStateProfiles).map(([directory, { name }]) => ({ directory, displayName: name }));

	return profiles;
}
