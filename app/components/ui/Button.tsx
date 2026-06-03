import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-container focus-visible:ring-primary/30",
  secondary: "border border-warm-line bg-warm-surface text-on-surface hover:bg-warm-raised focus-visible:ring-primary/20",
  danger: "bg-rescue-red text-white hover:bg-red-700 focus-visible:ring-red-200",
  ghost: "text-on-surface hover:bg-warm-raised focus-visible:ring-primary/20",
  success: "bg-field-green text-white hover:bg-emerald-800 focus-visible:ring-emerald-200",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-lg px-3 py-2 text-xs",
  md: "min-h-11 rounded-xl px-4 py-2.5 text-sm",
  lg: "min-h-12 rounded-xl px-6 py-3 text-base",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 font-bold transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

export function Button({ variant = "primary", size = "md", icon, className = "", children, ...props }: ButtonProps) {
  return (
    <button {...props} className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
};

export function ButtonLink({ href, variant = "primary", size = "md", icon, className = "", children, ...props }: ButtonLinkProps) {
  return (
    <Link href={href} {...props} className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {icon}
      {children}
    </Link>
  );
}
