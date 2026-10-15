-- PIX remains blocked by the production Edge Function guard until
-- MERCADOPAGO_PIX_ENABLED=true is explicitly configured.
update public.formas_pagamento
set ativo = true
where nome = 'PIX';

create index if not exists pedidos_pagamento_status_idx
  on public.pedidos(pagamento_status);
