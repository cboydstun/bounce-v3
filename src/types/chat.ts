export interface ChatSession {
    id: string;
    contactInfo: string; // email or phone
    createdAt: string;
    isActive: boolean;
    lastMessageAt: string;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    content: string;
    isAdmin: boolean;
    timestamp: string;
}

export interface CreateSessionRequest {
    contactInfo: string;
    initialMessage: string;
}

export interface SendMessageRequest {
    sessionId: string;
    content: string;
    isAdmin?: boolean;
}

export interface ChatResponse {
    success: boolean;
    message?: string;
    data?: any;
}
