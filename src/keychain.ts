import { spawn } from 'exec-utils';

export async function getEncryptionKey(): Promise<string> {
	const { data, error } = await spawn('security', ['find-generic-password', '-s', 'Chrome Safe Storage', '-a', 'Chrome', '-w']);
	if (error) {
		throw new Error(`Failed to get password: ${error.message}`);
	}
	const key = data.trim();
	if (!key) {
		throw new Error('Chrome Safe Storage password not found');
	}
	return key;
}
