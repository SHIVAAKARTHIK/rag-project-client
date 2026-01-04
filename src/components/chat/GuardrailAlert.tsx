"use client";

/**
 * GuardrailAlert Component
 * 
 * Displays guardrail warnings and blocked message notifications.
 * 
 * Place at: src/components/chat/GuardrailAlert.tsx
 */

import { AlertTriangle, ShieldAlert, X, Info } from "lucide-react";

interface GuardrailAlertProps {
  type: "warning" | "blocked" | "info";
  message: string;
  onDismiss?: () => void;
}

export function GuardrailAlert({ type, message, onDismiss }: GuardrailAlertProps) {
  const config = {
    warning: {
      icon: AlertTriangle,
      bgClass: "bg-yellow-500/10 border-yellow-500/30",
      iconClass: "text-yellow-400",
      textClass: "text-yellow-200",
      title: "Warning",
    },
    blocked: {
      icon: ShieldAlert,
      bgClass: "bg-red-500/10 border-red-500/30",
      iconClass: "text-red-400",
      textClass: "text-red-200",
      title: "Message Blocked",
    },
    info: {
      icon: Info,
      bgClass: "bg-blue-500/10 border-blue-500/30",
      iconClass: "text-blue-400",
      textClass: "text-blue-200",
      title: "Notice",
    },
  };

  const { icon: Icon, bgClass, iconClass, textClass, title } = config[type];

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${bgClass} animate-in fade-in duration-300`}>
      <div className="flex-shrink-0 mt-0.5">
        <Icon size={18} className={iconClass} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${textClass}`}>{title}</p>
        <p className="text-sm text-gray-300 mt-1">{message}</p>
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>
      )}
    </div>
  );
}

/**
 * Inline guardrail status for streaming
 */
export function GuardrailStatus({ status }: { status: string }) {
  if (!status.includes("🛡️")) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
      <ShieldAlert size={14} className="text-blue-400" />
      <span className="text-xs font-medium text-blue-200">
        {status.replace("🛡️", "").trim()}
      </span>
    </div>
  );
}