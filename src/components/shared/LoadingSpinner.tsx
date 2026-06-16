import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export default function LoadingSpinner({ className, size = 24 }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center p-2">
      <Loader2 
        className={cn("animate-spin text-violet-500", className)} 
        style={{ width: size, height: size }}
      />
    </div>
  );
}
