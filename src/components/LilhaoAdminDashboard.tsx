import { useState } from "react";
import {
  Activity, Archive, ArrowRight, BadgePercent, Bell, CalendarDays,
  ChartNoAxesCombined, ChevronDown, ClipboardList, CreditCard, House,
  LayoutDashboard, Menu, Package, Settings, ShoppingBag, TrendingUp,
  Utensils, UserRound, X,
} from "lucide-react";

const yellow = "#ffc900";
const nav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Pedidos", icon: ClipboardList },
  { label: "Cardápio", icon: Utensils },
  { label: "Categorias", icon: Archive },
  { label: "Cupons", icon: BadgePercent },
  { label: "Relatórios", icon: TrendingUp },
  { label: "Configurações", icon: Settings },
];
const kpis = [
  { label: "Vendas de hoje", value: "R$ 0,00", change: "Aguardando vendas", icon: CreditCard, tint: "text-emerald-400", bg: "bg-emerald-500/15" },
  { label: "Pedidos recebidos", value: "0", change: "Nenhum pedido novo", icon: ShoppingBag, tint: "text-yellow-300", bg: "bg-yellow-500/15" },
  { label: "Ticket médio", value: "R$ 0,00", change: "Sem dados ainda", icon: Activity, tint: "text-sky-400", bg: "bg-sky-500/15" },
  { label: "Itens no cardápio", value: "0", change: "Cadastre seus produtos", icon: Package, tint: "text-violet-400", bg: "bg-violet-500/15" },
];

