import { useContext } from "react";
import { DeckThemeContext } from "./DeckThemeContext";
import type { DeckThemeId } from "@/lib/poker/card-themes";
import "./quest-card-face.css";

export function QuestCardFace({
  value,
  description,
  theme: explicitTheme,
}: {
  value: string;
  description?: string;
  theme?: DeckThemeId;
}) {
  const sharedTheme = useContext(DeckThemeContext);
  const theme = explicitTheme ?? sharedTheme;
  const label = value.toUpperCase();
  return (
    <span className={`quest-card-face qcf-${theme}`} data-deck-theme={theme} aria-hidden="true">
      <img
        className="qcf-art"
        src={`/cards/quest-fronts-v2/front-${theme}.webp`}
        alt=""
        draggable={false}
        decoding="async"
      />
      <svg className="qcf-type" viewBox="0 0 100 140" preserveAspectRatio="none">
        <text
          className="qcf-value"
          x={theme === "01" ? 54 : 50}
          y="78"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize={label.length > 2 ? 33 : 48}
          letterSpacing="-2"
        >
          {label}
        </text>
        {description && (
          <text
            className="qcf-description"
            x="50"
            y="101"
            textAnchor="middle"
            fontFamily="Georgia, serif"
            fontSize="5.5"
            fontWeight="600"
          >
            {description}
          </text>
        )}
      </svg>
    </span>
  );
}
