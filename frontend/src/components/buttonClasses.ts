import { cn } from "../lib/cn";

// Kept in a non-component file so React Fast Refresh can hot-reload ui.tsx cleanly.

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "light";
export type ButtonSize = "sm" | "md" | "lg";

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none",
    "transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    size === "sm" && "h-9 px-4 text-sm",
    size === "md" && "h-11 px-5 text-[15px]",
    size === "lg" && "h-13 px-7 text-base",
    variant === "primary" && "bg-leaf-700 text-white shadow-lg shadow-leaf-700/25 hover:bg-leaf-800 hover:shadow-xl hover:shadow-leaf-700/30",
    variant === "secondary" && "bg-white text-leaf-800 ring-1 ring-leaf-200 hover:bg-leaf-50 hover:ring-leaf-300",
    variant === "ghost" && "text-leaf-800 hover:bg-leaf-100",
    variant === "danger" && "bg-danger-500 text-white hover:bg-danger-700",
    variant === "light" && "bg-white text-leaf-800 shadow-lg hover:bg-leaf-50",
    extra,
  );
}
