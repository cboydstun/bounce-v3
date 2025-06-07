import { IW9Form } from "../models/W9Form.js";
export declare class PDFGeneratorService {
    private static instance;
    private constructor();
    static getInstance(): PDFGeneratorService;
    /**
     * Generates a W-9 PDF form from the provided data
     * @param w9Data - The W-9 form data
     * @returns Buffer containing the PDF
     */
    generateW9PDF(w9Data: IW9Form): Promise<Buffer>;
    /**
     * Saves a PDF buffer to a file
     * @param pdfBuffer - The PDF buffer
     * @param filename - The filename to save as
     * @param directory - The directory to save in (optional)
     * @returns The full file path
     */
    savePDFToFile(pdfBuffer: Buffer, filename: string, directory?: string): Promise<string>;
    /**
     * Generates a unique filename for a W-9 PDF
     * @param contractorId - The contractor ID
     * @param timestamp - Optional timestamp (defaults to now)
     * @returns Unique filename
     */
    generateW9Filename(contractorId: string, timestamp?: Date): string;
}
export declare const pdfGeneratorService: PDFGeneratorService;
export declare const generateW9PDF: (w9Data: IW9Form) => Promise<Buffer>;
export declare const saveW9PDF: (pdfBuffer: Buffer, contractorId: string, directory?: string) => Promise<string>;
//# sourceMappingURL=pdfGenerator.d.ts.map