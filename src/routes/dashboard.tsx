import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Check, ClipboardList, ExternalLink, LayoutDashboard, LogIn, Package, Plus, Search, Settings, ShieldAlert, Utensils, X } from "lucide-react";
import { categorias, dinheiro, type Pedido, type Produto } from "@/data/store";
import { atualizarStatusPedido, carregarConfiguracoes, carregarPedidosAdmin, carregarProdutosAdmin, ehAdmin, salvarConfiguracoes, salvarProdutoDb, excluirProdutoDb } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type Aba = "visao" | "pedidos" | "cardapio" | "categorias" | "configuracoes";
const statusOptions = ["Recebido", "Em preparo", "Pronto", "Saiu para entrega", "Concluído", "Cancelado"];

function Login({ onLogged }: { onLogged: () => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  async function entrar() {
    setErro(""); setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("E-mail ou senha inválidos.");
    else onLogged();
    setCarregando(false);
  }
  return <main className="grid min-h-screen place-items-center bg-[#080909] px-4 text-white">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141617] p-6 shadow-2xl sm:p-8">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl border-2 border-[#ffc400] bg-[#17150d] text-xl font-black text-[#ffc400]">L!</div>
      <p className="mt-5 text-center text-[10px] font-black uppercase tracking-[.25em] text-[#ffc400]">Lilhão • Administração</p>
      <h1 className="mt-2 text-center text-3xl font-black">Acesso ao painel<span className="text-[#ffc400]">.</span></h1>
      <p className="mt-2 text-center text-sm text-white/40">Entre com uma conta autorizada no Supabase.</p>
      <div className="mt-6 space-y-3">
        <label className="block text-xs font-bold text-white/55">E-mail<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 outline-none focus:border-[#ffc400]" placeholder="admin@lilhao.com"/></label>
        <label className="block text-xs font-bold text-white/55">Senha<input value={senha} onChange={e=>setSenha(e.target.value)} type="password" autoComplete="current-password" onKeyDown={e=>e.key==="Enter"&&entrar()} className="mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 outline-none focus:border-[#ffc400]" placeholder="••••••••"/></label>
        {erro && <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">{erro}</div>}
        <button disabled={carregando||!email||!senha} onClick={entrar} className="min-h-12 w-full rounded-xl bg-[#ffc400] font-black text-black disabled:opacity-40"><LogIn className="mr-2 inline size-4"/>{carregando?"Entrando...":"Entrar no painel"}</button>
      </div>
    </section>
  </main>;
}

function Dashboard() {
  const [autenticado, setAutenticado] = useState(false);
  const [autorizado, setAutorizado] = useState<boolean | null>(null);
  const [aba, setAba] = useState<Aba>("visao");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [busca, setBusca] = useState("");
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [novoPedidoAviso, setNovoPedidoAviso] = useState("");
  const [agora, setAgora] = useState(new Date());

  const menu = [
    ["visao","Visão geral",LayoutDashboard],
    ["pedidos","Pedidos",ClipboardList],
    ["cardapio","Cardápio",Utensils],
    ["categorias","Categorias",Package],
    ["configuracoes","Configurações",Settings],
  ] as const;

  async function carregar() {
    setErro(""); setCarregando(true);
    try {
      const admin = await ehAdmin();
      setAutorizado(admin);
      if (!admin) return;
      const [ps, prods, cfg] = await Promise.all([carregarPedidosAdmin(), carregarProdutosAdmin(), carregarConfiguracoes()]);
      setPedidos(ps); setProdutos(prods); setConfig(cfg);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar o painel.");
    } finally { setCarregando(false); }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAutenticado(!!data.session);
      if (data.session) carregar();
      else setAutorizado(null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAutenticado(!!session);
      if (session) carregar();
      else { setAutorizado(null); setPedidos([]); setProdutos([]); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setAgora(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!autorizado) return;
    const channel = supabase.channel("lilhao-pedidos-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, (payload) => {
        carregarPedidosAdmin().then((lista) => {
          setPedidos(lista);
          if (payload.eventType === "INSERT") {
            const novo = lista.find((p) => p.numero === (payload.new as any)?.numero);
            const aviso = novo ? `Novo pedido #${novo.numero} recebido — ${dinheiro(novo.total)}` : "Novo pedido recebido.";
            setNovoPedidoAviso(aviso);
            setMensagem(aviso);
            if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([120, 60, 120]);
            if (typeof document !== "undefined") document.title = "🔔 Novo pedido • Lilhão";
            window.setTimeout(() => { if (typeof document !== "undefined") document.title = "Lilhão • Painel"; }, 5000);
          }
        }).catch(()=>{});
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "produtos" }, () => carregarProdutosAdmin().then(setProdutos).catch(()=>{}))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [autorizado]);

  const pedidosHoje = useMemo(() => {
    const hoje = new Date().toLocaleDateString("pt-BR");
    return pedidos.filter(p => new Date(p.criadoEm).toLocaleDateString("pt-BR") === hoje);
  }, [pedidos]);
  const vendasHoje = pedidosHoje.reduce((s,p)=>s+p.total,0);
  const itensVendidos = pedidosHoje.reduce((s,p)=>s+p.itens.reduce((a,i)=>a+i.quantidade,0),0);
  const lojaAberta = useMemo(() => {
    if (!config?.aceita_pedidos) return false;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(agora);
    const hora = Number(parts.find((p) => p.type === "hour")?.value || 0);
    const minuto = Number(parts.find((p) => p.type === "minute")?.value || 0);
    const atual = hora * 60 + minuto;
    const [oh, om] = String(config.horario_abertura || "18:00").split(":").map(Number);
    const [ch, cm] = String(config.horario_fechamento || "23:30").split(":").map(Number);
    const abertura = (oh || 0) * 60 + (om || 0);
    const fechamento = (ch || 0) * 60 + (cm || 0);
    if (abertura === fechamento) return true;
    return abertura < fechamento ? atual >= abertura && atual < fechamento : atual >= abertura || atual < fechamento;
  }, [config, agora]);
  const filtrados = useMemo(() => produtos.filter(p => (p.nome+" "+p.descricao+" "+p.categoria).toLowerCase().includes(busca.toLowerCase())), [produtos,busca]);

  if (!autenticado) return <Login onLogged={() => { setAutenticado(true); carregar(); }} />;
  if (autorizado === false) return <main className="grid min-h-screen place-items-center bg-[#080909] px-4 text-white"><section className="max-w-md rounded-3xl border border-red-400/20 bg-[#141617] p-8 text-center"><ShieldAlert className="mx-auto size-12 text-red-300"/><h1 className="mt-4 text-2xl font-black">Acesso não autorizado</h1><p className="mt-2 text-sm leading-relaxed text-white/45">Sua conta está autenticada, mas não possui uma entrada ativa em <b>admin_users</b>.</p><button onClick={()=>supabase.auth.signOut()} className="mt-5 rounded-xl border border-white/10 px-5 py-3 font-bold">Sair</button></section></main>;
  if (carregando || !config) return <main className="grid min-h-screen place-items-center bg-[#080909] text-white"><div className="text-center"><div className="mx-auto size-10 animate-spin rounded-full border-2 border-white/10 border-t-[#ffc400]"/><p className="mt-4 text-sm text-white/45">Carregando painel...</p></div></main>;

  async function status(numero:string,status:string) {
    try { await atualizarStatusPedido(numero,status); setPedidos(await carregarPedidosAdmin()); setMensagem("Status atualizado no banco."); }
    catch(e) { setErro(e instanceof Error?e.message:"Não foi possível atualizar."); }
  }
  async function salvarProduto(produto:Produto) {
    try { await salvarProdutoDb(produto); setProdutos(await carregarProdutosAdmin()); setProdutoEditando(null); setMensagem("Produto salvo no Supabase."); }
    catch(e) { setErro(e instanceof Error?e.message:"Não foi possível salvar o produto."); }
  }
  async function excluir(id:string) {
    try { await excluirProdutoDb(id); setProdutos(await carregarProdutosAdmin()); setMensagem("Produto desativado."); }
    catch(e) { setErro(e instanceof Error?e.message:"Não foi possível remover o produto."); }
  }
  async function salvarCfg() {
    try {
      const payload = {
        nome: String(config.nome || "").trim(),
        slogan: String(config.slogan || "").trim(),
        whatsapp: String(config.whatsapp || "").trim(),
        taxa_entrega: Number(config.taxa_entrega) || 0,
        pedido_minimo: Number(config.pedido_minimo) || 0,
        horario_abertura: String(config.horario_abertura || "18:00"),
        horario_fechamento: String(config.horario_fechamento || "23:30"),
        endereco_loja: String(config.endereco_loja || "").trim(),
        aceita_pedidos: !!config.aceita_pedidos,
      };
      await salvarConfiguracoes(payload);
      setConfig({ ...config, ...payload });
      setMensagem("Configurações salvas no Supabase.");
    } catch(e) { setErro(e instanceof Error?e.message:"Não foi possível salvar."); }
  }

  async function alternarAceitaPedidos() {
    const novoStatus = !config.aceita_pedidos;
    try {
      const payload = {
        nome: String(config.nome || "").trim(),
        slogan: String(config.slogan || "").trim(),
        whatsapp: String(config.whatsapp || "").trim(),
        taxa_entrega: Number(config.taxa_entrega) || 0,
        pedido_minimo: Number(config.pedido_minimo) || 0,
        horario_abertura: String(config.horario_abertura || "18:00"),
        horario_fechamento: String(config.horario_fechamento || "23:30"),
        endereco_loja: String(config.endereco_loja || "").trim(),
        aceita_pedidos: novoStatus,
      };
      await salvarConfiguracoes(payload);
      setConfig({ ...config, ...payload });
      setMensagem(novoStatus ? "Pedidos liberados." : "Pedidos pausados.");
    } catch(e) { setErro(e instanceof Error?e.message:"Não foi possível alterar o status da loja."); }
  }

  return <div className="min-h-screen bg-[#080909] text-white">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101112]/95 backdrop-blur-xl"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3 sm:px-6"><div className="flex items-center gap-3"><button onClick={()=>window.location.assign("/")} className="grid size-10 place-items-center rounded-full border-2 border-[#ffc400] bg-[#17150d] font-black text-[#ffc400]">L!</button><div><p className="text-lg font-black">Lilhão<span className="text-[#ffc400]">.</span></p><p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/40">Painel administrativo • online</p></div></div><div className="flex items-center gap-2"><span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 sm:inline">Supabase conectado</span><button onClick={()=>supabase.auth.signOut()} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70">Sair</button><button onClick={()=>window.location.assign("/")} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70"><ExternalLink className="mr-1 inline size-4"/> Loja</button></div></div></header>
    <div className="mx-auto flex max-w-[1500px]">
      <aside className="sticky top-[69px] hidden h-[calc(100vh-69px)] w-64 shrink-0 border-r border-white/10 bg-[#0d0e0f] p-4 md:block"><p className="px-3 pb-3 text-[10px] font-black uppercase tracking-[.2em] text-white/30">Gerenciamento</p><div className="space-y-1">{menu.map(([id,label,Icon])=><button key={id} onClick={()=>setAba(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold ${aba===id?"bg-[#ffc400] text-black":"text-white/55 hover:bg-white/5 hover:text-white"}`}><Icon className="size-5"/>{label}{id==="pedidos"&&pedidos.length>0&&<span className="ml-auto rounded-full bg-black/10 px-2 py-0.5 text-[10px]">{pedidos.length}</span>}</button>)}</div><div className="mt-8 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4"><p className="text-xs font-black text-emerald-300">Banco conectado</p><p className="mt-2 text-xs leading-relaxed text-white/40">Pedidos e cardápio são persistidos no Supabase. O painel atualiza pedidos em tempo real.</p></div></aside>
      <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs text-white/35">Lilhão / {menu.find(m=>m[0]===aba)?.[1]}</p><h1 className="mt-1 text-3xl font-black">{menu.find(m=>m[0]===aba)?.[1]}<span className="text-[#ffc400]">.</span></h1></div><button onClick={()=>{setAba("cardapio");setProdutoEditando({id:"produto-"+Date.now(),nome:"",descricao:"",preco:0,categoria:"Hambúrgueres"});}} className="rounded-xl bg-[#ffc400] px-4 py-3 font-black text-black"><Plus className="mr-1 inline size-4"/> Adicionar produto</button></div>
        {novoPedidoAviso&&<div className="mb-3 flex items-center justify-between rounded-xl border border-[#ffc400]/30 bg-[#ffc400]/10 px-4 py-3 text-sm text-[#ffc400]"><span>🔔 {novoPedidoAviso}</span><button onClick={()=>setNovoPedidoAviso("")}><X className="size-4"/></button></div>}
        {mensagem&&<div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300"><span><Check className="mr-2 inline size-4"/>{mensagem}</span><button onClick={()=>setMensagem("")}><X className="size-4"/></button></div>}
        {erro&&<div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{erro}</div>}
        {aba==="visao"&&<section className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Vendas de hoje",dinheiro(vendasHoje),"Receita no banco"],["Pedidos hoje",String(pedidosHoje.length),"Pedidos recebidos"],["Itens vendidos",String(itensVendidos),"Itens registrados"],["Itens no cardápio",String(produtos.length),"Produtos ativos"]].map(([l,v,d])=><article key={l} className="rounded-2xl border border-white/10 bg-[#141617] p-5"><div className="flex items-center justify-between"><p className="text-sm text-white/55">{l}</p><span className="grid size-9 place-items-center rounded-xl bg-[#ffc400]/10 text-[#ffc400]"><BarChart3 className="size-5"/></span></div><p className="mt-5 text-3xl font-black">{v}</p><p className="mt-1 text-xs text-white/35">{d}</p></article>)}</div><section className="rounded-2xl border border-white/10 bg-[#141617] p-5"><div className="flex items-center justify-between"><div><h2 className="font-black">Pedidos recentes</h2><p className="mt-1 text-xs text-white/35">Atualização automática via Realtime.</p></div><button onClick={()=>setAba("pedidos")} className="text-sm font-bold text-[#ffc400]">Ver todos</button></div>{pedidos.slice(0,8).map(p=><button key={p.numero} onClick={()=>{setPedidoSelecionado(p);setAba("pedidos")}} className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 p-4 text-left hover:border-[#ffc400]/30"><div><p className="text-xs text-white/35">#{p.numero} • {p.nome}</p><p className="mt-1 font-bold">{p.itens.map(i=>`${i.quantidade}x ${i.nome}`).join(", ")}</p></div><div className="text-right"><b className="text-[#ffc400]">{dinheiro(p.total)}</b><p className="mt-1 text-[10px] text-emerald-300">{p.status}</p></div></button>)}{!pedidos.length&&<div className="py-16 text-center text-sm text-white/30">Nenhum pedido registrado.</div>}</section></section>}
        {aba==="pedidos"&&<section className="space-y-4"><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141617] px-4"><Search className="size-4 text-white/30"/><input value={busca} onChange={e=>setBusca(e.target.value)} className="min-h-11 flex-1 bg-transparent text-sm outline-none" placeholder="Buscar pedido ou cliente..."/></div><div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141617]">{pedidos.filter(p=>(p.numero+" "+p.nome+" "+p.telefone).toLowerCase().includes(busca.toLowerCase())).map(p=><div key={p.numero} className="grid gap-3 border-b border-white/10 p-5 last:border-0 md:grid-cols-[1fr_1.4fr_.7fr_.8fr] md:items-center"><div><p className="text-xs text-white/35">Pedido</p><b>#{p.numero}</b><p className="text-xs text-white/35">{new Date(p.criadoEm).toLocaleString("pt-BR")}</p></div><div><b>{p.nome}</b><p className="text-xs text-white/40">{p.telefone} • {p.entrega}</p></div><b className="text-[#ffc400]">{dinheiro(p.total)}</b><select value={p.status} onChange={e=>status(p.numero,e.target.value)} className="min-h-10 rounded-lg border border-white/10 bg-[#0d0e0f] px-2 text-xs font-bold">{statusOptions.filter((x) => x !== "Saiu para entrega" || p.entrega === "Entrega").map(x=><option key={x}>{x}</option>)}</select><button onClick={()=>setPedidoSelecionado(p)} className="text-left text-xs font-bold text-[#ffc400] md:col-span-4">Ver detalhes →</button></div>)}{!pedidos.length&&<div className="py-16 text-center text-white/30">Nenhum pedido registrado.</div>}</div></section>}
        {aba==="cardapio"&&<section className="space-y-4"><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141617] px-4"><Search className="size-4 text-white/30"/><input value={busca} onChange={e=>setBusca(e.target.value)} className="min-h-11 flex-1 bg-transparent text-sm outline-none" placeholder="Buscar produto..."/></div><div className="grid gap-3 lg:grid-cols-2">{filtrados.map(p=><article key={p.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#141617] p-4"><div className="size-20 shrink-0 overflow-hidden rounded-xl bg-black">{p.imagem?<img src={p.imagem} alt="" className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-2xl">🍔</div>}</div><div className="min-w-0 flex-1"><p className="text-xs text-[#ffc400]">{p.categoria}</p><h3 className="font-black">{p.nome}</h3><p className="mt-1 line-clamp-1 text-xs text-white/40">{p.descricao}</p><b className="mt-2 block text-[#ffc400]">{dinheiro(p.preco)}</b></div><button onClick={()=>setProdutoEditando(p)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold">Editar</button><button onClick={()=>excluir(p.id)} className="grid size-9 place-items-center rounded-lg border border-red-400/15 text-red-300"><X className="size-4"/></button></article>)}</div></section>}
        {aba==="categorias"&&<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categorias.filter(c=>c!=="Todos").map(cat=><article key={cat} className="rounded-2xl border border-white/10 bg-[#141617] p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-white/35">Categoria</p><h2 className="mt-1 font-black">{cat}</h2></div><span className="grid size-10 place-items-center rounded-xl bg-[#ffc400]/10 text-[#ffc400]"><Utensils className="size-5"/></span></div><p className="mt-4 text-sm text-white/45">{produtos.filter(p=>p.categoria===cat).length} produtos ativos</p></article>)}</section>}
        {aba==="configuracoes"&&<section className="space-y-5">
          <article className={`rounded-2xl border p-5 ${lojaAberta ? "border-emerald-400/20 bg-emerald-400/5" : "border-red-400/20 bg-red-400/5"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-white/35">Operação da loja</p>
                <div className="mt-1 flex items-center gap-3">
                  <span className={`size-3 rounded-full ${lojaAberta ? "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.7)]" : "bg-red-400"}`}/>
                  <h2 className="text-2xl font-black">{lojaAberta ? "Loja aberta" : "Loja fechada"}</h2>
                </div>
                <p className="mt-2 text-sm text-white/45">Horário: {config.horario_abertura || "18:00"} às {config.horario_fechamento || "23:30"} • {config.aceita_pedidos ? "Pedidos habilitados" : "Pedidos pausados"}</p>
              </div>
              <button onClick={alternarAceitaPedidos} className={`rounded-xl px-5 py-3 font-black ${config.aceita_pedidos ? "border border-red-400/20 bg-red-400/10 text-red-200" : "bg-[#ffc400] text-black"}`}>
                {config.aceita_pedidos ? "Pausar pedidos" : "Liberar pedidos"}
              </button>
            </div>
          </article>

          <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
            <article className="rounded-2xl border border-white/10 bg-[#141617] p-5">
              <div className="flex items-center justify-between">
                <div><h2 className="font-black">Dados da lanchonete</h2><p className="mt-1 text-xs text-white/35">Esses dados alimentam a loja pública e as regras do checkout.</p></div>
                <Settings className="size-5 text-[#ffc400]"/>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-white/50 sm:col-span-2">Nome<input value={config.nome ?? ""} onChange={e=>setConfig({...config,nome:e.target.value})} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#ffc400]"/></label>
                <label className="block text-xs font-bold text-white/50 sm:col-span-2">Slogan<input value={config.slogan ?? ""} onChange={e=>setConfig({...config,slogan:e.target.value})} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#ffc400]"/></label>
                <label className="block text-xs font-bold text-white/50">WhatsApp<input value={config.whatsapp ?? ""} onChange={e=>setConfig({...config,whatsapp:e.target.value})} inputMode="tel" placeholder="(XX) XXXXX-XXXX" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#ffc400]"/></label>
                <label className="block text-xs font-bold text-white/50">Endereço<input value={config.endereco_loja ?? ""} onChange={e=>setConfig({...config,endereco_loja:e.target.value})} placeholder="Endereço da lanchonete" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#ffc400]"/></label>
                <label className="block text-xs font-bold text-white/50">Taxa de entrega (R$)<input type="number" min="0" step="0.01" value={config.taxa_entrega ?? 0} onChange={e=>setConfig({...config,taxa_entrega:e.target.value})} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#ffc400]"/></label>
                <label className="block text-xs font-bold text-white/50">Pedido mínimo (R$)<input type="number" min="0" step="0.01" value={config.pedido_minimo ?? 0} onChange={e=>setConfig({...config,pedido_minimo:e.target.value})} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#ffc400]"/></label>
                <label className="block text-xs font-bold text-white/50">Abertura<input type="time" value={config.horario_abertura ?? "18:00"} onChange={e=>setConfig({...config,horario_abertura:e.target.value})} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#ffc400]"/></label>
                <label className="block text-xs font-bold text-white/50">Fechamento<input type="time" value={config.horario_fechamento ?? "23:30"} onChange={e=>setConfig({...config,horario_fechamento:e.target.value})} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none focus:border-[#ffc400]"/></label>
              </div>
              <button onClick={salvarCfg} className="mt-5 w-full rounded-xl bg-[#ffc400] px-4 py-3 font-black text-black sm:w-auto">Salvar configurações</button>
            </article>

            <aside className="space-y-5">
              <article className="rounded-2xl border border-white/10 bg-[#141617] p-5">
                <h2 className="font-black">Regras atuais</h2>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-black/20 p-3"><span className="text-sm text-white/45">Horário</span><b>{config.horario_abertura || "18:00"}–{config.horario_fechamento || "23:30"}</b></div>
                  <div className="flex items-center justify-between rounded-xl bg-black/20 p-3"><span className="text-sm text-white/45">Entrega</span><b>{dinheiro(Number(config.taxa_entrega) || 0)}</b></div>
                  <div className="flex items-center justify-between rounded-xl bg-black/20 p-3"><span className="text-sm text-white/45">Pedido mínimo</span><b>{Number(config.pedido_minimo) > 0 ? dinheiro(Number(config.pedido_minimo)) : "Sem mínimo"}</b></div>
                  <div className="flex items-center justify-between rounded-xl bg-black/20 p-3"><span className="text-sm text-white/45">Pedidos</span><b className={config.aceita_pedidos ? "text-emerald-300" : "text-red-300"}>{config.aceita_pedidos ? "Habilitados" : "Pausados"}</b></div>
                </div>
              </article>
              <article className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-5">
                <h2 className="font-black">Segurança e operação</h2>
                <ul className="mt-4 space-y-3 text-sm text-white/55"><li>✓ Supabase conectado</li><li>✓ Autenticação administrativa</li><li>✓ RLS ativo</li><li>✓ Pedidos persistidos no banco</li><li>✓ Atualização em tempo real</li><li>✓ PIX desativado até integração com provedor real</li></ul>
              </article>
            </aside>
          </div>
        </section>}
      </main>
    </div>
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#101112]/95 p-2 backdrop-blur-xl md:hidden">{menu.map(([id,label,Icon])=><button key={id} onClick={()=>setAba(id)} className={`flex flex-col items-center gap-1 py-1 text-[9px] font-bold ${aba===id?"text-[#ffc400]":"text-white/45"}`}><Icon className="size-5"/>{label}</button>)}</nav>
    {produtoEditando && (
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
        onClick={() => setProdutoEditando(null)}
      >
        <section
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#141617] p-5 sm:rounded-3xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">
              {produtos.some((p) => p.id === produtoEditando.id) ? "Editar produto" : "Novo produto"}
            </h2>
            <button onClick={() => setProdutoEditando(null)}><X /></button>
          </div>
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-bold text-white/50">
              Nome
              <input
                value={produtoEditando.nome}
                onChange={(e) => setProdutoEditando({ ...produtoEditando, nome: e.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none"
              />
            </label>
            <label className="block text-xs font-bold text-white/50">
              Descrição
              <textarea
                value={produtoEditando.descricao}
                onChange={(e) => setProdutoEditando({ ...produtoEditando, descricao: e.target.value })}
                className="mt-1 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-bold text-white/50">
                Preço
                <input
                  type="number"
                  step="0.01"
                  value={produtoEditando.preco}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, preco: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none"
                />
              </label>
              <label className="block text-xs font-bold text-white/50">
                Categoria
                <select
                  value={produtoEditando.categoria}
                  onChange={(e) => setProdutoEditando({ ...produtoEditando, categoria: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 p-3 outline-none"
                >
                  {categorias.filter((c) => c !== "Todos").map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setProdutoEditando(null)} className="rounded-xl border border-white/10 py-3 font-bold">
                Cancelar
              </button>
              <button
                onClick={() => salvarProduto(produtoEditando)}
                disabled={!produtoEditando.nome.trim() || produtoEditando.preco <= 0}
                className="rounded-xl bg-[#ffc400] py-3 font-black text-black disabled:opacity-40"
              >
                Salvar produto
              </button>
            </div>
          </div>
        </section>
      </div>
    )}{pedidoSelecionado&&<div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/75" onClick={()=>setPedidoSelecionado(null)}><section onClick={e=>e.stopPropagation()} className="max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141617] p-5"><div className="flex items-center justify-between"><div><p className="text-xs text-white/40">Detalhes do pedido</p><h2 className="text-2xl font-black">#{pedidoSelecionado.numero}</h2></div><button onClick={()=>setPedidoSelecionado(null)}><X/></button></div><div className="mt-5 space-y-2 text-sm"><p><b>Cliente:</b> {pedidoSelecionado.nome}</p><p><b>Telefone:</b> {pedidoSelecionado.telefone}</p><p><b>Entrega:</b> {pedidoSelecionado.entrega}</p>{pedidoSelecionado.entrega === "Retirada no local" ? <p><b>Local de retirada:</b> {config?.nome || "Lilhão"}</p> : <p><b>Endereço:</b> {pedidoSelecionado.endereco}</p>}<p><b>Pagamento:</b> {pedidoSelecionado.pagamento}</p><p><b>Observação:</b> {pedidoSelecionado.observacao || "—"}</p></div><div className="my-5 space-y-3 border-y border-white/10 py-4">{pedidoSelecionado.itens.map(i=><div key={i.id} className="flex justify-between"><span>{i.quantidade}x {i.nome}</span><b>{dinheiro(i.preco*i.quantidade)}</b></div>)}</div><div className="flex justify-between text-lg font-black"><span>Total</span><span className="text-[#ffc400]">{dinheiro(pedidoSelecionado.total)}</span></div></section></div>}
  </div>;
}

export const Route = createFileRoute("/dashboard")({ component: Dashboard });
