import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-line bg-input px-3 text-sm text-fg placeholder:text-muted/80 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded-md border border-line bg-input px-3 py-2 text-sm text-fg placeholder:text-muted/80 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold",
        className,
      )}
      {...props}
    />
  );
}
