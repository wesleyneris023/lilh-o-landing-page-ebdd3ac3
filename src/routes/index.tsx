import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, Clock, Copy, CreditCard, Flame, Home, LayoutDashboard, MapPin, Minus, PackageCheck, Phone, Plus, QrCode, Search, ShoppingBag, Store, Trash2, User, Utensils, X } from "lucide-react";
import heroBurger from "@/assets/hero-burger.jpg";

import { categorias, dinheiro, lerPedidos, lerProdutos, salvarPedidos, type ItemSacola, type Pedido, type Produto } from "@/data/store";
import { carregarCatalogo, carregarCategorias, carregarConfiguracoes, carregarFormasPagamento, criarPedidoReal, carregarPedidosAdmin } from "@/lib/api";
const PIX_CODIGO_DEMO = "00020126580014BR.GOV.BCB.PIX0136lilhao-demo-pagamento-nao-real-5204000053039865406";
function categoriaIcone(cat: string) {
  switch (cat) {
    case "Todos": return LayoutDashboard;
    case "Hambúrgueres": return Flame;
    case "Combos": return PackageCheck;
    case "Pratos": return Utensils;
    case "Bebidas": return ShoppingBag;
    case "Sorvetes": return Store;
    default: return ClipboardList;
  }
}

function FakeQrCode() {
  const cells = Array.from({ length: 29 * 29 }, (_, index) => {
    const x = index % 29;
    const y = Math.floor(index / 29);
    const finder = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7 && (x === ox || x === ox + 6 || y === oy || y === oy + 6 || (x >= ox + 2 && x <= ox + 4 && y >= oy + 2 && y <= oy + 4));
    const timing = (x === 6 && y > 7 && y < 21) || (y === 6 && x > 7 && x < 21);
    const noise = ((x * 17 + y * 31 + x * y * 7) % 11) < 5;
    return finder(0, 0) || finder(22, 0) || finder(0, 22) || timing || noise;
  });
  return <svg viewBox="0 0 29 29" className="size-full rounded-xl bg-white p-3" role="img" aria-label="QR Code demonstrativo do PIX">{cells.map((on, i) => on ? <rect key={i} x={i % 29} y={Math.floor(i / 29)} width="1" height="1" fill="#050505" /> : null)}</svg>;
}

