import { spawn } from 'node:child_process';
import os from 'node:os';

const COOKIES_DB_PATH = `${os.homedir()}/Library/Application Support/Google/Chrome/Default/Cookies`;

type RawCookie = {
	creation_utc: number;
	host_key: string;
	top_frame_site_key: string;
	name: string;
	value: string;
	encrypted_value: string;
	path: string;
	expires_utc: number;
	is_secure: number;
	is_httponly: number;
	last_access_utc: number;
	has_expires: number;
	is_persistent: number;
	priority: number;
	samesite: number;
	source_scheme: number;
	source_port: number;
	last_update_utc: number;
	source_type: number;
	has_cross_site_ancestor: number;
};

export async function getRawCookies(domain?: string) {
	let query = `
		SELECT *, hex(encrypted_value) as encrypted_value
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
				resolve(JSON.parse(data));
			} else {
				reject(new Error(`sqlite3 exited with code ${code}: ${error}`));
			}
		});
	});
}
