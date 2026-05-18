import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-sans resize-y min-h-[80px]",
        "placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-black",
        "disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
