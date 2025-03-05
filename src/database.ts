import { spawn } from 'node:child_process';
import os from 'node:os';

const COOKIES_DB_PATH = `${os.homedir()}/Library/Application Support/Google/Chrome/Default/Cookies`;

type RawCookie = {
	host_key: string;
	name: string;
	encrypted_value: string;
	path: string;
	expires_utc: number;
	is_secure: number;
	is_httponly: number;
	samesite: number;
};

export async function getRawCookies(domain?: string) {
	let query = `
		SELECT host_key, name, hex(encrypted_value) as encrypted_value, path, expires_utc, is_secure, is_httponly, samesite
		FROM cookies
		`;

	if (domain) {
		query += `WHERE host_key LIKE '%${domain}'`;
	}

	const rawCookies = await executeSQL<RawCookie>(COOKIES_DB_PATH, query);
	return rawCookies;
}

function executeSQL<T = unknown>(databasePath: string, query: string): Promise<T[]> {
	const ps = spawn('sqlite3', ['--json', '--readonly', databasePath, query]);

	return new Promise((resolve, reject) => {
		let data = '';
		let error = '';

		ps.stdout.on('data', chunk => {
			data += chunk;
		});

		ps.stderr.on('data', chunk => {
			error += chunk;
		});

		ps.on('close', code => {
			if (code === 0) {
				resolve(JSON.parse(data || '[]'));
			} else {
				reject(new Error(`sqlite3 exited with code ${code}: ${error}`));
			}
		});
	});
}
