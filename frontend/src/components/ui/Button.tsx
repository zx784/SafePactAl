"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LucideIcon } from "@/components/ui/Icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
  onLight?: boolean;
  icon?: string;
  iconRight?: string;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size,
  onDark,
  onLight,
  icon,
  iconRight,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const cls = [
    "btn",
    `btn-${variant}`,
    size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "",
    onDark ? "on-dark" : "",
    onLight ? "on-light" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? 15 : 17;

  return (
    <button className={cls} {...rest}>
      {icon && <LucideIcon name={icon} size={iconSize} />}
      {children}
      {iconRight && <LucideIcon name={iconRight} size={iconSize} />}
    </button>
  );
}
