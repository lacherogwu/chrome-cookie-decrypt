import crypto from 'crypto';

const AESCBC_SALT = 'saltysalt';
const AESCBC_IV = ' '.repeat(16);
const AESCBC_ITERATIONS_MACOS = 1003;
const AESCBC_LENGTH = 16;

export async function decrypt(encryptedValue: Buffer, password: Buffer) {
	const key = crypto.pbkdf2Sync(password, Buffer.from(AESCBC_SALT), AESCBC_ITERATIONS_MACOS, AESCBC_LENGTH, 'sha1');

	// Check if the encrypted value is too short
	if (encryptedValue.length < 3) {
		throw new Error('Encrypted length less than 3');
	}

	// Check if the prefix is 'v10'
	const version = encryptedValue.subarray(0, 3).toString();
	if (version !== 'v10') {
		throw new Error(`Unsupported encrypted value version: ${version}`);
	}

	// Remove the 'v10' prefix
	const ciphertext = encryptedValue.subarray(3);

	// Create decipher
	const decipher = crypto.createDecipheriv('aes-128-cbc', key, Buffer.from(AESCBC_IV));

	// Disable automatic padding handling as we'll do it manually
	decipher.setAutoPadding(false);

	// Decrypt the data
	let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

	if (decrypted.length === 0) {
		throw new Error('Not enough bits');
	}

	if (decrypted.length % AESCBC_LENGTH !== 0) {
		throw new Error(`Decrypted data block length is not a multiple of ${AESCBC_LENGTH}`);
	}

	// Get padding length from the last byte
	const paddingLen = decrypted[decrypted.length - 1];
	if (paddingLen > 16) {
		throw new Error(`Invalid last block padding length: ${paddingLen}`);
	}

	// Extract the actual value (skip first 32 bytes which is the SHA256 of the HostKey)
	const value = decrypted.subarray(32, decrypted.length - paddingLen).toString();

	return value;
}
