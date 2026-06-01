"use client";
import { icons, LucideProps } from "lucide-react";
import type { FC } from "react";

interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

function toPascal(name: string): string {
  return name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export function LucideIcon({ name, size = 18, strokeWidth = 1.75, className, color, style }: IconProps) {
  const pascal = toPascal(name);
  const IconComponent = (icons as Record<string, FC<LucideProps>>)[pascal];

  if (!IconComponent) return null;

  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      color={color}
      style={style}
      aria-hidden="true"
    />
  );
}
