import { CHROME_USER_DATA_PATH, isMacOS } from './constants';
import fs from 'node:fs/promises';

export function assertChromeInstalled() {
	if (!isMacOS) {
		throw new Error('This module only works on macOS');
	}
}

export async function assertsChromeDirectoryAccess() {
	assertChromeInstalled();

	try {
		await fs.access(CHROME_USER_DATA_PATH);
	} catch (err) {
		throw new Error('Chrome user data directory not found');
	}
}

export async function isProfileExists(profile = 'Default'): Promise<boolean> {
	return fs
		.access(`${CHROME_USER_DATA_PATH}/${profile}`)
		.then(() => true)
		.catch(() => false);
}
