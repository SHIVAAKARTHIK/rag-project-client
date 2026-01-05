"use client";

/**
 * AgentStatus Component
 * 
 * Shows the current status of the AI agent while processing.
 * 
 * Place at: src/components/chats/AgentStatus.tsx
 */

import { Search, Globe, FileText, Loader2, Sparkles, HelpCircle, CheckCircle } from "lucide-react";

interface AgentStatusProps {
  status: string;
}

/**
 * Simple inline status indicator
 */
export function AgentStatus({ status }: AgentStatusProps) {
  if (!status) return null;

  const getConfig = () => {
    if (status.includes("🔍") || status.includes("Searching your documents")) {
      return {
        icon: Search,
        bgClass: "bg-blue-500/10 border-blue-500/30",
        iconClass: "text-blue-400",
        label: "Searching documents...",
      };
    }
    
    if (status.includes("🌐") || status.includes("Searching the web")) {
      return {
        icon: Globe,
        bgClass: "bg-green-500/10 border-green-500/30",
        iconClass: "text-green-400",
        label: "Searching the web...",
      };
    }
    
    if (status.includes("✅") || status.includes("Found")) {
      return {
        icon: CheckCircle,
        bgClass: "bg-green-500/10 border-green-500/30",
        iconClass: "text-green-400",
        label: "Found relevant info!",
      };
    }
    
    if (status.includes("📝") || status.includes("Generating")) {
      return {
        icon: Sparkles,
        bgClass: "bg-purple-500/10 border-purple-500/30",
        iconClass: "text-purple-400",
        label: "Generating response...",
      };
    }
    
    if (status.includes("🤔") || status.includes("Checking") || status.includes("Not found")) {
      return {
        icon: HelpCircle,
        bgClass: "bg-yellow-500/10 border-yellow-500/30",
        iconClass: "text-yellow-400",
        label: "Analyzing query...",
      };
    }
    
    return {
      icon: Loader2,
      bgClass: "bg-gray-500/10 border-gray-500/30",
      iconClass: "text-gray-400",
      label: "Processing...",
    };
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div 
      className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border ${config.bgClass} transition-all duration-300`}
    >
      <Icon 
        size={16} 
        className={`${config.iconClass} ${Icon === Loader2 ? 'animate-spin' : ''}`} 
      />
      <span className="text-sm font-medium text-gray-200">{config.label}</span>
      <Loader2 size={12} className="text-gray-500 animate-spin" />
    </div>
  );
}

/**
 * Detailed status with step progress
 */
export function AgentStatusDetailed({ status }: AgentStatusProps) {
  if (!status) return null;

  const steps = [
    { id: "docs", label: "Search documents", icon: FileText, keywords: ["🔍", "documents"] },
    { id: "analyze", label: "Analyze query", icon: HelpCircle, keywords: ["🤔", "Checking", "Not found"] },
    { id: "web", label: "Search web", icon: Globe, keywords: ["🌐", "web"] },
    { id: "generate", label: "Generate response", icon: Sparkles, keywords: ["📝", "Generating", "✅"] },
  ];

  const getCurrentStepIndex = () => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].keywords.some(kw => status.includes(kw))) {
        return i;
      }
    }
    return 0;
  };

  const currentStep = getCurrentStepIndex();
  const isUsingWebSearch = status.includes("🌐") || status.includes("web");

  return (
    <div className="bg-[#1c1c1c] border border-gray-800 rounded-xl p-4 min-w-[260px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-medium text-gray-300">RAGent is working</span>
      </div>
      
      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          // Skip web step if not being used and we're past it
          if (step.id === "web" && !isUsingWebSearch && currentStep >= 3) {
            return null;
          }
          
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 transition-all duration-300 ${
                isActive ? "opacity-100" : isComplete ? "opacity-70" : "opacity-30"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-blue-500/20 border border-blue-500"
                    : isComplete
                    ? "bg-green-500/20 border border-green-500"
                    : "bg-gray-800 border border-gray-700"
                }`}
              >
                {isActive ? (
                  <Loader2 size={14} className="text-blue-400 animate-spin" />
                ) : isComplete ? (
                  <CheckCircle size={14} className="text-green-400" />
                ) : (
                  <Icon size={14} className="text-gray-500" />
                )}
              </div>
              
              <span 
                className={`text-sm ${
                  isActive ? "text-white font-medium" : isComplete ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}