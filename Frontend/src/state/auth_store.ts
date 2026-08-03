export const tokenStore = (() => {
    let _accessToken: string | null = null;
    const set = (token: string) => {
        _accessToken = token;
    };
    const get = (): string | null => _accessToken;
    const clear = (): void => {
        _accessToken = null;
    };
    return { set, get, clear } as const;
})();