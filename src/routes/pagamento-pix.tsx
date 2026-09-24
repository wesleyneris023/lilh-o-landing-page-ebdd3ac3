import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Clock3, Copy, QrCode, ShieldCheck, ShoppingBag, Sparkles, WalletCards } from "lucide-react";

export const Route = createFileRoute("/pagamento-pix")({ component: PagamentoPixPage });

function DemoQrCode() {
  // Padrão gerado apenas para compor a interface. Não é um QR Pix válido.
  const cells = useMemo(() => Array.from({ length: 441 }, (_, i) => {
    const row = Math.floor(i / 21), col = i % 21;
    const finder = (r: number, c: number) => {
      const dr = row - r, dc = col - c;
      return dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
    };
    return finder(0, 0) || finder(0, 14) || finder(14, 0) || ((row * 7 + col * 11 + row * col) % 5 < 2);
  }), []);
  return <div className="relative mx-auto aspect-square w-full max-w-[290px] overflow-hidden rounded-xl bg-white p-3" aria-label="QR Code fictício, não pagável">
    <div className="grid h-full w-full grid-cols-[repeat(21,minmax(0,1fr))] gap-[2px]">{cells.map((filled, i) => <span key={i} className={filled ? "rounded-[1px] bg-[#111]" : "bg-white"} />)}</div>
    <div className="absolute inset-0 grid place-items-center bg-white/65"><span className="rotate-[-18deg] border-4 border-red-600 bg-white px-3 py-2 text-center text-sm font-black uppercase tracking-widest text-red-600 shadow-lg">Somente<br/>demonstração</span></div>
  </div>;
}

function PagamentoPixPage() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const pedidoNumero = params.get("pedido") || "DEMO-0001";
  const valorParam = Number(params.get("valor"));
  const valor = Number.isFinite(valorParam) && valorParam > 0 ? valorParam : 45;
  const [copiado, setCopiado] = useState(false);
  const [pago, setPago] = useState(false);
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const codigoFalso = `PIX-DEMO-NAO-PAGAVEL|LILHAO|PEDIDO-${pedidoNumero}|VALOR-${valor.toFixed(2)}|CODIGO-FICTICIO`;
  const dinheiro = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(codigoFalso);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    } catch { setMostrarAviso(true); }
  }

  function simularPagamento() {
    setPago(true);
    try {
      const pedidos = JSON.parse(localStorage.getItem("lilhao-pedidos") || "[]");
      const atualizados = pedidos.map((p: any) => String(p.numero) === pedidoNumero ? { ...p, status: "Pago (simulação)", pagamentoStatus: "aprovado_demo" } : p);
      localStorage.setItem("lilhao-pedidos", JSON.stringify(atualizados));
    } catch { /* armazenamento local opcional no protótipo */ }
  }

  return <main className="min-h-[100dvh] bg-[#080909] px-4 pb-10 text-white sm:px-6">
    <header className="mx-auto flex max-w-xl items-center gap-3 border-b border-white/10 py-4">
      <Link to="/" aria-label="Voltar ao cardápio" className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.04] transition hover:border-[#ffc400]/50"><ArrowLeft className="size-5" /></Link>
      <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#ffc400]">Lilhão • Checkout</p><h1 className="truncate text-xl font-black">Pagamento via PIX</h1></div>
      <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">Modo teste</span>
    </header>

    <section className="mx-auto max-w-xl py-7 text-center sm:py-10">
      <div className={`mx-auto grid size-14 place-items-center rounded-2xl ${pago ? "bg-emerald-400/10 text-emerald-400" : "bg-[#ffc400]/10 text-[#ffc400]"}`}>{pago ? <CheckCircle2 className="size-7"/> : <QrCode className="size-7"/>}</div>
      <p className="mt-4 text-sm font-semibold text-white/55">{pago ? "Pagamento de demonstração concluído" : "Escaneie para pagar"}</p>
      <h2 className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">{dinheiro(valor)}</h2>
      <p className="mt-2 text-xs text-white/45">Pedido #{pedidoNumero}</p>

      <div className="mx-auto mt-6 max-w-[330px] rounded-3xl border border-white/10 bg-[#151718] p-4 shadow-2xl"><DemoQrCode/><p className="mt-3 text-xs font-bold text-red-300">QR CODE FICTÍCIO — NÃO PAGÁVEL</p><p className="mt-1 text-[11px] leading-relaxed text-white/40">Imagem ilustrativa para validar o layout. Não tente efetuar pagamento.</p></div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#141617] p-4 text-left"><div className="flex items-center gap-2"><WalletCards className="size-5 text-[#ffc400]"/><h3 className="font-bold">PIX copia e cola (teste)</h3></div><div className="mt-3 break-all rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-white/45">{codigoFalso}</div><button onClick={copiarCodigo} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#ffc400]/30 bg-[#ffc400]/10 px-4 font-bold text-[#ffc400] transition hover:bg-[#ffc400]/15"><Copy className="size-4"/>{copiado ? "Código de teste copiado" : "Copiar código de teste"}</button>{mostrarAviso && <p className="mt-2 text-xs text-amber-300">Não foi possível copiar automaticamente. Selecione o código acima manualmente.</p>}</div>

      <div className={`mt-5 flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold ${pago ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-[#ffc400]/15 bg-[#ffc400]/[.06] text-[#ffc400]"}`}>{pago ? <CheckCircle2 className="size-4"/> : <Clock3 className="size-4"/>}{pago ? "Aprovado apenas na simulação" : "Aguardando pagamento • demonstração"}</div>

      {!pago ? <button onClick={simularPagamento} className="mt-4 min-h-14 w-full rounded-xl bg-[#ffc400] px-5 font-black text-black transition hover:bg-yellow-300">Simular pagamento aprovado</button> : <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200"><CheckCircle2 className="mx-auto mb-2 size-6"/><b>Simulação concluída!</b><p className="mt-1 text-xs text-emerald-100/70">O status local do pedido foi atualizado para “Pago (simulação)”. Nenhum pagamento real foi recebido.</p></div>}

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#141617] p-4 text-left"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#ffc400]"/><div><p className="font-bold">Ambiente de demonstração</p><p className="mt-1 text-sm leading-relaxed text-white/50">Esta tela não cria cobranças, não consulta bancos e não confirma pagamentos reais. O QR e o código são fictícios. A confirmação serve somente para visualizar o fluxo.</p></div></div></div>

      <div className="mt-6 grid gap-3"><Link to="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffc400] px-5 font-black text-black transition hover:bg-yellow-300"><ShoppingBag className="size-4"/>Voltar ao cardápio</Link><p className="flex items-center justify-center gap-1.5 text-xs text-white/30"><Sparkles className="size-3.5"/>Tela preparada para futura integração PIX real</p></div>
    </section>
  </main>;
}