export default function LilhaoAdminDashboard() {
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [period, setPeriod] = useState("Hoje");
  const go = (label: string) => { setActive(label); setMenuOpen(false); };

  return (
    <div className="min-h-screen bg-[#09090b] text-white [font-family:'Sora',sans-serif]">
      {menuOpen && <button aria-label="Fechar menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-black/70 lg:hidden" />}
      <div className="min-h-screen lg:flex">
        <aside className={`${menuOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-white/[0.08] bg-[#101012] transition-transform duration-200 lg:static lg:translate-x-0`}>
          <div className="flex h-[92px] items-center gap-3 border-b border-white/[0.08] px-6">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-[#ffc900] text-xl font-black text-[#ffc900]">L!</div>
            <div><div className="text-[25px] font-black tracking-tight">Lilhão<span className="text-[#ffc900]">.</span></div><div className="text-[9px] uppercase tracking-[.22em] text-zinc-500">Painel administrativo</div></div>
            <button className="ml-auto text-zinc-500 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fechar navegação"><X size={19}/></button>
          </div>
          <div className="px-4 pt-7">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-zinc-600">Gerenciamento</p>
            <nav className="space-y-1">{nav.map(({ label, icon: Icon }) => <button key={label} onClick={() => go(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-sm font-semibold transition ${active === label ? "bg-[#ffc900] text-black shadow-[0_5px_24px_rgba(255,201,0,.12)]" : "text-zinc-400 hover:bg-white/[.05] hover:text-white"}`}><Icon size={18}/>{label}{label === "Pedidos" && <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-[10px]">0</span>}</button>)}</nav>
          </div>
          <div className="mt-auto p-4">
            <div className="rounded-xl border border-white/[.08] bg-white/[.025] p-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><span className="h-2 w-2 rounded-full bg-emerald-400"/>Loja em preparação</div><p className="text-[11px] leading-5 text-zinc-500">O painel está em modo inicial. Os indicadores serão atualizados quando os dados reais estiverem integrados.</p></div>
            <div className="mt-4 flex items-center gap-3 px-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#ffc900]/15 text-xs font-bold text-[#ffc900]">LL</div><div><p className="text-xs font-semibold">Administrador</p><p className="text-[10px] text-zinc-500">Acesso temporário</p></div></div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <header className="sticky top-0 z-30 flex min-h-[82px] items-center justify-between border-b border-white/[.08] bg-[#09090b]/95 px-4 backdrop-blur md:px-8">
            <div className="flex min-w-0 items-center gap-3"><button onClick={() => setMenuOpen(true)} aria-label="Abrir menu" className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 lg:hidden"><Menu size={21}/></button><div className="min-w-0"><p className="truncate text-[11px] text-zinc-500">Lilhão / <span className="text-zinc-300">{active}</span></p><h1 className="text-xl font-extrabold tracking-tight md:text-2xl">{active}<span className="text-[#ffc900]">.</span></h1></div></div>
            <div className="flex shrink-0 items-center gap-2 md:gap-4"><a href="/" className="hidden rounded-full border border-[#ffc900]/40 px-4 py-2 text-xs font-bold text-[#ffc900] transition hover:bg-[#ffc900]/10 sm:inline-flex">← Voltar à loja</a><span className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[10px] text-zinc-400 xl:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-amber-400"/>Modo de demonstração</span><button aria-label="Notificações" className="relative rounded-xl border border-white/10 p-2.5 text-zinc-400"><Bell size={18}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ffc900]"/></button><div className="grid h-10 w-10 place-items-center rounded-full bg-[#ffc900] text-sm font-black text-black">L!</div></div>
          </header>

          <div className="mx-auto max-w-[1500px] p-4 md:p-8">
            {active === "Dashboard" ? <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-zinc-400">Bem-vindo! Aqui você tem o controle completo da sua lanchonete.</p><h2 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Resumo da operação<span className="text-[#ffc900]">.</span></h2></div><button onClick={() => go("Cardápio")} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffc900] px-4 py-3.5 text-sm font-extrabold text-black transition hover:bg-yellow-300 sm:w-auto"><span className="text-lg">＋</span> Adicionar produto</button></div>
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-white/[.08] bg-[#121214] px-3 py-2.5 sm:w-fit"><CalendarDays size={16} className="text-zinc-400"/><select aria-label="Período" value={period} onChange={e => setPeriod(e.target.value)} className="w-full bg-transparent text-xs text-zinc-300 outline-none sm:w-36">{["Hoje", "Últimos 7 dias", "Últimos 30 dias", "Este mês"].map(p => <option key={p} className="bg-[#121214]">{p}</option>)}</select><ChevronDown size={14} className="text-zinc-500"/></div>
              <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{kpis.map(({ label, value, change, icon: Icon, tint, bg }) => <article key={label} className="min-w-0 rounded-2xl border border-white/[.08] bg-[#121214] p-3.5 sm:p-5"><div className="mb-3 flex items-start justify-between gap-2 sm:mb-5"><span className="text-[11px] font-semibold leading-snug text-zinc-400 sm:text-sm">{label}</span><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${bg} ${tint} sm:h-10 sm:w-10`}><Icon size={17}/></span></div><p className="break-words text-xl font-black tracking-tight sm:text-2xl lg:text-3xl">{value}</p><p className="mt-2 text-[9px] leading-snug text-zinc-500 sm:text-[11px]">{change}</p></article>)}</div>
              <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
                <section className="rounded-2xl border border-white/[.08] bg-[#121214] p-4 sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><div><h3 className="font-bold">Vendas do dia</h3><p className="mt-1 text-[11px] text-zinc-500">Acompanhe o faturamento da loja</p></div><span className="rounded-lg border border-white/10 px-3 py-2 text-[10px] text-zinc-400">{period}</span></div><div className="grid min-h-[210px] place-items-center rounded-xl border border-dashed border-white/10 bg-black/10 px-4 text-center"><div><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-white/[.04] text-zinc-600"><ChartNoAxesCombined size={21}/></div><p className="text-sm font-semibold text-zinc-300">Ainda sem movimentação</p><p className="mx-auto mt-1 max-w-xs text-[11px] leading-5 text-zinc-500">Quando as vendas forem registradas, o gráfico de desempenho aparecerá aqui.</p></div></div></section>
                <section className="rounded-2xl border border-white/[.08] bg-[#121214] p-4 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold">Pedidos recentes</h3><p className="mt-1 text-[11px] text-zinc-500">Últimos pedidos da loja</p></div><button onClick={() => go("Pedidos")} className="text-xs font-bold text-[#ffc900]">Ver todos <ArrowRight className="ml-1 inline" size={14}/></button></div><div className="grid min-h-[210px] place-items-center rounded-xl border border-dashed border-white/10 bg-black/10 px-4 text-center"><div><ShoppingBag className="mx-auto mb-3 text-zinc-600" size={25}/><p className="text-sm font-semibold text-zinc-300">Nenhum pedido por enquanto</p><p className="mt-1 text-[11px] text-zinc-500">Os novos pedidos aparecerão aqui.</p></div></div></section>
              </div>
              <section className="mt-5 rounded-2xl border border-white/[.08] bg-[#121214] p-4 sm:p-6"><div className="mb-4"><h3 className="font-bold">Acesso rápido</h3><p className="mt-1 text-[11px] text-zinc-500">Atalhos para as principais tarefas</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{label:"Cardápio",icon:Utensils,sub:"Gerenciar itens"},{label:"Pedidos",icon:ClipboardList,sub:"Acompanhar"},{label:"Cupons",icon:BadgePercent,sub:"Criar promoção"},{label:"Relatórios",icon:TrendingUp,sub:"Ver resultados"}].map(({label,icon:Icon,sub})=><button key={label} onClick={()=>go(label)} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[.08] bg-white/[.02] p-3 text-left transition hover:border-[#ffc900]/40 hover:bg-[#ffc900]/5 sm:gap-3 sm:p-4"><Icon size={19} className="shrink-0 text-[#ffc900]"/><span className="min-w-0"><span className="block truncate text-xs font-bold sm:text-sm">{label}</span><span className="mt-1 block text-[10px] text-zinc-500">{sub}</span></span></button>)}</div></section>
            </> : <section className="grid min-h-[55vh] place-items-center rounded-2xl border border-white/[.08] bg-[#121214] p-6 text-center"><div className="max-w-md"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#ffc900]/10 text-[#ffc900]"><ClipboardList size={25}/></div><h2 className="text-xl font-extrabold">{active}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Esta área ficará disponível nesta navegação. Os dados reais serão conectados na próxima etapa.</p><button onClick={() => go("Dashboard")} className="mt-5 rounded-xl border border-[#ffc900]/40 px-4 py-2.5 text-xs font-bold text-[#ffc900]">Voltar ao Dashboard</button></div></section>}
          </div>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/[.08] bg-[#101012]/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur lg:hidden">{[{label:"Dashboard",icon:House},{label:"Pedidos",icon:ClipboardList},{label:"Cardápio",icon:Utensils},{label:"Mais",icon:UserRound}].map(({label,icon:Icon})=><button key={label} onClick={()=>label === "Mais" ? setMenuOpen(true) : go(label)} className={`flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold ${active===label?"text-[#ffc900]":"text-zinc-500"}`}><Icon size={20}/>{label}</button>)}</nav>
      <footer className="border-t border-white/[.06] px-5 py-4 text-center text-[10px] text-zinc-700">Lilhão Admin · Painel em versão inicial · Sem autenticação</footer>
    </div>
  );
}
