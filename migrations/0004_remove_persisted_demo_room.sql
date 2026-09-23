-- RAID1 is now an isolated browser-side sandbox, not a shared persisted room.
-- Remove the legacy row so previously accumulated visitors, votes and chat are
-- gone as soon as this migration reaches an environment.
delete from poker_rooms where code = 'RAID1';