function Index() {
  const [categoria, setCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [sacola, setSacola] = useState<ItemSacola[]>([]);
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [categoriasAbertas, setCategoriasAbertas] = useState(false);
  const [checkoutEtapa, setCheckoutEtapa] = useState(0);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<"entrega" | "retirada">("entrega");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [complemento, setComplemento] = useState("");
  const [referencia, setReferencia] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [troco, setTroco] = useState("");
  const [observacao, setObservacao] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoAtual, setPedidoAtual] = useState<Pedido | null>(null);
  const [aba, setAba] = useState<"inicio" | "pedidos" | "conta">("inicio");
  const [menu, setMenu] = useState<Produto[]>(lerProdutos());
  const [categoriasMenu, setCategoriasMenu] = useState<string[]>(categorias);
  const [pixPago, setPixPago] = useState(false);
  const [carregandoMenu, setCarregandoMenu] = useState(true);
  const [erroMenu, setErroMenu] = useState("");
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [erroCheckout, setErroCheckout] = useState("");
  const [taxaEntregaConfigurada, setTaxaEntregaConfigurada] = useState(5);
  const [aceitaPedidos, setAceitaPedidos] = useState(true);
  const [formasPagamento, setFormasPagamento] = useState<string[]>(["PIX", "Crédito", "Débito", "Dinheiro"]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setCarregandoMenu(true);
        const [catalogoResult, categoriasResult, configResult, formasResult] = await Promise.allSettled([
          carregarCatalogo(),
          carregarCategorias(),
          carregarConfiguracoes(),
          carregarFormasPagamento(),
        ]);
        if (!ativo) return;
        const produtos = catalogoResult.status === "fulfilled" ? catalogoResult.value : null;
        const cats = categoriasResult.status === "fulfilled" ? categoriasResult.value : null;
        const cfg = configResult.status === "fulfilled" ? configResult.value : null;
        const formas = formasResult.status === "fulfilled" ? formasResult.value : null;
        setMenu(produtos ?? lerProdutos());
        setCategoriasMenu(cats ?? categorias);
        if (cfg) {
          setTaxaEntregaConfigurada(Number(cfg.taxa_entrega || 0));
          setAceitaPedidos(cfg.aceita_pedidos !== false);
        }
        if (formas?.length) setFormasPagamento(formas);
        if (produtos && cats) {
          setErroMenu("");
        } else {
          const failed = [catalogoResult, categoriasResult, configResult, formasResult].filter((r) => r.status === "rejected").length;
          setErroMenu("Alguns dados online não puderam ser carregados (" + failed + "). O restante do cardápio continua disponível.");
        }
      } catch {
        if (!ativo) return;
        setErroMenu("Não foi possível carregar o cardápio online. Exibindo o catálogo de demonstração.");
        setMenu(lerProdutos());
        setCategoriasMenu(categorias);
      } finally {
        if (ativo) setCarregandoMenu(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  const filtrados = useMemo(() => menu.filter((p) => (categoria === "Todos" || p.categoria === categoria) && `${p.nome} ${p.descricao}`.toLowerCase().includes(busca.toLowerCase())), [categoria, busca, menu]);
  const quantidade = sacola.reduce((t, i) => t + i.quantidade, 0);
  const subtotal = sacola.reduce((t, i) => t + i.preco * i.quantidade, 0);
  const taxaEntrega = tipoEntrega === "entrega" ? taxaEntregaConfigurada : 0;
  const total = subtotal + taxaEntrega;

  function adicionar(produto: Produto) { setSacola((atual) => { const existe = atual.find((i) => i.id === produto.id); return existe ? atual.map((i) => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i) : [...atual, { ...produto, quantidade: 1 }]; }); }
  function alterarQuantidade(id: string, delta: number) { setSacola((atual) => atual.map((i) => i.id === id ? { ...i, quantidade: i.quantidade + delta } : i).filter((i) => i.quantidade > 0)); }
  function abrirCheckout() { if (!sacola.length || !aceitaPedidos) return; setSacolaAberta(false); setCheckoutEtapa(1); setAba("inicio"); }
  function continuarEntrega() { if (!nome.trim() || !telefone.trim() || (tipoEntrega === "entrega" && (!rua.trim() || !numero.trim() || !bairro.trim()))) return; setCheckoutEtapa(2); }
  function continuarPagamento() { if (!pagamento) return; setCheckoutEtapa(3); }
  async function confirmarPedido(pixConfirmado = pixPago) {
    if (pagamento === "PIX" && !pixConfirmado) return;
    if (!sacola.length || enviandoPedido) return;
    setErroCheckout("");
    setEnviandoPedido(true);
    const enderecoTexto = tipoEntrega === "retirada"
      ? "Retirada no local"
      : rua + ", " + numero + " — " + bairro + (complemento ? ", " + complemento : "") + (referencia ? " (Ref.: " + referencia + ")" : "");
    try {
      const criado = await criarPedidoReal({
        nome,
        telefone,
        tipo_entrega: tipoEntrega,
        endereco: { cep, rua, numero, bairro, complemento, referencia, texto: enderecoTexto },
        pagamento,
        observacao,
        itens: sacola.map((item) => ({ id: item.id, quantidade: item.quantidade })),
      });
      const novo: Pedido = {
        numero: criado.numero,
        criadoEm: new Date().toISOString(),
        itens: sacola,
        nome,
        telefone,
        entrega: tipoEntrega === "retirada" ? "Retirada no local" : "Entrega",
        endereco: enderecoTexto,
        pagamento: pagamento + (pagamento === "Dinheiro" && troco ? " (troco para " + troco + ")" : ""),
        observacao,
        subtotal: Number(criado.subtotal),
        taxa: Number(criado.taxa_entrega),
        total: Number(criado.total),
        status: "Recebido",
      };
      setPedidos((atual) => [novo, ...atual]);
      setPedidoAtual(novo);
      setSacola([]);
      setPixPago(false);
      setCheckoutEtapa(5);
    } catch (error) {
      setErroCheckout(error instanceof Error ? error.message : "Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setEnviandoPedido(false);
    }
  }
  async function abrirMeusPedidos() { try { setPedidos(await carregarPedidosAdmin()); } catch { setPedidos(lerPedidos()); } setAba("pedidos"); setCheckoutEtapa(0); setSacolaAberta(false); setPixPago(false); }

  const inputClass = "mt-1.5 min-h-12 w-full rounded-xl border border-white/10 bg-[#101112] px-4 text-base text-white outline-none placeholder:text-white/30 focus:border-[#ffc400]";
  const actionClass = "min-h-12 rounded-xl bg-[#ffc400] px-5 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40";
  const quietClass = "min-h-12 rounded-xl border border-white/10 bg-white/[.04] px-5 font-bold text-white/75";

  return <div className="min-h-screen bg-[#080909] pb-24 text-white md:pb-0">
    {erroMenu && checkoutEtapa === 0 && <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6"><div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">{erroMenu}</div></div>}
    {erroCheckout && checkoutEtapa > 0 && <div className="mx-auto max-w-3xl px-3 pt-3 sm:px-6"><div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{erroCheckout}</div></div>}
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#101010]/95 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6"><div className="flex items-center gap-2"><button type="button" onClick={() => window.location.assign("/dashboard")} aria-label="Abrir painel administrativo" className="grid size-9 shrink-0 place-items-center rounded-full border border-[#ffc400]/40 bg-[#17150d] text-[#ffc400]"><LayoutDashboard className="size-4"/></button><button onClick={() => { setAba("inicio"); setCheckoutEtapa(0); }} className="flex items-center gap-2.5 text-white"><span className="grid size-10 place-items-center rounded-full border-2 border-[#ffc400] bg-[#17150d] text-lg font-black text-[#ffc400]">L!</span><span><span className="block text-2xl font-black leading-none">Lilhão<span className="text-[#ffc400]">.</span></span><span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[.16em] text-white/65 sm:block">Sabor que todo mundo aprova</span></span></button></div><button type="button" onClick={() => setSacolaAberta(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#ffc400] px-3.5 text-sm font-black text-black"><ShoppingBag className="size-5"/><span className="grid min-h-6 min-w-6 place-items-center rounded-full bg-black px-1 text-xs font-black text-[#ffc400]">{quantidade}</span></button></div></header>

    {checkoutEtapa > 0 ? <main className="mx-auto min-h-[calc(100dvh-70px)] max-w-3xl px-3 pb-6 sm:px-6">
      <div className="sticky top-[65px] z-20 -mx-3 border-b border-white/10 bg-[#080909]/95 px-3 py-4 backdrop-blur sm:mx-0 sm:px-0"><div className="flex items-center gap-3"><button onClick={() => checkoutEtapa === 1 ? setCheckoutEtapa(0) : checkoutEtapa === 4 ? setCheckoutEtapa(3) : checkoutEtapa === 5 ? setCheckoutEtapa(0) : setCheckoutEtapa(checkoutEtapa - 1)} aria-label="Voltar" className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5"><ArrowLeft className="size-5"/></button><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#ffc400]">Lilhão • Seu pedido</p><h1 className="text-xl font-black">{checkoutEtapa === 4 ? "Pagamento via PIX" : checkoutEtapa === 5 ? "Pedido enviado" : "Finalizar pedido"}</h1></div></div>
        {checkoutEtapa < 4 && <div className="mt-5 grid grid-cols-3 gap-2">{["Entrega", "Pagamento", "Confirmação"].map((label, idx) => { const num = idx + 1; const done = checkoutEtapa > num; const active = checkoutEtapa === num; return <div key={label} className="text-center"><div className={`mx-auto grid size-9 place-items-center rounded-full text-sm font-black ${active || done ? "bg-[#ffc400] text-black" : "bg-[#202223] text-white/45"}`}>{done ? <Check className="size-4"/> : num}</div><p className={`mt-1.5 text-xs font-bold ${active ? "text-white" : "text-white/45"}`}>{label}</p><div className={`mt-2 h-0.5 rounded ${done ? "bg-[#ffc400]" : "bg-white/10"}`}/></div>; })}</div>}
      </div>

      {checkoutEtapa === 1 && <section className="space-y-5 py-5"><div className="rounded-2xl border border-white/10 bg-[#141617] p-4"><h2 className="text-lg font-black">Seus dados</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-white/60">Nome completo *<input required value={nome} onChange={e => setNome(e.target.value)} className={inputClass} placeholder="Como podemos te chamar?"/></label><label className="text-xs font-bold text-white/60">Telefone / WhatsApp *<input required value={telefone} onChange={e => setTelefone(e.target.value)} className={inputClass} placeholder="(00) 00000-0000" inputMode="tel"/></label></div></div>
        <div><h2 className="mb-3 text-lg font-black">Como deseja receber?</h2><div className="grid gap-3 sm:grid-cols-2"><button onClick={() => setTipoEntrega("entrega")} className={`flex min-h-[76px] items-center gap-3 rounded-2xl border p-4 text-left ${tipoEntrega === "entrega" ? "border-[#ffc400] bg-[#ffc400]/10" : "border-white/10 bg-[#141617]"}`}><MapPin className="size-6 text-[#ffc400]"/><span className="flex-1"><b>Receber no endereço</b><small className="mt-1 block text-white/45">Taxa de entrega: {dinheiro(taxaEntregaConfigurada)}</small></span><span className={`size-5 rounded-full border-2 ${tipoEntrega === "entrega" ? "border-[#ffc400] bg-[#ffc400] shadow-[inset_0_0_0_4px_#111]" : "border-white/25"}`}/></button><button onClick={() => setTipoEntrega("retirada")} className={`flex min-h-[76px] items-center gap-3 rounded-2xl border p-4 text-left ${tipoEntrega === "retirada" ? "border-[#ffc400] bg-[#ffc400]/10" : "border-white/10 bg-[#141617]"}`}><Store className="size-6 text-[#ffc400]"/><span className="flex-1"><b>Retirar no local</b><small className="mt-1 block text-white/45">Sem taxa de entrega</small></span><span className={`size-5 rounded-full border-2 ${tipoEntrega === "retirada" ? "border-[#ffc400] bg-[#ffc400] shadow-[inset_0_0_0_4px_#111]" : "border-white/25"}`}/></button></div></div>
        {tipoEntrega === "entrega" && <div className="rounded-2xl border border-white/10 bg-[#141617] p-4"><h2 className="text-lg font-black">Endereço de entrega</h2><div className="mt-3 grid grid-cols-2 gap-3"><label className="col-span-2 text-xs font-bold text-white/60 sm:col-span-1">CEP (opcional)<input value={cep} onChange={e => setCep(e.target.value)} className={inputClass} placeholder="00000-000" inputMode="numeric"/></label><label className="col-span-2 text-xs font-bold text-white/60 sm:col-span-1">Bairro *<input required value={bairro} onChange={e => setBairro(e.target.value)} className={inputClass} placeholder="Seu bairro"/></label><label className="col-span-2 text-xs font-bold text-white/60 sm:col-span-1">Rua / Avenida *<input required value={rua} onChange={e => setRua(e.target.value)} className={inputClass} placeholder="Nome da rua"/></label><label className="text-xs font-bold text-white/60">Número *<input required value={numero} onChange={e => setNumero(e.target.value)} className={inputClass} placeholder="Nº"/></label><label className="text-xs font-bold text-white/60">Complemento<input value={complemento} onChange={e => setComplemento(e.target.value)} className={inputClass} placeholder="Casa, ap..."/></label><label className="col-span-2 text-xs font-bold text-white/60">Ponto de referência<input value={referencia} onChange={e => setReferencia(e.target.value)} className={inputClass} placeholder="Próximo de..."/></label></div><p className="mt-3 text-xs text-white/45">Confira o endereço antes de continuar. A taxa de entrega é definida pela lanchonete.</p></div>}
        <button onClick={continuarEntrega} disabled={!nome.trim() || !telefone.trim() || (tipoEntrega === "entrega" && (!rua.trim() || !numero.trim() || !bairro.trim()))} className={`${actionClass} w-full`}>Continuar <ArrowRight className="ml-1 inline size-4"/></button>
      </section>}

      {checkoutEtapa === 2 && <section className="space-y-5 py-5"><div><h2 className="text-lg font-black">Forma de pagamento</h2><p className="mt-1 text-sm text-white/45">Selecione como deseja pagar.</p></div><div className="space-y-3">{formasPagamento.map(nome => { const desc = nome === "PIX" ? "Pagamento via PIX" : nome === "Crédito" ? "Cartão de crédito na entrega" : nome === "Débito" ? "Cartão de débito na entrega" : "Pague ao receber ou retirar"; return { nome, desc }; }).map(op => <button key={op.nome} onClick={() => setPagamento(op.nome)} className={`flex min-h-[76px] w-full items-center gap-4 rounded-2xl border p-4 text-left ${pagamento === op.nome ? "border-[#ffc400] bg-[#ffc400]/10" : "border-white/10 bg-[#141617]"}`}><span className={`grid size-11 place-items-center rounded-xl ${pagamento === op.nome ? "bg-[#ffc400] text-black" : "bg-white/5 text-[#ffc400]"}`}><CreditCard className="size-5"/></span><span className="flex-1"><b>{op.nome}</b><small className="mt-1 block text-white/45">{op.desc}</small></span>{op.nome === "PIX" && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">Popular</span>}<span className={`size-5 rounded-full border-2 ${pagamento === op.nome ? "border-[#ffc400] bg-[#ffc400] shadow-[inset_0_0_0_4px_#111]" : "border-white/25"}`}/></button>)}</div>
        {pagamento === "Dinheiro" && <label className="block text-xs font-bold text-white/60">Precisa de troco? Para quanto?<input value={troco} onChange={e => setTroco(e.target.value)} className={inputClass} placeholder="Ex.: R$ 50,00 (opcional)"/></label>}
        <label className="block text-xs font-bold text-white/60">Observação do pedido (opcional)<textarea value={observacao} onChange={e => setObservacao(e.target.value)} className={`${inputClass} min-h-24 py-3`} placeholder="Alguma informação para a lanchonete?"/></label>
        <div className="rounded-2xl border border-white/10 bg-[#141617] p-4"><div className="flex justify-between text-sm text-white/50"><span>Subtotal</span><span>{dinheiro(subtotal)}</span></div><div className="mt-2 flex justify-between text-sm text-white/50"><span>Entrega</span><span>{taxaEntrega ? dinheiro(taxaEntrega) : "Grátis"}</span></div><div className="mt-3 flex justify-between border-t border-white/10 pt-3 font-black"><span>Total</span><span className="text-[#ffc400]">{dinheiro(total)}</span></div></div>
        <div className="grid grid-cols-[.8fr_1.2fr] gap-3"><button onClick={() => setCheckoutEtapa(1)} className={quietClass}>Voltar</button><button onClick={continuarPagamento} disabled={!pagamento} className={actionClass}>Continuar <ArrowRight className="ml-1 inline size-4"/></button></div>
      </section>}

      {checkoutEtapa === 3 && <section className="space-y-4 py-5"><p className="text-sm text-white/50">Confira as informações antes de confirmar.</p><div className="rounded-2xl border border-white/10 bg-[#141617] p-4"><div className="flex items-center justify-between"><h2 className="font-black">Cliente</h2><button onClick={() => setCheckoutEtapa(1)} className="text-sm font-bold text-[#ffc400]">Editar</button></div><p className="mt-2">{nome}</p><p className="text-sm text-white/50">{telefone}</p><p className="mt-3 text-sm text-white/70">{tipoEntrega === "retirada" ? "Retirada no local" : `${rua}, ${numero} — ${bairro}${complemento ? `, ${complemento}` : ""}`}</p>{referencia && tipoEntrega === "entrega" && <p className="text-xs text-white/40">Referência: {referencia}</p>}</div><div className="rounded-2xl border border-white/10 bg-[#141617] p-4"><div className="flex items-center justify-between"><h2 className="font-black">Pagamento</h2><button onClick={() => setCheckoutEtapa(2)} className="text-sm font-bold text-[#ffc400]">Editar</button></div><p className="mt-2">{pagamento}{pagamento === "Dinheiro" && troco ? ` • Troco para ${troco}` : ""}</p></div><div className="rounded-2xl border border-white/10 bg-[#141617] p-4"><h2 className="font-black">Resumo do pedido</h2><div className="mt-3 space-y-3">{sacola.map(item => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-white/70">{item.quantidade}x {item.nome}</span><b>{dinheiro(item.preco * item.quantidade)}</b></div>)}</div><div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-sm"><div className="flex justify-between text-white/50"><span>Subtotal</span><span>{dinheiro(subtotal)}</span></div><div className="flex justify-between text-white/50"><span>Taxa de entrega</span><span>{taxaEntrega ? dinheiro(taxaEntrega) : "Grátis"}</span></div><div className="flex justify-between border-t border-white/10 pt-3 text-base font-black"><span>Total</span><span className="text-[#ffc400]">{dinheiro(total)}</span></div></div>{observacao && <p className="mt-3 text-xs text-white/45">Observação: {observacao}</p>}</div><div className="grid grid-cols-[.8fr_1.2fr] gap-3"><button onClick={() => setCheckoutEtapa(2)} className={quietClass}>Voltar</button><button onClick={() => pagamento === "PIX" ? setCheckoutEtapa(4) : confirmarPedido()} disabled={enviandoPedido} className={actionClass}>{pagamento === "PIX" ? "Pagar com PIX" : "Confirmar pedido"} <Check className="ml-1 inline size-4"/></button></div><p className="text-center text-[11px] text-white/35">O pedido é enviado e persistido no Supabase. O PIX permanece em modo demonstração até a integração com um provedor real.</p></section>}

      {checkoutEtapa === 4 && <section className="space-y-6 py-8">
        <div className="text-center"><div className="mx-auto grid size-16 place-items-center rounded-full bg-[#ffc400]/10 text-[#ffc400]"><QrCode className="size-8"/></div><p className="mt-4 text-xs font-black uppercase tracking-[.2em] text-[#ffc400]">Pagamento via PIX</p><h2 className="mt-2 text-3xl font-black">Escaneie para pagar</h2><p className="mt-2 text-sm text-white/45">Este QR Code é apenas demonstrativo e não movimenta dinheiro.</p><p className="mt-4 text-4xl font-black text-[#ffc400]">{dinheiro(total)}</p></div>
        <div className="mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-white p-4 shadow-2xl"><FakeQrCode /></div>
        <div className="mx-auto max-w-sm text-center"><p className="text-xs text-white/40">Ou copie o código PIX de demonstração</p><button onClick={() => navigator.clipboard?.writeText(PIX_CODIGO_DEMO)} className="mt-3 min-h-12 w-full rounded-xl bg-[#ffc400] px-4 font-black text-black"><Copy className="mr-2 inline size-4"/>Copiar código PIX</button><p className="mt-4 text-sm font-bold text-amber-300">Aguardando pagamento…</p><button onClick={() => { setPixPago(true); confirmarPedido(true); }} className="mt-5 w-full rounded-xl border border-white/10 bg-white/[.04] py-3 text-sm font-bold text-white/70">Simular pagamento confirmado</button><div className="mt-4 rounded-2xl border border-white/10 bg-[#141617] p-4 text-left text-xs leading-relaxed text-white/45"><b className="text-white">Ambiente de demonstração</b><br/>O pedido só será registrado depois que o pagamento PIX for simulado. Na versão real, esta etapa será ligada ao provedor PIX.</div></div>
      </section>}

      {checkoutEtapa === 5 && pedidoAtual && <section className="py-10 text-center"><div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-400/15 text-emerald-400"><CheckCircle2 className="size-11"/></div><p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-[#ffc400]">Tudo certo, {pedidoAtual.nome.split(" ")[0]}!</p><h2 className="mt-2 text-3xl font-black">Pedido registrado</h2><p className="mt-2 text-sm text-white/50">Seu número de pedido</p><p className="mt-1 text-4xl font-black text-[#ffc400]">#{pedidoAtual.numero}</p><div className="mx-auto mt-6 max-w-md rounded-2xl border border-white/10 bg-[#141617] p-4 text-left"><div className="flex items-center gap-3"><PackageCheck className="size-6 text-[#ffc400]"/><div><b>Status: {pedidoAtual.status}</b><p className="text-xs text-white/45">Pedido recebido pelo sistema da Lilhão</p></div></div><div className="mt-4 border-t border-white/10 pt-3 text-sm"><div className="flex justify-between"><span className="text-white/50">Entrega</span><span>{pedidoAtual.entrega}</span></div><div className="mt-2 flex justify-between"><span className="text-white/50">Pagamento</span><span>{pedidoAtual.pagamento}</span></div><div className="mt-2 flex justify-between font-black"><span>Total</span><span className="text-[#ffc400]">{dinheiro(pedidoAtual.total)}</span></div></div></div><p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-white/40">Seu pedido foi registrado com segurança e já está disponível para atendimento no sistema da Lilhão.</p><div className="mx-auto mt-6 grid max-w-md gap-3"><button onClick={abrirMeusPedidos} className={actionClass}>Acompanhar / ver meus pedidos</button><button onClick={() => { setCheckoutEtapa(0); setPedidoAtual(null); setAba("inicio"); }} className={quietClass}>Voltar ao cardápio</button></div></section>}
    </main> : <>
      {aba === "inicio" && <main><section id="inicio" className="relative isolate flex min-h-[420px] items-center justify-center overflow-hidden border-b border-white/10 bg-black text-center sm:min-h-[520px]"><img src={heroBurger} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover"/><div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/65 via-black/50 to-[#080909]"/><div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-16"><p className="mb-4 text-[11px] font-black uppercase tracking-[.2em] text-white/90 sm:text-sm">Hambúrgueres • Pizzas • Refeições • Sorvetes</p><p className="text-xl font-black uppercase">Lanchonete do</p><h1 className="mt-1 text-7xl font-black uppercase leading-[.9] tracking-tight text-[#ffc400] sm:text-9xl">Lilhão<span className="text-white">.</span></h1><p className="mt-4 text-sm font-bold uppercase tracking-wide">Sabor que vira tradição!</p><a href="#cardapio" className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#ffc400] px-9 font-black text-black">Ver cardápio ↓</a></div></section>
        <section id="cardapio" className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-10"><div className="mb-4 flex items-center gap-3 rounded-full border border-white/15 bg-[#171819] px-4 py-1"><Search className="size-5 text-white/45"/><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar no cardápio..." className="min-h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/40"/></div><div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141617] px-4 py-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Categoria selecionada</p><p className="truncate text-sm font-black">{categoria}</p></div><button onClick={() => setCategoriasAbertas(true)} className="rounded-full bg-[#ffc400] px-4 py-2.5 text-xs font-black text-black">Categorias ⌄</button></div>
          {(categoria === "Todos" ? categoriasMenu.slice(1) : [categoria]).map(cat => { const itens = filtrados.filter(p => p.categoria === cat); if (!itens.length) return null; const Icon = categoriaIcone(cat); return <section key={cat} className="mb-7"><div className="mb-3 flex items-center gap-3"><Icon className="size-6 text-[#ffc400]"/><h2 className="text-xl font-black">{cat}</h2></div><div className="space-y-2.5">{itens.map(p => <article key={p.id} className="flex min-h-[116px] overflow-hidden rounded-xl border border-white/15 bg-[#141617]"><div className="w-[112px] shrink-0 bg-black sm:w-36">{p.imagem ? <img src={p.imagem} alt={p.nome} loading="lazy" className="h-full min-h-[116px] w-full object-cover"/> : <div className="grid h-full min-h-[116px] place-items-center text-4xl">{cat === "Bebidas" ? "🥤" : cat === "Sorvetes" ? "🍨" : cat === "Pizzas" ? "🍕" : "🥪"}</div>}</div><div className="flex min-w-0 flex-1 items-center justify-between gap-2 p-3"><div className="min-w-0"><h3 className="text-sm font-bold">{p.nome}</h3><p className="mt-1 line-clamp-2 text-xs text-white/55">{p.descricao}</p><p className="mt-1.5 font-black text-[#ffc400]">{dinheiro(p.preco)}</p></div><button onClick={() => adicionar(p)} aria-label={`Adicionar ${p.nome}`} className="grid size-10 shrink-0 place-items-center rounded-full bg-[#ffc400] text-black"><Plus className="size-5"/></button></div></article>)}</div></section>; })}{filtrados.length === 0 && <p className="p-8 text-center text-white/50">Nenhum item encontrado.</p>}</section>
        <section className="border-t border-white/10 bg-[#111314] px-4 py-8 text-center"><p className="text-xs font-black uppercase tracking-[.2em] text-[#ffc400]">Estamos por aqui</p><h2 className="mt-2 text-2xl font-black">Lilhão, sabor que conquista</h2><div className="mt-5 flex flex-wrap justify-center gap-4 text-sm text-white/50"><span><Clock className="mr-1 inline size-4 text-[#ffc400]"/>Consulte os horários</span><span><Phone className="mr-1 inline size-4 text-[#ffc400]"/>Pedidos</span></div></section></main>}

      {aba === "pedidos" && <main className="mx-auto min-h-[70dvh] max-w-3xl px-4 py-6"><div className="flex items-center gap-3"><ClipboardList className="size-6 text-[#ffc400]"/><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#ffc400]">Sua conta</p><h1 className="text-2xl font-black">Meus pedidos</h1></div></div>{pedidos.length === 0 ? <div className="py-24 text-center"><ShoppingBag className="mx-auto size-12 text-white/20"/><h2 className="mt-4 text-lg font-bold">Nenhum pedido encontrado</h2><p className="mt-2 text-sm text-white/45">Seus pedidos confirmados neste navegador aparecerão aqui.</p><button onClick={() => setAba("inicio")} className={`${actionClass} mt-5`}>Ver cardápio</button></div> : <div className="mt-5 space-y-3">{pedidos.map(p => <article key={p.numero} className="rounded-2xl border border-white/10 bg-[#141617] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs text-white/45">Pedido #{p.numero}</p><p className="mt-1 font-black">{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</p></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">{p.status}</span></div><div className="mt-3 flex items-center justify-between"><p className="text-sm text-white/60">{p.itens.reduce((s,i)=>s+i.quantidade,0)} item(ns) • {p.entrega}</p><b className="text-[#ffc400]">{dinheiro(p.total)}</b></div><button onClick={() => setPedidoAtual(p)} className="mt-3 w-full rounded-lg border border-white/10 py-2.5 text-sm font-bold">Ver detalhes</button></article>)}</div>}{pedidoAtual && checkoutEtapa === 0 && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75" onClick={() => setPedidoAtual(null)}><section onClick={e=>e.stopPropagation()} className="max-h-[80dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#141617] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Pedido #{pedidoAtual.numero}</h2><button onClick={() => setPedidoAtual(null)}><X className="size-5"/></button></div><p className="mt-3 text-sm text-white/60">{pedidoAtual.nome} • {pedidoAtual.telefone}</p><p className="mt-1 text-sm">{pedidoAtual.endereco}</p><p className="mt-2 text-sm">Pagamento: {pedidoAtual.pagamento}</p><div className="mt-4 space-y-2 border-t border-white/10 pt-3">{pedidoAtual.itens.map(i=><div key={i.id} className="flex justify-between text-sm"><span>{i.quantidade}x {i.nome}</span><span>{dinheiro(i.preco*i.quantidade)}</span></div>)}</div><div className="mt-3 flex justify-between border-t border-white/10 pt-3 font-black"><span>Total</span><span className="text-[#ffc400]">{dinheiro(pedidoAtual.total)}</span></div></section></div>}</main>}
      {aba === "conta" && <main className="mx-auto min-h-[70dvh] max-w-3xl px-4 py-8"><div className="flex items-center gap-3"><User className="size-6 text-[#ffc400]"/><div><p className="text-xs font-black uppercase tracking-[.18em] text-[#ffc400]">Lilhão</p><h1 className="text-2xl font-black">Minha conta</h1></div></div><div className="mt-5 rounded-2xl border border-white/10 bg-[#141617] p-5"><h2 className="font-black">Seus dados</h2><p className="mt-2 text-sm text-white/50">Informe seus dados durante a finalização do pedido. O histórico fica salvo neste navegador.</p><button onClick={abrirMeusPedidos} className={`${quietClass} mt-4 w-full`}>Consultar meus pedidos <ArrowRight className="ml-1 inline size-4"/></button></div></main>}
    </>}

    {quantidade > 0 && checkoutEtapa === 0 && <button onClick={() => setSacolaAberta(true)} className="fixed bottom-[88px] right-4 z-30 flex min-h-14 items-center gap-3 rounded-full bg-[#ffc400] px-5 font-black text-black shadow-xl md:bottom-6"><ShoppingBag className="size-5"/>Ver sacola • {dinheiro(subtotal)}</button>}
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-[#101112]/95 px-2 py-2 backdrop-blur-xl md:hidden"><button onClick={() => {setAba("inicio");setCheckoutEtapa(0);}} className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${aba === "inicio" ? "text-[#ffc400]" : "text-white/55"}`}><Home className="size-5"/>Início</button><button onClick={() => setCategoriasAbertas(true)} className="flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-white/55"><Utensils className="size-5"/>Categorias</button><button onClick={abrirMeusPedidos} className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${aba === "pedidos" ? "text-[#ffc400]" : "text-white/55"}`}><span className="relative"><ClipboardList className="size-5"/>{quantidade > 0 && <span className="absolute -right-3 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#ffc400] px-1 text-[9px] font-black text-black">{quantidade}</span>}</span>Pedidos</button><button onClick={() => {setAba("conta");setCheckoutEtapa(0);}} className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${aba === "conta" ? "text-[#ffc400]" : "text-white/55"}`}><User className="size-5"/>Conta</button></nav>

    {categoriasAbertas && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 backdrop-blur-sm" onClick={() => setCategoriasAbertas(false)}><section role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()} className="max-h-[82dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111314] pb-6"><div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#111314] px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#ffc400]">Explore o cardápio</p><h2 className="mt-1 text-xl font-black">Categorias</h2></div><button onClick={() => setCategoriasAbertas(false)} aria-label="Fechar categorias" className="grid size-10 place-items-center rounded-full border border-white/10"><X className="size-5"/></button></div><div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">{categoriasMenu.map(item=>{const Icon=categoriaIcone(item);const selected=categoria===item;const count=item==="Todos"?menu.length:menu.filter(p=>p.categoria===item).length;return <button key={item} onClick={()=>{setCategoria(item);setCategoriasAbertas(false);setAba("inicio");document.getElementById("cardapio")?.scrollIntoView({behavior:"smooth"});}} className={`flex min-h-[90px] items-center gap-3 rounded-2xl border p-3 text-left ${selected?"border-[#ffc400] bg-[#ffc400] text-black":"border-white/10 bg-[#191b1c] text-white"}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected?"bg-black/10":"bg-[#ffc400]/10 text-[#ffc400]"}`}><Icon className="size-5"/></span><span><b className="block text-sm">{item}</b><small className={`mt-1 block text-[10px] ${selected?"text-black/60":"text-white/40"}`}>{item==="Todos"?"Cardápio completo":`${count} ${count===1?"opção":"opções"}`}</small></span></button>})}</div></section></div>}

    {sacolaAberta && <div className="fixed inset-0 z-[65] flex justify-end bg-black/75" onClick={() => setSacolaAberta(false)}><aside role="dialog" aria-modal="true" aria-label="Minha sacola" onClick={e=>e.stopPropagation()} className="flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#111314] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 p-5"><div><p className="text-xs font-black uppercase tracking-widest text-[#ffc400]">Seu pedido</p><h2 className="mt-1 text-2xl font-black">Minha sacola ({quantidade})</h2></div><button onClick={() => setSacolaAberta(false)} aria-label="Fechar sacola" className="grid size-10 place-items-center rounded-full border border-white/15"><X className="size-5"/></button></div><div className="flex-1 overflow-y-auto p-4">{sacola.length===0?<div className="py-16 text-center"><ShoppingBag className="mx-auto size-12 text-white/20"/><h3 className="mt-4 font-bold">Sua sacola está vazia</h3><button onClick={()=>setSacolaAberta(false)} className={`${actionClass} mt-5`}>Explorar cardápio</button></div>:<div className="space-y-3">{sacola.map(item=><div key={item.id} className="flex gap-3 rounded-xl border border-white/10 bg-[#181a1b] p-3"><div className="size-[68px] shrink-0 overflow-hidden rounded-lg bg-black">{item.imagem?<img src={item.imagem} alt={item.nome} className="h-full w-full object-cover"/>:<div className="grid h-full place-items-center text-2xl">🍟</div>}</div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div><h4 className="text-sm font-bold">{item.nome}</h4><p className="text-xs text-[#ffc400]">{dinheiro(item.preco)}</p></div><button onClick={()=>alterarQuantidade(item.id,-item.quantidade)} aria-label={`Remover ${item.nome}`} className="text-white/40"><Trash2 className="size-4"/></button></div><div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-2 rounded-full bg-white/[.06] p-1"><button onClick={()=>alterarQuantidade(item.id,-1)} className="grid size-7 place-items-center rounded-full bg-white/10"><Minus className="size-3.5"/></button><span className="min-w-4 text-center text-sm font-bold">{item.quantidade}</span><button onClick={()=>alterarQuantidade(item.id,1)} className="grid size-7 place-items-center rounded-full bg-white/10"><Plus className="size-3.5"/></button></div><b className="text-sm text-[#ffc400]">{dinheiro(item.preco*item.quantidade)}</b></div></div></div>)}</div>}</div>{sacola.length>0&&<div className="border-t border-white/10 bg-[#141617] p-4"><label className="mb-3 block text-xs font-bold text-white/50">Observação geral (opcional)<input value={observacao} onChange={e=>setObservacao(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-[#ffc400]" placeholder="Ex.: sem cebola"/></label><div className="mb-4 flex items-center justify-between"><span className="font-bold text-white/60">Subtotal</span><span className="text-2xl font-black">{dinheiro(subtotal)}</span></div><button onClick={abrirCheckout} className={`${actionClass} w-full`}>Finalizar pedido <ArrowRight className="ml-1 inline size-4"/></button><p className="mt-3 text-center text-[10px] text-white/35">Entrega e pagamento serão escolhidos na próxima etapa.</p></div>}</aside></div>}
  </div>;
}

export const Route = createFileRoute("/")({ component: Index });