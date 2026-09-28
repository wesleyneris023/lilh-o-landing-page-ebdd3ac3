import { supabase, ORDER_FUNCTION_URL } from "./supabase";
import { dinheiro, produtosIniciais, type Pedido, type Produto } from "@/data/store";

type ProdutoDb = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem_url: string | null;
  selo: string | null;
  ativo: boolean;
  destaque: boolean;
  ordem: number;
  categorias?: { nome: string; slug?: string } | { nome: string; slug?: string }[] | null;
};

function mapProduto(row: ProdutoDb): Produto {
  const cat = Array.isArray(row.categorias) ? row.categorias[0] : row.categorias;
  const fallback = produtosIniciais.find((p) => p.nome === row.nome);
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    preco: Number(row.preco),
    categoria: cat?.nome || fallback?.categoria || "Outros",
    ...((row.imagem_url || fallback?.imagem) ? { imagem: (row.imagem_url || fallback?.imagem)! } : {}),
    ...((row.selo || fallback?.selo) ? { selo: (row.selo || fallback?.selo)! } : {}),
  };
}

export async function carregarCatalogo(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("id,nome,descricao,preco,imagem_url,selo,ativo,destaque,ordem,categorias(nome,slug)")
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => mapProduto(r as ProdutoDb));
}

export async function carregarCategorias(): Promise<string[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("nome")
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return ["Todos", ...(data || []).map((item) => item.nome)];
}

const CLIENTE_TOKEN_KEY = "lilhao-cliente-token-v1";

