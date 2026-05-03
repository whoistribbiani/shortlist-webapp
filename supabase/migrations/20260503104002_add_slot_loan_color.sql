alter table if exists public.board_slots
  add column if not exists slot_color text not null default '',
  add column if not exists loan_from text not null default '';
