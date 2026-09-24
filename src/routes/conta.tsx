import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Phone, UserRound, ClipboardList, ShoppingBag, Search, CheckCircle2, XCircle } from "lucide-react";

type ClienteSalvo = { telefone: string; nome: string };
type ItemPedido = { id: string; nome: string; quantidade: number; preco: number };
type PedidoSalvo = {
  numero: string;
  telefone: string;
  nome: string;
  status: string;
  total: number;
  criadoEm: string;
  itens: ItemPedido[];
  entrega: string;
  endereco: string;
  pagamento: string;
  observacao?: string;
};
const CLIENTES_KEY = "lilhao_clientes";
const PEDIDOS_KEY = "lilhao-pedidos";
const somenteNumeros = (valor: string) => valor.replace(/\D/g, "");
const formatarTelefone = (valor: string) => {
  const n = somenteNumeros(valor).slice(0, 11);
  if (n.length <= 2) return n ? `(${n}` : "";
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
};
const dinheiro = (valor = 0) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const podeCancelar = (status = "") => ["recebido", "aguardando pagamento", "aguardando confirmação"].includes(status.trim().toLowerCase());

function ContaPage() {
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState<ClienteSalvo | null>(null);
  const [etapa, setEtapa] = useState<"telefone" | "nome" | "pedidos">("telefone");
  const [erro, setErro] = useState("");
  const [pedidos, setPedidos] = useState<PedidoSalvo[]>([]);
  const [pedidoDetalhe, setPedidoDetalhe] = useState<PedidoSalvo | null>(null);
  const [aviso, setAviso] = useState("");

  function continuarTelefone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    const numero = somenteNumeros(telefone);
    if (numero.length < 10 || numero.length > 11) {
      setErro("Informe um telefone válido com DDD.");
      return;
    }

    let clientes: ClienteSalvo[] = [];
    try { clientes = JSON.parse(localStorage.getItem(CLIENTES_KEY) || "[]"); } catch { clientes = []; }
    const encontrado = clientes.find((item) => somenteNumeros(item.telefone) === numero);
    if (encontrado) abrirPedidos(encontrado);
    else setEtapa("nome");
  }

  function salvarNome(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nome.trim()) return;
    const novoCliente = { telefone: somenteNumeros(telefone), nome: nome.trim() };
    let clientes: ClienteSalvo[] = [];
    try { clientes = JSON.parse(localStorage.getItem(CLIENTES_KEY) || "[]"); } catch { clientes = []; }
    localStorage.setItem(CLIENTES_KEY, JSON.stringify([...clientes.filter((item) => somenteNumeros(item.telefone) !== novoCliente.telefone), novoCliente]));
    abrirPedidos(novoCliente);
  }

  function abrirPedidos(dados: ClienteSalvo) {
    setCliente(dados);
    let todos: PedidoSalvo[] = [];
    try { todos = JSON.parse(localStorage.getItem(PEDIDOS_KEY) || "[]"); } catch { todos = []; }
    setPedidos(todos.filter((pedido) => somenteNumeros(pedido.telefone || "") === somenteNumeros(dados.telefone)));
    setEtapa("pedidos");
  }

  function cancelarPedido(pedido: PedidoSalvo) {
    if (!podeCancelar(pedido.status)) return;
    const confirmado = window.confirm(`Deseja realmente cancelar o pedido #${pedido.numero}? Essa ação não poderá ser desfeita.`);
    if (!confirmado) return;
    const atualizados = pedidos.map((item) => item.numero === pedido.numero ? { ...item, status: "Cancelado" } : item);
    try { localStorage.setItem(PEDIDOS_KEY, JSON.stringify(atualizados.concat((() => {
      let todos: PedidoSalvo[] = [];
      try { todos = JSON.parse(localStorage.getItem(PEDIDOS_KEY) || "[]"); } catch { todos = []; }
      return todos.filter((item) => somenteNumeros(item.telefone || "") !== somenteNumeros(cliente?.telefone || ""));
    })()))); } catch { /* armazenamento local indisponível */ }
    setPedidos(atualizados);
    setPedidoDetalhe((atual) => atual?.numero === pedido.numero ? { ...atual, status: "Cancelado" } : atual);
    setAviso(`Pedido #${pedido.numero} cancelado nesta demonstração.`);
  }

  function trocarTelefone() {
    setCliente(null); setTelefone(""); setNome(""); setPedidos([]); setErro(""); setAviso(""); setPedidoDetalhe(null); setEtapa("telefone");
  }

  return <main className="min-h-screen bg-[#080909] pb-24 text-white">
    <header className="flex min-h-[88px] items-center gap-4 border-b border-white/10 bg-[#101010] px-5 py-4 sm:px-8">
      <Link to="/" aria-label="Voltar para o início" className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/5"><ArrowLeft className="size-5" /></Link>
      <Link to="/" className="flex min-w-0 items-center gap-3"><span className="grid size-12 place-items-center rounded-full border-2 border-[#ffc400] bg-[#17150d] text-lg font-black text-[#ffc400]">L!</span><span className="text-xl font-black">Lilhão<span className="text-[#ffc400]">.</span></span></Link>
      <h1 className="ml-auto text-base font-semibold sm:text-lg">Meus Pedidos</h1>
    </header>

    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-xl flex-col justify-center px-5 py-12">
      {etapa !== "pedidos" ? <>
        <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-white/5 text-[#ffc400]"><Phone className="size-9" /></div>
        <h2 className="mt-8 text-center text-3xl font-semibold">Meus pedidos</h2>
        <p className="mt-4 text-center text-base leading-relaxed text-white/55">{etapa === "telefone" ? "Informe o telefone que você usou no pedido." : "É sua primeira vez por aqui. Como podemos te chamar?"}</p>
        {etapa === "telefone" ? <form onSubmit={continuarTelefone} className="mt-8 space-y-4">
          <label className="sr-only" htmlFor="telefone-cliente">Telefone com DDD</label>
          <input id="telefone-cliente" type="tel" inputMode="numeric" autoComplete="tel" value={telefone} onChange={(event) => setTelefone(formatarTelefone(event.target.value))} placeholder="(96) 90000-0000" className="min-h-[68px] w-full rounded-2xl border border-white/15 bg-[#141617] px-5 text-center text-xl outline-none focus:border-[#ffc400]" />
          {erro && <p role="alert" className="text-center text-sm text-red-400">{erro}</p>}
          <button type="submit" className="min-h-[60px] w-full rounded-2xl bg-[#ffc400] text-lg font-black text-black">Continuar</button>
        </form> : <form onSubmit={salvarNome} className="mt-8 space-y-4">
          <div className="flex min-h-[60px] items-center justify-center rounded-2xl border border-white/10 bg-[#141617] text-lg text-white/75"><Phone className="mr-3 size-5" />{formatarTelefone(telefone)}</div>
          <label className="sr-only" htmlFor="nome-cliente">Seu nome</label>
          <input id="nome-cliente" autoComplete="name" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Seu nome" className="min-h-[68px] w-full rounded-2xl border border-white/15 bg-[#141617] px-5 text-center text-xl outline-none focus:border-[#ffc400]" />
          <button type="submit" disabled={!nome.trim()} className="min-h-[60px] w-full rounded-2xl bg-[#ffc400] text-lg font-black text-black disabled:opacity-40">Continuar</button>
          <button type="button" onClick={() => setEtapa("telefone")} className="w-full py-2 text-sm text-white/50 underline">Voltar</button>
        </form>}
      </> : <>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#141617] p-4"><div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#ffc400] text-black"><UserRound className="size-6" /></div><div className="min-w-0"><p className="text-xs uppercase tracking-wider text-white/45">Olá,</p><p className="truncate text-lg font-bold">{cliente?.nome}</p><p className="text-sm text-white/55">{formatarTelefone(cliente?.telefone || "")}</p></div><button type="button" onClick={trocarTelefone} className="ml-auto text-xs text-white/50 underline">Trocar telefone</button></div>
        <div className="mt-8 flex items-center gap-3"><ClipboardList className="size-6 text-[#ffc400]"/><h2 className="text-2xl font-semibold">Meus Pedidos</h2></div>
        {aviso && <p role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">{aviso}</p>}
        {pedidos.length ? <div className="mt-5 space-y-3">{pedidos.map((pedido) => <article key={pedido.numero} className="rounded-2xl border border-white/10 bg-[#141617] p-4"><div className="flex items-center justify-between gap-3"><b>Pedido #{pedido.numero}</b><span className={`rounded-full px-3 py-1 text-xs font-semibold ${pedido.status === "Cancelado" ? "bg-red-400/10 text-red-300" : "bg-emerald-400/10 text-emerald-300"}`}>{pedido.status || "Recebido"}</span></div><p className="mt-2 text-sm text-white/45">{pedido.criadoEm ? new Date(pedido.criadoEm).toLocaleString("pt-BR") : "Pedido registrado"}</p><div className="mt-3 flex items-center justify-between gap-3"><span className="text-sm text-white/55">{pedido.itens?.reduce((s, i) => s + i.quantidade, 0) || 0} item(ns) · {pedido.entrega}</span><b className="text-lg text-[#ffc400]">{dinheiro(pedido.total)}</b></div><button onClick={() => setPedidoDetalhe(pedido)} className="mt-3 w-full rounded-xl border border-white/10 py-3 text-sm font-bold">Ver detalhes</button></article>)}</div> : <div className="py-12 text-center"><ShoppingBag className="mx-auto size-12 text-white/20"/><h3 className="mt-6 text-xl font-semibold">Nenhum pedido realizado ainda</h3><p className="mt-3 text-sm text-white/50">Seus pedidos aparecerão aqui quando forem registrados.</p></div>}
        <Link to="/" className="mt-5 inline-flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-[#ffc400] px-5 text-base font-black text-black"><Search className="size-5" /> Ver cardápio</Link>
        <p className="mt-4 text-center text-xs leading-relaxed text-white/40"><CheckCircle2 className="mr-1 inline size-4" />Os pedidos desta versão ficam salvos no navegador.</p>
      </>}
    </section>
    {pedidoDetalhe && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75" onClick={() => setPedidoDetalhe(null)}><section role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} className="max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141617] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Pedido #{pedidoDetalhe.numero}</h2><button onClick={() => setPedidoDetalhe(null)} aria-label="Fechar detalhes"><span className="text-2xl">×</span></button></div><p className="mt-3 text-sm text-white/60">{pedidoDetalhe.nome} · {formatarTelefone(pedidoDetalhe.telefone)}</p><p className="mt-1 text-sm">{pedidoDetalhe.endereco}</p><p className="mt-2 text-sm">Pagamento: {pedidoDetalhe.pagamento}</p><div className="mt-4 space-y-3 border-t border-white/10 pt-3">{pedidoDetalhe.itens?.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.quantidade}x {item.nome}</span><span>{dinheiro(item.preco * item.quantidade)}</span></div>)}</div><div className="mt-4 flex justify-between border-t border-white/10 pt-3 font-black"><span>Total</span><span className="text-[#ffc400]">{dinheiro(pedidoDetalhe.total)}</span></div><div className="mt-5 space-y-3">{podeCancelar(pedidoDetalhe.status) ? <button onClick={() => cancelarPedido(pedidoDetalhe)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 font-bold text-red-300"><XCircle className="size-5"/> Cancelar pedido</button> : <p className="rounded-xl bg-white/5 p-3 text-center text-xs text-white/45">{pedidoDetalhe.status === "Cancelado" ? "Este pedido foi cancelado." : "Este pedido não pode mais ser cancelado por aqui."}</p>}<button onClick={() => setPedidoDetalhe(null)} className="min-h-12 w-full rounded-xl bg-[#ffc400] font-black text-black">Fechar</button></div></section></div>}
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-white/10 bg-[#101112] px-2 py-2 text-white sm:hidden"><Link to="/" className="flex flex-col items-center gap-1 py-1 text-xs text-white/65"><span>⌂</span>Início</Link><Link to="/#cardapio" className="flex flex-col items-center gap-1 py-1 text-xs text-white/65"><span>▦</span>Cardápio</Link><Link to="/" className="flex flex-col items-center gap-1 py-1 text-xs text-white/65"><ShoppingBag className="size-5"/>Pedidos</Link><span className="flex flex-col items-center gap-1 py-1 text-xs text-[#ffc400]"><UserRound className="size-5"/>Conta</span></nav>
  </main>;
}

export const Route = createFileRoute("/conta")({ component: ContaPage });