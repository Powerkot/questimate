import { createContext } from "react";
import type { DeckThemeId } from "@/lib/poker/card-themes";
export const DeckThemeContext = createContext<DeckThemeId>("01");
