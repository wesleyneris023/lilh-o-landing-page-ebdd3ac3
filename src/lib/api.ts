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
  categorias?: { nome: string; slug: string } | null;
};

function mapProduto(row: ProdutoDb): Produto {
  const fallback = produtosIniciais.find((p) => p.nome === row.nome);
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    preco: Number(row.preco),
    categoria: row.categorias?.nome || fallback?.categoria || "Outros",
    imagem: row.imagem_url || fallback?.imagem,
    selo: row.selo || fallback?.selo,
  };
}

export async function carregarCatalogo(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from("produtos")
    .select("id,nome,descricao,preco,imagem_url,selo,ativo,destaque,ordem,categorias(nome,slug)")
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapProduto);
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

export async function criarPedidoReal(input: {
  nome: string;
  telefone: string;
  tipo_entrega: "entrega" | "retirada";
  endereco: Record<string, string>;
  pagamento: string;
  observacao: string;
  itens: Array<{ id: string; quantidade: number }>;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(ORDER_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || "Não foi possível criar o pedido.");
  return body as { id: string; numero: string; subtotal: number; taxa_entrega: number; total: number; status: string; pagamento_status: string };
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
  return (data || []).map(mapProduto);
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
