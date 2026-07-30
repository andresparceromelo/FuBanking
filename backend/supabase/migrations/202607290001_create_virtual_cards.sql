create table if not exists public.virtual_cards (
  id uuid primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  card_holder_name text not null,
  card_number text not null unique,
  last_four char(4) not null,
  expiration_date char(5) not null,
  cvv char(3) not null,
  status text not null default 'ACTIVA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint virtual_cards_status_check
    check (status in ('ACTIVA', 'BLOQUEADA', 'CANCELADA')),
  constraint virtual_cards_number_check
    check (card_number ~ '^[0-9]{16}$'),
  constraint virtual_cards_last_four_check
    check (last_four ~ '^[0-9]{4}$'),
  constraint virtual_cards_expiration_date_check
    check (expiration_date ~ '^[0-9]{2}/[0-9]{2}$'),
  constraint virtual_cards_cvv_check
    check (cvv ~ '^[0-9]{3}$')
);

create index if not exists idx_virtual_cards_user_id
  on public.virtual_cards(user_id);

create index if not exists idx_virtual_cards_account_id
  on public.virtual_cards(account_id);

create index if not exists idx_virtual_cards_created_at
  on public.virtual_cards(created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_virtual_cards_updated_at on public.virtual_cards;

create trigger set_virtual_cards_updated_at
before update on public.virtual_cards
for each row
execute function public.set_updated_at();
