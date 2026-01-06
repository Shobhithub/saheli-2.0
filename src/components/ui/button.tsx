import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // SOS Emergency Button
        sos: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sos animate-sos-pulse active:scale-95",
        // Coral Primary (for auth screens)
        coral: "bg-primary text-primary-foreground hover:opacity-90 shadow-md active:scale-[0.98]",
        // Teal Accent Button
        teal: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-md active:scale-[0.98]",
        // Success Button
        success: "bg-success text-success-foreground hover:bg-success/90 active:scale-[0.98]",
        // Warning Button  
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 active:scale-[0.98]",
        // Soft Outline for secondary actions
        "soft-outline": "border-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 active:scale-[0.98]",
        // Icon buttons in header
        "header-icon": "bg-header/20 text-header-foreground hover:bg-header/30 backdrop-blur-sm",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
        // SOS Button sizes
        sos: "h-24 w-24 rounded-full text-xl font-bold",
        "sos-lg": "h-32 w-32 rounded-full text-2xl font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
