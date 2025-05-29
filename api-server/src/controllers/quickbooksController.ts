import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { quickbooksService } from "../services/quickbooksService.js";
import { logger } from "../utils/logger.js";
import W9Form from "../models/W9Form.js";
import {
  encryptTaxId,
  validateTaxId,
  formatTaxIdDisplay,
} from "../utils/encryption.js";
import { generateW9PDF, saveW9PDF } from "../utils/pdfGenerator.js";
import { RealtimeService } from "../services/realtimeService.js";
import mongoose from "mongoose";

/**
 * Initiates QuickBooks OAuth connection
 */
export const connectQuickBooks = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const contractorId = req.contractor!.contractorId;

    // Generate OAuth URL
    const { authUrl, state } =
      quickbooksService.instance.generateAuthUrl(contractorId);

    logger.info(
      `Generated QuickBooks auth URL for contractor: ${contractorId}`,
    );

    res.json({
      success: true,
      authUrl,
      message: "Please complete the authorization in QuickBooks",
    });
  } catch (error) {
    logger.error("Failed to initiate QuickBooks connection:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate QuickBooks connection",
      code: "QUICKBOOKS_CONNECTION_FAILED",
    });
  }
};

/**
 * Handles QuickBooks OAuth callback
 */
export const handleQuickBooksCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, realmId, error } = req.query;

    // Check for OAuth errors
    if (error) {
      logger.error("QuickBooks OAuth error:", error);
      return res.status(400).json({
        success: false,
        error: "QuickBooks authorization was denied or failed",
        code: "OAUTH_ERROR",
      });
    }

    // Validate required parameters
    if (!code || !state || !realmId) {
      return res.status(400).json({
        success: false,
        error: "Missing required OAuth parameters",
        code: "INVALID_OAUTH_PARAMS",
      });
    }

    // Exchange code for tokens
    const tokens = await quickbooksService.instance.exchangeCodeForTokens(
      code as string,
      state as string,
      realmId as string,
    );

    // Get company information
    const contractorId = (
      quickbooksService.instance as any
    ).verifyAndExtractContractorId(state as string);
    const companyInfo = await quickbooksService.instance.getCompanyInfo(
      contractorId as any,
    );

    // Send real-time notification
    await RealtimeService.sendPersonalNotification(
      contractorId,
      "QuickBooks Connected",
      `Successfully connected to ${companyInfo.companyName}`,
      {
        companyName: companyInfo.companyName,
        connectedAt: new Date().toISOString(),
      },
      "normal",
    );

    logger.info(
      `QuickBooks connected successfully for contractor: ${contractorId}`,
    );

    return res.json({
      success: true,
      message: "QuickBooks connected successfully",
      companyInfo: {
        name: companyInfo.companyName,
        connectedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Failed to handle QuickBooks callback:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to complete QuickBooks connection",
      code: "CALLBACK_PROCESSING_FAILED",
    });
  }
};

/**
 * Disconnects QuickBooks integration
 */
export const disconnectQuickBooks = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const contractorId = req.contractor!.contractorId;

    await quickbooksService.instance.disconnectQuickBooks(
      new mongoose.Types.ObjectId(contractorId),
    );

    // Send real-time notification
    await RealtimeService.sendPersonalNotification(
      contractorId.toString(),
      "QuickBooks Disconnected",
      "QuickBooks integration has been disconnected",
      undefined,
      "normal",
    );

    logger.info(`QuickBooks disconnected for contractor: ${contractorId}`);

    res.json({
      success: true,
      message: "QuickBooks disconnected successfully",
    });
  } catch (error) {
    logger.error("Failed to disconnect QuickBooks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to disconnect QuickBooks",
      code: "DISCONNECT_FAILED",
    });
  }
};

/**
 * Gets QuickBooks connection status
 */
export const getQuickBooksStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const contractorId = req.contractor!.contractorId;

    const status = await quickbooksService.instance.getConnectionStatus(
      new mongoose.Types.ObjectId(contractorId),
    );

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    logger.error("Failed to get QuickBooks status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get QuickBooks status",
      code: "STATUS_CHECK_FAILED",
    });
  }
};

/**
 * Submits W-9 form information
 */
