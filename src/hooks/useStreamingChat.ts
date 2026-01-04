"use client";

/**
 * useStreamingChat Hook with Guardrails Support
 * 
 * Place at: src/hooks/useStreamingChat.ts
 */

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";

// Types
interface Citation {
  chunk_id: string;
  document_id: string;
  filename: string;
  page: number;
}

interface WebSource {
  url: string;
  title: string;
  snippet: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
  chat_id: string;
  clerk_id: string;
  citations?: Citation[];
}

interface StreamEvent {
  type: string;
  content: any;
  category?: string;
}

interface UseStreamingChatProps {
  projectId: string;
  chatId: string;
}

interface StreamResult {
  userMessage: Message;
  aiMessage: Message;
  response: string;
  citations: Citation[];
  webSources: WebSource[];
  blocked: boolean;
  blockReason?: string;
}

export function useStreamingChat({ projectId, chatId }: UseStreamingChatProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [status, setStatus] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  
  const { getToken } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string): Promise<StreamResult | undefined> => {
    // Reset state
    setIsStreaming(true);
    setStreamingContent("");
    setStatus("");
    setCitations([]);
    setWebSources([]);
    
    abortControllerRef.current = new AbortController();
    
    let fullResponse = "";
    let collectedCitations: Citation[] = [];
    let collectedWebSources: WebSource[] = [];
    let userMessage: Message | null = null;
    let aiMessage: Message | null = null;
    let blocked = false;
    let blockReason: string | undefined;
    
    try {
      const token = await getToken();

      const response = await apiClient.stream(
        `/api/projects/${projectId}/chats/${chatId}/messages/stream`,
        { content },
        token,
        abortControllerRef.current.signal
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              
              switch (event.type) {
                case "status":
                  setStatus(event.content);
                  break;
                  
                case "token":
                  fullResponse += event.content;
                  setStreamingContent(fullResponse);
                  break;
                  
                case "citations":
                  collectedCitations = event.content;
                  setCitations(event.content);
                  break;
                  
                case "web_sources":
                  collectedWebSources = event.content;
                  setWebSources(event.content);
                  break;
                  
                case "user_message":
                  userMessage = event.content;
                  break;
                  
                case "ai_message":
                  aiMessage = event.content;
                  break;
                  
                case "guardrail_blocked":
                  // ✅ Handle blocked message - display it as the response!
                  blocked = true;
                  blockReason = event.content;
                  fullResponse = event.content;  // Show block message
                  setStreamingContent(event.content);
                  setStatus("🛡️ Message blocked");
                  console.log("🚫 Guardrail blocked:", event.content);
                  break;
                  
                case "guardrail_warning":
                  console.log("⚠️ Guardrail warning:", event.content);
                  break;
                  
                case "done":
                  break;
                  
                case "error":
                  throw new Error(event.content);
              }
            } catch (parseError) {
              // Ignore incomplete JSON
            }
          }
        }
      }
      
      if (userMessage && aiMessage) {
        return {
          userMessage,
          aiMessage,
          response: fullResponse,
          citations: collectedCitations,
          webSources: collectedWebSources,
          blocked,
          blockReason,
        };
      }
      
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Stream aborted");
      } else {
        console.error("Streaming error:", error);
        throw error;
      }
    } finally {
      setIsStreaming(false);
      setStatus("");
      abortControllerRef.current = null;
    }
  }, [projectId, chatId, getToken]);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStatus("");
    }
  }, []);

  const resetStream = useCallback(() => {
    setIsStreaming(false);
    setStreamingContent("");
    setStatus("");
    setCitations([]);
    setWebSources([]);
  }, []);

  return {
    sendMessage,
    abortStream,
    resetStream,
    isStreaming,
    streamingContent,
    status,
    citations,
    webSources,
  };
}