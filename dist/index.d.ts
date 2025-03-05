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

declare function getCookies(domain?: string, profile?: string): Promise<Cookie[]>;
declare function getProfiles(): Promise<{
    profile: string;
    name: string;
}[]>;

export { type Cookie, getCookies, getProfiles };
