import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center font-mono text-[10px] tracking-widest uppercase px-1.5 py-0.5 border",
  {
    variants: {
      variant: {
        default:  "bg-black text-white border-black",
        outline:  "border-current text-current bg-transparent",
        muted:    "bg-zinc-100 text-zinc-600 border-zinc-200",
        high:     "bg-red-50 text-red-700 border-red-200",
        medium:   "bg-amber-50 text-amber-700 border-amber-200",
        low:      "bg-green-50 text-green-700 border-green-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
