import { spawn } from 'node:child_process';

export async function getEncryptionKey(): Promise<string> {
	return new Promise((resolve, reject) => {
		const securityProcess = spawn('security', ['find-generic-password', '-s', 'Chrome Safe Storage', '-a', 'Chrome', '-w']);

		let password = '';
		let errorOutput = '';

		securityProcess.stdout.on('data', data => {
			password += data.toString();
		});

		securityProcess.stderr.on('data', data => {
			errorOutput += data.toString();
		});

		securityProcess.on('close', code => {
			if (code === 0) {
				const trimmedPassword = password.trim();
				if (trimmedPassword) {
					resolve(trimmedPassword);
				} else {
					reject(new Error('Chrome Safe Storage password not found'));
				}
			} else {
				reject(new Error(`Failed to get password: ${errorOutput}`));
			}
		});

		securityProcess.on('error', err => {
			reject(new Error(`Failed to spawn security process: ${err.message}`));
		});
	});
}
