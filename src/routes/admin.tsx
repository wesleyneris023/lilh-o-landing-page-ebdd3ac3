import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Archive, ArrowDownRight, ArrowUpRight, BadgePercent, Bell,
  CalendarDays, Check, ChevronDown, CircleDollarSign, ClipboardList,
  Clock3, CreditCard, LayoutDashboard, Menu, Package, Plus, Search,
  Settings, ShoppingBag, TrendingUp, Utensils, X,
} from "lucide-react";

type Section = "Visão geral" | "Pedidos" | "Cardápio" | "Categorias" | "Cupons" | "Relatórios" | "Configurações";
type MenuItem = { id: string; name: string; category: string; price: number; available: boolean };

const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Pedidos", icon: ClipboardList },
  { label: "Cardápio", icon: Utensils },
  { label: "Categorias", icon: Archive },
  { label: "Cupons", icon: BadgePercent },
  { label: "Relatórios", icon: TrendingUp },
  { label: "Configurações", icon: Settings },
];
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const [section, setSection] = useState<Section>("Visão geral");
  const [mobileNav, setMobileNav] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", category: "Hambúrgueres", price: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lilhao-admin-menu");
      if (saved) setItems(JSON.parse(saved));
    } catch { /* Ignore invalid local draft data. */ }
  }, []);
  const saveItems = (next: MenuItem[]) => {
    setItems(next);
    try { localStorage.setItem("lilhao-admin-menu", JSON.stringify(next)); } catch { /* Storage may be unavailable. */ }
  };
  const filteredItems = useMemo(() => items.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [items, search]);

  const submitItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.price || Number(form.price) <= 0) return;
    saveItems([...items, { id: crypto.randomUUID(), name: form.name.trim(), category: form.category, price: Number(form.price), available: true }]);
    setForm({ name: "", category: "Hambúrgueres", price: "" });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className="flex min-h-screen">
        {mobileNav && <button aria-label="Fechar menu" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-black/70 lg:hidden" />}
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-white/[0.08] bg-[#101011] transition-transform lg:static lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-[82px] items-center gap-3 border-b border-white/[0.08] px-6">
            <div className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#ffc900] text-lg font-extrabold text-[#ffc900]">L!</div>
            <div><div className="text-[21px] font-extrabold tracking-tight">Lilhão<span className="text-[#ffc900]">.</span></div><div className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-zinc-500">Painel administrativo</div></div>
          </div>
          <div className="px-4 pt-7"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Gerenciamento</p>
            <nav className="space-y-1">{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setSection(label); setMobileNav(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition ${section === label ? "bg-[#ffc900] text-black shadow-[0_6px_24px_rgba(255,201,0,0.12)]" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"}`}><Icon size={17} strokeWidth={2.2} />{label}{label === "Pedidos" && <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-[10px]">0</span>}</button>)}</nav>
          </div>
          <div className="mt-auto p-4"><div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><span className="h-2 w-2 rounded-full bg-emerald-400" />Loja em preparação</div><p className="text-[11px] leading-5 text-zinc-500">Seu painel está em modo inicial. Os dados ainda não estão conectados ao banco.</p></div><div className="mt-4 flex items-center gap-3 px-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#ffc900]/15 text-xs font-bold text-[#ffc900]">LL</div><div className="min-w-0"><p className="text-xs font-semibold">Administrador</p><p className="text-[10px] text-zinc-500">Acesso sem login (temporário)</p></div><ChevronDown className="ml-auto text-zinc-600" size={15}/></div></div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[82px] items-center justify-between border-b border-white/[0.08] bg-[#0b0b0c]/95 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3"><button className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 lg:hidden" onClick={() => setMobileNav(true)} aria-label="Abrir menu"><Menu size={20}/></button><div><p className="text-[11px] text-zinc-500">Lilhão / <span className="text-zinc-300">{section}</span></p><h1 className="mt-1 text-lg font-bold tracking-tight md:text-xl">{section}</h1></div></div>
            <div className="flex items-center gap-2 md:gap-4"><span className="hidden rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-zinc-400 sm:inline-flex sm:items-center sm:gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-400"/>Modo de demonstração</span><button aria-label="Notificações" className="relative rounded-xl border border-white/10 p-2.5 text-zinc-400 hover:text-white"><Bell size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ffc900]"/></button><div className="hidden h-8 w-px bg-white/10 sm:block"/><div className="hidden text-right sm:block"><p className="text-xs font-semibold">Lilhão</p><p className="text-[10px] text-zinc-500">Loja</p></div><div className="grid h-9 w-9 place-items-center rounded-full bg-[#ffc900] text-xs font-extrabold text-black">L!</div></div>
          </header>

          <div className="mx-auto max-w-[1450px] p-4 md:p-8">
            {section === "Visão geral" && <>
              <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm text-zinc-400">Acompanhe o movimento da sua lanchonete.</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-[28px]">Resumo da operação <span className="text-[#ffc900]">.</span></h2></div><button onClick={() => setSection("Cardápio")} className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#ffc900] px-4 py-3 text-xs font-extrabold text-black transition hover:bg-yellow-300"><Plus size={16}/> Adicionar produto</button></div>
              <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
                { title: "Vendas de hoje", value: "R$ 0,00", icon: CircleDollarSign, note: "Nenhuma venda registrada" },
                { title: "Pedidos recebidos", value: "0", icon: ShoppingBag, note: "Aguardando primeiro pedido" },
                { title: "Ticket médio", value: "R$ 0,00", icon: CreditCard, note: "Sem dados disponíveis" },
                { title: "Itens no cardápio", value: String(items.length), icon: Package, note: "Cadastrados neste navegador" },
              ].map(({ title, value, icon: Icon, note }) => <div key={title} className="rounded-2xl border border-white/[0.08] bg-[#121213] p-5"><div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold text-zinc-400">{title}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ffc900]/10 text-[#ffc900]"><Icon size={18}/></span></div><p className="text-[27px] font-extrabold tracking-tight">{value}</p><p className="mt-2 text-[10px] text-zinc-500">{note}</p></div>)}</div>
              <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                <section className="rounded-2xl border border-white/[0.08] bg-[#121213] p-5 md:p-6"><div className="mb-7 flex items-center justify-between"><div><h3 className="font-bold">Visão de vendas</h3><p className="mt-1 text-[11px] text-zinc-500">Acompanhe o faturamento da loja</p></div><span className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-400"><CalendarDays size={13}/> Hoje <ChevronDown size={12}/></span></div><div className="grid min-h-[190px] place-items-center rounded-xl border border-dashed border-white/10 bg-black/10 px-4 text-center"><div><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-white/[0.04] text-zinc-600"><Activity size={20}/></div><p className="text-sm font-semibold text-zinc-300">Ainda sem movimentação</p><p className="mt-1 max-w-xs text-[11px] leading-5 text-zinc-500">Quando os pedidos estiverem integrados, seus resultados aparecerão aqui.</p></div></div></section>
                <section className="rounded-2xl border border-white/[0.08] bg-[#121213] p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">Pedidos recentes</h3><p className="mt-1 text-[11px] text-zinc-500">Últimos pedidos da loja</p></div><button onClick={() => setSection("Pedidos")} className="text-[11px] font-bold text-[#ffc900] hover:underline">Ver pedidos</button></div><div className="grid min-h-[190px] place-items-center rounded-xl border border-dashed border-white/10 bg-black/10 px-4 text-center"><div><ShoppingBag className="mx-auto mb-3 text-zinc-600" size={24}/><p className="text-sm font-semibold text-zinc-300">Nenhum pedido por enquanto</p><p className="mt-1 text-[11px] text-zinc-500">Os novos pedidos serão exibidos aqui.</p></div></div></section>
              </div>
              <section className="mt-5 rounded-2xl border border-white/[0.08] bg-[#121213] p-5 md:p-6"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold">Acesso rápido</h3><p className="mt-1 text-[11px] text-zinc-500">Atalhos para tarefas comuns</p></div></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[{label:"Gerenciar cardápio",icon:Utensils,section:"Cardápio" as Section},{label:"Acompanhar pedidos",icon:ClipboardList,section:"Pedidos" as Section},{label:"Criar cupom",icon:BadgePercent,section:"Cupons" as Section},{label:"Ver relatórios",icon:TrendingUp,section:"Relatórios" as Section}].map(({label,icon:Icon,section:target})=><button key={label} onClick={()=>setSection(target)} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left text-[11px] font-semibold text-zinc-300 transition hover:border-[#ffc900]/40 hover:bg-[#ffc900]/5"><Icon size={17} className="text-[#ffc900]"/>{label}</button>)}</div></section>
            </>}

            {section === "Cardápio" && <>
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-zinc-400">Cadastre e organize os produtos que aparecem na loja.</p><h2 className="mt-1 text-2xl font-extrabold">Seu cardápio <span className="text-[#ffc900]">.</span></h2></div><button onClick={()=>setShowForm(true)} className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#ffc900] px-4 py-3 text-xs font-extrabold text-black hover:bg-yellow-300"><Plus size={16}/> Novo produto</button></div>
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#121213] p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto..." className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-[#ffc900]/50"/></div><span className="self-center text-[11px] text-zinc-500">{filteredItems.length} produto(s)</span></div>
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121213]"><div className="hidden grid-cols-[1.5fr_1fr_0.7fr_0.7fr_90px] gap-4 border-b border-white/[0.08] px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 md:grid"><span>Produto</span><span>Categoria</span><span>Preço</span><span>Status</span><span>Ações</span></div>{filteredItems.length===0?<div className="grid min-h-[260px] place-items-center px-5 py-12 text-center"><div><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#ffc900]/10 text-[#ffc900]"><Utensils size={22}/></div><h3 className="font-bold">Seu cardápio começa aqui</h3><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-zinc-500">Cadastre os produtos da lanchonete. Por enquanto, os rascunhos ficam salvos somente neste navegador.</p><button onClick={()=>setShowForm(true)} className="mt-5 rounded-xl bg-[#ffc900] px-4 py-3 text-xs font-extrabold text-black"><Plus className="mr-1 inline" size={14}/> Cadastrar primeiro produto</button></div></div>:filteredItems.map(item=><div key={item.id} className="grid grid-cols-1 gap-3 border-b border-white/[0.06] px-5 py-4 last:border-0 md:grid-cols-[1.5fr_1fr_0.7fr_0.7fr_90px] md:items-center md:gap-4"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-[#ffc900]"><Package size={18}/></div><span className="text-sm font-semibold">{item.name}</span></div><span className="text-xs text-zinc-400">{item.category}</span><span className="text-sm font-bold text-[#ffc900]">{money(item.price)}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${item.available?"bg-emerald-400/10 text-emerald-400":"bg-zinc-500/10 text-zinc-400"}`}>{item.available?"Disponível":"Indisponível"}</span><div className="flex gap-2"><button title="Alternar disponibilidade" onClick={()=>saveItems(items.map(i=>i.id===item.id?{...i,available:!i.available}:i))} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white"><Check size={14}/></button><button title="Excluir produto" onClick={()=>saveItems(items.filter(i=>i.id!==item.id))} className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-red-400"><X size={14}/></button></div></div>)}</div>
            </>}

            {section === "Pedidos" && <EmptySection icon={ShoppingBag} title="Nenhum pedido recebido" description="Assim que o cardápio estiver conectado ao fluxo de pedidos, você poderá acompanhar novos pedidos, atualizar status e consultar o histórico por aqui." />}
            {section === "Categorias" && <EmptySection icon={Archive} title="Organize seu cardápio por categorias" description="A gestão de categorias será conectada ao banco de dados na próxima etapa. O cardápio público ainda não é alterado por esta tela." />}
            {section === "Cupons" && <EmptySection icon={BadgePercent} title="Nenhum cupom cadastrado" description="Em breve você poderá criar cupons de desconto e definir regras de utilização para seus clientes." />}
            {section === "Relatórios" && <EmptySection icon={TrendingUp} title="Relatórios aguardando dados" description="Os indicadores de faturamento, produtos mais vendidos e desempenho serão exibidos quando os pedidos reais estiverem integrados." />}
            {section === "Configurações" && <div className="max-w-3xl rounded-2xl border border-white/[0.08] bg-[#121213] p-5 md:p-7"><h3 className="font-bold">Configurações da loja</h3><p className="mt-1 text-xs text-zinc-500">Informações iniciais do Lilhão.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs text-zinc-400">Nome da loja<input defaultValue="Lilhão" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-[#ffc900]/50"/></label><label className="text-xs text-zinc-400">Status da loja<input value="Em configuração" readOnly className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-zinc-400 outline-none"/></label><div className="sm:col-span-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4 text-[11px] leading-5 text-amber-200/80">Estas configurações são apenas visuais nesta etapa. Ainda não há salvamento no Supabase nem autenticação administrativa.</div></div></div>}
          </div>
        </main>
      </div>

      {showForm && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><form onSubmit={submitItem} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151516] p-5 shadow-2xl md:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-extrabold">Novo produto</h3><p className="mt-1 text-[11px] text-zinc-500">Adicione um item ao rascunho do cardápio.</p></div><button type="button" onClick={()=>setShowForm(false)} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"><X size={18}/></button></div><label className="mb-4 block text-xs font-semibold text-zinc-400">Nome do produto<input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex.: X-Lilhão" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-[#ffc900]/50" required/></label><label className="mb-4 block text-xs font-semibold text-zinc-400">Categoria<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="mt-2 w-full rounded-xl border border-white/10 bg-[#101011] px-3 py-3 text-sm text-white outline-none focus:border-[#ffc900]/50">{["Hambúrgueres","Combos","Carne de Sol","Pizzas","Bebidas","Porções","Sobremesas","Outros"].map(c=><option key={c}>{c}</option>)}</select></label><label className="mb-6 block text-xs font-semibold text-zinc-400">Preço (R$)<input type="number" min="0.01" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0,00" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-[#ffc900]/50" required/></label><div className="flex gap-3"><button type="button" onClick={()=>setShowForm(false)} className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-zinc-300">Cancelar</button><button type="submit" className="flex-1 rounded-xl bg-[#ffc900] px-4 py-3 text-xs font-extrabold text-black">Salvar rascunho</button></div><p className="mt-4 text-center text-[10px] text-zinc-600">Salvo localmente neste navegador; ainda não publicado na loja.</p></form></div>}
      <footer className="border-t border-white/[0.06] px-5 py-4 text-center text-[10px] text-zinc-700">Lilhão Admin · Versão inicial · Sem autenticação</footer>
    </div>
  );
}

function EmptySection({ icon: Icon, title, description }: { icon: typeof ShoppingBag; title: string; description: string }) {
  return <div className="grid min-h-[420px] place-items-center rounded-2xl border border-white/[0.08] bg-[#121213] px-5 py-12 text-center"><div className="max-w-md"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#ffc900]/10 text-[#ffc900]"><Icon size={24}/></div><h2 className="text-xl font-extrabold">{title}</h2><p className="mt-3 text-xs leading-6 text-zinc-500">{description}</p></div></div>;
}