function obterTokenCliente() {
  if (typeof window === "undefined") return "";
  const existente = window.localStorage.getItem(CLIENTE_TOKEN_KEY);
  if (existente && existente.length >= 32) return existente;
  const token = `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
  window.localStorage.setItem(CLIENTE_TOKEN_KEY, token);
  return token;
}

export async function criarPedidoReal(input: {
  nome: string;
  telefone: string;
  tipo_entrega: "entrega" | "retirada";
  endereco: Record<string, string>;
  pagamento: string;
  observacao: string;
  itens: Array<{ id: string; quantidade: number }>;
  idempotency_key: string;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const cliente_token = obterTokenCliente();
  const response = await fetch(ORDER_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || "",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ ...input, cliente_token, idempotency_key: input.idempotency_key }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "Não foi possível criar o pedido.");
  if (typeof window !== "undefined" && typeof body?.cliente_token === "string" && body.cliente_token.length >= 32) {
    window.localStorage.setItem(CLIENTE_TOKEN_KEY, body.cliente_token);
  }
  return body as { id: string; numero: string; subtotal: number; taxa_entrega: number; total: number; status: string; pagamento_status: string; cliente_token: string };
}

function mapPedido(row: any): Pedido {
  return {
    numero: row.numero,
    criadoEm: row.criado_em,
    itens: (row.pedido_itens || row.itens || []).map((i: any) => ({
      id: i.produto_id || i.id,
      nome: i.nome_produto || i.nome,
      descricao: "",
      preco: Number(i.preco_unitario ?? i.preco),
      categoria: "",
      quantidade: Number(i.quantidade),
    })),
    nome: row.nome_cliente,
    telefone: row.telefone,
    entrega: row.tipo_entrega === "retirada" ? "Retirada no local" : "Entrega",
    endereco: formatEndereco(row.endereco),
    pagamento: row.pagamento,
    observacao: row.observacao || "",
    subtotal: Number(row.subtotal),
    taxa: Number(row.taxa_entrega),
    total: Number(row.total),
    status: row.status,
  };
}

function normalizarTelefone(telefone: string) {
  const digits = telefone.replace(/\D/g, "");
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
}

export async function carregarClienteAtual(): Promise<{ id: string; nome: string; telefone: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("clientes")
    .select("id,nome,telefone")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function enviarCodigoTelefone(telefone: string) {
  const phone = normalizarTelefone(telefone);
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
  return phone;
}

export async function confirmarCodigoTelefone(telefone: string, codigo: string) {
  const phone = normalizarTelefone(telefone);
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: codigo.trim(),
    type: "sms",
  });
  if (error) throw error;
  return { ...data, phone };
}

export async function sincronizarClienteAtual(nome: string, telefone: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Faça login para continuar.");
  const telefoneVerificado = session.user.phone || telefone;
  const response = await fetch(ORDER_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || "",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      acao: "vincular",
      nome: nome.trim(),
      telefone: telefoneVerificado.trim(),
      cliente_token: obterTokenCliente(),
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "Não foi possível salvar sua conta.");
  return body as { cliente_id: string; nome: string; telefone: string };
}

export async function sairCliente() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function carregarPedidosCliente(): Promise<Pedido[]> {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    const { data, error } = await supabase
      .from("pedidos")
      .select("numero,criado_em,nome_cliente,telefone,tipo_entrega,endereco,pagamento,observacao,subtotal,taxa_entrega,total,status,pedido_itens(id,produto_id,nome_produto,preco_unitario,quantidade,total)")
      .order("criado_em", { ascending: false });
    if (error) throw error;
    return (data || []).map(mapPedido);
  }

  const token = obterTokenCliente();
  if (!token) return [];
  const response = await fetch(ORDER_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || "",
    },
    body: JSON.stringify({ acao: "consultar", cliente_token: token }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "Não foi possível carregar seus pedidos.");
  const lista = Array.isArray(body?.pedidos) ? body.pedidos : [];
  return lista.map(mapPedido);
}

export async function carregarPedidosAdmin(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("*,pedido_itens(*)")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    numero: p.numero,
    criadoEm: p.criado_em,
    itens: (p.pedido_itens || []).map((i: any) => ({
      id: i.produto_id || i.id,
      nome: i.nome_produto,
      descricao: "",
      preco: Number(i.preco_unitario),
      categoria: "",
      quantidade: i.quantidade,
    })),
    nome: p.nome_cliente,
    telefone: p.telefone,
    entrega: p.tipo_entrega === "retirada" ? "Retirada no local" : "Entrega",
    endereco: formatEndereco(p.endereco),
    pagamento: p.pagamento,
    observacao: p.observacao || "",
    subtotal: Number(p.subtotal),
    taxa: Number(p.taxa_entrega),
    total: Number(p.total),
    status: p.status,
  }));
}

function formatEndereco(endereco: any) {
  if (!endereco || typeof endereco !== "object") return "";
  if (endereco.texto) return endereco.texto;
  return [endereco.rua && `${endereco.rua}, ${endereco.numero || ""}`, endereco.bairro, endereco.complemento, endereco.referencia && `Ref.: ${endereco.referencia}`].filter(Boolean).join(" — ");
}

export async function atualizarStatusPedido(numero: string, status: string) {
  const { error } = await supabase.from("pedidos").update({ status, atualizado_em: new Date().toISOString() }).eq("numero", numero);
  if (error) throw error;
}

export async function carregarProdutosAdmin() {
  const { data, error } = await supabase.from("produtos").select("id,nome,descricao,preco,imagem_url,selo,ativo,destaque,ordem,categoria_id,categorias(nome)").order("ordem", { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => mapProduto(r as ProdutoDb));
}

export async function salvarProdutoDb(produto: Produto) {
  const categoria = await supabase.from("categorias").select("id").eq("nome", produto.categoria).single();
  if (categoria.error) throw categoria.error;
  const payload = { nome: produto.nome, descricao: produto.descricao, preco: produto.preco, categoria_id: categoria.data.id, selo: produto.selo || null, imagem_url: produto.imagem || null, ativo: true };
  const existing = await supabase.from("produtos").select("id").eq("id", produto.id).maybeSingle();
  if (existing.data) {
    const { error } = await supabase.from("produtos").update(payload).eq("id", produto.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("produtos").insert(payload);
  if (error) throw error;
}

export async function excluirProdutoDb(id: string) {
  const { error } = await supabase.from("produtos").update({ ativo: false }).eq("id", id);
  if (error) throw error;
}

export async function carregarFormasPagamento() {
  const { data, error } = await supabase.from("formas_pagamento").select("nome").eq("ativo", true).order("ordem", { ascending: true });
  if (error) throw error;
  return (data || []).map((item) => item.nome);
}

export async function carregarConfiguracoes() {
  const { data, error } = await supabase.from("configuracoes_loja").select("*").eq("id", true).single();
  if (error) throw error;
  return data;
}

export async function salvarConfiguracoes(payload: Record<string, unknown>) {
  const { error } = await supabase.from("configuracoes_loja").update(payload).eq("id", true);
  if (error) throw error;
}

export async function ehAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase.from("admin_users").select("user_id,role,ativo,nome").eq("user_id", user.id).eq("ativo", true).maybeSingle();
  if (error) throw error;
  return !!data && (data.role === "admin" || data.role === "operador");
}

export { dinheiro };
