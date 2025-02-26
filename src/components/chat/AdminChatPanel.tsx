"use client";

import { useState, useEffect } from "react";
import {
  getAdminSessions,
  sendChatMessage,
  getChatMessages,
  updateSessionStatus,
} from "@/utils/api";
import { ChatMessage, ChatSession, ChatResponse } from "@/types/chat";

export default function AdminChatPanel() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  // Load sessions and setup polling
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000); // Poll every 10 seconds

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Load messages for selected session
  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession);
      const interval = setInterval(() => loadMessages(selectedSession), 5000);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const response = (await getAdminSessions()) as ChatResponse<{
        sessions: ChatSession[];
      }>;
      if (response.success && response.data) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const response = (await getChatMessages(sessionId)) as ChatResponse<
        ChatMessage[]
      >;
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !newMessage.trim()) return;

    try {
      const response = await sendChatMessage({
        sessionId: selectedSession,
        content: newMessage.trim(),
        isAdmin: true,
      });

      if (response.success && response.data) {
        setMessages((prev) => [...prev, response.data as ChatMessage]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSessionStatusChange = async (
    sessionId: string,
    isActive: boolean
  ) => {
    try {
      const response = await updateSessionStatus(sessionId, isActive);
      if (response.success) {
        loadSessions(); // Refresh sessions list
      }
    } catch (error) {
      console.error("Error updating session status:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sessions List */}
      <div className="w-1/3 border-r bg-white p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Chat Sessions</h2>
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedSession === session.id
                  ? "bg-purple-100"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedSession(session.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{session.contactInfo}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSessionStatusChange(session.id, !session.isActive);
                  }}
                  className={`px-2 py-1 rounded text-sm ${
                    session.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {session.isActive ? "Active" : "Closed"}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Started: {new Date(session.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.isAdmin
                          ? "bg-purple-600 text-white"
                          : "bg-white text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-xs opacity-75 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`px-4 py-2 rounded-md ${
                    newMessage.trim()
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">
              Select a chat session to view messages
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
