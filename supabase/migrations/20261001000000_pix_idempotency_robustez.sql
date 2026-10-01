-- Robustez do PIX: retries idempotentes reutilizam os dados da cobrança existente.
DO $migration$
DECLARE
  v_definition text;
BEGIN
  SELECT pg_get_functiondef(p.oid)
    INTO v_definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'criar_pedido'
  LIMIT 1;

  IF v_definition IS NULL THEN
    RAISE EXCEPTION 'Função public.criar_pedido não encontrada';
  END IF;

  v_definition := replace(
    v_definition,
    '''cliente_id'',v_existing.cliente_id,''idempotente'',true',
    '''cliente_id'',v_existing.cliente_id,''mercadopago_order_id'',v_existing.mercadopago_order_id,''mercadopago_payment_id'',v_existing.mercadopago_payment_id,''pix_qr_code'',v_existing.pix_qr_code,''pix_qr_code_base64'',v_existing.pix_qr_code_base64,''pix_ticket_url'',v_existing.pix_ticket_url,''idempotente'',true'
  );

  EXECUTE v_definition;
END
$migration$;
