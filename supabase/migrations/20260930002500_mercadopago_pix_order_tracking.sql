alter table public.pedidos
  add column if not exists mercadopago_order_id text,
  add column if not exists mercadopago_payment_id text,
  add column if not exists pix_qr_code text,
  add column if not exists pix_qr_code_base64 text,
  add column if not exists pix_ticket_url text;

create unique index if not exists pedidos_mercadopago_order_id_uidx
  on public.pedidos(mercadopago_order_id)
  where mercadopago_order_id is not null;

create index if not exists pedidos_pagamento_status_idx
  on public.pedidos(pagamento_status);
