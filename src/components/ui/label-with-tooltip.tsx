import { Info } from "lucide-react";
import React from "react";

interface LabelWithTooltipProps {
  label: string;
  tooltip: string;
  htmlFor?: string;
  className?: string;
}

export function LabelWithTooltip({ label, tooltip, htmlFor, className = "" }: LabelWithTooltipProps) {
  return (
    <div className={`flex items-center gap-1.5 mb-1 group relative ${className}`}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <Info className="w-4 h-4 text-gray-400 cursor-help transition-colors group-hover:text-gray-600" />
      
      {/* Tooltip content */}
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-black/90 backdrop-blur-sm text-white text-xs p-2.5 rounded-lg shadow-lg z-10 animate-in fade-in zoom-in-95 duration-200">
        {tooltip}
        {/* Arrow pointer */}
        <div className="absolute left-6 top-full -mt-1 w-2 h-2 bg-black/90 rotate-45 pointer-events-none"></div>
      </div>
    </div>
  );
}
