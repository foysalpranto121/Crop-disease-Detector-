/** Join class names, skipping falsy values. */
export function cn(...classes: unknown[]): string {
  return classes.filter((c): c is string => typeof c === "string" && c.length > 0).join(" ");
}

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";
