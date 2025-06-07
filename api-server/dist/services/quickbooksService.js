// @ts-ignore - node-quickbooks doesn't have TypeScript definitions
import QuickBooks from "node-quickbooks";
import { logger } from "../utils/logger.js";
import { encryptQuickBooksTokens, decryptQuickBooksTokens, } from "../utils/encryption.js";
import QuickBooksToken from "../models/QuickBooksToken.js";
import ContractorAuth from "../models/ContractorAuth.js";
import mongoose from "mongoose";
export class QuickBooksService {
    static instance;
    clientId;
    clientSecret;
    redirectUri;
    sandbox;
    scope;
    constructor() {
        this.clientId = process.env.QUICKBOOKS_CLIENT_ID || "";
        this.clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || "";
        this.redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || "";
        this.sandbox = process.env.QUICKBOOKS_SANDBOX === "true";
        this.scope =
            process.env.QUICKBOOKS_SCOPE || "com.intuit.quickbooks.accounting";
        if (!this.clientId || !this.clientSecret || !this.redirectUri) {
            throw new Error("QuickBooks configuration is incomplete. Please check environment variables.");
        }
    }
    static getInstance() {
        if (!QuickBooksService.instance) {
            QuickBooksService.instance = new QuickBooksService();
        }
        return QuickBooksService.instance;
    }
    /**
     * Generates QuickBooks OAuth authorization URL
     * @param contractorId - The contractor ID for state management
     * @returns Authorization URL and state
     */
    generateAuthUrl(contractorId) {
        try {
            const state = this.generateSecureState(contractorId);
            // Manually construct the OAuth URL for QuickBooks
            const baseUrl = this.sandbox
                ? "https://appcenter.intuit.com/connect/oauth2"
                : "https://appcenter.intuit.com/connect/oauth2";
            const params = new URLSearchParams({
                client_id: this.clientId,
                scope: this.scope,
                redirect_uri: this.redirectUri,
                response_type: "code",
                state: state,
                access_type: "offline",
            });
            const authUrl = `${baseUrl}?${params.toString()}`;
            logger.info(`Generated QuickBooks auth URL for contractor: ${contractorId}`);
            return {
                authUrl,
                state,
            };
        }
        catch (error) {
            logger.error("Failed to generate QuickBooks auth URL:", error);
            throw new Error("Failed to generate authorization URL");
        }
    }
    /**
     * Exchanges authorization code for access tokens
     * @param code - Authorization code from QuickBooks
     * @param state - State parameter for verification
     * @param realmId - QuickBooks company ID
     * @returns Token information
     */
    async exchangeCodeForTokens(code, state, realmId) {
        try {
            // Verify state and extract contractor ID
            const contractorId = this.verifyAndExtractContractorId(state);
            // Exchange code for tokens
            const tokenResponse = await this.requestTokens(code);
            // Calculate expiration date
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
            const tokens = {
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token,
                tokenType: tokenResponse.token_type || "Bearer",
                expiresAt,
                scope: tokenResponse.scope || this.scope,
                realmId,
            };
            // Store encrypted tokens in database
            await this.storeTokens(contractorId, tokens);
            // Update contractor's QuickBooks connection status
            await this.updateContractorQuickBooksStatus(contractorId, true);
            logger.info(`Successfully exchanged tokens for contractor: ${contractorId}`);
            return tokens;
        }
        catch (error) {
            logger.error("Failed to exchange code for tokens:", error);
            throw new Error("Failed to complete QuickBooks authorization");
        }
    }
    /**
     * Refreshes expired access tokens
     * @param contractorId - The contractor ID
     * @returns Updated token information
     */
    async refreshTokens(contractorId) {
        try {
            // Get current tokens from database
            const tokenDoc = await QuickBooksToken.findByContractor(contractorId);
            if (!tokenDoc) {
                throw new Error("No QuickBooks tokens found for contractor");
            }
            // Decrypt tokens
            const decryptedTokens = decryptQuickBooksTokens({
                accessToken: tokenDoc.accessToken,
                refreshToken: tokenDoc.refreshToken,
            });
            // Request new tokens
            const tokenResponse = await this.requestRefreshTokens(decryptedTokens.refreshToken);
            // Calculate new expiration date
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
            const newTokens = {
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token || decryptedTokens.refreshToken,
                tokenType: tokenResponse.token_type || "Bearer",
                expiresAt,
                scope: tokenResponse.scope || tokenDoc.scope,
                realmId: tokenDoc.realmId,
            };
            // Update tokens in database
            await this.storeTokens(contractorId.toString(), newTokens);
            logger.info(`Successfully refreshed tokens for contractor: ${contractorId}`);
            return newTokens;
        }
        catch (error) {
            logger.error("Failed to refresh tokens:", error);
            throw new Error("Failed to refresh QuickBooks tokens");
        }
    }
    /**
     * Gets company information from QuickBooks
     * @param contractorId - The contractor ID
     * @returns Company information
     */
    async getCompanyInfo(contractorId) {
        try {
            const qbo = await this.getQuickBooksClient(contractorId);
            return new Promise((resolve, reject) => {
                qbo.getCompanyInfo(qbo.realmId, (err, companyInfo) => {
                    if (err) {
                        logger.error("Failed to get company info:", err);
                        reject(new Error("Failed to retrieve company information"));
                        return;
                    }
                    const company = companyInfo.QueryResponse.CompanyInfo[0];
                    resolve({
                        companyName: company.CompanyName,
                        address: {
                            line1: company.CompanyAddr?.Line1,
                            city: company.CompanyAddr?.City,
                            countrySubDivisionCode: company.CompanyAddr?.CountrySubDivisionCode,
                            postalCode: company.CompanyAddr?.PostalCode,
                        },
                        email: company.Email?.Address,
                        phone: company.PrimaryPhone?.FreeFormNumber,
                    });
                });
            });
        }
        catch (error) {
            logger.error("Failed to get company info:", error);
            throw new Error("Failed to retrieve company information");
        }
    }
    /**
     * Creates a vendor in QuickBooks for the contractor
     * @param contractorId - The contractor ID
     * @param contractorData - Contractor information
     * @returns Vendor ID
     */
    async createVendor(contractorId, contractorData) {
        try {
            const qbo = await this.getQuickBooksClient(contractorId);
            const vendor = {
                Name: contractorData.name,
                CompanyName: contractorData.name,
                PrintOnCheckName: contractorData.name,
                Active: true,
                Vendor1099: true, // Mark as 1099 vendor
                ...(contractorData.email && {
                    PrimaryEmailAddr: {
                        Address: contractorData.email,
                    },
                }),
                ...(contractorData.phone && {
                    PrimaryPhone: {
                        FreeFormNumber: contractorData.phone,
                    },
                }),
                ...(contractorData.address && {
                    BillAddr: {
                        Line1: contractorData.address.street,
                        City: contractorData.address.city,
                        CountrySubDivisionCode: contractorData.address.state,
                        PostalCode: contractorData.address.zipCode,
                        Country: "USA",
                    },
                }),
            };
            return new Promise((resolve, reject) => {
                qbo.createVendor(vendor, (err, vendorResponse) => {
                    if (err) {
                        logger.error("Failed to create vendor:", err);
                        reject(new Error("Failed to create vendor in QuickBooks"));
                        return;
                    }
                    const vendorId = vendorResponse.Vendor.Id;
                    logger.info(`Created vendor in QuickBooks: ${vendorId} for contractor: ${contractorId}`);
                    resolve(vendorId);
                });
            });
        }
        catch (error) {
            logger.error("Failed to create vendor:", error);
            throw new Error("Failed to create vendor in QuickBooks");
        }
    }
    /**
     * Disconnects QuickBooks integration for a contractor
     * @param contractorId - The contractor ID
     */
    async disconnectQuickBooks(contractorId) {
        try {
            // Remove tokens from database
            await QuickBooksToken.findOneAndDelete({ contractorId, isActive: true });
            // Update contractor's QuickBooks connection status
            await this.updateContractorQuickBooksStatus(contractorId.toString(), false);
            logger.info(`Disconnected QuickBooks for contractor: ${contractorId}`);
        }
        catch (error) {
            logger.error("Failed to disconnect QuickBooks:", error);
            throw new Error("Failed to disconnect QuickBooks");
        }
    }
    /**
     * Checks if tokens are expiring soon and refreshes them
     * @param contractorId - The contractor ID
     * @param minutesThreshold - Minutes before expiration to refresh (default: 30)
     */
    async checkAndRefreshTokens(contractorId, minutesThreshold = 30) {
        try {
            const tokenDoc = await QuickBooksToken.findByContractor(contractorId);
            if (!tokenDoc) {
                return;
            }
            if (tokenDoc.isExpiringSoon(minutesThreshold)) {
                await this.refreshTokens(contractorId);
                logger.info(`Auto-refreshed tokens for contractor: ${contractorId}`);
            }
        }
        catch (error) {
            logger.error("Failed to check and refresh tokens:", error);
            // Don't throw error for auto-refresh failures
        }
    }
    /**
     * Gets QuickBooks connection status for a contractor
     * @param contractorId - The contractor ID
     * @returns Connection status information
     */
    async getConnectionStatus(contractorId) {
        try {
            const tokenDoc = await QuickBooksToken.findByContractor(contractorId);
            if (!tokenDoc || !tokenDoc.isActive) {
                return { connected: false };
            }
            // Try to get company info to verify connection is still valid
            try {
                const companyInfo = await this.getCompanyInfo(contractorId);
                return {
                    connected: true,
                    companyName: companyInfo.companyName,
                    expiresAt: tokenDoc.expiresAt,
                    lastRefreshed: tokenDoc.lastRefreshed,
                };
            }
            catch (error) {
                // Connection might be invalid
                return {
                    connected: false,
                };
            }
        }
        catch (error) {
            logger.error("Failed to get connection status:", error);
            return { connected: false };
        }
    }
    // Private helper methods
    async getQuickBooksClient(contractorId) {
        const tokenDoc = await QuickBooksToken.findByContractor(contractorId);
        if (!tokenDoc) {
            throw new Error("No QuickBooks tokens found for contractor");
        }
        // Check if tokens need refresh
        await this.checkAndRefreshTokens(contractorId);
        // Get fresh tokens after potential refresh
        const freshTokenDoc = await QuickBooksToken.findByContractor(contractorId);
        if (!freshTokenDoc) {
            throw new Error("No QuickBooks tokens found after refresh");
        }
        const decryptedTokens = decryptQuickBooksTokens({
            accessToken: freshTokenDoc.accessToken,
            refreshToken: freshTokenDoc.refreshToken,
        });
        const qbo = new QuickBooks(this.clientId, this.clientSecret, decryptedTokens.accessToken, false, // no token secret for OAuth 2.0
        freshTokenDoc.realmId, this.sandbox, true, // enable debugging
        null, // minor version
        "2.0", // oauth version
        decryptedTokens.refreshToken);
        return qbo;
    }
    generateSecureState(contractorId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return Buffer.from(`${contractorId}:${timestamp}:${random}`).toString("base64");
    }
    verifyAndExtractContractorId(state) {
        try {
            const decoded = Buffer.from(state, "base64").toString("utf-8");
            const [contractorId, timestamp] = decoded.split(":");
            if (!contractorId || !timestamp) {
                throw new Error("Invalid state format");
            }
            // Verify timestamp is not too old (1 hour)
            const stateAge = Date.now() - parseInt(timestamp);
            if (stateAge > 3600000) {
                // 1 hour in milliseconds
                throw new Error("State parameter has expired");
            }
            return contractorId;
        }
        catch (error) {
            throw new Error("Invalid state parameter");
        }
    }
    async requestTokens(code) {
        return new Promise((resolve, reject) => {
            QuickBooks.getAccessToken(this.redirectUri, code, this.clientId, this.clientSecret, (err, accessToken) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(accessToken);
                }
            });
        });
    }
    async requestRefreshTokens(refreshToken) {
        return new Promise((resolve, reject) => {
            QuickBooks.refreshAccessToken(refreshToken, this.clientId, this.clientSecret, (err, accessToken) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(accessToken);
                }
            });
        });
    }
    async storeTokens(contractorId, tokens) {
        const encryptedTokens = encryptQuickBooksTokens({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
        await QuickBooksToken.findOneAndUpdate({ contractorId: new mongoose.Types.ObjectId(contractorId) }, {
            contractorId: new mongoose.Types.ObjectId(contractorId),
            accessToken: encryptedTokens.accessToken,
            refreshToken: encryptedTokens.refreshToken,
            tokenType: tokens.tokenType,
            expiresAt: tokens.expiresAt,
            scope: tokens.scope,
            realmId: tokens.realmId,
            isActive: true,
            lastRefreshed: new Date(),
        }, { upsert: true, new: true });
    }
    async updateContractorQuickBooksStatus(contractorId, connected) {
        await ContractorAuth.findByIdAndUpdate(contractorId, { quickbooksConnected: connected }, { new: true });
    }
}
// Export singleton instance (lazy initialization)
let _quickbooksService = null;
export const quickbooksService = {
    get instance() {
        if (!_quickbooksService) {
            _quickbooksService = QuickBooksService.getInstance();
        }
        return _quickbooksService;
    },
};
//# sourceMappingURL=quickbooksService.js.map