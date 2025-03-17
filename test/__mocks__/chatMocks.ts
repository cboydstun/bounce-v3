export const mockChatSession = {
    id: "test-session-1",
    contactInfo: "test@example.com",
    createdAt: new Date("2025-02-23T10:00:00Z").toISOString(),
    isActive: true,
    lastMessageAt: new Date("2025-02-23T10:05:00Z").toISOString(),
};

export const mockChatSessions = [
    mockChatSession,
    {
        id: "test-session-2",
        contactInfo: "customer@example.com",
        createdAt: new Date("2025-02-23T09:00:00Z").toISOString(),
        isActive: false,
        lastMessageAt: new Date("2025-02-23T09:30:00Z").toISOString(),
    }
];

export const mockChatMessages = [
    {
        id: "msg-1",
        sessionId: "test-session-1",
        content: "Hello, I have a question about bounce houses",
        isAdmin: false,
        timestamp: new Date("2025-02-23T10:00:00Z").toISOString(),
    },
    {
        id: "msg-2",
        sessionId: "test-session-1",
        content: "Hi! How can I help you today?",
        isAdmin: true,
        timestamp: new Date("2025-02-23T10:01:00Z").toISOString(),
    },
    {
        id: "msg-3",
        sessionId: "test-session-1",
        content: "What's the size of the Disney Princess bounce house?",
        isAdmin: false,
        timestamp: new Date("2025-02-23T10:02:00Z").toISOString(),
    },
];

export const mockApiResponses = {
    createSession: {
        success: true,
        data: {
            session: mockChatSession,
            message: mockChatMessages[0],
        },
    },
    sendMessage: {
        success: true,
        data: mockChatMessages[1],
    },
    getMessages: {
        success: true,
        data: mockChatMessages,
    },
    getSessions: {
        success: true,
        data: {
            sessions: [
                {
                    ...mockChatSession,
                    latestMessage: mockChatMessages[2],
                },
            ],
            total: 1,
        },
    },
};

// Mock for ChatService class
export const mockChatServiceInstance = {
    startMessagePolling: jest.fn(),
    stopMessagePolling: jest.fn(),
    startSessionsPolling: jest.fn(),
    stopSessionsPolling: jest.fn(),
    createChatSession: jest.fn().mockResolvedValue(mockApiResponses.createSession.data),
    sendMessage: jest.fn().mockImplementation((sessionId, content, isAdmin = false) => ({
        id: `temp-${Date.now()}`,
        sessionId,
        content,
        isAdmin,
        timestamp: new Date().toISOString()
    })),
    updateSessionStatus: jest.fn().mockResolvedValue({ success: true }),
    cleanup: jest.fn()
};

// Mock for ChatService.getInstance
export const mockGetInstance = jest.fn().mockReturnValue(mockChatServiceInstance);

// Mock API functions
export const mockApi = {
    createChatSession: jest.fn().mockResolvedValue(mockApiResponses.createSession),
    sendChatMessage: jest.fn().mockResolvedValue(mockApiResponses.sendMessage),
    getChatMessages: jest.fn().mockResolvedValue(mockApiResponses.getMessages),
    getAdminSessions: jest.fn().mockResolvedValue(mockApiResponses.getSessions),
    updateSessionStatus: jest.fn().mockResolvedValue({
        success: true,
        data: { ...mockChatSession, isActive: false },
    }),
};

// Mock localStorage
export const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
};

// Mock next/navigation
export const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: "/",
};
