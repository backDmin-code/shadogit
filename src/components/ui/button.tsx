import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:opacity-85 hover:-translate-y-px shadow-glow",
        gradient:
          "text-primary-foreground bg-[linear-gradient(135deg,#c8f135_0%,#f76aaa_100%)] hover:shadow-glow-lg",
        secondary:
          "bg-surface-2 text-foreground border border-border hover:border-primary/40 hover:text-primary",
        outline:
          "border border-border bg-surface-2 hover:border-primary/40 hover:text-primary",
        ghost:
          "text-text-dim hover:bg-surface-2 hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        link: "text-primary underline-offset-4 hover:underline border-b border-primary/40 rounded-none px-0",
      },
      size: {
        default: "h-8 px-4 py-1.5",
        sm: "h-7 rounded-md px-3 text-[11px]",
        lg: "h-10 rounded-lg px-6 text-sm",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
