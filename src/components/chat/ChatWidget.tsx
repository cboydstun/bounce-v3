"use client";

import { useState, useEffect } from "react";
import {
  createChatSession,
  sendChatMessage,
  getChatMessages,
} from "@/utils/api";
import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";
import { ChatMessage, ChatResponse, ChatSession } from "@/types/chat";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Load existing session from localStorage
  useEffect(() => {
    const savedSessionId = localStorage.getItem("chat_session_id");
    if (savedSessionId) {
      setSessionId(savedSessionId);
      loadMessages(savedSessionId);
    }
  }, []);

  // Setup polling for new messages when chat is open
  useEffect(() => {
    if (isOpen && sessionId) {
      // Initial load
      loadMessages(sessionId);

      // Setup polling
      const interval = setInterval(() => {
        loadMessages(sessionId);
      }, 5000); // Poll every 5 seconds

      setPollInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      // Clear polling when chat is closed
      if (pollInterval) clearInterval(pollInterval);
    }
  }, [isOpen, sessionId, pollInterval]);

  const loadMessages = async (sid: string) => {
    try {
      const response = (await getChatMessages(sid)) as ChatResponse<
        ChatMessage[]
      >;
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSubmitContact = async (contactInfo: string) => {
    try {
      const response = (await createChatSession({
        contactInfo,
        initialMessage: "Hi, I'd like to chat with you.",
      })) as ChatResponse<{ session: ChatSession; message: ChatMessage }>;

      if (response.success && response.data) {
        const { session, message } = response.data;
        setSessionId(session.id);
        setMessages([message]);
        localStorage.setItem("chat_session_id", session.id);
      }
    } catch (error) {
      console.error("Error creating chat session:", error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!sessionId) return;

    try {
      const response = (await sendChatMessage({
        sessionId,
        content,
      })) as ChatResponse<ChatMessage>;

      if (response.success && response.data) {
        setMessages((prev) => [...prev, response.data as ChatMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <ChatButton onClick={handleToggleChat} isOpen={isOpen} />
      <ChatWindow
        onClose={() => setIsOpen(false)}
        isOpen={isOpen}
        sessionId={sessionId}
        messages={messages}
        onSendMessage={handleSendMessage}
        onSubmitContact={handleSubmitContact}
      />
    </>
  );
}
