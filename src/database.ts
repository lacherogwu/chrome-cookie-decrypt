import { spawn } from 'exec-utils';
import { CHROME_USER_DATA_PATH } from './constants';
import { isProfileExists } from './utils';
import type { RawCookie } from './types';

export async function getRawCookies(domain?: string, profile = 'Default'): Promise<RawCookie[]> {
	if (!(await isProfileExists(profile))) {
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

	const rawCookies = await executeSQL<RawCookie>(cookiesDbPath, query);
	return rawCookies;
}

async function executeSQL<T = unknown>(databasePath: string, query: string): Promise<T[]> {
	const { data, error } = await spawn('sqlite3', ['--json', '--readonly', databasePath, query]);
	if (error) {
		throw new Error(`sqlite3 exited with code ${error.code}: ${error.message}`);
	}

	return JSON.parse(data || '[]');
}

function getProfileCookiesDbPath(profile = 'Default'): string {
	return `${CHROME_USER_DATA_PATH}/${profile}/Cookies`;
}
