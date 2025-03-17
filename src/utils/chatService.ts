import axios from "axios";
import {
    getChatMessages,
    getAdminSessions,
    sendChatMessage,
    updateSessionStatus,
    createChatSession
} from "./api";
import { ChatMessage, ChatSession, ChatResponse } from "@/types/chat";

// Configuration for polling and backoff
const POLLING_CONFIG = {
    BASE_INTERVAL: 10000, // 10 seconds
    MAX_INTERVAL: 60000,  // 1 minute
    BACKOFF_FACTOR: 1.5,
    ERROR_THRESHOLD: 3,
    MAX_RETRIES: 5
};

// Interface for queued messages
interface QueuedMessage {
    sessionId: string;
    content: string;
    isAdmin?: boolean;
    timestamp: number;
    retryCount: number;
}

// Interface for polling state
interface PollingState {
    interval: number;
    errorCount: number;
    timeoutId: NodeJS.Timeout | null;
    lastPollTime: number;
    isPolling: boolean;
}

/**
 * Centralized service for managing chat operations
 * - Handles polling with exponential backoff
 * - Manages message queue for reliable delivery
 * - Implements request cancellation for stale requests
 */
class ChatService {
    private static instance: ChatService;
    private messageQueue: QueuedMessage[] = [];
    private pollingStates: Map<string, PollingState> = new Map();
    private abortControllers: Map<string, AbortController> = new Map();
    private sessionListeners: Map<string, Set<(messages: ChatMessage[]) => void>> = new Map();
    private sessionsListeners: Set<(sessions: ChatSession[]) => void> = new Set();
    private isProcessingQueue: boolean = false;
    private lastRequestTime: Record<string, number> = {};
    private RATE_LIMIT_DELAY = 1000; // 1 second between requests of the same type

    // Private constructor for singleton pattern
    private constructor() {
        // Start the message queue processor
        this.processMessageQueue();
    }

