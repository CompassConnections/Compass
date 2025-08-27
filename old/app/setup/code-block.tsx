"use client";

import { useState } from "react";
import { ClipboardCopy } from "lucide-react";

interface CodeBlockProps {
  code: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="relative bg-gray-900 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
        <span className="text-xs text-gray-400">Terminal</span>
        <button
          onClick={copyToClipboard}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <span className="text-green-400 text-xs">Copied!</span>
          ) : (
            <ClipboardCopy size={16} />
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-gray-300 text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}