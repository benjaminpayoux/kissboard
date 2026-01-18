import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent/90 focus:ring-accent/20",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-column focus:ring-accent/10",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/20",
  ghost:
    "bg-transparent text-foreground hover:bg-column focus:ring-accent/10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2
          px-4 py-2 rounded-lg
          text-sm font-medium
          transition-all duration-200
          hover:scale-[1.02] active:scale-[0.98]
          focus:outline-none focus:ring-2
          disabled:opacity-50 disabled:pointer-events-none
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
