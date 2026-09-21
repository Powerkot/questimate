import { cardBackArt, cardLore } from "@/lib/poker/cards";
import type { Lang } from "@/lib/poker/i18n";
import type { CardValue } from "@/lib/poker/types";
import { cn } from "@/lib/cn";

type Size = "seat" | "deck" | "mini" | "hero";
type Face = "back" | "front" | "empty";

type Props = {
  value?: CardValue | string | null;
  variantId?: string | null;
  backId?: string | null;
  face: Face;
  lang?: Lang;
  size?: Size;
  selected?: boolean;
  outlier?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function MagicCard({
  value,
  variantId,
  backId,
  face,
  lang = "ru",
  size = "seat",
  selected,
  outlier,
  disabled,
  onClick,
}: Props) {
  const lore = cardLore(value, variantId);
  const label = lore
    ? `${value} — ${lore.name[lang]}, ${lore.title[lang]}`
    : face === "back"
      ? "Hidden card"
      : "Empty seat";
  const className = cn(
    "mc",
    size === "seat" && "mc-seat",
    size === "deck" && "mc-deck",
    size === "mini" && "mc-mini",
    size === "hero" && "mc-hero",
    face === "front" && "is-face",
    face === "empty" && "is-empty",
    selected && "is-selected",
    outlier && "is-outlier",
    lore?.epic && face === "front" && "is-epic",
    onClick && "mc-btn",
    disabled && "is-disabled",
  );
  const inner = (
    <span className="mc-inner">
      <span className="mc-side mc-back">
        <img src={cardBackArt(backId)} alt="" draggable={false} loading="lazy" />
      </span>
      <span className="mc-side mc-front">
        {lore ? (
          <>
            <img
              src={lore.art}
              alt=""
              draggable={false}
              loading={size === "deck" ? "eager" : "lazy"}
            />
          </>
        ) : (
          <span className="mc-blank">—</span>
        )}
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        disabled={disabled}
        title={label}
        aria-label={label}
        onClick={onClick}
        data-selected={selected || undefined}
        className={className}
      >
        {inner}
      </button>
    );
  }

  return (
    <div title={label} aria-label={label} className={className}>
      {inner}
    </div>
  );
}

export function MiniFaces({
  values,
  lang,
}: {
  values: { value: string; variantId?: string | null }[];
  lang: Lang;
}) {
  return (
    <div className="flex flex-wrap items-end gap-1.5">
      {values.map((item, i) => (
        <MagicCard
          key={`${item.value}-${item.variantId ?? "base"}-${i}`}
          value={item.value}
          variantId={item.variantId}
          face="front"
          size="mini"
          lang={lang}
        />
      ))}
    </div>
  );
}
