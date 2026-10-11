import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DECK_THEMES, THEME_NAMES, type DeckThemeId } from "@/lib/poker/card-themes";
import { QuestCardFace } from "@/components/poker/QuestCardFace";
import "@/components/poker/quest-decks.css";

export const Route = createFileRoute("/quest-decks")({
  head: () => ({ meta: [{ title: "Выбранные колоды — Questimate" }] }),
  component: SelectedDecks,
});
function SelectedDecks() {
  const [theme, setTheme] = useState<DeckThemeId>("01");
  return (
    <main className="chosen-decks">
      <header>
        <a href="/?room=RAID1">← В таверну</a>
        <p>ДЕВЯТЬ ВЫБРАННЫХ ДИЗАЙНОВ</p>
        <h1>Колоды квестов</h1>
        <p>Один квест — одна колода для всех. Следующий квест — следующий дизайн.</p>
      </header>
      <section className="chosen-grid" aria-label="Выбранные дизайны">
        {DECK_THEMES.map((id) => (
          <button
            type="button"
            key={id}
            onClick={() => setTheme(id)}
            aria-pressed={theme === id}
            className={theme === id ? "active" : ""}
          >
            <span className="chosen-card">
              <QuestCardFace value="XL" theme={id} />
            </span>
            <strong>
              №{Number(id)} · {THEME_NAMES[id]}
            </strong>
          </button>
        ))}
      </section>
      <section className="chosen-hand">
        <h2>
          №{Number(theme)} · {THEME_NAMES[theme]}
        </h2>
        <p>Все оценки в одной колоде</p>
        <div>
          {["XS", "S", "M", "L", "XL", "XXL", "?", "☕"].map((value, i) => (
            <span key={value} style={{ transform: `rotate(${(i - 3.5) * 2}deg)` }}>
              <QuestCardFace theme={theme} value={value} />
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
