"use client";

import { useEffect, useState } from "react";
import { X, FileText, Hash, Type, Loader2, ExternalLink } from "lucide-react";

interface ChunkDetails {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  page_number: number;
  char_count: number;
  type: string[];  // Changed to array
  original_content: { text?: string } | null;  // Changed to object
  filename: string;
}

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunkId: string | null;
  filename: string;
  page: number;
  onFetchChunk: (chunkId: string) => Promise<ChunkDetails>;
}

export function CitationModal({
  isOpen,
  onClose,
  chunkId,
  filename,
  page,
  onFetchChunk,
}: CitationModalProps) {
  const [chunkDetails, setChunkDetails] = useState<ChunkDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && chunkId) {
      loadChunkDetails();
    } else {
      // Reset state when modal closes
      setChunkDetails(null);
      setError(null);
    }
  }, [isOpen, chunkId]);

  const loadChunkDetails = async () => {
    if (!chunkId) return;

    setIsLoading(true);
    setError(null);

    try {
      const details = await onFetchChunk(chunkId);
      setChunkDetails(details);
    } catch (err) {
      setError("Failed to load chunk details");
      console.error("Error fetching chunk:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1e1e1e]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#252525] border border-gray-700 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-gray-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-200 truncate max-w-md">
                {filename}
              </h3>
              <p className="text-xs text-gray-400">Page {page}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#252525] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-400">
                <Loader2 size={20} className="animate-spin" />
                <span>Loading chunk details...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-red-400 mb-2">{error}</p>
                <button
                  onClick={loadChunkDetails}
                  className="text-sm text-gray-400 hover:text-gray-200 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : chunkDetails ? (
            <div className="space-y-6">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetadataCard
                  icon={<Hash size={14} />}
                  label="Chunk Index"
                  value={`#${chunkDetails.chunk_index}`}
                />
                <MetadataCard
                  icon={<FileText size={14} />}
                  label="Page"
                  value={chunkDetails.page_number.toString()}
                />
                <MetadataCard
                  icon={<Type size={14} />}
                  label="Type"
                  value={chunkDetails.type.join(", ")}
                />
                <MetadataCard
                  icon={<Hash size={14} />}
                  label="Characters"
                  value={chunkDetails.char_count.toLocaleString()}
                />
              </div>

              {/* Chunk Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-300">
                    Chunk Content
                  </h4>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(chunkDetails.content);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded hover:bg-[#252525] transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-[#252525] border border-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {chunkDetails.content}
                  </p>
                </div>
              </div>

              {/* Original Content (if different) */}
              {chunkDetails.original_content?.text &&
                chunkDetails.original_content.text !== chunkDetails.content && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-300">
                      Original Content
                    </h4>
                    <div className="bg-[#202020] border border-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
                        {chunkDetails.original_content.text}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-800 bg-[#1e1e1e]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-[#252525] hover:bg-[#2a2a2a] border border-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for metadata cards
function MetadataCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#252525] border border-gray-700 rounded-lg p-3">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-medium text-gray-200 truncate">{value}</p>
    </div>
  );
}