import { createFileRoute } from "@tanstack/react-router";
import { CardLab } from "@/components/card-lab/CardLab";

export const Route = createFileRoute("/card-lab")({
  head: () => ({ meta: [{ title: "Мастерская карт — Questimate" }] }),
  component: CardLab,
});
