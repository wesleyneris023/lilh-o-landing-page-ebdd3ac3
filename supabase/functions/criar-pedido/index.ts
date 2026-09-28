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
      p_idempotency_key: typeof body.idempotency_key === "string" ? body.idempotency_key.trim() : "",
      p_rate_limit_key: `ip:${await sha256Hex(`${key}:${clientIp}`)}`,
    });

    if (error) throw error;

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