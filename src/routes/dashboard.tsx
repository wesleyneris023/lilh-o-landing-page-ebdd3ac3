import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Check, ClipboardList, ExternalLink, LayoutDashboard, Package, Plus, Search, Settings, Trash2, Utensils, X } from "lucide-react";
import { categorias, dinheiro, lerPedidos, lerProdutos, salvarProdutos, type Pedido, type Produto } from "@/data/store";

type Aba = "visao" | "pedidos" | "cardapio" | "categorias" | "configuracoes";
const statusOptions = ["Recebido", "Em preparo", "Pronto", "Saiu para entrega", "Concluído"];

function Dashboard() {
  const [aba, setAba] = useState<Aba>("visao");
  const [pedidos, setPedidos] = useState<Pedido[]>(lerPedidos());
  const [produtos, setProdutos] = useState<Produto[]>(lerProdutos());
  const [busca, setBusca] = useState("");
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [mensagem, setMensagem] = useState("");

  const hoje = new Date().toLocaleDateString("pt-BR");
  const pedidosHoje = pedidos.filter(p => new Date(p.criadoEm).toLocaleDateString("pt-BR") === hoje);
  const vendasHoje = pedidosHoje.reduce((s, p) => s + p.total, 0);
  const itensVendidos = pedidos.reduce((s, p) => s + p.itens.reduce((a, i) => a + i.quantidade, 0), 0);
  const filtrados = useMemo(() => produtos.filter(p => `${p.nome} ${p.descricao} ${p.categoria}`.toLowerCase().includes(busca.toLowerCase())), [produtos, busca]);

  const menu = [
    ["visao", "Visão geral", LayoutDashboard],
    ["pedidos", "Pedidos", ClipboardList],
    ["cardapio", "Cardápio", Utensils],
    ["categorias", "Categorias", Package],
    ["configuracoes", "Configurações", Settings],
  ] as const;

  function atualizarStatus(numero: string, status: string) {
    const atualizados = pedidos.map(p => p.numero === numero ? { ...p, status } : p);
    setPedidos(atualizados);
    try { localStorage.setItem("lilhao-pedidos", JSON.stringify(atualizados)); } catch {}
    setMensagem("Status atualizado.");
  }

  function salvarProduto(produto: Produto) {
    const atualizados = produtos.some(p => p.id === produto.id) ? produtos.map(p => p.id === produto.id ? produto : p) : [...produtos, produto];
    setProdutos(atualizados); salvarProdutos(atualizados); setProdutoEditando(null); setMensagem("Cardápio salvo neste navegador.");
  }

  function excluirProduto(id: string) {
    const atualizados = produtos.filter(p => p.id !== id);
    setProdutos(atualizados); salvarProdutos(atualizados); setMensagem("Produto removido.");
  }

  return <div className="min-h-screen bg-[#080909] text-white">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101112]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.assign("/")} className="grid size-10 place-items-center rounded-full border-2 border-[#ffc400] bg-[#17150d] font-black text-[#ffc400]" aria-label="Voltar para a loja">L!</button>
          <div><p className="text-lg font-black">Lilhão<span className="text-[#ffc400]">.</span></p><p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/40">Painel administrativo</p></div>
        </div>
        <div className="flex items-center gap-2"><span className="hidden rounded-full border border-[#ffc400]/20 bg-[#ffc400]/5 px-3 py-2 text-xs text-[#ffc400] sm:inline">Modo de demonstração</span><button onClick={() => window.location.assign("/")} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70"><ExternalLink className="mr-1 inline size-4"/> Loja</button></div>
      </div>
    </header>

    <div className="mx-auto flex max-w-[1500px]">
      <aside className="sticky top-[69px] hidden h-[calc(100vh-69px)] w-64 shrink-0 border-r border-white/10 bg-[#0d0e0f] p-4 md:block">
        <p className="px-3 pb-3 text-[10px] font-black uppercase tracking-[.2em] text-white/30">Gerenciamento</p>
        <div className="space-y-1">{menu.map(([id,label,Icon]) => <button key={id} onClick={() => setAba(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold ${aba===id?"bg-[#ffc400] text-black":"text-white/55 hover:bg-white/5 hover:text-white"}`}><Icon className="size-5"/>{label}{id==="pedidos"&&pedidos.length>0&&<span className="ml-auto rounded-full bg-black/10 px-2 py-0.5 text-[10px]">{pedidos.length}</span>}</button>)}</div>
        <div className="mt-8 rounded-2xl border border-[#ffc400]/15 bg-[#ffc400]/5 p-4"><p className="text-xs font-black text-[#ffc400]">Próxima integração</p><p className="mt-2 text-xs leading-relaxed text-white/40">Conectar o painel ao Supabase para dados compartilhados e pedidos em tempo real.</p></div>
      </aside>

      <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs text-white/35">Lilhão / {menu.find(m=>m[0]===aba)?.[1]}</p><h1 className="mt-1 text-3xl font-black">{menu.find(m=>m[0]===aba)?.[1]}<span className="text-[#ffc400]">.</span></h1></div><button onClick={() => {setAba("cardapio");setProdutoEditando({id:`produto-${Date.now()}`,nome:"",descricao:"",preco:0,categoria:"Hambúrgueres"});}} className="rounded-xl bg-[#ffc400] px-4 py-3 font-black text-black"><Plus className="mr-1 inline size-4"/> Adicionar produto</button></div>
        {mensagem&&<div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"><span><Check className="mr-2 inline size-4"/>{mensagem}</span><button onClick={()=>setMensagem("")}><X className="size-4"/></button></div>}

        {aba==="visao"&&<section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Vendas de hoje",dinheiro(vendasHoje),"Receita registrada"],["Pedidos hoje",String(pedidosHoje.length),"Pedidos recebidos"],["Itens vendidos",String(itensVendidos),"Itens registrados"],["Itens no cardápio",String(produtos.length),"Produtos cadastrados"]].map(([l,v,s])=><article key={l} className="rounded-2xl border border-white/10 bg-[#141617] p-5"><div className="flex items-center justify-between"><p className="text-sm text-white/55">{l}</p><span className="grid size-9 place-items-center rounded-xl bg-[#ffc400]/10 text-[#ffc400]"><BarChart3 className="size-5"/></span></div><p className="mt-5 text-3xl font-black">{v}</p><p className="mt-1 text-xs text-white/35">{s}</p></article>)}</div>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]"><section className="rounded-2xl border border-white/10 bg-[#141617] p-5"><div className="flex items-center justify-between"><div><h2 className="font-black">Pedidos recentes</h2><p className="mt-1 text-xs text-white/35">Acompanhe a operação.</p></div><button onClick={()=>setAba("pedidos")} className="text-sm font-bold text-[#ffc400]">Ver todos</button></div>{pedidos.slice(0,6).map(p=><button key={p.numero} onClick={()=>{setPedidoSelecionado(p);setAba("pedidos")}} className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 p-4 text-left hover:border-[#ffc400]/30"><div><p className="text-xs text-white/35">#{p.numero} • {p.nome}</p><p className="mt-1 font-bold">{p.itens.map(i=>`${i.quantidade}x ${i.nome}`).join(", ")}</p></div><div className="text-right"><b className="text-[#ffc400]">{dinheiro(p.total)}</b><p className="mt-1 text-[10px] text-emerald-300">{p.status}</p></div></button>)}{!pedidos.length&&<div className="py-16 text-center text-sm text-white/30">Nenhum pedido registrado ainda.</div>}</section><section className="rounded-2xl border border-white/10 bg-[#141617] p-5"><h2 className="font-black">Acesso rápido</h2><div className="mt-4 grid gap-2">{[["pedidos","Gerenciar pedidos",ClipboardList],["cardapio","Editar cardápio",Utensils],["configuracoes","Configurações",Settings]].map(([id,l,I])=><button key={id} onClick={()=>setAba(id as Aba)} className="rounded-xl border border-white/10 p-4 text-left text-sm font-bold hover:border-[#ffc400]/30"><I className="mr-2 inline size-4 text-[#ffc400]"/>{l}</button>)}</div></section></div>
        </section>}

        {aba==="pedidos"&&<section className="space-y-4"><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141617] px-4"><Search className="size-4 text-white/30"/><input value={busca} onChange={e=>setBusca(e.target.value)} className="min-h-11 flex-1 bg-transparent text-sm outline-none" placeholder="Buscar pedido ou cliente..."/></div><div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141617]">{pedidos.filter(p=>`${p.numero} ${p.nome} ${p.telefone}`.toLowerCase().includes(busca.toLowerCase())).map(p=><div key={p.numero} className="grid gap-3 border-b border-white/10 p-5 last:border-0 md:grid-cols-[1fr_1.4fr_.7fr_.8fr] md:items-center"><div><p className="text-xs text-white/35">Pedido</p><b>#{p.numero}</b><p className="text-xs text-white/35">{new Date(p.criadoEm).toLocaleString("pt-BR")}</p></div><div><b>{p.nome}</b><p className="text-xs text-white/40">{p.telefone} • {p.entrega}</p></div><b className="text-[#ffc400]">{dinheiro(p.total)}</b><select value={p.status} onChange={e=>atualizarStatus(p.numero,e.target.value)} className="min-h-10 rounded-lg border border-white/10 bg-[#0d0e0f] px-2 text-xs font-bold">{statusOptions.map(s=><option key={s}>{s}</option>)}</select><button onClick={()=>setPedidoSelecionado(p)} className="text-left text-xs font-bold text-[#ffc400] md:col-span-4">Ver detalhes →</button></div>)}{!pedidos.length&&<div className="py-16 text-center text-white/30">Nenhum pedido registrado.</div>}</div></section>}

        {aba==="cardapio"&&<section className="space-y-4"><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141617] px-4"><Search className="size-4 text-white/30"/><input value={busca} onChange={e=>setBusca(e.target.value)} className="min-h-11 flex-1 bg-transparent text-sm outline-none" placeholder="Buscar produto..."/></div><div className="grid gap-3 lg:grid-cols-2">{filtrados.map(p=><article key={p.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#141617] p-4"><div className="size-20 shrink-0 overflow-hidden rounded-xl bg-black">{p.imagem?<img src={p.imagem} alt="" className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-2xl">🍔</div>}</div><div className="min-w-0 flex-1"><p className="text-xs text-[#ffc400]">{p.categoria}</p><h3 className="font-black">{p.nome||"Produto sem nome"}</h3><p className="mt-1 line-clamp-1 text-xs text-white/40">{p.descricao}</p><b className="mt-2 block text-[#ffc400]">{dinheiro(p.preco)}</b></div><button onClick={()=>setProdutoEditando(p)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">Editar</button><button onClick={()=>excluirProduto(p.id)} className="grid size-9 place-items-center rounded-lg border border-red-400/15 text-red-300"><Trash2 className="size-4"/></button></article>)}</div></section>}

        {aba==="categorias"&&<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categorias.filter(c=>c!=="Todos").map(cat=><article key={cat} className="rounded-2xl border border-white/10 bg-[#141617] p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-white/35">Categoria</p><h2 className="mt-1 font-black">{cat}</h2></div><span className="grid size-10 place-items-center rounded-xl bg-[#ffc400]/10 text-[#ffc400]"><Utensils className="size-5"/></span></div><p className="mt-4 text-sm text-white/45">{produtos.filter(p=>p.categoria===cat).length} produtos cadastrados</p></article>)}</section>}

        {aba==="configuracoes"&&<section className="grid gap-5 lg:grid-cols-2"><article className="rounded-2xl border border-white/10 bg-[#141617] p-5"><h2 className="font-black">Dados da lanchonete</h2><div className="mt-4 space-y-3"><label className="block text-xs font-bold text-white/50">Nome<input defaultValue="Lilhão" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none"/></label><label className="block text-xs font-bold text-white/50">WhatsApp<input defaultValue="(00) 00000-0000" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none"/></label><label className="block text-xs font-bold text-white/50">Taxa de entrega<input defaultValue="R$ 5,00" className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none"/></label><button onClick={()=>setMensagem("Configurações salvas para demonstração.")} className="rounded-xl bg-[#ffc400] px-4 py-3 font-black text-black">Salvar configurações</button></div></article><article className="rounded-2xl border border-[#ffc400]/15 bg-[#ffc400]/5 p-5"><h2 className="font-black">Status do projeto</h2><ul className="mt-4 space-y-3 text-sm text-white/55"><li>✓ Loja e checkout responsivos</li><li>✓ Categorias e sacola</li><li>✓ PIX demonstrativo</li><li>✓ Painel administrativo sem login</li><li>• Supabase ainda precisa receber o modelo de dados</li><li>• PIX real e notificações ainda não estão conectados</li></ul></article></section>}
      </main>
    </div>

    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#101112]/95 p-2 backdrop-blur-xl md:hidden">{menu.map(([id,label,Icon])=><button key={id} onClick={()=>setAba(id)} className={`flex flex-col items-center gap-1 py-1 text-[9px] font-bold ${aba===id?"text-[#ffc400]":"text-white/45"}`}><Icon className="size-5"/>{label}</button>)}</nav>

    {produtoEditando&&<div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4" onClick={()=>setProdutoEditando(null)}><section onClick={e=>e.stopPropagation()} className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#141617] p-5 sm:rounded-3xl"><div className="flex items-center justify-between"><h2 className="text-xl font-black">{produtos.some(p=>p.id===produtoEditando.id)?"Editar produto":"Novo produto"}</h2><button onClick={()=>setProdutoEditando(null)}><X/></button></div><div className="mt-5 space-y-3"><label className="block text-xs font-bold text-white/50">Nome<input value={produtoEditando.nome} onChange={e=>setProdutoEditando({...produtoEditando,nome:e.target.value})} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none"/></label><label className="block text-xs font-bold text-white/50">Descrição<textarea value={produtoEditando.descricao} onChange={e=>setProdutoEditando({...produtoEditando,descricao:e.target.value})} className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none"/></label><div className="grid grid-cols-2 gap-3"><label className="block text-xs font-bold text-white/50">Preço<input type="number" step="0.01" value={produtoEditando.preco} onChange={e=>setProdutoEditando({...produtoEditando,preco:Number(e.target.value)})} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none"/></label><label className="block text-xs font-bold text-white/50">Categoria<select value={produtoEditando.categoria} onChange={e=>setProdutoEditando({...produtoEditando,categoria:e.target.value})} className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none">{categorias.filter(c=>c!=="Todos").map(c=><option key={c}>{c}</option>)}</select></label></div><div className="grid grid-cols-2 gap-3 pt-2"><button onClick={()=>setProdutoEditando(null)} className="rounded-xl border border-white/10 py-3 font-bold">Cancelar</button><button onClick={()=>salvarProduto(produtoEditando)} disabled={!produtoEditando.nome.trim()||produtoEditando.preco<=0} className="rounded-xl bg-[#ffc400] py-3 font-black text-black disabled:opacity-40">Salvar produto</button></div></div></section></div>}

    {pedidoSelecionado&&<div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/75" onClick={()=>setPedidoSelecionado(null)}><section onClick={e=>e.stopPropagation()} className="max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141617] p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-white/40">Detalhes do pedido</p><h2 className="text-2xl font-black">#{pedidoSelecionado.numero}</h2></div><button onClick={()=>setPedidoSelecionado(null)}><X/></button></div><div className="mt-5 space-y-2 text-sm"><p><b>Cliente:</b> {pedidoSelecionado.nome}</p><p><b>Telefone:</b> {pedidoSelecionado.telefone}</p><p><b>Entrega:</b> {pedidoSelecionado.entrega}</p><p><b>Endereço:</b> {pedidoSelecionado.endereco}</p><p><b>Pagamento:</b> {pedidoSelecionado.pagamento}</p></div><div className="my-5 space-y-3 border-y border-white/10 py-4">{pedidoSelecionado.itens.map(i=><div key={i.id} className="flex justify-between"><span>{i.quantidade}x {i.nome}</span><b>{dinheiro(i.preco*i.quantidade)}</b></div>)}</div><div className="flex justify-between text-lg font-black"><span>Total</span><span className="text-[#ffc400]">{dinheiro(pedidoSelecionado.total)}</span></div></section></div>}
  </div>;
}

export const Route = createFileRoute("/dashboard")({ component: Dashboard });
