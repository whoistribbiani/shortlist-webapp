alter table if exists public.board_slots
  add column if not exists team_logo_url text not null default '';
