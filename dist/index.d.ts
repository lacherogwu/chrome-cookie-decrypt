type Cookie = {
    domain: string;
    path: string;
    secure: boolean;
    expires: number;
    name: string;
    value: string;
    httpOnly: boolean;
    sameSite: 'None' | 'Lax' | 'Strict';
};
type Profile = {
    directory: string;
    displayName: string;
};

declare function getCookies(domain?: string, profile?: string): Promise<Cookie[]>;
declare function getProfiles(): Promise<Profile[]>;

export { type Cookie, type Profile, getCookies, getProfiles };
