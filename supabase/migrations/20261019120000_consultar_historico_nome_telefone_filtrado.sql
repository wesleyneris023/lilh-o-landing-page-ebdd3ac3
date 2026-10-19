-- Filter public customer history inside PostgreSQL and return only fields required by the UI.
-- Never include delivery address or private notes in this public lookup.
CREATE OR REPLACE FUNCTION public.consultar_historico_nome_telefone(p_primeiro_nome text, p_telefone text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  WITH input AS (
    SELECT
      lower(split_part(regexp_replace(trim(coalesce(p_primeiro_nome, '')), '\\s+', ' ', 'g'), ' ', 1)) AS primeiro_nome,
      CASE
        WHEN length(regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g')) IN (12, 13)
          AND left(regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g'), 2) = '55'
        THEN substr(regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g'), 3)
        ELSE regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g')
      END AS telefone
  ),
  matches AS (
    SELECT p.criado_em,
      jsonb_build_object(
        'numero', p.numero, 'criado_em', p.criado_em, 'nome_cliente', p.nome_cliente,
        'telefone', p.telefone, 'tipo_entrega', p.tipo_entrega, 'pagamento', p.pagamento,
        'pagamento_status', p.pagamento_status, 'status', p.status, 'subtotal', p.subtotal,
        'taxa_entrega', p.taxa_entrega, 'total', p.total,
        'pedido_itens', coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'id', pi.id, 'produto_id', pi.produto_id, 'nome_produto', pi.nome_produto,
            'preco_unitario', pi.preco_unitario, 'quantidade', pi.quantidade, 'total', pi.total
          ) ORDER BY pi.id)
          FROM public.pedido_itens pi WHERE pi.pedido_id = p.id
        ), '[]'::jsonb)
      ) AS pedido_json
    FROM public.pedidos p CROSS JOIN input i
    WHERE i.primeiro_nome <> ''
      AND length(i.telefone) BETWEEN 10 AND 11
      AND lower(split_part(regexp_replace(trim(coalesce(p.nome_cliente, '')), '\\s+', ' ', 'g'), ' ', 1)) = i.primeiro_nome
      AND CASE
        WHEN length(regexp_replace(coalesce(p.telefone, ''), '[^0-9]', '', 'g')) IN (12, 13)
          AND left(regexp_replace(coalesce(p.telefone, ''), '[^0-9]', '', 'g'), 2) = '55'
        THEN substr(regexp_replace(coalesce(p.telefone, ''), '[^0-9]', '', 'g'), 3)
        ELSE regexp_replace(coalesce(p.telefone, ''), '[^0-9]', '', 'g')
      END = i.telefone
  )
  SELECT coalesce(jsonb_agg(pedido_json ORDER BY criado_em DESC), '[]'::jsonb) FROM matches;
$function$;
REVOKE ALL ON FUNCTION public.consultar_historico_nome_telefone(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consultar_historico_nome_telefone(text, text) TO service_role;
