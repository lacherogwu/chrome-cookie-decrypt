type Cookie = {
    domain: string;
    path: string;
    secure: boolean;
    expires: number;
    name: string;
    value: string;
    httpOnly: boolean;
    sameSite: 'None' | 'Lax' | 'Strict';
};
type Profile = {
    directory: string;
    displayName: string;
};

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
declare function getCookies(domain?: string, profile?: string): Promise<Cookie[]>;
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
declare function getProfiles(): Promise<Profile[]>;

export { type Cookie, type Profile, getCookies, getProfiles };
