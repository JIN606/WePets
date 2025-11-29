

/**
 * @description ChatPets Service
 * This file provides the service layer for communicating with the ChatPets AI backend.
 * It handles sending messages to the API and receiving responses.
 * All API communication logic is centralized here for easy maintenance.
 */

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
  }
  
  export const chatpetsService = {
    async sendMessage(messages: ChatMessage[]): Promise<string> {
      try {
        const response = await fetch("/api/chatpets-ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get AI response");
        }
  
        const data = await response.json();
        return data.reply;
      } catch (error) {
        console.error("ChatPets service error:", error);
        throw error;
      }
    },
  };
    
  