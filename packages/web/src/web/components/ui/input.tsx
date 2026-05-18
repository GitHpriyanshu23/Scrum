import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-8 w-full border border-zinc-300 bg-white px-3 py-1 text-sm font-sans",
        "placeholder:text-zinc-400 focus-visible:outline-none focus-visible:border-black",
        "disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