export const submitW9Form = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const contractorId = req.contractor!.contractorId;
    const {
      businessName,
      taxClassification,
      taxClassificationOther,
      taxId,
      address,
      requestorInfo,
      certifications,
      exemptPayeeCodes,
      fatcaReportingCode,
      signature,
    } = req.body;

    // Validate tax ID format
    if (!validateTaxId(taxId)) {
      res.status(400).json({
        success: false,
        error: "Invalid tax ID format. Must be 9 digits (SSN or EIN)",
        code: "INVALID_TAX_ID",
      });
      return;
    }

    // Check if W-9 already exists
    const existingW9 = await W9Form.findByContractor(
      new mongoose.Types.ObjectId(contractorId),
    );
    if (existingW9 && existingW9.status === "approved") {
      res.status(400).json({
        success: false,
        error: "W-9 form has already been approved",
        code: "W9_ALREADY_APPROVED",
      });
      return;
    }

    // Encrypt sensitive data
    const encryptedTaxId = encryptTaxId(taxId);

    // Create or update W-9 form
    const w9Data = {
      contractorId: new mongoose.Types.ObjectId(contractorId),
      businessName,
      taxClassification,
      taxClassificationOther,
      taxId: encryptedTaxId,
      address,
      requestorInfo,
      certifications,
      exemptPayeeCodes,
      fatcaReportingCode,
      signature,
      dateSigned: new Date(),
      status: "submitted" as const,
    };

    let w9Form;
    if (existingW9) {
      // Update existing form
      Object.assign(existingW9, w9Data);
      w9Form = await existingW9.save();
    } else {
      // Create new form
      w9Form = new W9Form(w9Data);
      await w9Form.save();
    }

    // Generate PDF
    try {
      const pdfBuffer = await generateW9PDF(w9Form);
      const pdfPath = await saveW9PDF(pdfBuffer, contractorId.toString());

      // Update form with PDF URL (in production, this would be a cloud storage URL)
      w9Form.pdfUrl = pdfPath;
      await w9Form.save();
    } catch (pdfError) {
      logger.error("Failed to generate W-9 PDF:", pdfError);
      // Continue without PDF - it can be generated later
    }

    // Send real-time notification
    await RealtimeService.sendPersonalNotification(
      contractorId.toString(),
      "W-9 Form Submitted",
      "Your W-9 tax form has been submitted for review",
      {
        formId: w9Form._id.toString(),
        submittedAt: w9Form.submittedAt?.toISOString(),
      },
      "normal",
    );

    res.json({
      success: true,
      message: "W-9 form submitted successfully",
      w9Form: {
        id: w9Form._id,
        status: w9Form.status,
        submittedAt: w9Form.submittedAt,
        businessName: w9Form.businessName,
        taxClassification: w9Form.taxClassification,
        maskedTaxId: formatTaxIdDisplay(taxId),
      },
    });
    return;
  } catch (error) {
    logger.error("Failed to submit W-9 form:", error);
    res.status(500).json({
      success: false,
      error: "Failed to submit W-9 form",
      code: "W9_SUBMISSION_FAILED",
    });
    return;
  }
};

/**
 * Gets W-9 form status
 */
export const getW9Status = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contractorId = req.contractor!.contractorId;

    const w9Form = await W9Form.findByContractor(
      new mongoose.Types.ObjectId(contractorId),
    );

    if (!w9Form) {
      return res.json({
        success: true,
        w9Form: null,
        message: "No W-9 form found",
      });
    }

    return res.json({
      success: true,
      w9Form: {
        id: w9Form._id,
        status: w9Form.status,
        businessName: w9Form.businessName,
        taxClassification: w9Form.taxClassification,
        submittedAt: w9Form.submittedAt,
        approvedAt: w9Form.approvedAt,
        rejectedAt: w9Form.rejectedAt,
        rejectionReason: w9Form.rejectionReason,
        hasPdf: Boolean(w9Form.pdfUrl),
      },
    });
  } catch (error) {
    logger.error("Failed to get W-9 status:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get W-9 status",
      code: "W9_STATUS_CHECK_FAILED",
    });
  }
};

/**
 * Updates W-9 form (for draft status only)
 */
export const updateW9Form = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const contractorId = req.contractor!.contractorId;

    const w9Form = await W9Form.findByContractor(
      new mongoose.Types.ObjectId(contractorId),
    );

    if (!w9Form) {
      return res.status(404).json({
        success: false,
        error: "W-9 form not found",
        code: "W9_NOT_FOUND",
      });
    }

    if (w9Form.status !== "draft") {
      return res.status(400).json({
        success: false,
        error: "Can only update draft W-9 forms",
        code: "W9_NOT_EDITABLE",
      });
    }

    // Update allowed fields
    const allowedFields = [
      "businessName",
      "taxClassification",
      "taxClassificationOther",
      "address",
      "requestorInfo",
      "certifications",
      "exemptPayeeCodes",
      "fatcaReportingCode",
      "signature",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (w9Form as any)[field] = req.body[field];
      }
    });

    // Handle tax ID separately (needs encryption)
    if (req.body.taxId) {
      if (!validateTaxId(req.body.taxId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid tax ID format",
          code: "INVALID_TAX_ID",
        });
      }
      w9Form.taxId = encryptTaxId(req.body.taxId);
    }

    await w9Form.save();

    logger.info(`W-9 form updated for contractor: ${contractorId}`);

    return res.json({
      success: true,
      message: "W-9 form updated successfully",
      w9Form: {
        id: w9Form._id,
        status: w9Form.status,
        businessName: w9Form.businessName,
        taxClassification: w9Form.taxClassification,
      },
    });
  } catch (error) {
    logger.error("Failed to update W-9 form:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update W-9 form",
      code: "W9_UPDATE_FAILED",
    });
  }
};

