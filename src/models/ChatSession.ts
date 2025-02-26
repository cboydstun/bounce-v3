import mongoose, { Schema, Document, Model } from "mongoose";

type ChatSessionMethods = Record<string, never>;

interface ChatSessionModel extends Model<IChatSession, Record<string, never>, ChatSessionMethods> {
    findBySessionId(id: string): Promise<IChatSession | null>;
    findActiveSessions(): Promise<IChatSession[]>;
}

export interface IChatSession extends Document {
    id: string;
    contactInfo: string;
    createdAt: Date;
    isActive: boolean;
    lastMessageAt: Date;
}

const chatSessionSchema = new Schema<IChatSession>({
    id: { type: String, required: true, unique: true },
    contactInfo: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    lastMessageAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    toJSON: {
        transform: (_, ret) => {
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Create indexes
chatSessionSchema.index({ id: 1 }, { unique: true });
chatSessionSchema.index({ contactInfo: 1 });
chatSessionSchema.index({ isActive: 1 });
chatSessionSchema.index({ lastMessageAt: -1 });

// Static methods
chatSessionSchema.statics.findBySessionId = function (id: string) {
    return this.findOne({ id });
};

chatSessionSchema.statics.findActiveSessions = function () {
    return this.find({ isActive: true }).sort({ lastMessageAt: -1 });
};

// Export the model
const ChatSession = mongoose.models.ChatSession || mongoose.model<IChatSession, ChatSessionModel>("ChatSession", chatSessionSchema);
export default ChatSession;
