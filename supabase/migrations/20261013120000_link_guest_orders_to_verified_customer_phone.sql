create or replace function public.vincular_pedidos_cliente_por_telefone(
  p_auth_user_id uuid,
  p_telefone text
) returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cliente_id uuid;
  v_telefone_normalizado text;
  v_atualizados integer := 0;
begin
  if p_auth_user_id is null or length(regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g')) < 8 then
    raise exception 'Identificação de cliente inválida.';
  end if;

  select c.id into v_cliente_id
  from public.clientes c
  where c.auth_user_id = p_auth_user_id
  limit 1;

  if v_cliente_id is null then
    raise exception 'Cliente autenticado não encontrado.';
  end if;

  v_telefone_normalizado := regexp_replace(regexp_replace(p_telefone, '[^0-9]', '', 'g'), '^55', '');

  update public.pedidos p
  set cliente_id = v_cliente_id,
      atualizado_em = now()
  where p.cliente_id is null
    and regexp_replace(regexp_replace(coalesce(p.telefone, ''), '[^0-9]', '', 'g'), '^55', '') = v_telefone_normalizado;

  get diagnostics v_atualizados = row_count;
  return v_atualizados;
end;
$$;

revoke all on function public.vincular_pedidos_cliente_por_telefone(uuid, text) from public, anon, authenticated;
grant execute on function public.vincular_pedidos_cliente_por_telefone(uuid, text) to service_role;
