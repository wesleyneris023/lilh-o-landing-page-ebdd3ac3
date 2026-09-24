import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock3, Copy, QrCode, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pagamento-pix")({
  component: PagamentoPixPage,
});

function PagamentoPixPage() {
  // Protótipo visual: valor e conteúdo não representam uma cobrança real.
  const valorDemonstracao = "R$ 45,00";

  return (
    <main className="min-h-[100dvh] bg-[#080909] px-4 pb-8 text-white sm:px-6">
      <header className="mx-auto flex max-w-xl items-center gap-3 border-b border-white/10 py-4">
        <Link to="/" aria-label="Voltar ao cardápio" className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.04] transition hover:border-[#ffc400]/50">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#ffc400]">Lilhão • Checkout</p>
          <h1 className="truncate text-xl font-black">Pagamento via PIX</h1>
        </div>
        <span className="rounded-full border border-[#ffc400]/20 bg-[#ffc400]/10 px-2.5 py-1 text-[10px] font-bold text-[#ffc400]">Prévia</span>
      </header>

      <section className="mx-auto max-w-xl py-8 text-center sm:py-12">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#ffc400]/20 bg-[#ffc400]/10 text-[#ffc400]"><QrCode className="size-7" /></div>
        <p className="mt-5 text-sm font-semibold text-white/55">Escaneie para pagar</p>
        <h2 className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">{valorDemonstracao}</h2>
        <p className="mt-3 text-sm text-white/45">Pedido demonstrativo • #000000</p>

        <div className="mx-auto mt-7 max-w-[300px] rounded-3xl border border-white/10 bg-white p-5 shadow-[0_12px_50px_rgba(0,0,0,.25)]">
          <div className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-5 text-center text-zinc-900">
            <div className="grid size-16 place-items-center rounded-2xl bg-zinc-200 text-zinc-700"><QrCode className="size-10" /></div>
            <p className="mt-4 text-sm font-black">QR Code demonstrativo</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">Será gerado aqui quando o PIX real for integrado.</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-white/45">Ou copie o código PIX</p>
        <button type="button" disabled className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-4 font-bold text-white/35" title="Disponível após integrar o provedor de pagamento">
          <Copy className="size-4" /> Código PIX indisponível nesta prévia
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-[#ffc400]/15 bg-[#ffc400]/[.06] px-3 py-3 text-sm font-semibold text-[#ffc400]"><Clock3 className="size-4 shrink-0" /> Aguardando integração do pagamento</div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#141617] p-4 text-left">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#ffc400]" />
            <div>
              <p className="font-bold">Pagamento seguro, em breve</p>
              <p className="mt-1 text-sm leading-relaxed text-white/50">Esta é somente a estrutura visual. Nenhuma cobrança será criada ou confirmada nesta tela. Quando a integração estiver pronta, o status será atualizado após a confirmação do provedor.</p>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-3">
          <Link to="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#ffc400] px-5 font-black text-black transition hover:bg-yellow-300"><ArrowLeft className="size-4" /> Voltar ao cardápio</Link>
          <p className="flex items-center justify-center gap-1.5 text-xs text-white/30"><Sparkles className="size-3.5" /> Tela de preparação para futura integração PIX</p>
        </div>
      </section>
    </main>
  );
}
