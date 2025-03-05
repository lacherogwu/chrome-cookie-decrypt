export type Cookie = {
	domain: string;
	path: string;
	secure: boolean;
	expires: number;
	name: string;
	value: string;
	httpOnly: boolean;
	sameSite: 'None' | 'Lax' | 'Strict';
};

export type RawCookie = {
	host_key: string;
	name: string;
	encrypted_value: string;
	path: string;
	expires_utc: number;
	is_secure: number;
	is_httponly: number;
	samesite: number;
};
