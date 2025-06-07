export interface JWTPayload {
    contractorId: string;
    email: string;
    name: string;
    isVerified: boolean;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
declare class JWTService {
    private _accessTokenSecret;
    private _refreshTokenSecret;
    private _accessTokenExpiry;
    private _refreshTokenExpiry;
    private _initialized;
    constructor();
    private initialize;
    private get accessTokenSecret();
    private get refreshTokenSecret();
    private get accessTokenExpiry();
    private get refreshTokenExpiry();
    private validateExpiry;
    generateAccessToken(payload: JWTPayload): string;
    generateRefreshToken(contractorId: string): string;
    generateTokenPair(payload: JWTPayload): TokenPair;
    verifyAccessToken(token: string): JWTPayload;
    verifyRefreshToken(token: string): {
        contractorId: string;
        type: string;
    };
    extractTokenFromHeader(authHeader: string | undefined): string | null;
    getTokenExpiry(token: string): Date | null;
}
export declare const jwtService: JWTService;
export default jwtService;
//# sourceMappingURL=jwt.d.ts.map