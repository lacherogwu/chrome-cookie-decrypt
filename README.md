# chrome-cookie-decrypt

A Node.js package for retrieving and decrypting Google Chrome cookies on macOS. This utility allows you to programmatically access Chrome cookies for automation, testing, or data extraction purposes.

## Description

`chrome-cookie-decrypt` provides a simple API to access encrypted Chrome cookies from the local Chrome installation on macOS. It handles all the complexity of:

- Accessing the Chrome cookie database
- Retrieving the encryption key from macOS Keychain
- Decrypting the cookie values using Chrome's encryption algorithm

## Installation

### NPM

```bash
npm i chrome-cookie-decrypt
```

### GitHub

```bash
npm i https://github.com/lacherogwu/chrome-cookie-decrypt
```

## Requirements

- macOS (this package is not compatible with Windows or Linux)
- Node.js 16 or higher
- Google Chrome installed on the system
- SQLite3 command-line tool installed

## Usage

```typescript
import { getCookies, getProfiles } from 'chrome-cookie-decrypt';

// Get all Chrome cookies from the default profile
const allCookies = await getCookies();
console.log(allCookies);

// Get cookies for a specific domain
const googleCookies = await getCookies('google.com');
console.log(googleCookies);

// Get cookies for a specific domain from a specific profile
const profileCookies = await getCookies('example.com', 'Profile 1');
console.log(profileCookies);

// Get all available Chrome profiles
const profiles = await getProfiles();
console.log(profiles);

// Use profile information to get cookies for a specific profile
const firstProfile = profiles[0];
const profileCookies = await getCookies(undefined, firstProfile.directory);
console.log(`Cookies for ${firstProfile.displayName}:`, profileCookies);
```

## API

### `getCookies(domain?: string, profile?: string): Promise<Cookie[]>`

Retrieves and decrypts Chrome cookies.

- **Parameters:**
  - `domain` (optional): Filter cookies by domain (e.g., 'google.com')
  - `profile` (optional): Specify the Chrome profile to use (e.g., 'Profile 1')
- **Returns:**
  - Promise resolving to an array of `Cookie` objects

### `getProfiles(): Promise<Profile[]>`

Retrieves all available Chrome profiles.

- **Returns:**
  - Promise resolving to an array of `Profile` objects

### Cookie Object

```typescript
type Cookie = {
	domain: string; // Cookie domain
	path: string; // Cookie path
	secure: boolean; // Whether the cookie requires a secure connection
	expires: number; // Expiration timestamp
	name: string; // Cookie name
	value: string; // Decrypted cookie value
	httpOnly: boolean; // Whether the cookie is HTTP only
	sameSite: 'None' | 'Lax' | 'Strict'; // SameSite policy
};
```

### Profile Object

```typescript
type Profile = {
	displayName: string; // Profile display name
	directory: string; // Profile directory
};
```

## License

MIT
