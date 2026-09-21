import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { Questimate } from "@/components/poker/Questimate";

type Search = {
  room?: string;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = typeof search.room === "string" ? search.room : "";
    const room = raw.trim().toUpperCase();
    return /^[A-Z0-9]{5}$/.test(room) ? { room } : {};
  },
  component: Home,
});

function Home() {
  const { room } = Route.useSearch();
  const navigate = Route.useNavigate();
  const onRoomCode = useCallback(
    (code: string | undefined) => {
      const next = code ? code.toUpperCase() : undefined;
      if ((room ?? undefined) === next) return;
      void navigate({
        search: next ? { room: next } : {},
        replace: true,
        resetScroll: false,
      });
    },
    [navigate, room],
  );

  return <Questimate roomCode={room} onRoomCode={onRoomCode} />;
}
