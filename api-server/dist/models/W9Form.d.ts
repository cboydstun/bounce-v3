import mongoose, { Document } from "mongoose";
export interface IW9Form {
    contractorId: mongoose.Types.ObjectId;
    businessName: string;
    taxClassification: "individual" | "c-corp" | "s-corp" | "partnership" | "trust" | "llc" | "other";
    taxClassificationOther?: string;
    taxId: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    requestorInfo: {
        name: string;
        address: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
        };
    };
    certifications: {
        taxIdCorrect: boolean;
        notSubjectToBackupWithholding: boolean;
        usCitizenOrResident: boolean;
        fatcaExempt: boolean;
    };
    exemptPayeeCodes?: string[];
    fatcaReportingCode?: string;
    signature: string;
    signatureDate: string;
    status: "draft" | "submitted" | "approved" | "rejected";
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    pdfPath?: string;
    hasPdf: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IW9FormDocument extends IW9Form, Document {
    canBeModified(): boolean;
    canBeSubmitted(): boolean;
    isComplete(): boolean;
}
export interface IW9FormModel extends mongoose.Model<IW9FormDocument> {
    findByContractor(contractorId: mongoose.Types.ObjectId): Promise<IW9FormDocument | null>;
    findActiveByContractor(contractorId: mongoose.Types.ObjectId): Promise<IW9FormDocument | null>;
}
declare const W9Form: IW9FormModel;
export default W9Form;
//# sourceMappingURL=W9Form.d.ts.map