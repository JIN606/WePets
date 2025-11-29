

/**
 * @description ChatPets AI Assistant Widget
 * This component renders a floating chat widget in the bottom-right corner of the screen.
 * It has two states: minimized (just an icon and label) and expanded (full chat interface).
 * The widget provides quick question buttons and a chat input for pet care advice.
 * It uses the useChatPetsAI hook for state management and API communication.
 */

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { useChatPetsAI } from "../hooks/useChatPetsAI";

const quickQuestions = [
  "Diet & Nutrition",
  "Training Tips",
  "Health Concerns",
  "Behavior Issues",
];

export const ChatPetsWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, error, sendMessage } = useChatPetsAI();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue("");
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(`Tell me about ${question.toLowerCase()} for my pet`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-300 font-black uppercase tracking-wider"
        aria-label="Open ChatPets Assistant"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="text-sm">ChatPets</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 w-96 max-w-[calc(100vw-2rem)] animate-in zoom-in-95 duration-200">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-3xl overflow-hidden flex flex-col h-[600px] max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6" />
            <h3 className="text-xl font-black uppercase tracking-tight">ChatPets</h3>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close ChatPets"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
                <p className="text-gray-800 font-medium">
                  💬 Hello! I'm your pet assistant. How can I help you today?
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-gray-400 tracking-wider">🐾 Quick Questions:</p>
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full text-left px-4 py-3 bg-white border-2 border-gray-200 hover:border-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200 text-sm font-bold text-gray-700"
                  >
                    • {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-orange-600 to-red-600 text-white"
                    : "bg-white border-2 border-gray-200 text-gray-800"
                }`}
              >
                <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <p className="text-sm font-medium text-red-600">⚠️ {error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t-4 border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-600 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed font-medium text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-black uppercase tracking-wider text-sm"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
  