/**
 * Downloads W-9 PDF
 */
export const downloadW9PDF = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const contractorId = req.contractor!.contractorId;

    const w9Form = await W9Form.findByContractor(
      new mongoose.Types.ObjectId(contractorId),
    );

    if (!w9Form) {
      return res.status(404).json({
        success: false,
        error: "W-9 form not found",
        code: "W9_NOT_FOUND",
      });
    }

    if (!w9Form.pdfUrl) {
      // Generate PDF if it doesn't exist
      try {
        const pdfBuffer = await generateW9PDF(w9Form);
        const pdfPath = await saveW9PDF(pdfBuffer, contractorId.toString());

        w9Form.pdfUrl = pdfPath;
        await w9Form.save();

        // Return the generated PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="w9-form-${contractorId}.pdf"`,
        );
        res.send(pdfBuffer);
        return;
      } catch (pdfError) {
        logger.error("Failed to generate W-9 PDF:", pdfError);
        return res.status(500).json({
          success: false,
          error: "Failed to generate PDF",
          code: "PDF_GENERATION_FAILED",
        });
      }
    }

    // In production, this would redirect to cloud storage URL
    return res.json({
      success: true,
      message: "PDF available for download",
      downloadUrl: w9Form.pdfUrl,
    });
  } catch (error) {
    logger.error("Failed to download W-9 PDF:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to download W-9 PDF",
      code: "PDF_DOWNLOAD_FAILED",
    });
  }
};

/**
 * Syncs contractor information with QuickBooks
 */
export const syncContractor = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const contractorId = req.contractor!.contractorId;
    const contractor = req.contractor!;

    // Check if QuickBooks is connected
    const status = await quickbooksService.instance.getConnectionStatus(
      new mongoose.Types.ObjectId(contractorId),
    );
    if (!status.connected) {
      return res.status(400).json({
        success: false,
        error: "QuickBooks not connected",
        code: "QUICKBOOKS_NOT_CONNECTED",
      });
    }

    // Get W-9 form for address information
    const w9Form = await W9Form.findByContractor(
      new mongoose.Types.ObjectId(contractorId),
    );

    // Create vendor in QuickBooks
    const vendorId = await quickbooksService.instance.createVendor(
      new mongoose.Types.ObjectId(contractorId),
      {
        name: contractor.name,
        email: contractor.email,
        ...(w9Form?.address && { address: w9Form.address }),
      },
    );

    // Send real-time notification
    await RealtimeService.sendPersonalNotification(
      contractorId.toString(),
      "Vendor Profile Created",
      "Your contractor profile has been created in QuickBooks",
      {
        vendorId,
        createdAt: new Date().toISOString(),
      },
      "normal",
    );

    logger.info(
      `Contractor synced to QuickBooks: ${contractorId}, Vendor ID: ${vendorId}`,
    );

    return res.json({
      success: true,
      message: "Contractor synced to QuickBooks successfully",
      vendorId,
    });
  } catch (error) {
    logger.error("Failed to sync contractor:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to sync contractor to QuickBooks",
      code: "CONTRACTOR_SYNC_FAILED",
    });
  }
};

/**
 * Gets sync status
 */
export const getSyncStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const contractorId = req.contractor!.contractorId;

    // Check QuickBooks connection
    const qbStatus = await quickbooksService.instance.getConnectionStatus(
      new mongoose.Types.ObjectId(contractorId),
    );

    // Check W-9 status
    const w9Form = await W9Form.findByContractor(
      new mongoose.Types.ObjectId(contractorId),
    );

    const syncStatus = {
      quickbooksConnected: qbStatus.connected,
      companyName: qbStatus.companyName,
      w9Status: w9Form?.status || "not_submitted",
      w9Approved: w9Form?.status === "approved",
      readyForSync: qbStatus.connected && w9Form?.status === "approved",
      lastSyncAt: null, // This would be stored separately in production
    };

    res.json({
      success: true,
      syncStatus,
    });
  } catch (error) {
    logger.error("Failed to get sync status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get sync status",
      code: "SYNC_STATUS_CHECK_FAILED",
    });
  }
};
