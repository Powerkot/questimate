import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-[transform,background-color,color] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
  {
    variants: {
      variant: {
        gold: "bg-gold text-gold-ink shadow-[0_0_0_1px_var(--color-border)] hover:bg-gold-2",
        ghost:
          "bg-surface-2 text-fg shadow-[0_0_0_1px_var(--color-line)] hover:bg-surface",
        tiny: "bg-transparent text-muted font-medium hover:text-gold-2",
        lang: "rounded-full border border-line bg-transparent px-2.5 py-1 text-xs font-medium tracking-wide text-muted hover:text-fg",
        pip: "flex-col border border-border bg-card-back text-gold-2 hover:-translate-y-1 data-[selected=true]:-translate-y-1 data-[selected=true]:outline-2 data-[selected=true]:outline-gold",
      },
      size: {
        default: "h-11 rounded-md px-4 text-sm",
        compact: "h-9 rounded-sm px-3 text-sm",
        pip: "h-18 min-w-14 rounded-md px-2 text-lg",
        tiny: "h-8 rounded-sm px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
