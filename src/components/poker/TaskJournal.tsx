import { useState } from "react";
import { HistoryPanel } from "./HistoryPanel";
import type { HistoryEntry, Task } from "@/lib/poker/types";
import { I18N, type Lang } from "@/lib/poker/i18n";

type Props = {
  lang: Lang;
  history: HistoryEntry[];
  queue: Task[];
  current: Task | null;
  isHost: boolean;
  onAdd: (title: string, description: string) => Promise<boolean>;
  onStart: (id: string) => void;
  onRemove: (id: string) => void;
  onReestimate: (entry: HistoryEntry) => void;
};
export function TaskJournal({
  lang,
  history,
  queue,
  current,
  isHost,
  onAdd,
  onStart,
  onRemove,
  onReestimate,
}: Props) {
  const [tab, setTab] = useState("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const ru = lang === "ru";
  return (
    <div className="task-journal">
      <div className="journal-tabs" role="tablist" aria-label={ru ? "Журнал заданий" : "Quest log"}>
        {[
          [
            "all",
            ru ? "Все задания" : "All quests",
            history.length + queue.length + Number(!!current),
          ],
          ["pending", ru ? "Предстоящие" : "Upcoming", queue.length],
          ["done", ru ? "Завершённые" : "Completed", history.length],
        ].map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(String(id))}
          >
            {label}
            <small>{count}</small>
          </button>
        ))}
      </div>
      {isHost && tab !== "done" && (
        <form
          className="journal-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || !title.trim()) return;
            setBusy(true);
            try {
              if (await onAdd(title, description)) {
                setTitle("");
                setDescription("");
              }
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            aria-label={ru ? "Название задания" : "Quest title"}
            placeholder={ru ? "Следующее задание…" : "Next quest…"}
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            aria-label={ru ? "Описание задания" : "Quest description"}
            placeholder={ru ? "Описание (необязательно)" : "Description (optional)"}
            maxLength={4000}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit" disabled={busy || !title.trim()}>
            {ru ? "Добавить в очередь" : "Add to queue"}
          </button>
        </form>
      )}
      {tab === "all" && current && (
        <article className="journal-current">
          <small>{ru ? "Сейчас голосуем" : "Voting now"}</small>
          <strong>{current.title}</strong>
        </article>
      )}
      {tab !== "done" && (
        <div className="journal-queue">
          {queue.map((task) => (
            <article key={task.id}>
              <strong>{task.title}</strong>
              {task.description && <p>{task.description}</p>}
              {isHost && (
                <div>
                  <button type="button" disabled={!!current} onClick={() => onStart(task.id)}>
                    {ru ? "Начать голосование" : "Start voting"}
                  </button>
                  <button
                    type="button"
                    aria-label={`${ru ? "Убрать из очереди" : "Remove from queue"}: ${task.title}`}
                    onClick={() => onRemove(task.id)}
                  >
                    ×
                  </button>
                </div>
              )}
            </article>
          ))}
          {tab === "pending" && !queue.length && (
            <p className="journal-empty">
              {ru
                ? "Очередь пуста. Добавьте следующее задание."
                : "The queue is empty. Add your next quest."}
            </p>
          )}
        </div>
      )}
      {tab !== "pending" && (
        <HistoryPanel
          t={I18N[lang]}
          lang={lang}
          history={history}
          isHost={isHost}
          hasActiveTask={!!current}
          onReestimate={onReestimate}
        />
      )}
    </div>
  );
}
