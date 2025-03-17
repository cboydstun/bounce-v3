"use client";

import { useState, useEffect } from "react";
import ChatService from "@/utils/chatService";
import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";
import { ChatMessage } from "@/types/chat";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Load existing session from localStorage
  useEffect(() => {
    const savedSessionId = localStorage.getItem("chat_session_id");
    if (savedSessionId) {
      setSessionId(savedSessionId);
      // Initial messages will be loaded when polling starts
    }
  }, []);

  // Get chat service instance
  const chatService = ChatService.getInstance();

  // Setup polling for new messages when chat is open
  useEffect(() => {
    if (isOpen && sessionId) {
      // Start polling for messages
      chatService.startMessagePolling(sessionId, handleMessagesUpdate);

      // Cleanup when chat is closed or component unmounts
      return () => {
        chatService.stopMessagePolling(sessionId, handleMessagesUpdate);
      };
    }
  }, [isOpen, sessionId, chatService]);

  // Callback for message updates
  const handleMessagesUpdate = (updatedMessages: ChatMessage[]) => {
    setMessages(updatedMessages);
  };

  const handleSubmitContact = async (contactInfo: string) => {
    setError(null);
    setIsCreatingSession(true);

    try {
      // Use chat service to create session
      const { session, message } = await chatService.createChatSession(
        contactInfo,
        "Hi, I'd like to chat with you."
      );

      setSessionId(session.id);
      setMessages([message]);
      localStorage.setItem("chat_session_id", session.id);
    } catch (error) {
      console.error("Error creating chat session:", error);
      setError("Failed to create chat session. Please try again.");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!sessionId) return;

    try {
      // Use chat service to send message
      const tempMessage = chatService.sendMessage(sessionId, content, false);

      // Optimistically add message to UI
      setMessages((prev) => [...prev, tempMessage]);
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
        error={error}
        isCreatingSession={isCreatingSession}
      />
    </>
  );
}
