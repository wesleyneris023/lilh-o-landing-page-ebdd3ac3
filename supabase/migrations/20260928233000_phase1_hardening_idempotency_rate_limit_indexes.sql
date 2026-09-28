-- Phase 1 production hardening: duplicate-order protection, checkout rate limiting and FK indexes.
-- Applied to production Supabase project before this migration was committed to Git.

create table if not exists public.pedido_rate_limits (
  chave text primary key,
  janela_inicio timestamptz not null default now(),
  tentativas integer not null default 0 check (tentativas >= 0)
);

alter table public.pedido_rate_limits enable row level security;

create index if not exists pedido_rate_limits_janela_idx
  on public.pedido_rate_limits (janela_inicio);

alter table public.pedidos
  add column if not exists idempotency_key text;

create unique index if not exists pedidos_idempotency_key_uidx
  on public.pedidos (idempotency_key)
  where idempotency_key is not null;

create index if not exists enderecos_cliente_id_idx
  on public.enderecos (cliente_id);

create index if not exists pedido_itens_produto_id_idx
  on public.pedido_itens (produto_id);

drop function if exists public.criar_pedido(text,text,text,jsonb,text,text,jsonb,text,uuid);

create or replace function public.criar_pedido(
  p_nome text,
  p_telefone text,
  p_tipo_entrega text,
  p_endereco jsonb,
  p_pagamento text,
  p_observacao text,
  p_itens jsonb,
  p_cliente_token text,
  p_auth_user_id uuid default null,
  p_idempotency_key text default null,
  p_rate_limit_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_pedido_id uuid;
  v_numero text;
  v_subtotal numeric(10,2);
  v_taxa numeric(10,2);
  v_total numeric(10,2);
  v_item jsonb;
  v_produto public.produtos%rowtype;
  v_qtd integer;
  v_cfg public.configuracoes_loja%rowtype;
  v_hora time;
  v_abertura time;
  v_fechamento time;
  v_pagamento_ativo boolean;
  v_item_count integer;
  v_valid_item_count integer;
  v_cliente_token text;
  v_cliente_id uuid;
  v_rate_limit_key text;
  v_rate_attempts integer;
  v_existing public.pedidos%rowtype;
begin
  if length(trim(coalesce(p_nome,''))) < 2 then raise exception 'Nome inválido'; end if;
  if length(regexp_replace(coalesce(p_telefone,''),'\\D','','g')) < 8 then raise exception 'Telefone inválido'; end if;
  if p_tipo_entrega not in ('entrega','retirada') then raise exception 'Tipo de entrega inválido'; end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then raise exception 'Carrinho vazio'; end if;
  if length(trim(coalesce(p_cliente_token,''))) < 32 then raise exception 'Identificador do cliente inválido'; end if;
  if length(trim(coalesce(p_idempotency_key,''))) < 16 or length(trim(p_idempotency_key)) > 100 then raise exception 'Identificador de pedido inválido'; end if;

  v_cliente_token := trim(p_cliente_token);

  select * into v_existing
  from public.pedidos
  where idempotency_key = trim(p_idempotency_key)
  limit 1;

  if found then
    return jsonb_build_object(
      'id',v_existing.id,'numero',v_existing.numero,'subtotal',v_existing.subtotal,
      'taxa_entrega',v_existing.taxa_entrega,'total',v_existing.total,'status',v_existing.status,
      'pagamento_status',v_existing.pagamento_status,'cliente_token',v_cliente_token,
      'cliente_id',v_existing.cliente_id,'idempotente',true
    );
  end if;

  v_rate_limit_key := trim(coalesce(p_rate_limit_key,''));
  if length(v_rate_limit_key) < 16 then v_rate_limit_key := 'unknown'; end if;

  delete from public.pedido_rate_limits
  where janela_inicio < now() - interval '1 day';

  insert into public.pedido_rate_limits(chave, janela_inicio, tentativas)
  values (v_rate_limit_key, now(), 1)
  on conflict (chave) do update
    set janela_inicio = case
      when now() - public.pedido_rate_limits.janela_inicio >= interval '10 minutes' then now()
      else public.pedido_rate_limits.janela_inicio
    end,
    tentativas = case
      when now() - public.pedido_rate_limits.janela_inicio >= interval '10 minutes' then 1
      else public.pedido_rate_limits.tentativas + 1
    end
  returning tentativas into v_rate_attempts;

  if v_rate_attempts > 10 then
    raise exception 'Muitas tentativas de pedido. Aguarde alguns minutos e tente novamente.';
  end if;

  if p_auth_user_id is not null then
    select c.id into v_cliente_id
    from public.clientes c
    where c.auth_user_id = p_auth_user_id
    limit 1;

    if v_cliente_id is null then
      insert into public.clientes (auth_user_id, nome, telefone)
      values (p_auth_user_id, trim(p_nome), trim(p_telefone))
      returning id into v_cliente_id;
    else
      update public.clientes
      set nome = trim(p_nome), telefone = trim(p_telefone), updated_at = now()
      where id = v_cliente_id;
    end if;

    update public.pedidos
    set cliente_id = v_cliente_id
    where cliente_id is null
      and cliente_token_hash = encode(extensions.digest(v_cliente_token, 'sha256'),'hex');
  end if;

  select * into v_cfg from public.configuracoes_loja where id = true;

  if not found or coalesce(v_cfg.aceita_pedidos,false) = false then
    raise exception 'A lanchonete está temporariamente sem receber pedidos.';
  end if;

  v_hora := (now() at time zone 'America/Sao_Paulo')::time;
  v_abertura := nullif(trim(coalesce(v_cfg.horario_abertura,'')),'')::time;
  v_fechamento := nullif(trim(coalesce(v_cfg.horario_fechamento,'')),'')::time;

  if v_abertura is not null and v_fechamento is not null and v_abertura <> v_fechamento then
    if v_abertura < v_fechamento then
      if not (v_hora >= v_abertura and v_hora < v_fechamento) then
        raise exception 'A lanchonete está fechada no momento. Horário de atendimento: % às %.', to_char(v_abertura,'HH24:MI'), to_char(v_fechamento,'HH24:MI');
      end if;
    else
      if not (v_hora >= v_abertura or v_hora < v_fechamento) then
        raise exception 'A lanchonete está fechada no momento. Horário de atendimento: % às %.', to_char(v_abertura,'HH24:MI'), to_char(v_fechamento,'HH24:MI');
      end if;
    end if;
  end if;

  select exists(
    select 1 from public.formas_pagamento fp
    where fp.nome = p_pagamento and fp.ativo = true
  ) into v_pagamento_ativo;

  if not v_pagamento_ativo then raise exception 'Forma de pagamento indisponível.'; end if;

  if p_tipo_entrega = 'entrega' then
    if coalesce(p_endereco->>'rua','') = '' or coalesce(p_endereco->>'numero','') = '' or coalesce(p_endereco->>'bairro','') = '' then
      raise exception 'Endereço de entrega incompleto.';
    end if;
  end if;

  if p_tipo_entrega = 'retirada' then
    p_endereco := jsonb_build_object('texto','Retirada no local');
  end if;

  select count(*) into v_item_count from jsonb_array_elements(p_itens);
  select count(*) into v_valid_item_count
  from jsonb_array_elements(p_itens) i
  where (i->>'id') is not null
    and (i->>'quantidade') ~ '^[0-9]+$'
    and (i->>'quantidade')::integer between 1 and 99;

  if v_item_count <> v_valid_item_count then raise exception 'Quantidade de item inválida.'; end if;

  select coalesce(sum((p.preco * (i->>'quantidade')::integer)),0)
    into v_subtotal
  from jsonb_array_elements(p_itens) i
  join public.produtos p on p.id = (i->>'id')::uuid
  where p.ativo = true;

  if v_subtotal <= 0 then raise exception 'Itens indisponíveis.'; end if;

  select count(*) into v_valid_item_count
  from jsonb_array_elements(p_itens) i
  join public.produtos p on p.id = (i->>'id')::uuid
  where p.ativo = true;

  if v_valid_item_count <> v_item_count then raise exception 'Um ou mais produtos não estão mais disponíveis.'; end if;

  if v_cfg.pedido_minimo > 0 and v_subtotal < v_cfg.pedido_minimo then
    raise exception 'O pedido mínimo é de R$ %.', to_char(v_cfg.pedido_minimo,'FM999G999G990D00');
  end if;

  v_taxa := case when p_tipo_entrega = 'entrega' then coalesce(v_cfg.taxa_entrega,0) else 0 end;
  v_total := v_subtotal + v_taxa;
  v_numero := 'LH-' || to_char(now(),'YYYYMMDD') || '-' || lpad(nextval('public.pedido_numero_seq')::text,4,'0');

  begin
    insert into public.pedidos (
      numero,cliente_id,nome_cliente,telefone,tipo_entrega,endereco,pagamento,pagamento_status,
      status,subtotal,taxa_entrega,total,observacao,cliente_token_hash,idempotency_key
    ) values (
      v_numero,v_cliente_id,trim(p_nome),trim(p_telefone),p_tipo_entrega,coalesce(p_endereco,'{}'::jsonb),
      p_pagamento,case when p_pagamento='PIX' then 'pendente' else 'aprovado' end,
      'Recebido',v_subtotal,v_taxa,v_total,coalesce(p_observacao,''),
      encode(extensions.digest(v_cliente_token, 'sha256'),'hex'),trim(p_idempotency_key)
    ) returning id into v_pedido_id;
  exception when unique_violation then
    select * into v_existing from public.pedidos where idempotency_key = trim(p_idempotency_key) limit 1;
    if found then
      return jsonb_build_object(
        'id',v_existing.id,'numero',v_existing.numero,'subtotal',v_existing.subtotal,
        'taxa_entrega',v_existing.taxa_entrega,'total',v_existing.total,'status',v_existing.status,
        'pagamento_status',v_existing.pagamento_status,'cliente_token',v_cliente_token,
        'cliente_id',v_existing.cliente_id,'idempotente',true
      );
    end if;
    raise;
  end;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    select * into v_produto from public.produtos
    where id = (v_item->>'id')::uuid and ativo = true;
    if not found then raise exception 'Produto indisponível'; end if;
    v_qtd := (v_item->>'quantidade')::integer;
    insert into public.pedido_itens(pedido_id,produto_id,nome_produto,preco_unitario,quantidade,total)
    values (v_pedido_id,v_produto.id,v_produto.nome,v_produto.preco,v_qtd,v_produto.preco*v_qtd);
  end loop;

  return jsonb_build_object(
    'id',v_pedido_id,'numero',v_numero,'subtotal',v_subtotal,'taxa_entrega',v_taxa,'total',v_total,
    'status','Recebido','pagamento_status',case when p_pagamento='PIX' then 'pendente' else 'aprovado' end,
    'cliente_token',v_cliente_token,'cliente_id',v_cliente_id,'idempotente',false
  );
end;
$function$;

revoke all on function public.criar_pedido(text,text,text,jsonb,text,text,jsonb,text,uuid,text,text) from public, anon, authenticated;
grant execute on function public.criar_pedido(text,text,text,jsonb,text,text,jsonb,text,uuid,text,text) to service_role;
