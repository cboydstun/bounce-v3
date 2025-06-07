import mongoose from "mongoose";
export interface IQuickBooksToken {
    contractorId: mongoose.Types.ObjectId;
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresAt: Date;
    scope: string;
    realmId: string;
    isActive: boolean;
    lastRefreshed: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IQuickBooksTokenDocument extends IQuickBooksToken, mongoose.Document {
    _id: mongoose.Types.ObjectId;
    isExpired(): boolean;
    isExpiringSoon(minutesThreshold?: number): boolean;
}
export interface IQuickBooksTokenModel extends mongoose.Model<IQuickBooksTokenDocument> {
    findByContractor(contractorId: mongoose.Types.ObjectId): Promise<IQuickBooksTokenDocument | null>;
    findActiveTokens(): Promise<IQuickBooksTokenDocument[]>;
    findExpiringSoon(minutesThreshold?: number): Promise<IQuickBooksTokenDocument[]>;
    findByRealmId(realmId: string): Promise<IQuickBooksTokenDocument | null>;
}
declare const _default: IQuickBooksTokenModel;
export default _default;
//# sourceMappingURL=QuickBooksToken.d.ts.map