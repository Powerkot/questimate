import { CARD_BACK, cardLore } from "@/lib/poker/cards";
import type { Lang } from "@/lib/poker/i18n";
import type { CardValue } from "@/lib/poker/types";
import { cn } from "@/lib/cn";

type Size = "seat" | "deck" | "mini";
type Face = "back" | "front" | "empty";

type Props = {
  value?: CardValue | string | null;
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
  face,
  lang = "ru",
  size = "seat",
  selected,
  outlier,
  disabled,
  onClick,
}: Props) {
  const lore = cardLore(value);
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
        <img src={CARD_BACK} alt="" draggable={false} />
      </span>
      <span className="mc-side mc-front">
        {lore ? (
          <>
            <img src={lore.art} alt="" draggable={false} />
            <span className="mc-value">{value}</span>
            {size !== "mini" ? (
              <span className="mc-caption">
                <span className="mc-name">{lore.name[lang]}</span>
                {size === "seat" ? <span className="mc-title">{lore.title[lang]}</span> : null}
              </span>
            ) : null}
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

export function MiniFaces({ values, lang }: { values: string[]; lang: Lang }) {
  return (
    <div className="flex flex-wrap items-end gap-1.5">
      {values.map((v, i) => (
        <MagicCard key={`${v}-${i}`} value={v} face="front" size="mini" lang={lang} />
      ))}
    </div>
  );
}
