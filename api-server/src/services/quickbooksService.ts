// @ts-ignore - node-quickbooks doesn't have TypeScript definitions
import QuickBooks from "node-quickbooks";
import { logger } from "../utils/logger.js";
import {
  encryptQuickBooksTokens,
  decryptQuickBooksTokens,
} from "../utils/encryption.js";
import QuickBooksToken from "../models/QuickBooksToken.js";
import ContractorAuth from "../models/ContractorAuth.js";
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

export class QuickBooksService {
  private static instance: QuickBooksService;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private sandbox: boolean;
  private scope: string;

  private constructor() {
    this.clientId = process.env.QUICKBOOKS_CLIENT_ID || "";
    this.clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || "";
    this.redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || "";
    this.sandbox = process.env.QUICKBOOKS_SANDBOX === "true";
    this.scope =
      process.env.QUICKBOOKS_SCOPE || "com.intuit.quickbooks.accounting";

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error(
        "QuickBooks configuration is incomplete. Please check environment variables.",
      );
    }
  }

  public static getInstance(): QuickBooksService {
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
  public generateAuthUrl(contractorId: string): QuickBooksAuthUrl {
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

      logger.info(
        `Generated QuickBooks auth URL for contractor: ${contractorId}`,
      );

      return {
        authUrl,
        state,
      };
    } catch (error) {
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
  public async exchangeCodeForTokens(
    code: string,
    state: string,
    realmId: string,
  ): Promise<QuickBooksTokens> {
    try {
      // Verify state and extract contractor ID
      const contractorId = this.verifyAndExtractContractorId(state);

      // Exchange code for tokens
      const tokenResponse = await this.requestTokens(code);

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

      const tokens: QuickBooksTokens = {
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

      logger.info(
        `Successfully exchanged tokens for contractor: ${contractorId}`,
      );

      return tokens;
    } catch (error) {
      logger.error("Failed to exchange code for tokens:", error);
      throw new Error("Failed to complete QuickBooks authorization");
    }
  }

  /**
   * Refreshes expired access tokens
   * @param contractorId - The contractor ID
   * @returns Updated token information
   */
  public async refreshTokens(
    contractorId: mongoose.Types.ObjectId,
  ): Promise<QuickBooksTokens> {
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
      const tokenResponse = await this.requestRefreshTokens(
        decryptedTokens.refreshToken,
      );

      // Calculate new expiration date
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);

      const newTokens: QuickBooksTokens = {
        accessToken: tokenResponse.access_token,
        refreshToken:
          tokenResponse.refresh_token || decryptedTokens.refreshToken,
        tokenType: tokenResponse.token_type || "Bearer",
        expiresAt,
        scope: tokenResponse.scope || tokenDoc.scope,
        realmId: tokenDoc.realmId,
      };

      // Update tokens in database
      await this.storeTokens(contractorId.toString(), newTokens);

      logger.info(
        `Successfully refreshed tokens for contractor: ${contractorId}`,
      );

      return newTokens;
    } catch (error) {
      logger.error("Failed to refresh tokens:", error);
      throw new Error("Failed to refresh QuickBooks tokens");
    }
  }

  /**
   * Gets company information from QuickBooks
   * @param contractorId - The contractor ID
   * @returns Company information
   */
  public async getCompanyInfo(
    contractorId: mongoose.Types.ObjectId,
  ): Promise<QuickBooksCompanyInfo> {
    try {
      const qbo = await this.getQuickBooksClient(contractorId);

      return new Promise((resolve, reject) => {
        qbo.getCompanyInfo(qbo.realmId, (err: any, companyInfo: any) => {
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
              countrySubDivisionCode:
                company.CompanyAddr?.CountrySubDivisionCode,
              postalCode: company.CompanyAddr?.PostalCode,
            },
            email: company.Email?.Address,
            phone: company.PrimaryPhone?.FreeFormNumber,
          });
        });
      });
    } catch (error) {
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
  public async createVendor(
    contractorId: mongoose.Types.ObjectId,
    contractorData: {
      name: string;
      email?: string;
      phone?: string;
      address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
      };
    },
  ): Promise<string> {
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
        qbo.createVendor(vendor, (err: any, vendorResponse: any) => {
          if (err) {
            logger.error("Failed to create vendor:", err);
            reject(new Error("Failed to create vendor in QuickBooks"));
            return;
          }

          const vendorId = vendorResponse.Vendor.Id;
          logger.info(
            `Created vendor in QuickBooks: ${vendorId} for contractor: ${contractorId}`,
          );
          resolve(vendorId);
        });
      });
    } catch (error) {
      logger.error("Failed to create vendor:", error);
      throw new Error("Failed to create vendor in QuickBooks");
    }
  }

  /**
   * Disconnects QuickBooks integration for a contractor
   * @param contractorId - The contractor ID
   */
  public async disconnectQuickBooks(
    contractorId: mongoose.Types.ObjectId,
  ): Promise<void> {
    try {
      // Remove tokens from database
      await QuickBooksToken.findOneAndDelete({ contractorId, isActive: true });

      // Update contractor's QuickBooks connection status
      await this.updateContractorQuickBooksStatus(
        contractorId.toString(),
        false,
      );

      logger.info(`Disconnected QuickBooks for contractor: ${contractorId}`);
    } catch (error) {
      logger.error("Failed to disconnect QuickBooks:", error);
      throw new Error("Failed to disconnect QuickBooks");
    }
  }

  /**
   * Checks if tokens are expiring soon and refreshes them
   * @param contractorId - The contractor ID
   * @param minutesThreshold - Minutes before expiration to refresh (default: 30)
   */
  public async checkAndRefreshTokens(
    contractorId: mongoose.Types.ObjectId,
    minutesThreshold: number = 30,
  ): Promise<void> {
    try {
      const tokenDoc = await QuickBooksToken.findByContractor(contractorId);
      if (!tokenDoc) {
        return;
      }

      if (tokenDoc.isExpiringSoon(minutesThreshold)) {
        await this.refreshTokens(contractorId);
        logger.info(`Auto-refreshed tokens for contractor: ${contractorId}`);
      }
    } catch (error) {
      logger.error("Failed to check and refresh tokens:", error);
      // Don't throw error for auto-refresh failures
    }
  }

  /**
   * Gets QuickBooks connection status for a contractor
   * @param contractorId - The contractor ID
   * @returns Connection status information
   */
  public async getConnectionStatus(
    contractorId: mongoose.Types.ObjectId,
  ): Promise<{
    connected: boolean;
    companyName?: string;
    expiresAt?: Date;
    lastRefreshed?: Date;
  }> {
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
      } catch (error) {
        // Connection might be invalid
        return {
          connected: false,
        };
      }
    } catch (error) {
      logger.error("Failed to get connection status:", error);
      return { connected: false };
    }
  }

  // Private helper methods

  private async getQuickBooksClient(
    contractorId: mongoose.Types.ObjectId,
  ): Promise<any> {
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

    const qbo = new QuickBooks(
      this.clientId,
      this.clientSecret,
      decryptedTokens.accessToken,
      false, // no token secret for OAuth 2.0
      freshTokenDoc.realmId,
      this.sandbox,
      true, // enable debugging
      null, // minor version
      "2.0", // oauth version
      decryptedTokens.refreshToken,
    );

    return qbo;
  }

  private generateSecureState(contractorId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return Buffer.from(`${contractorId}:${timestamp}:${random}`).toString(
      "base64",
    );
  }

  private verifyAndExtractContractorId(state: string): string {
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
    } catch (error) {
      throw new Error("Invalid state parameter");
    }
  }

  private async requestTokens(code: string): Promise<any> {
    return new Promise((resolve, reject) => {
      QuickBooks.getAccessToken(
        this.redirectUri,
        code,
        this.clientId,
        this.clientSecret,
        (err: any, accessToken: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(accessToken);
          }
        },
      );
    });
  }

  private async requestRefreshTokens(refreshToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      QuickBooks.refreshAccessToken(
        refreshToken,
        this.clientId,
        this.clientSecret,
        (err: any, accessToken: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(accessToken);
          }
        },
      );
    });
  }

  private async storeTokens(
    contractorId: string,
    tokens: QuickBooksTokens,
  ): Promise<void> {
    const encryptedTokens = encryptQuickBooksTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    await QuickBooksToken.findOneAndUpdate(
      { contractorId: new mongoose.Types.ObjectId(contractorId) },
      {
        contractorId: new mongoose.Types.ObjectId(contractorId),
        accessToken: encryptedTokens.accessToken,
        refreshToken: encryptedTokens.refreshToken,
        tokenType: tokens.tokenType,
        expiresAt: tokens.expiresAt,
        scope: tokens.scope,
        realmId: tokens.realmId,
        isActive: true,
        lastRefreshed: new Date(),
      },
      { upsert: true, new: true },
    );
  }

  private async updateContractorQuickBooksStatus(
    contractorId: string,
    connected: boolean,
  ): Promise<void> {
    await ContractorAuth.findByIdAndUpdate(
      contractorId,
      { quickbooksConnected: connected },
      { new: true },
    );
  }
}

// Export singleton instance (lazy initialization)
let _quickbooksService: QuickBooksService | null = null;
export const quickbooksService = {
  get instance() {
    if (!_quickbooksService) {
      _quickbooksService = QuickBooksService.getInstance();
    }
    return _quickbooksService;
  },
};
