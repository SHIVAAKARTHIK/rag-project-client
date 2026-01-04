"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { CitationModal } from "@/components/chat/CitationModal";
import { ChatWithMessages, Message } from "@/lib/types";
import { apiClient } from "@/lib/api";
import { MessageFeedbackModal } from "@/components/chat/MessageFeedbackModel";
import toast from "react-hot-toast";
import { NotFound } from "@/components/ui/NotFound";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useStreamingChat } from "@/hooks/useStreamingChat";

interface Citation {
  chunk_id: string;
  document_id: string;
  filename: string;
  page: number;
}

interface ChunkDetails {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  page_number: number;
  char_count: number;
  type: string[];
  original_content: { text?: string } | null;
  filename: string;
}

interface ProjectChatPageProps {
  params: Promise<{
    projectId: string;
    chatId: string;
  }>;
}

export default function ProjectChatPage({ params }: ProjectChatPageProps) {
  const { projectId, chatId } = use(params);

  const [currentChatData, setCurrentChatData] =
    useState<ChatWithMessages | null>(null);

  const [isLoadingChatData, setIsLoadingChatData] = useState(true);

  const [sendMessageError, setSendMessageError] = useState<string | null>(null);

  const [feedbackModal, setFeedbackModal] = useState<{
    messageId: string;
    type: "like" | "dislike";
  } | null>(null);

  // Citation modal state
  const [citationModal, setCitationModal] = useState<{
    isOpen: boolean;
    chunkId: string | null;
    filename: string;
    page: number;
  }>({
    isOpen: false,
    chunkId: null,
    filename: "",
    page: 0,
  });

  const { getToken, userId } = useAuth();

  // Streaming hook
  const {
    sendMessage: sendStreamingMessage,
    isStreaming,
    streamingContent,
    status: agentStatus,
    abortStream,
  } = useStreamingChat({ projectId, chatId });

  // Handle citation click
  const handleCitationClick = (citation: Citation) => {
    setCitationModal({
      isOpen: true,
      chunkId: citation.chunk_id,
      filename: citation.filename,
      page: citation.page,
    });
  };

  // Fetch chunk details
  const fetchChunkDetails = async (chunkId: string): Promise<ChunkDetails> => {
    const token = await getToken();
    const response = await apiClient.get(`/api/chunks/${chunkId}`, token);
    return response;
  };

  // Close citation modal
  const handleCloseCitationModal = () => {
    setCitationModal({
      isOpen: false,
      chunkId: null,
      filename: "",
      page: 0,
    });
  };

  // Send message with streaming
  const handleSendMessage = async (content: string) => {
    try {
      setSendMessageError(null);

      if (!currentChatData || !userId) {
        setSendMessageError("Chat or user not found");
        return;
      }

      // Create optimistic user message to show immediately
      const optimisticUserMessage: Message = {
        id: `temp-${Date.now()}`,
        chat_id: currentChatData.id,
        content: content,
        role: "user",
        clerk_id: userId,
        created_at: new Date().toISOString(),
        citations: [],
      };

      // Add user message to UI immediately
      setCurrentChatData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, optimisticUserMessage],
        };
      });

      // Use streaming to send message
      const result = await sendStreamingMessage(content);

      if (result) {
        // Replace optimistic message with real messages from server
        setCurrentChatData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [
              ...prev.messages.filter(
                (msg) => msg.id !== optimisticUserMessage.id
              ),
              result.userMessage,
              result.aiMessage,
            ],
          };
        });

        toast.success("Message sent");
      }
    } catch (err) {
      setSendMessageError("Failed to send message");
      toast.error("Failed to send message");

      // Remove optimistic message on error
      setCurrentChatData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((msg) => !msg.id.startsWith("temp-")),
        };
      });
    }
  };

  const handleFeedbackOpen = (messageId: string, type: "like" | "dislike") => {
    setFeedbackModal({ messageId, type });
  };

  const handleFeedbackSubmit = async (feedback: {
    rating: "like" | "dislike";
    comment?: string;
    category?: string;
  }) => {
    if (!userId || !feedbackModal) return;

    try {
      const token = await getToken();

      await apiClient.post(
        "/api/feedback",
        {
          message_id: feedbackModal.messageId,
          rating: feedback.rating,
          comment: feedback.comment,
          category: feedback.category,
        },
        token
      );

      toast.success("Thanks for your feedback!");
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setFeedbackModal(null);
    }
  };

  useEffect(() => {
    const loadChat = async () => {
      if (!userId) return;

      setIsLoadingChatData(true);

      try {
        const token = await getToken();
        const result = await apiClient.get(`/api/chats/${chatId}`, token);
        const chatData = result.data;

        setCurrentChatData(chatData);
        toast.success("Chat loaded");
      } catch (err) {
        toast.error("Failed to load chat. Please try again.");
      } finally {
        setIsLoadingChatData(false);
      }
    };

    loadChat();
  }, [userId, chatId]);

  if (isLoadingChatData) {
    return <LoadingSpinner message="Loading chat..." />;
  }

  if (!currentChatData) {
    return <NotFound message="Chat not found" />;
  }

  return (
    <>
      <ChatInterface
        chat={currentChatData}
        projectId={projectId}
        onSendMessage={handleSendMessage}
        onFeedback={handleFeedbackOpen}
        onCitationClick={handleCitationClick}
        isLoading={isStreaming}
        error={sendMessageError}
        onDismissError={() => setSendMessageError(null)}
        isStreaming={isStreaming}
        streamingMessage={streamingContent}
        agentStatus={agentStatus}
      />
      
      {/* Feedback Modal */}
      <MessageFeedbackModal
        isOpen={!!feedbackModal}
        feedbackType={feedbackModal?.type}
        onSubmit={handleFeedbackSubmit}
        onClose={() => setFeedbackModal(null)}
      />

      {/* Citation Modal */}
      <CitationModal
        isOpen={citationModal.isOpen}
        onClose={handleCloseCitationModal}
        chunkId={citationModal.chunkId}
        filename={citationModal.filename}
        page={citationModal.page}
        onFetchChunk={fetchChunkDetails}
      />
    </>
  );
}