import mongoose from "mongoose";
export interface QuickBooksAuthUrl {
    authUrl: string;
    state: string;
}
export interface QuickBooksTokens {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresAt: Date;
    scope: string;
    realmId: string;
}
export interface QuickBooksCompanyInfo {
    companyName: string;
    address: {
        line1?: string;
        city?: string;
        countrySubDivisionCode?: string;
        postalCode?: string;
    };
    email?: string;
    phone?: string;
}
export declare class QuickBooksService {
    private static instance;
    private clientId;
    private clientSecret;
    private redirectUri;
    private sandbox;
    private scope;
    private constructor();
    static getInstance(): QuickBooksService;
    /**
     * Generates QuickBooks OAuth authorization URL
     * @param contractorId - The contractor ID for state management
     * @returns Authorization URL and state
     */
    generateAuthUrl(contractorId: string): QuickBooksAuthUrl;
    /**
     * Exchanges authorization code for access tokens
     * @param code - Authorization code from QuickBooks
     * @param state - State parameter for verification
     * @param realmId - QuickBooks company ID
     * @returns Token information
     */
    exchangeCodeForTokens(code: string, state: string, realmId: string): Promise<QuickBooksTokens>;
    /**
     * Refreshes expired access tokens
     * @param contractorId - The contractor ID
     * @returns Updated token information
     */
    refreshTokens(contractorId: mongoose.Types.ObjectId): Promise<QuickBooksTokens>;
    /**
     * Gets company information from QuickBooks
     * @param contractorId - The contractor ID
     * @returns Company information
     */
    getCompanyInfo(contractorId: mongoose.Types.ObjectId): Promise<QuickBooksCompanyInfo>;
    /**
     * Creates a vendor in QuickBooks for the contractor
     * @param contractorId - The contractor ID
     * @param contractorData - Contractor information
     * @returns Vendor ID
     */
    createVendor(contractorId: mongoose.Types.ObjectId, contractorData: {
        name: string;
        email?: string;
        phone?: string;
        address?: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
        };
    }): Promise<string>;
    /**
     * Disconnects QuickBooks integration for a contractor
     * @param contractorId - The contractor ID
     */
    disconnectQuickBooks(contractorId: mongoose.Types.ObjectId): Promise<void>;
    /**
     * Checks if tokens are expiring soon and refreshes them
     * @param contractorId - The contractor ID
     * @param minutesThreshold - Minutes before expiration to refresh (default: 30)
     */
    checkAndRefreshTokens(contractorId: mongoose.Types.ObjectId, minutesThreshold?: number): Promise<void>;
    /**
     * Gets QuickBooks connection status for a contractor
     * @param contractorId - The contractor ID
     * @returns Connection status information
     */
    getConnectionStatus(contractorId: mongoose.Types.ObjectId): Promise<{
        connected: boolean;
        companyName?: string;
        expiresAt?: Date;
        lastRefreshed?: Date;
    }>;
    private getQuickBooksClient;
    private generateSecureState;
    private verifyAndExtractContractorId;
    private requestTokens;
    private requestRefreshTokens;
    private storeTokens;
    private updateContractorQuickBooksStatus;
}
export declare const quickbooksService: {
    readonly instance: QuickBooksService;
};
//# sourceMappingURL=quickbooksService.d.ts.map