-- Party Poker rooms. Unowned session state (no accounts): code + nick only.
create table if not exists poker_rooms (
  code       text primary key,
  version    integer not null default 0,
  state      jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists poker_rooms_updated_at_idx
  on poker_rooms (updated_at);
