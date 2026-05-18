import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display tracking-wide uppercase text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 cursor-pointer",
  {
    variants: {
      variant: {
        default:   "bg-black text-white hover:bg-zinc-800 border border-black",
        outline:   "border border-black bg-transparent text-black hover:bg-black hover:text-white",
        ghost:     "bg-transparent text-black hover:bg-zinc-100 border border-transparent",
        muted:     "bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200",
        destructive: "bg-red-600 text-white hover:bg-red-700 border border-red-600",
      },
      size: {
        default: "h-8 px-4 py-0",
        sm:      "h-7 px-3 text-xs",
        lg:      "h-10 px-6 text-base",
        icon:    "h-8 w-8 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
);
Button.displayName = "Button";
