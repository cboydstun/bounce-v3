import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import { quickbooksService } from "../services/quickbooksService.js";
import { encryptionService } from "../utils/encryption.js";
import W9Form from "../models/W9Form.js";
import ContractorAuth from "../models/ContractorAuth.js";
/**
 * QuickBooks Controller
 *
 * Handles all QuickBooks-related HTTP requests including W-9 form management,
 * QuickBooks integration, and document operations.
 */
export class QuickBooksController {
  // ============================================================================
  // W-9 Form Operations
  // ============================================================================
  /**
   * Get W-9 form status for the authenticated contractor
   */
  async getW9Status(req, res) {
    try {
      const contractorId = new mongoose.Types.ObjectId(
        (req.user || req.contractor).id,
      );
      const w9Form = await W9Form.findByContractor(contractorId);
      if (!w9Form) {
        res.json({
          success: true,
          data: {
            w9Form: null,
          },
        });
        return;
      }
      // Transform to mobile app format
      const w9Status = {
        id: w9Form._id.toString(),
        status: w9Form.status,
        businessName: w9Form.businessName,
        taxClassification: w9Form.taxClassification,
        submittedAt: w9Form.submittedAt,
        approvedAt: w9Form.approvedAt,
        rejectedAt: w9Form.rejectedAt,
        rejectionReason: w9Form.rejectionReason,
        hasPdf: w9Form.hasPdf,
      };
      res.json({
        success: true,
        data: {
          w9Form: w9Status,
        },
      });
    } catch (error) {
      logger.error("Get W-9 status error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "W9_STATUS_ERROR",
          message: "Failed to get W-9 status",
          statusCode: 500,
        },
      });
    }
  }
  /**
   * Submit W-9 form
   */
  async submitW9Form(req, res) {
    try {
      const contractorId = new mongoose.Types.ObjectId(req.user.id);
      const formData = req.body;
      // Validate required fields
      const requiredFields = [
        "businessName",
        "taxClassification",
        "taxId",
        "address",
        "requestorInfo",
        "certifications",
        "signature",
        "signatureDate",
      ];
      for (const field of requiredFields) {
        if (!formData[field]) {
          res.status(400).json({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: `Missing required field: ${field}`,
              statusCode: 400,
            },
          });
          return;
        }
      }
      // Encrypt sensitive data
      const encryptedTaxId = encryptionService.instance.encrypt(formData.taxId);
      // Check if contractor already has a W-9 form
      let w9Form = await W9Form.findByContractor(contractorId);
      if (w9Form && !w9Form.canBeModified()) {
        res.status(400).json({
          success: false,
          error: {
            code: "FORM_NOT_MODIFIABLE",
            message: "W-9 form cannot be modified in current status",
            statusCode: 400,
          },
        });
        return;
      }
      // Create or update W-9 form
      const w9Data = {
        contractorId,
        businessName: formData.businessName.trim(),
        taxClassification: formData.taxClassification,
        taxClassificationOther: formData.taxClassificationOther?.trim(),
        taxId: encryptedTaxId,
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.toUpperCase(),
          zipCode: formData.address.zipCode.trim(),
        },
        requestorInfo: {
          name: formData.requestorInfo.name.trim(),
          address: {
            street: formData.requestorInfo.address.street.trim(),
            city: formData.requestorInfo.address.city.trim(),
            state: formData.requestorInfo.address.state.toUpperCase(),
            zipCode: formData.requestorInfo.address.zipCode.trim(),
          },
        },
        certifications: formData.certifications,
        exemptPayeeCodes: formData.exemptPayeeCodes || [],
        fatcaReportingCode: formData.fatcaReportingCode?.trim(),
        signature: formData.signature.trim(),
        signatureDate: formData.signatureDate,
        status: "submitted",
      };
      if (w9Form) {
        // Update existing form
        Object.assign(w9Form, w9Data);
        await w9Form.save();
      } else {
        // Create new form
        w9Form = new W9Form(w9Data);
        await w9Form.save();
      }
      // Generate PDF (mock implementation for now)
      // In production, this would integrate with a PDF generation service
      w9Form.hasPdf = true;
      w9Form.pdfPath = `/pdfs/w9-${w9Form._id}.pdf`;
      await w9Form.save();
      // Transform response
      const w9Status = {
        id: w9Form._id.toString(),
        status: w9Form.status,
        businessName: w9Form.businessName,
        taxClassification: w9Form.taxClassification,
        submittedAt: w9Form.submittedAt,
        approvedAt: w9Form.approvedAt,
        rejectedAt: w9Form.rejectedAt,
        rejectionReason: w9Form.rejectionReason,
        hasPdf: w9Form.hasPdf,
      };
      logger.info(`W-9 form submitted for contractor: ${contractorId}`);
      res.json({
        success: true,
        data: {
          w9Form: w9Status,
        },
      });
    } catch (error) {
      logger.error("Submit W-9 form error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "W9_SUBMISSION_ERROR",
          message: "Failed to submit W-9 form",
          statusCode: 500,
        },
      });
    }
  }
  /**
   * Update W-9 form (draft only)
   */
  async updateW9Form(req, res) {
    try {
      const contractorId = new mongoose.Types.ObjectId(req.user.id);
      const updateData = req.body;
      const w9Form = await W9Form.findByContractor(contractorId);
      if (!w9Form) {
        res.status(404).json({
          success: false,
          error: {
            code: "W9_NOT_FOUND",
            message: "W-9 form not found",
            statusCode: 404,
          },
        });
        return;
      }
      if (!w9Form.canBeModified()) {
        res.status(400).json({
          success: false,
          error: {
            code: "FORM_NOT_MODIFIABLE",
            message: "W-9 form cannot be modified in current status",
            statusCode: 400,
          },
        });
        return;
      }
      // Update fields
      if (updateData.businessName) {
        w9Form.businessName = updateData.businessName.trim();
      }
      if (updateData.taxClassification) {
        w9Form.taxClassification = updateData.taxClassification;
      }
      if (updateData.taxClassificationOther) {
        w9Form.taxClassificationOther =
          updateData.taxClassificationOther.trim();
      }
      if (updateData.taxId) {
        w9Form.taxId = encryptionService.instance.encrypt(updateData.taxId);
      }
      if (updateData.address) {
        w9Form.address = {
          ...w9Form.address,
          ...updateData.address,
        };
      }
      if (updateData.requestorInfo) {
        w9Form.requestorInfo = {
          ...w9Form.requestorInfo,
          ...updateData.requestorInfo,
        };
      }
      if (updateData.certifications) {
        w9Form.certifications = {
          ...w9Form.certifications,
          ...updateData.certifications,
        };
      }
      if (updateData.signature) {
        w9Form.signature = updateData.signature.trim();
      }
      if (updateData.signatureDate) {
        w9Form.signatureDate = updateData.signatureDate;
      }
      await w9Form.save();
      // Transform response
      const w9Status = {
        id: w9Form._id.toString(),
        status: w9Form.status,
        businessName: w9Form.businessName,
        taxClassification: w9Form.taxClassification,
        submittedAt: w9Form.submittedAt,
        approvedAt: w9Form.approvedAt,
        rejectedAt: w9Form.rejectedAt,
        rejectionReason: w9Form.rejectionReason,
        hasPdf: w9Form.hasPdf,
      };
      res.json({
        success: true,
        data: {
          w9Form: w9Status,
        },
      });
    } catch (error) {
      logger.error("Update W-9 form error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "W9_UPDATE_ERROR",
          message: "Failed to update W-9 form",
          statusCode: 500,
        },
      });
    }
  }
  /**
   * Download W-9 PDF
   */
  async downloadW9PDF(req, res) {
    try {
      const contractorId = new mongoose.Types.ObjectId(req.user.id);
      const w9Form = await W9Form.findByContractor(contractorId);
      if (!w9Form || !w9Form.hasPdf) {
        res.status(404).json({
          success: false,
          error: {
            code: "PDF_NOT_FOUND",
            message: "W-9 PDF not found",
            statusCode: 404,
          },
        });
        return;
      }
      // Mock PDF content for now
      // In production, this would serve the actual PDF file
      const mockPdfContent = Buffer.from(`
        %PDF-1.4
        1 0 obj
        <<
        /Type /Catalog
        /Pages 2 0 R
        >>
        endobj
        
        2 0 obj
        <<
        /Type /Pages
        /Kids [3 0 R]
        /Count 1
        >>
        endobj
        
        3 0 obj
        <<
        /Type /Page
        /Parent 2 0 R
        /MediaBox [0 0 612 792]
        /Contents 4 0 R
        >>
        endobj
        
        4 0 obj
        <<
        /Length 44
        >>
        stream
        BT
        /F1 12 Tf
        100 700 Td
        (W-9 Form - ${w9Form.businessName}) Tj
        ET
        endstream
        endobj
        
        xref
        0 5
        0000000000 65535 f 
        0000000009 00000 n 
        0000000058 00000 n 
        0000000115 00000 n 
        0000000206 00000 n 
        trailer
        <<
        /Size 5
        /Root 1 0 R
        >>
        startxref
        299
        %%EOF
      `);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="w9-form-${w9Form.businessName.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"`,
      );
      res.setHeader("Content-Length", mockPdfContent.length);
      res.send(mockPdfContent);
    } catch (error) {
      logger.error("Download W-9 PDF error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "PDF_DOWNLOAD_ERROR",
          message: "Failed to download W-9 PDF",
          statusCode: 500,
        },
      });
    }
  }
  // ============================================================================
  // QuickBooks Integration Operations
  // ============================================================================
  /**
   * Get QuickBooks integration status
   */
  async getQuickBooksStatus(req, res) {
    try {
      const contractorId = new mongoose.Types.ObjectId(req.user.id);
      // Get connection status from QuickBooks service
      const connectionStatus =
        await quickbooksService.instance.getConnectionStatus(contractorId);
      // Get W-9 status
      const w9Form = await W9Form.findByContractor(contractorId);
      const syncStatus = {
        connected: connectionStatus.connected,
        companyName: connectionStatus.companyName,
        w9Status: w9Form?.status || "not_submitted",
        w9Approved: w9Form?.status === "approved",
        readyForSync:
          connectionStatus.connected && w9Form?.status === "approved",
        lastSyncAt: connectionStatus.lastRefreshed,
      };
      res.json({
        success: true,
        data: {
          syncStatus,
        },
      });
    } catch (error) {
      logger.error("Get QuickBooks status error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "QUICKBOOKS_STATUS_ERROR",
          message: "Failed to get QuickBooks status",
          statusCode: 500,
        },
      });
    }
  }
  /**
   * Initiate QuickBooks connection
   */
  async connectQuickBooks(req, res) {
    try {
      const contractorId = req.user.id;
      // Generate QuickBooks OAuth URL
      const authData = quickbooksService.instance.generateAuthUrl(contractorId);
      res.json({
        success: true,
        data: {
          authUrl: authData.authUrl,
          state: authData.state,
        },
      });
    } catch (error) {
      logger.error("Connect QuickBooks error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "QUICKBOOKS_CONNECT_ERROR",
          message: "Failed to initiate QuickBooks connection",
          statusCode: 500,
        },
      });
    }
  }
  /**
   * Sync contractor data with QuickBooks
   */
  async syncContractor(req, res) {
    try {
      const contractorId = new mongoose.Types.ObjectId(req.user.id);
      // Get contractor data
      const contractor = await ContractorAuth.findById(contractorId);
      if (!contractor) {
        res.status(404).json({
          success: false,
          error: {
            code: "CONTRACTOR_NOT_FOUND",
            message: "Contractor not found",
            statusCode: 404,
          },
        });
        return;
      }
      // Check if QuickBooks is connected
      const connectionStatus =
        await quickbooksService.instance.getConnectionStatus(contractorId);
      if (!connectionStatus.connected) {
        res.status(400).json({
          success: false,
          error: {
            code: "QUICKBOOKS_NOT_CONNECTED",
            message: "QuickBooks is not connected",
            statusCode: 400,
          },
        });
        return;
      }
      // Get W-9 form for address information
      const w9Form = await W9Form.findByContractor(contractorId);
      // Create vendor in QuickBooks
      const vendorData = {
        name: contractor.name,
        email: contractor.email,
        ...(contractor.phone && { phone: contractor.phone }),
        ...(w9Form && {
          address: {
            street: w9Form.address.street,
            city: w9Form.address.city,
            state: w9Form.address.state,
            zipCode: w9Form.address.zipCode,
          },
        }),
      };
      const vendorId = await quickbooksService.instance.createVendor(
        contractorId,
        vendorData,
      );
      res.json({
        success: true,
        data: {
          vendorId,
        },
      });
    } catch (error) {
      logger.error("Sync contractor error:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "CONTRACTOR_SYNC_ERROR",
          message: "Failed to sync contractor data",
          statusCode: 500,
        },
      });
    }
  }
  /**
   * Handle QuickBooks OAuth callback
   */
  async handleOAuthCallback(req, res) {
    try {
      const { code, state, realmId } = req.query;
      if (!code || !state || !realmId) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_CALLBACK",
            message: "Missing required OAuth parameters",
            statusCode: 400,
          },
        });
        return;
      }
      // Exchange code for tokens
      const tokens = await quickbooksService.instance.exchangeCodeForTokens(
        code,
        state,
        realmId,
      );
      // Redirect to mobile app with success
      res.redirect(
        `${process.env.MOBILE_APP_URL}/quickbooks/callback?success=true`,
      );
    } catch (error) {
      logger.error("QuickBooks OAuth callback error:", error);
      res.redirect(
        `${process.env.MOBILE_APP_URL}/quickbooks/callback?success=false&error=${encodeURIComponent("OAuth callback failed")}`,
      );
    }
  }
}
// Export singleton instance
export const quickbooksController = new QuickBooksController();
//# sourceMappingURL=quickbooksController.js.map
