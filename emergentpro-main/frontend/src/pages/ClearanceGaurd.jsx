import React from "react";
import { useAuth } from "../../App";
import { Lock, EyeOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

const levels = {
  public: 0,
  confidential: 1,
  secret: 2,
  top_secret: 3
};

export default function ClearanceGuard({ level = "public", children, fallback = "redact" }) {
  const { user } = useAuth();
  
  const userLevel = levels[user?.clearance_level || "public"];
  const requiredLevel = levels[level];

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  // If access denied
  if (fallback === "hidden") return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-slate-100 border border-slate-300 rounded cursor-not-allowed select-none opacity-70">
            <Lock className="w-3 h-3 text-slate-500" />
            <span className="font-mono text-xs font-bold text-slate-500 tracking-widest">
              REDACTED
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 text-white border-slate-800">
          <p className="text-xs font-heading uppercase flex items-center gap-2">
            <EyeOff className="w-3 h-3" />
            Clearance Required: {level.replace('_', ' ')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}