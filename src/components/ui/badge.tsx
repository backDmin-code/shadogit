import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-1.5 py-0.5 text-2xs font-mono font-medium uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/25 bg-primary/12 text-primary",
        secondary:
          "border-border bg-surface-2 text-text-dim",
        outline:
          "border-border text-text-dim",
        accent:
          "border-accent/25 bg-accent/12 text-accent",
        mint:
          "border-[hsl(var(--accent-mint))]/25 bg-[hsl(var(--accent-mint))]/12 text-[hsl(var(--accent-mint))]",
        amber:
          "border-brand-amber/25 bg-brand-amber/10 text-brand-amber",
        gradient:
          "border-transparent text-white bg-[linear-gradient(135deg,#c8f135_0%,#f76aaa_100%)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
