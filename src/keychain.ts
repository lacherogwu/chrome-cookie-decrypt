import keytar from 'keytar';

export async function getEncryptionKey() {
	const password = await keytar.getPassword('Chrome Safe Storage', 'Chrome');
	if (!password) {
		throw new Error('Chrome Safe Storage password not found');
	}
	return Buffer.from(password, 'utf-8');
}
