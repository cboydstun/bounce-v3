"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { ChatMessage } from "@/types/chat";

interface ChatWindowProps {
  onClose: () => void;
  isOpen: boolean;
  sessionId?: string;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onSubmitContact: (contactInfo: string) => void;
}

export default function ChatWindow({
  onClose,
  isOpen,
  sessionId,
  messages,
  onSendMessage,
  onSubmitContact,
}: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isValidContact, setIsValidContact] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const validateContact = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateContact(contactInfo)) {
      onSubmitContact(contactInfo);
    }
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContactInfo(value);
    setIsValidContact(validateContact(value));
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-lg shadow-xl transition-all duration-300 flex flex-col ${
        isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Chat with Us</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contact Form or Messages */}
      {!sessionId ? (
        <div className="flex-1 p-4">
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="contact"
                className="block text-sm font-medium text-gray-700"
              >
                Enter your email or phone number to start chatting
              </label>
              <input
                type="text"
                id="contact"
                value={contactInfo}
                onChange={handleContactChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="Email or phone number"
              />
            </div>
            <button
              type="submit"
              disabled={!isValidContact}
              className={`w-full py-2 px-4 rounded-md ${
                isValidContact
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Start Chat
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      msg.isAdmin
                        ? "bg-gray-100 text-gray-800"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <form onSubmit={handleMessageSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className={`p-2 rounded-md ${
                  message.trim()
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