    /**
     * Get the singleton instance of ChatService
     */
    public static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService();
        }
        return ChatService.instance;
    }

    /**
     * Start polling for messages for a specific session
     * @param sessionId The session ID to poll for
     * @param callback Optional callback to receive messages
     */
    public startMessagePolling(sessionId: string, callback?: (messages: ChatMessage[]) => void): void {
        if (!this.pollingStates.has(sessionId)) {
            this.pollingStates.set(sessionId, {
                interval: POLLING_CONFIG.BASE_INTERVAL,
                errorCount: 0,
                timeoutId: null,
                lastPollTime: 0,
                isPolling: false
            });
        }

        // Add callback to listeners if provided
        if (callback) {
            if (!this.sessionListeners.has(sessionId)) {
                this.sessionListeners.set(sessionId, new Set());
            }
            this.sessionListeners.get(sessionId)?.add(callback);
        }

        const state = this.pollingStates.get(sessionId)!;
        if (!state.isPolling) {
            state.isPolling = true;
            this.pollMessages(sessionId);
        }
    }

    /**
     * Stop polling for messages for a specific session
     * @param sessionId The session ID to stop polling for
     * @param callback Optional callback to remove (if not provided, all callbacks are removed)
     */
    public stopMessagePolling(sessionId: string, callback?: (messages: ChatMessage[]) => void): void {
        const state = this.pollingStates.get(sessionId);
        if (!state) return;

        // Remove specific callback if provided
        if (callback && this.sessionListeners.has(sessionId)) {
            this.sessionListeners.get(sessionId)?.delete(callback);
            // If no more listeners, stop polling
            if (this.sessionListeners.get(sessionId)?.size === 0) {
                this.sessionListeners.delete(sessionId);
            }
        } else {
            // Remove all listeners
            this.sessionListeners.delete(sessionId);
        }

        // If no more listeners, stop polling
        if (!this.sessionListeners.has(sessionId)) {
            if (state.timeoutId) {
                clearTimeout(state.timeoutId);
            }
            state.isPolling = false;
            this.pollingStates.delete(sessionId);

            // Cancel any pending requests
            this.cancelRequest(`messages-${sessionId}`);
        }
    }

    /**
     * Start polling for admin sessions
     * @param callback Callback to receive sessions
     */
    public startSessionsPolling(callback: (sessions: ChatSession[]) => void): void {
        this.sessionsListeners.add(callback);

        if (!this.pollingStates.has('admin-sessions')) {
            this.pollingStates.set('admin-sessions', {
                interval: POLLING_CONFIG.BASE_INTERVAL,
                errorCount: 0,
                timeoutId: null,
                lastPollTime: 0,
                isPolling: false
            });

            const state = this.pollingStates.get('admin-sessions')!;
            state.isPolling = true;
            this.pollSessions();
        }
    }

    /**
     * Stop polling for admin sessions
     * @param callback Callback to remove
     */
    public stopSessionsPolling(callback: (sessions: ChatSession[]) => void): void {
        this.sessionsListeners.delete(callback);

        if (this.sessionsListeners.size === 0) {
            const state = this.pollingStates.get('admin-sessions');
            if (state?.timeoutId) {
                clearTimeout(state.timeoutId);
            }

            if (state) {
                state.isPolling = false;
            }

            this.pollingStates.delete('admin-sessions');

            // Cancel any pending requests
            this.cancelRequest('admin-sessions');
        }
    }

    /**
     * Send a message and add it to the queue for reliable delivery
     * @param sessionId The session ID to send the message to
     * @param content The message content
     * @param isAdmin Whether the message is from an admin
     * @returns A temporary message object
     */
    /**
     * Create a new chat session
     * @param contactInfo The contact information for the session
     * @param initialMessage The initial message to send
     * @returns Promise that resolves with the created session and message
     */
    public async createChatSession(contactInfo: string, initialMessage: string): Promise<{ session: ChatSession; message: ChatMessage }> {
        try {
            // Apply rate limiting
            await this.rateLimit('create-session');

            // Create a new abort controller
            const controller = new AbortController();
            this.abortControllers.set('create-session', controller);

            // Create the session
            const response = await createChatSession(
                {
                    contactInfo,
                    initialMessage
                },
                { signal: controller.signal }
            );

            if (response.success && response.data) {
                return response.data;
            }

            throw new Error(response.message || 'Failed to create chat session');
        } catch (error) {
            console.error('Error creating chat session:', error);
            throw error;
        } finally {
            // Clean up the abort controller
            this.abortControllers.delete('create-session');
        }
    }

    /**
     * Send a message and add it to the queue for reliable delivery
     * @param sessionId The session ID to send the message to
     * @param content The message content
     * @param isAdmin Whether the message is from an admin
     * @returns A temporary message object
     */
    public sendMessage(sessionId: string, content: string, isAdmin: boolean = false): ChatMessage {
        // Create a temporary message ID
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Add message to queue
        this.messageQueue.push({
            sessionId,
            content,
            isAdmin,
            timestamp: Date.now(),
            retryCount: 0
        });

        // Trigger queue processing
        this.triggerQueueProcessing();

        // Return a temporary message object for immediate UI feedback
        return {
            id: tempId,
            sessionId,
            content,
            isAdmin,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Update a session's status
     * @param sessionId The session ID to update
     * @param isActive The new active status
     * @returns Promise that resolves when the update is complete
     */
    public async updateSessionStatus(sessionId: string, isActive: boolean): Promise<void> {
        try {
            // Apply rate limiting
            await this.rateLimit('session-status');

            // Create a new abort controller
            const controller = new AbortController();
            this.abortControllers.set('session-status', controller);

            // Update the session status
            await updateSessionStatus(
                sessionId,
                isActive,
                { signal: controller.signal }
            );

            // Refresh sessions after status update
            this.pollSessions();
        } catch (error) {
            // Don't handle aborted requests as errors
            if (axios.isCancel(error)) {
                console.log('Session status update was cancelled');
                return;
            }

            console.error("Error updating session status:", error);
            throw error;
        } finally {
            // Clean up the abort controller
            this.abortControllers.delete('session-status');
        }
    }

    /**
     * Cancel a pending request
     * @param key The request key to cancel
     */
    private cancelRequest(key: string): void {
        const controller = this.abortControllers.get(key);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(key);
        }
    }

    /**
     * Poll for messages for a specific session
     * @param sessionId The session ID to poll for
     * @param showLoading Whether to show loading state
     */
    private async pollMessages(sessionId: string): Promise<void> {
        const state = this.pollingStates.get(sessionId);
        if (!state || !state.isPolling) return;

        try {
            // Cancel any existing request for this session
            this.cancelRequest(`messages-${sessionId}`);

            // Create a new abort controller
            const controller = new AbortController();
            this.abortControllers.set(`messages-${sessionId}`, controller);

            // Apply rate limiting
            await this.rateLimit(`messages-${sessionId}`);

            // Make the request with the abort controller
            const response = await getChatMessages(sessionId, {
                signal: controller.signal
            }) as ChatResponse<ChatMessage[]>;

            // Process successful response
            if (response.success && response.data) {
                // Reset error count and interval on success
                state.errorCount = 0;
                state.interval = POLLING_CONFIG.BASE_INTERVAL;

                // Notify all listeners
                const listeners = this.sessionListeners.get(sessionId);
                if (listeners) {
                    listeners.forEach(callback => callback(response.data as ChatMessage[]));
                }
            }
        } catch (error) {
            // Don't handle aborted requests as errors
            if (axios.isCancel(error)) {
                console.log(`Request for session ${sessionId} was cancelled`);
                return;
            }

            console.error(`Error polling messages for session ${sessionId}:`, error);

            // Increment error count and apply exponential backoff
            state.errorCount++;
            if (state.errorCount <= POLLING_CONFIG.ERROR_THRESHOLD) {
                state.interval = Math.min(
                    state.interval * POLLING_CONFIG.BACKOFF_FACTOR,
                    POLLING_CONFIG.MAX_INTERVAL
                );
            }
        } finally {
            // Clean up the abort controller
            this.abortControllers.delete(`messages-${sessionId}`);

            // Schedule next poll if still polling
            if (state.isPolling) {
                state.timeoutId = setTimeout(() => {
                    this.pollMessages(sessionId);
                }, state.interval);
            }
        }
    }

    /**
     * Poll for admin sessions
     * @param showLoading Whether to show loading state
     */
    private async pollSessions(): Promise<void> {
        const state = this.pollingStates.get('admin-sessions');
        if (!state || !state.isPolling) return;

        try {
            // Cancel any existing request
            this.cancelRequest('admin-sessions');

            // Create a new abort controller
            const controller = new AbortController();
            this.abortControllers.set('admin-sessions', controller);

            // Apply rate limiting
            await this.rateLimit('admin-sessions');

            // Make the request with the abort controller
            const response = await getAdminSessions({
                signal: controller.signal
            }) as ChatResponse<{ sessions: ChatSession[] }>;

            // Process successful response
            if (response.success && response.data) {
                // Reset error count and interval on success
                state.errorCount = 0;
                state.interval = POLLING_CONFIG.BASE_INTERVAL;

                // Notify all listeners
                const sessions = response.data.sessions || [];
                this.sessionsListeners.forEach(callback => {
                    callback(sessions);
                });
            }
        } catch (error) {
            // Don't handle aborted requests as errors
            if (axios.isCancel(error)) {
                console.log('Admin sessions request was cancelled');
                return;
            }

            console.error('Error polling admin sessions:', error);

            // Increment error count and apply exponential backoff
            state.errorCount++;
            if (state.errorCount <= POLLING_CONFIG.ERROR_THRESHOLD) {
                state.interval = Math.min(
                    state.interval * POLLING_CONFIG.BACKOFF_FACTOR,
                    POLLING_CONFIG.MAX_INTERVAL
                );
            }
        } finally {
            // Clean up the abort controller
            this.abortControllers.delete('admin-sessions');

            // Schedule next poll if still polling
            if (state.isPolling) {
                state.timeoutId = setTimeout(() => {
                    this.pollSessions();
                }, state.interval);
            }
        }
    }

    /**
     * Process the message queue
     */
    private async processMessageQueue(): Promise<void> {
        if (this.isProcessingQueue || this.messageQueue.length === 0) {
            // Schedule next check if there are no messages
            setTimeout(() => this.processMessageQueue(), 500);
            return;
        }

        this.isProcessingQueue = true;

        try {
            // Get the oldest message
            const message = this.messageQueue.shift();

            if (message) {
                try {
                    // Apply rate limiting
                    await this.rateLimit('send-message');

                    // Create a new abort controller
                    const controller = new AbortController();
                    this.abortControllers.set(`send-message-${message.sessionId}`, controller);

                    // Send the message with abort controller
                    const response = await sendChatMessage(
                        {
                            sessionId: message.sessionId,
                            content: message.content,
                            isAdmin: message.isAdmin
                        },
                        { signal: controller.signal }
                    );

                    // If successful, trigger a refresh of messages
                    if (response.success) {
                        // Refresh messages for this session
                        const state = this.pollingStates.get(message.sessionId);
                        if (state && state.isPolling) {
                            this.pollMessages(message.sessionId);
                        }
                    }
                } catch (error) {
                    // Clean up the abort controller
                    this.abortControllers.delete(`send-message-${message.sessionId}`);

                    // Don't handle aborted requests as errors
                    if (axios.isCancel(error)) {
                        console.log(`Message send was cancelled for session ${message.sessionId}`);
                        return;
                    }
                    console.error('Error sending message:', error);

                    // If under retry limit, add back to queue with increased retry count
                    if (message.retryCount < POLLING_CONFIG.MAX_RETRIES) {
                        this.messageQueue.push({
                            ...message,
                            retryCount: message.retryCount + 1,
                            timestamp: Date.now() // Update timestamp for sorting
                        });

                        // Sort queue by timestamp to maintain order
                        this.messageQueue.sort((a, b) => a.timestamp - b.timestamp);

                        console.warn(`Message send failed, queued for retry (${message.retryCount + 1}/${POLLING_CONFIG.MAX_RETRIES})`);
                    } else {
                        console.error('Failed to send message after maximum retries:', message);
                    }
                }
            }
        } finally {
            this.isProcessingQueue = false;

            // Process next message or schedule next check
            if (this.messageQueue.length > 0) {
                setTimeout(() => this.processMessageQueue(), 300);
            } else {
                setTimeout(() => this.processMessageQueue(), 500);
            }
        }
    }

    /**
     * Trigger queue processing
     */
    private triggerQueueProcessing(): void {
        if (!this.isProcessingQueue && this.messageQueue.length > 0) {
            this.processMessageQueue();
        }
    }

    /**
     * Apply rate limiting to requests
     * @param endpoint The endpoint to rate limit
     */
    private async rateLimit(endpoint: string): Promise<void> {
        const now = Date.now();
        const lastRequest = this.lastRequestTime[endpoint] || 0;
        const timeSinceLastRequest = now - lastRequest;

        if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
            // Wait for the remaining time
            await new Promise(resolve =>
                setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
            );
        }

        this.lastRequestTime[endpoint] = Date.now();
    }

    /**
     * Clean up all resources
     */
    public cleanup(): void {
        // Cancel all pending requests
        this.abortControllers.forEach(controller => {
            controller.abort();
        });
        this.abortControllers.clear();

        // Clear all timeouts
        this.pollingStates.forEach(state => {
            if (state.timeoutId) {
                clearTimeout(state.timeoutId);
            }
        });
        this.pollingStates.clear();

        // Clear all listeners
        this.sessionListeners.clear();
        this.sessionsListeners.clear();
    }
}

export default ChatService;
