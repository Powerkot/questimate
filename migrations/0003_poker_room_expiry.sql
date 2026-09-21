-- A room's lifetime is fixed at creation time. Activity never extends it.
alter table poker_rooms
  add column if not exists created_at timestamptz not null default now();

create index if not exists poker_rooms_created_at_idx
  on poker_rooms (created_at);
