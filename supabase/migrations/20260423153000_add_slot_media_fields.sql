alter table if exists public.board_slots
  add column if not exists video_url text not null default '';

alter table if exists public.board_slots
  add column if not exists player_internal_id text not null default '';

alter table if exists public.board_slots
  add column if not exists player_image_url text not null default '';
