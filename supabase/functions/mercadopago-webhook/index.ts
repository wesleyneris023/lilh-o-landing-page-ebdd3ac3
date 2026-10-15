import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-signature, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function hex(bytes: Uint8Array) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseSignature(value: string | null) {
  const result: Record<string, string> = {};
  for (const part of value?.split(",") ?? []) {
    const [key, val] = part.split("=", 2);
    if (key && val) result[key.trim()] = val.trim();
  }
  return result;
}

async function hmacSha256(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return hex(new Uint8Array(signature));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  try {
    const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");

    if (!webhookSecret || !accessToken || !supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Webhook ainda não configurado." }), {
        status: 503,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const dataId = url.searchParams.get("data.id") || "";
    const requestId = req.headers.get("x-request-id") || "";
    const signature = parseSignature(req.headers.get("x-signature"));
    const ts = signature.ts || "";
    const receivedHash = signature.v1 || "";

    if (!dataId || !requestId || !ts || !receivedHash) {
      return new Response(JSON.stringify({ error: "Assinatura do webhook ausente." }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expectedHash = await hmacSha256(webhookSecret, manifest);
    if (!safeEqual(expectedHash, receivedHash)) {
      return new Response(JSON.stringify({ error: "Assinatura do webhook inválida." }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    if (body?.type && body.type !== "order") return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

    const orderId = dataId || body?.data?.id;
    if (!orderId) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    const order = await mpResponse.json().catch(() => ({}));

    if (!mpResponse.ok) {
      return new Response(JSON.stringify({ error: "Não foi possível consultar a order no Mercado Pago." }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const numero = typeof order?.external_reference === "string" ? order.external_reference : "";
    const paymentId = order?.transactions?.payments?.[0]?.id
      ? String(order.transactions.payments[0].id)
      : null;

    if (!/^LH-\d{8}-\d{4}$/.test(numero)) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
    }

    let pagamentoStatus: "pendente" | "aprovado" | "recusado" | "cancelado" = "pendente";
    if (order.status === "processed" && order.status_detail === "accredited") {
      pagamentoStatus = "aprovado";
    } else if (order.status === "failed") {
      pagamentoStatus = "recusado";
    } else if (["canceled", "expired", "refunded"].includes(order.status)) {
      pagamentoStatus = "cancelado";
    }

    const admin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    const { error } = await admin
      .from("pedidos")
      .update({
        mercadopago_order_id: String(order.id || orderId),
        mercadopago_payment_id: paymentId,
        pagamento_status: pagamentoStatus,
        atualizado_em: new Date().toISOString(),
      })
      .eq("numero", numero)
      .eq("pagamento", "PIX");

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, numero, pagamento_status: pagamentoStatus }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro no webhook." }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});