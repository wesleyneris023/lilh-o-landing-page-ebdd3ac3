import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Phone, UserRound, ClipboardList, ShoppingBag, Search, CheckCircle2 } from "lucide-react";

type ClienteSalvo = { telefone: string; nome: string };
type PedidoSalvo = { id?: string | number; telefone?: string; nome?: string; status?: string; total?: number; criadoEm?: string };
const CLIENTES_KEY = "lilhao_clientes";
const PEDIDOS_KEY = "lilhao_pedidos";
const somenteNumeros = (valor: string) => valor.replace(/\D/g, "");
const formatarTelefone = (valor: string) => {
  const n = somenteNumeros(valor).slice(0, 11);
  if (n.length <= 2) return n ? `(${n}` : "";
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
};
const dinheiro = (valor = 0) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ContaPage() {
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState<ClienteSalvo | null>(null);
  const [etapa, setEtapa] = useState<"telefone" | "nome" | "pedidos">("telefone");
  const [erro, setErro] = useState("");
  const [pedidos, setPedidos] = useState<PedidoSalvo[]>([]);

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
    if (encontrado) {
      abrirPedidos(encontrado);
    } else {
      setEtapa("nome");
    }
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

  function trocarTelefone() {
    setCliente(null); setTelefone(""); setNome(""); setPedidos([]); setErro(""); setEtapa("telefone");
  }

  return <main className="min-h-screen bg-[#f8f8f6] pb-8 text-[#171717]">
    <header className="flex min-h-[88px] items-center gap-4 border-b border-black/10 bg-white px-5 py-4 sm:px-8">
      <Link to="/" aria-label="Voltar para o início" className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f0f0ed] transition hover:bg-[#e7e7e2]"><ArrowLeft className="size-5" /></Link>
      <Link to="/" className="flex min-w-0 items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-[#ffc400] text-lg font-black text-black">L!</span>
        <span className="text-xl font-black">Lilhão<span className="text-[#ffc400]">.</span></span>
      </Link>
      <h1 className="ml-auto text-base font-semibold sm:text-lg">Meus Pedidos</h1>
    </header>

    <section className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-xl flex-col justify-center px-5 py-12">
      {etapa !== "pedidos" ? <>
        <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#e9e9e6]"><Phone className="size-9" /></div>
        <h2 className="mt-8 text-center text-3xl font-semibold">Meus pedidos</h2>
        <p className="mt-4 text-center text-base leading-relaxed text-black/55">{etapa === "telefone" ? "Informe o telefone que você usou no pedido." : "É sua primeira vez por aqui. Como podemos te chamar?"}</p>

        {etapa === "telefone" ? <form onSubmit={continuarTelefone} className="mt-8 space-y-4">
          <label className="sr-only" htmlFor="telefone-cliente">Telefone com DDD</label>
          <input id="telefone-cliente" type="tel" inputMode="numeric" autoComplete="tel" value={telefone} onChange={(event) => setTelefone(formatarTelefone(event.target.value))} placeholder="(96) 90000-0000" className="min-h-[76px] w-full rounded-2xl border-2 border-black/20 bg-white px-5 text-center text-xl outline-none transition focus:border-[#ffc400]" />
          {erro && <p role="alert" className="text-center text-sm text-red-600">{erro}</p>}
          <button type="submit" className="min-h-[68px] w-full rounded-2xl bg-[#171717] text-lg font-semibold text-white transition hover:bg-black">Continuar</button>
        </form> : <form onSubmit={salvarNome} className="mt-8 space-y-4">
          <div className="flex min-h-[68px] items-center justify-center rounded-2xl border border-black/10 bg-white text-lg text-black/75"><Phone className="mr-3 size-5" />{formatarTelefone(telefone)}</div>
          <label className="sr-only" htmlFor="nome-cliente">Seu nome</label>
          <input id="nome-cliente" autoComplete="name" value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Seu nome" className="min-h-[76px] w-full rounded-2xl border-2 border-black/20 bg-white px-5 text-center text-xl outline-none transition focus:border-[#ffc400]" />
          <p className="text-center text-sm text-black/50">Primeira vez por aqui — só o nome e pronto.</p>
          <button type="submit" disabled={!nome.trim()} className="min-h-[68px] w-full rounded-2xl bg-[#171717] text-lg font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40">Continuar</button>
          <button type="button" onClick={() => setEtapa("telefone")} className="w-full py-2 text-sm text-black/50 underline">Voltar</button>
        </form>}
      </> : <>
        <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#ffc400]"><UserRound className="size-6" /></div>
          <div className="min-w-0"><p className="text-xs uppercase tracking-wider text-black/45">Olá,</p><p className="truncate text-lg font-bold">{cliente?.nome}</p><p className="text-sm text-black/55">{formatarTelefone(cliente?.telefone || "")}</p></div>
          <button type="button" onClick={trocarTelefone} className="ml-auto text-xs text-black/50 underline">Trocar telefone</button>
        </div>
        <div className="mt-8 flex items-center gap-3"><ClipboardList className="size-6 text-[#c49a00]"/><h2 className="text-2xl font-semibold">Meus Pedidos</h2></div>
        {pedidos.length ? <div className="mt-5 space-y-3">{pedidos.map((pedido, index) => <article key={pedido.id ?? index} className="rounded-2xl border border-black/10 bg-white p-4"><div className="flex items-center justify-between gap-3"><b>Pedido #{pedido.id ?? index + 1}</b><span className="rounded-full bg-[#fff3b5] px-3 py-1 text-xs font-semibold">{pedido.status || "Recebido"}</span></div><p className="mt-2 text-sm text-black/55">{pedido.criadoEm || "Pedido registrado"}</p><p className="mt-3 text-lg font-bold">{dinheiro(pedido.total)}</p></article>)}</div> : <div className="py-12 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-[#e9e9e6]"><Phone className="size-9" /></div>
          <h3 className="mt-6 text-2xl font-semibold">Nenhum pedido realizado ainda</h3>
          <p className="mt-3 text-base text-black/55">Seus pedidos aparecerão aqui quando forem registrados.</p>
        </div>}
        <Link to="/" className="mt-5 inline-flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-[#171717] px-5 text-base font-semibold text-white transition hover:bg-black"><Search className="size-5" /> Ver cardápio</Link>
        <p className="mt-4 text-center text-xs leading-relaxed text-black/45"><CheckCircle2 className="mr-1 inline size-4" />Seus dados ficam salvos neste navegador nesta versão.</p>
      </>}
    </section>
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-white/10 bg-[#101112] px-2 py-2 text-white sm:hidden">
      <Link to="/" className="flex flex-col items-center gap-1 py-1 text-xs text-white/65"><span>⌂</span>Início</Link>
      <Link to="/#cardapio" className="flex flex-col items-center gap-1 py-1 text-xs text-white/65"><span>▦</span>Cardápio</Link>
      <Link to="/" className="flex flex-col items-center gap-1 py-1 text-xs text-white/65"><ShoppingBag className="size-5"/>Pedidos</Link>
      <span className="flex flex-col items-center gap-1 py-1 text-xs text-[#ffc400]"><UserRound className="size-5"/>Conta</span>
    </nav>
  </main>;
}

export const Route = createFileRoute("/conta")({ component: ContaPage });
