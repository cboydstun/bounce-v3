import mongoose, { Schema, Document, Model } from "mongoose";

interface ChatMessageMethods {
    // Add any instance methods here
}

interface ChatMessageModel extends Model<IChatMessage, {}, ChatMessageMethods> {
    findBySessionId(sessionId: string): Promise<IChatMessage[]>;
    findLatestBySessionId(sessionId: string): Promise<IChatMessage | null>;
    findLatestMessages(limit?: number): Promise<IChatMessage[]>;
}

export interface IChatMessage extends Document {
    id: string;
    sessionId: string;
    content: string;
    isAdmin: boolean;
    timestamp: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
    id: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    content: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
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
chatMessageSchema.index({ id: 1 }, { unique: true });
chatMessageSchema.index({ sessionId: 1 });
chatMessageSchema.index({ timestamp: -1 });

// Static methods
chatMessageSchema.statics.findBySessionId = function (sessionId: string) {
    return this.find({ sessionId }).sort({ timestamp: 1 });
};

chatMessageSchema.statics.findLatestBySessionId = function (sessionId: string) {
    return this.findOne({ sessionId }).sort({ timestamp: -1 });
};

chatMessageSchema.statics.findLatestMessages = function (limit: number = 100) {
    return this.find().sort({ timestamp: -1 }).limit(limit);
};

// Export the model
const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage, ChatMessageModel>("ChatMessage", chatMessageSchema);
export default ChatMessage;
