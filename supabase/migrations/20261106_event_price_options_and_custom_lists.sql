-- Safe on the live site: only adds things, and existing events keep showing a plain rupee price.
alter table public.events
  add column if not exists price_currency text not null default 'INR'
    check (price_currency in ('INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD')),
  add column if not exists price_is_starting boolean not null default false;
