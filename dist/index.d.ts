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

declare function getCookies(domain?: string): Promise<Cookie[]>;

export { type Cookie, getCookies };
