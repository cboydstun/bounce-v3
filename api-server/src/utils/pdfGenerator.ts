import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { logger } from "./logger.js";
import { IW9Form } from "../models/W9Form.js";

export class PDFGeneratorService {
  private static instance: PDFGeneratorService;

  private constructor() {}

  public static getInstance(): PDFGeneratorService {
    if (!PDFGeneratorService.instance) {
      PDFGeneratorService.instance = new PDFGeneratorService();
    }
    return PDFGeneratorService.instance;
  }

  /**
   * Generates a W-9 PDF form from the provided data
   * @param w9Data - The W-9 form data
   * @returns Buffer containing the PDF
   */
  public async generateW9PDF(w9Data: IW9Form): Promise<Buffer> {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Add a page
      const page = pdfDoc.addPage([612, 792]); // Standard letter size

      // Get the form
      const form = pdfDoc.getForm();

      // Set up fonts and styling
      const fontSize = 10;
      const titleFontSize = 14;
      const { width, height } = page.getSize();

      // Title
      page.drawText("Form W-9", {
        x: 50,
        y: height - 50,
        size: titleFontSize,
        color: rgb(0, 0, 0),
      });

      page.drawText(
        "Request for Taxpayer Identification Number and Certification",
        {
          x: 50,
          y: height - 70,
          size: fontSize,
          color: rgb(0, 0, 0),
        },
      );

      // Instructions
      page.drawText("Give Form to the requester. Do not send to the IRS.", {
        x: 50,
        y: height - 90,
        size: fontSize - 1,
        color: rgb(0.5, 0.5, 0.5),
      });

      let yPosition = height - 130;

      // 1. Name
      page.drawText("1. Name (as shown on your income tax return):", {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      page.drawText(w9Data.businessName || "", {
        x: 50,
        y: yPosition - 20,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      // Draw line under name
      page.drawLine({
        start: { x: 50, y: yPosition - 25 },
        end: { x: 550, y: yPosition - 25 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 60;

      // 2. Business name
      page.drawText(
        "2. Business name/disregarded entity name, if different from above:",
        {
          x: 50,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        },
      );

      // Draw line
      page.drawLine({
        start: { x: 50, y: yPosition - 25 },
        end: { x: 550, y: yPosition - 25 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 60;

      // 3. Tax Classification
      page.drawText(
        "3. Check appropriate box for federal tax classification:",
        {
          x: 50,
          y: yPosition,
          size: fontSize,
          color: rgb(0, 0, 0),
        },
      );

      yPosition -= 25;

      // Tax classification checkboxes
      const classifications = [
        {
          key: "individual",
          label: "Individual/sole proprietor or single-member LLC",
        },
        { key: "c-corp", label: "C Corporation" },
        { key: "s-corp", label: "S Corporation" },
        { key: "partnership", label: "Partnership" },
        { key: "trust", label: "Trust/estate" },
        { key: "llc", label: "Limited liability company" },
        { key: "other", label: "Other" },
      ];

      classifications.forEach((classification, index) => {
        const isChecked = w9Data.taxClassification === classification.key;
        const xPos = 70 + (index % 2) * 250;
        const yPos = yPosition - Math.floor(index / 2) * 20;

        // Draw checkbox
        page.drawRectangle({
          x: xPos,
          y: yPos - 2,
          width: 10,
          height: 10,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        // Fill checkbox if selected
        if (isChecked) {
          page.drawText("X", {
            x: xPos + 2,
            y: yPos,
            size: 8,
            color: rgb(0, 0, 0),
          });
        }

        // Label
        page.drawText(classification.label, {
          x: xPos + 15,
          y: yPos,
          size: fontSize - 1,
          color: rgb(0, 0, 0),
        });

        // If "other" is selected and there's a description
        if (
          classification.key === "other" &&
          isChecked &&
          w9Data.taxClassificationOther
        ) {
          page.drawText(`(${w9Data.taxClassificationOther})`, {
            x: xPos + 15 + (classification.label?.length || 0) * 5,
            y: yPos,
            size: fontSize - 1,
            color: rgb(0, 0, 0),
          });
        }
      });

      yPosition -= 100;

      // 4. Exemptions
      page.drawText("4. Exemptions (codes apply only to certain entities):", {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      if (w9Data.exemptPayeeCodes && w9Data.exemptPayeeCodes.length > 0) {
        page.drawText(
          `Exempt payee code: ${w9Data.exemptPayeeCodes.join(", ")}`,
          {
            x: 70,
            y: yPosition - 20,
            size: fontSize - 1,
            color: rgb(0, 0, 0),
          },
        );
      }

      if (w9Data.fatcaReportingCode) {
        page.drawText(`FATCA reporting code: ${w9Data.fatcaReportingCode}`, {
          x: 300,
          y: yPosition - 20,
          size: fontSize - 1,
          color: rgb(0, 0, 0),
        });
      }

      yPosition -= 60;

      // 5. Address
      page.drawText("5. Address (number, street, and apt. or suite no.):", {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      page.drawText(w9Data.address?.street || "", {
        x: 50,
        y: yPosition - 20,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: 50, y: yPosition - 25 },
        end: { x: 550, y: yPosition - 25 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 50;

      // 6. City, state, ZIP
      page.drawText("6. City, state, and ZIP code:", {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      const cityStateZip = `${w9Data.address?.city || ""}, ${w9Data.address?.state || ""} ${w9Data.address?.zipCode || ""}`;
      page.drawText(cityStateZip, {
        x: 50,
        y: yPosition - 20,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: 50, y: yPosition - 25 },
        end: { x: 550, y: yPosition - 25 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 60;

      // 7. List account numbers (if required by requester)
      page.drawText("7. List account number(s) here (optional):", {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: 50, y: yPosition - 25 },
        end: { x: 550, y: yPosition - 25 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 60;

      // Part I - Taxpayer Identification Number
      page.drawText("Part I    Taxpayer Identification Number (TIN)", {
        x: 50,
        y: yPosition,
        size: fontSize + 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 30;

      page.drawText(
        "Enter your TIN in the appropriate box. The TIN provided must match the name given on line 1.",
        {
          x: 50,
          y: yPosition,
          size: fontSize - 1,
          color: rgb(0, 0, 0),
        },
      );

      yPosition -= 30;

      // SSN box
      page.drawText("Social security number", {
        x: 50,
        y: yPosition,
        size: fontSize - 1,
        color: rgb(0, 0, 0),
      });

      // Draw SSN boxes (masked for security)
      const ssnBoxes = ["***", "**", "****"];
      let ssnXPos = 50;
      ssnBoxes.forEach((box, index) => {
        page.drawRectangle({
          x: ssnXPos,
          y: yPosition - 25,
          width: 30,
          height: 15,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        page.drawText(box, {
          x: ssnXPos + 5,
          y: yPosition - 20,
          size: fontSize - 1,
          color: rgb(0, 0, 0),
        });

        ssnXPos += 35;
        if (index < 2) {
          page.drawText("-", {
            x: ssnXPos - 5,
            y: yPosition - 20,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
        }
      });

      // EIN box
      page.drawText("or", {
        x: 200,
        y: yPosition,
        size: fontSize - 1,
        color: rgb(0, 0, 0),
      });

      page.drawText("Employer identification number", {
        x: 230,
        y: yPosition,
        size: fontSize - 1,
        color: rgb(0, 0, 0),
      });

      // Draw EIN boxes (masked for security)
      page.drawRectangle({
        x: 230,
        y: yPosition - 25,
        width: 80,
        height: 15,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      page.drawText("**-*******", {
        x: 235,
        y: yPosition - 20,
        size: fontSize - 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 80;

      // Part II - Certification
      page.drawText("Part II   Certification", {
        x: 50,
        y: yPosition,
        size: fontSize + 1,
        color: rgb(0, 0, 0),
      });

      yPosition -= 25;

      // Certification text
      const certificationText = [
        "Under penalties of perjury, I certify that:",
        "1. The number shown on this form is my correct taxpayer identification number (or I am waiting for a number to be issued to me); and",
        "2. I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the Internal Revenue",
        "   Service (IRS) that I am subject to backup withholding as a result of a failure to report all interest or dividends, or (c) the IRS has notified me that I am",
        "   no longer subject to backup withholding; and",
        "3. I am a U.S. citizen or other U.S. person (defined below); and",
        "4. The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct.",
      ];

      certificationText.forEach((line) => {
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: fontSize - 2,
          color: rgb(0, 0, 0),
        });
        yPosition -= 15;
      });

      yPosition -= 20;

      // Signature line
      page.drawText("Sign Here", {
        x: 50,
        y: yPosition,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      page.drawText("Signature >", {
        x: 50,
        y: yPosition - 25,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      // Signature
      page.drawText(w9Data.signature || "", {
        x: 120,
        y: yPosition - 25,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: 120, y: yPosition - 30 },
        end: { x: 350, y: yPosition - 30 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Date
      page.drawText("Date >", {
        x: 370,
        y: yPosition - 25,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      const dateString =
        w9Data.dateSigned?.toLocaleDateString() ||
        new Date().toLocaleDateString();
      page.drawText(dateString, {
        x: 410,
        y: yPosition - 25,
        size: fontSize,
        color: rgb(0, 0, 0),
      });

      page.drawLine({
        start: { x: 410, y: yPosition - 30 },
        end: { x: 550, y: yPosition - 30 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      logger.error("Failed to generate W-9 PDF:", error);
      throw new Error("Failed to generate W-9 PDF");
    }
  }

  /**
   * Saves a PDF buffer to a file
   * @param pdfBuffer - The PDF buffer
   * @param filename - The filename to save as
   * @param directory - The directory to save in (optional)
   * @returns The full file path
   */
  public async savePDFToFile(
    pdfBuffer: Buffer,
    filename: string,
    directory?: string,
  ): Promise<string> {
    try {
      const saveDirectory =
        directory || path.join(process.cwd(), "temp", "pdfs");

      // Ensure directory exists
      await fs.mkdir(saveDirectory, { recursive: true });

      const filePath = path.join(saveDirectory, filename);
      await fs.writeFile(filePath, pdfBuffer);

      logger.info(`PDF saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error("Failed to save PDF to file:", error);
      throw new Error("Failed to save PDF to file");
    }
  }

  /**
   * Generates a unique filename for a W-9 PDF
   * @param contractorId - The contractor ID
   * @param timestamp - Optional timestamp (defaults to now)
   * @returns Unique filename
   */
  public generateW9Filename(contractorId: string, timestamp?: Date): string {
    const date = timestamp || new Date();
    const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const timeString =
      date.toTimeString().split(" ")[0]?.replace(/:/g, "-") || "00-00-00"; // HH-MM-SS

    return `w9-${contractorId}-${dateString}-${timeString}.pdf`;
  }
}

// Export singleton instance
export const pdfGeneratorService = PDFGeneratorService.getInstance();

// Export utility functions
export const generateW9PDF = (w9Data: IW9Form): Promise<Buffer> => {
  return pdfGeneratorService.generateW9PDF(w9Data);
};

export const saveW9PDF = (
  pdfBuffer: Buffer,
  contractorId: string,
  directory?: string,
): Promise<string> => {
  const filename = pdfGeneratorService.generateW9Filename(contractorId);
  return pdfGeneratorService.savePDFToFile(pdfBuffer, filename, directory);
};
