import { useEffect, useRef } from "react";
import { cardFaceLabel, cardLore } from "@/lib/poker/cards";
import { SIZE_RANK, type HistoryEntry } from "@/lib/poker/types";
import type { Lang } from "@/lib/poker/i18n";

export function FinalCardReveal({
  entry,
  lang,
  onClose,
}: {
  entry: HistoryEntry;
  lang: Lang;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const lore = cardLore(entry.result, entry.resultVariantId);
  const rank = SIZE_RANK[entry.result];
  const ru = lang === "ru";
  useEffect(() => {
    const focus = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (["Escape", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        e.preventDefault();
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", key);
      focus?.focus();
    };
  }, []);
  return (
    <div
      className="final-scene"
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="final-quest-title"
    >
      <button className="final-close" type="button" autoFocus onClick={onClose}>
        {ru ? "Продолжить" : "Continue"} ×
      </button>
      <div className="final-aura" aria-hidden="true" />
      <div className="final-card-arrival">
        <div
          className="final-tilt"
          onPointerMove={(e) => {
            if (
              e.pointerType !== "mouse" ||
              window.matchMedia("(prefers-reduced-motion: reduce)").matches
            )
              return;
            const r = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty(
              "--ry",
              `${-((e.clientX - r.left) / r.width - 0.5) * 26}deg`,
            );
            e.currentTarget.style.setProperty(
              "--rx",
              `${((e.clientY - r.top) / r.height - 0.5) * 18}deg`,
            );
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.setProperty("--ry", "0deg");
            e.currentTarget.style.setProperty("--rx", "0deg");
          }}
        >
          <div className="final-portrait">
            {lore && <img src={lore.art} alt="" draggable={false} />}
            <span className="final-size">{cardFaceLabel(entry.result)}</span>
            <span className="final-rarity">
              {rank >= 5 ? (ru ? "Легендарная" : "Legendary") : ru ? "Карта команды" : "Party card"}
            </span>
            <div className="final-inscription">
              <h2>{lore?.name[lang] ?? cardFaceLabel(entry.result)}</h2>
              <p>{lore?.title[lang]}</p>
              {rank && (
                <div className="final-meter">
                  <small>{ru ? "Размер задачи" : "Quest size"}</small>
                  <span>
                    <i style={{ width: `${(rank / 6) * 100}%` }} />
                  </span>
                  <b>{cardFaceLabel(entry.result)}</b>
                </div>
              )}
              <blockquote>
                {entry.decisionNote ||
                  (ru
                    ? "«Одни видят маленький квест. Другие — целый рейд. Теперь у команды есть общий план.»"
                    : "“Some see a small quest. Others see a whole raid. Now the party has a shared plan.”")}
              </blockquote>
            </div>
            <div className="final-shine" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="final-caption">
        <span>{ru ? "Задание оценено" : "Quest estimated"}</span>
        <h2 id="final-quest-title">{entry.title}</h2>
      </div>
    </div>
  );
}
