import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function validarEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Informe um e-mail válido para pagar com PIX.");
  }
  return email;
}

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0]?.slice(0, 60) || "Cliente";
}

async function criarOrderPixMercadoPago(args: {
  accessToken: string;
  total: number;
  numero: string;
  email: string;
  nome: string;
  idempotencyKey: string;
}) {
  const response = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${args.accessToken}`,
      "X-Idempotency-Key": args.idempotencyKey,
    },
    body: JSON.stringify({
      type: "online",
      total_amount: args.total.toFixed(2),
      external_reference: args.numero,
      processing_mode: "automatic",
      payer: {
        email: args.email,
        first_name: primeiroNome(args.nome),
      },
      transactions: {
        payments: [
          {
            amount: args.total.toFixed(2),
            payment_method: {
              id: "pix",
              type: "bank_transfer",
            },
            expiration_time: "PT24H",
          },
        ],
      },
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = result?.message || result?.error || result?.cause?.[0]?.description || "Não foi possível criar a cobrança PIX.";
    throw new Error(`Mercado Pago: ${detail}`);
  }

  const payment = result?.transactions?.payments?.[0];
  const paymentMethod = payment?.payment_method;
  if (!result?.id || !paymentMethod?.qr_code) {
    throw new Error("Mercado Pago não retornou os dados do PIX.");
  }

  return {
    order_id: String(result.id),
    payment_id: payment?.id ? String(payment.id) : null,
    status: result?.status ?? "action_required",
    status_detail: result?.status_detail ?? "waiting_transfer",
    qr_code: String(paymentMethod.qr_code),
    qr_code_base64: paymentMethod.qr_code_base64 ? String(paymentMethod.qr_code_base64) : "",
    ticket_url: paymentMethod.ticket_url ? String(paymentMethod.ticket_url) : "",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");
    if (!key) throw new Error("Chave de servidor não configurada.");

    const admin = createClient(url, key, { auth: { persistSession: false } });
    const body = await req.json();

    const authorization = req.headers.get("Authorization") || "";
    const forwardedFor = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const clientIp = forwardedFor.split(",")[0]?.trim() || "unknown";
    let authUserId: string | null = null;
    let verifiedPhone: string | null = null;

    if (authorization.startsWith("Bearer ")) {
      const accessToken = authorization.slice(7).trim();
      if (accessToken) {
        const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
        if (userError || !userData.user) {
          return new Response(JSON.stringify({ error: "Sessão de cliente inválida." }), {
            status: 401,
            headers: { ...cors, "Content-Type": "application/json" },
          });
        }
        authUserId = userData.user.id;
        verifiedPhone = userData.user.phone || null;
      }
    }

    if (body?.acao === "vincular") {
      if (!authUserId) {
        return new Response(JSON.stringify({ error: "Usuário não autenticado." }), {
          status: 401,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const nome = typeof body?.nome === "string" ? body.nome.trim() : "";
      if (nome.length < 2) throw new Error("Nome inválido.");
      const telefone = verifiedPhone || (typeof body?.telefone === "string" ? body.telefone.trim() : "");
      if (telefone.replace(/\D/g, "").length < 8) throw new Error("Telefone inválido.");

      const { data: cliente, error: clienteError } = await admin
        .from("clientes")
        .upsert({ auth_user_id: authUserId, nome, telefone, updated_at: new Date().toISOString() }, { onConflict: "auth_user_id" })
        .select("id,nome,telefone")
        .single();
      if (clienteError) throw clienteError;

      const token = typeof body?.cliente_token === "string" ? body.cliente_token.trim() : "";
      if (token.length >= 32) {
        const tokenHash = await sha256Hex(token);
        const { error: linkError } = await admin
          .from("pedidos")
          .update({ cliente_id: cliente.id })
          .is("cliente_id", null)
          .eq("cliente_token_hash", tokenHash);
        if (linkError) throw linkError;
      }

      return new Response(JSON.stringify({ cliente_id: cliente.id, nome: cliente.nome, telefone: cliente.telefone }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (body?.acao === "consultar_pagamento") {
      const token = typeof body?.cliente_token === "string" ? body.cliente_token.trim() : "";
      const numero = typeof body?.numero === "string" ? body.numero.trim() : "";
      if (token.length < 32 || !numero) {
        return new Response(JSON.stringify({ pagamento_status: "pendente" }), {
          status: 200,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const tokenHash = await sha256Hex(token);
      const { data: pedidoPagamento, error: pagamentoError } = await admin
        .from("pedidos")
        .select("numero,pagamento,pagamento_status,mercadopago_order_id,mercadopago_payment_id")
        .eq("cliente_token_hash", tokenHash)
        .eq("numero", numero)
        .eq("pagamento", "PIX")
        .maybeSingle();
      if (pagamentoError) throw pagamentoError;

      return new Response(JSON.stringify({
        numero: pedidoPagamento?.numero ?? numero,
        pagamento_status: pedidoPagamento?.pagamento_status ?? "pendente",
        mercadopago_order_id: pedidoPagamento?.mercadopago_order_id ?? null,
        mercadopago_payment_id: pedidoPagamento?.mercadopago_payment_id ?? null,
      }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (body?.acao === "consultar") {
      const token = typeof body?.cliente_token === "string" ? body.cliente_token.trim() : "";
      if (token.length < 32) {
        return new Response(JSON.stringify({ pedidos: [] }), {
          status: 200,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const tokenHash = await sha256Hex(token);
      const { data, error } = await admin
        .from("pedidos")
        .select("numero,criado_em,nome_cliente,telefone,tipo_entrega,endereco,pagamento,pagamento_status,status,subtotal,taxa_entrega,total,observacao,pedido_itens(id,produto_id,nome_produto,preco_unitario,quantidade,total)")
        .eq("cliente_token_hash", tokenHash)
        .order("criado_em", { ascending: false });
      if (error) throw error;

      return new Response(JSON.stringify({ pedidos: data ?? [] }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const rateLimitKey = `ip:${await sha256Hex(`${key}:${clientIp}`)}`;
    const { data: rateAttempts, error: rateError } = await admin.rpc("registrar_tentativa_pedido", {
      p_rate_limit_key: rateLimitKey,
    });
    if (rateError) throw rateError;
    if (Number(rateAttempts) > 10) {
      return new Response(JSON.stringify({ error: "Muitas tentativas de pedido. Aguarde alguns minutos e tente novamente." }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json", "Retry-After": "600" },
      });
    }

    const idempotencyKey = typeof body.idempotency_key === "string" ? body.idempotency_key.trim() : "";

    const { data, error } = await admin.rpc("criar_pedido", {
      p_nome: body.nome,
      p_telefone: verifiedPhone || body.telefone,
      p_tipo_entrega: body.tipo_entrega,
      p_endereco: body.endereco ?? {},
      p_pagamento: body.pagamento,
      p_observacao: body.observacao ?? "",
      p_itens: body.itens ?? [],
      p_cliente_token: body.cliente_token,
      p_auth_user_id: authUserId,
      p_idempotency_key: idempotencyKey,
    });

    if (error) throw error;

    if (body.pagamento === "PIX") {
      const mercadoPagoToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!mercadoPagoToken) throw new Error("Credencial do Mercado Pago não configurada.");

      const email = validarEmail(body.email);
      const pix = await criarOrderPixMercadoPago({
        accessToken: mercadoPagoToken,
        total: Number(data.total),
        numero: String(data.numero),
        email,
        nome: String(body.nome ?? ""),
        idempotencyKey,
      });

      const { error: pixPersistError } = await admin
        .from("pedidos")
        .update({
          mercadopago_order_id: pix.order_id,
          mercadopago_payment_id: pix.payment_id,
          pix_qr_code: pix.qr_code,
          pix_qr_code_base64: pix.qr_code_base64 || null,
          pix_ticket_url: pix.ticket_url || null,
          pagamento_status: "pendente",
          atualizado_em: new Date().toISOString(),
        })
        .eq("numero", String(data.numero))
        .eq("pagamento", "PIX");

      if (pixPersistError) throw pixPersistError;

      return new Response(JSON.stringify({
        ...data,
        pagamento_status: "pendente",
        pix,
      }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Erro ao processar pedido.",
    }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});