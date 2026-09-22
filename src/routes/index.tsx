import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  MapPin,
  Clock,
  Phone,
  Instagram,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Search,
  Trash2,
  CheckCircle2,
  Utensils,
} from "lucide-react";

import heroBurger from "@/assets/hero-burger.jpg";
import prodBurger from "@/assets/prod-burger.jpg";
import prodHotdog from "@/assets/prod-hotdog.jpg";
import prodFries from "@/assets/prod-fries.jpg";

type Produto = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem?: string;
  selo?: string;
};

type ItemSacola = Produto & { quantidade: number };

const produtos: Produto[] = [
  { id: "hamburguer", nome: "Hambúrguer", descricao: "Pão, carne, queijo, alface, tomate, repolho e pepino.", preco: 12, categoria: "Hambúrgueres", imagem: prodBurger },
  { id: "egg-hamburguer", nome: "Eggs-Hambúrguer", descricao: "Pão, carne, queijo, presunto, ovo e salada completa.", preco: 14, categoria: "Hambúrgueres", imagem: prodBurger },
  { id: "x-egg", nome: "X-Egg Hambúrgão", descricao: "Pão, 2 carnes, queijo, presunto, 2 ovos, batata e palha.", preco: 18, categoria: "Hambúrgueres", imagem: prodBurger },
  { id: "x-bacon", nome: "X-Bacon", descricao: "Pão, carne, queijo, ovo, bacon, presunto e salada.", preco: 18, categoria: "Hambúrgueres", imagem: prodBurger, selo: "Queridinho" },
  { id: "x-calabresa", nome: "X-Calabresa", descricao: "Pão, calabresa, bacon, ovo, queijo e salada.", preco: 18, categoria: "Hambúrgueres", imagem: prodBurger },
  { id: "x-dogao", nome: "X-Dogão", descricao: "Pão, salsicha, ovo, queijo, batata, bacon, calabresa e salada.", preco: 15, categoria: "Hambúrgueres", imagem: prodHotdog },
  { id: "x-lilhao", nome: "X-Lilhão", descricao: "Pão, 2 carnes, calabresa, salsicha, bacon, batata e salada.", preco: 22, categoria: "Hambúrgueres", imagem: prodBurger, selo: "Especial da casa" },
  { id: "calabacon", nome: "Calabacon", descricao: "Calabresa, bacon, ovo, queijo e salada.", preco: 16, categoria: "Hambúrgueres", imagem: prodBurger },
  { id: "carne-sol", nome: "Carne de Sol Completa", descricao: "Carne de sol acebolada, arroz, farofa especial, macaxeira frita e salada fresquinha.", preco: 30, categoria: "Pratos", imagem: prodFries, selo: "Prato completo" },
  { id: "misto", nome: "Misto Tradicional", descricao: "Pão de forma, queijo e presunto.", preco: 10, categoria: "Mistos" },
  { id: "misto-especial", nome: "Misto Especial", descricao: "Pão de forma, queijo, presunto e ovo.", preco: 12, categoria: "Mistos" },
  { id: "x-americano", nome: "X-Americano", descricao: "Pão de forma, queijo, presunto, ovo, alface, tomate e pepino.", preco: 14, categoria: "Mistos" },
  { id: "pizza-media", nome: "Pizza Média", descricao: "Queijo, presunto e molho.", preco: 45, categoria: "Pizzas", selo: "Feita na hora" },
  { id: "refri-lata", nome: "Refrigerante (lata)", descricao: "Consulte os sabores disponíveis.", preco: 7, categoria: "Bebidas" },
  { id: "refri-1l", nome: "Refrigerante 1 L", descricao: "Consulte os sabores disponíveis.", preco: 12, categoria: "Bebidas" },
  { id: "refri-2l", nome: "Refrigerante 2 L", descricao: "Consulte os sabores disponíveis.", preco: 15, categoria: "Bebidas" },
  { id: "coca-1l", nome: "Coca-Cola 1 L", descricao: "Geladinha para acompanhar.", preco: 13, categoria: "Bebidas" },
  { id: "coca-2l", nome: "Coca-Cola 2 L", descricao: "Geladinha para compartilhar.", preco: 17, categoria: "Bebidas" },
  { id: "agua", nome: "Água mineral", descricao: "Água mineral.", preco: 4, categoria: "Bebidas" },
  { id: "suco", nome: "Suco", descricao: "Consulte os sabores disponíveis.", preco: 7, categoria: "Bebidas" },
  { id: "copo", nome: "Sorvete no copo", descricao: "Uma pausa geladinha e cremosa.", preco: 6, categoria: "Sorvetes" },
  { id: "taca", nome: "Taça", descricao: "Sobremesa gelada especial.", preco: 15, categoria: "Sorvetes" },
  { id: "cubinha", nome: "Cubinha", descricao: "Sobremesa gelada para dividir.", preco: 25, categoria: "Sorvetes" },
  { id: "combo-3", nome: "Combo 3 Hambúrgueres", descricao: "3 hambúrgueres por apenas R$ 33,00.", preco: 33, categoria: "Combos", selo: "Promoção" },
  { id: "combo-lilhao", nome: "Combo 2x Lilhão", descricao: "2 X-Lilhão por apenas R$ 38,00.", preco: 38, categoria: "Combos", selo: "Promoção" },
];

const categorias = ["Todos", "Combos", "Hambúrgueres", "Pratos", "Mistos", "Pizzas", "Bebidas", "Sorvetes"];
const dinheiro = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Header({ quantidade, abrirSacola }: { quantidade: number; abrirSacola: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#11110f]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#inicio" className="flex items-center gap-2 font-black tracking-tight text-white">
          <span className="grid size-10 place-items-center rounded-full border-2 border-[#ffc400] bg-[#201b0c] text-sm text-[#ffc400]">L!</span>
          <span className="text-2xl">Lilhão<span className="text-[#ffc400]">.</span></span>
        </a>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-white/70 md:flex">
          <a href="#inicio" className="hover:text-[#ffc400]">Início</a>
          <a href="#cardapio" className="hover:text-[#ffc400]">Cardápio</a>
          <a href="#contato" className="hover:text-[#ffc400]">Contato</a>
        </nav>
        <button onClick={abrirSacola} className="relative inline-flex min-h-11 items-center gap-2 rounded-full bg-[#ffc400] px-4 py-2 text-sm font-extrabold text-black transition hover:bg-[#ffda4d]" aria-label="Abrir sacola">
          <ShoppingBag className="size-5" /> <span className="hidden sm:inline">Minha sacola</span>
          <span className="grid size-6 place-items-center rounded-full bg-black text-xs text-[#ffc400]">{quantidade}</span>
        </button>
      </div>
    </header>
  );
}

function Index() {
  const [categoria, setCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [sacola, setSacola] = useState<ItemSacola[]>([]);
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [nomeCliente, setNomeCliente] = useState("");
  const [bairro, setBairro] = useState("");
  const [observacao, setObservacao] = useState("");
  const [pedidoMontado, setPedidoMontado] = useState(false);

  const filtrados = useMemo(() => produtos.filter((p) =>
    (categoria === "Todos" || p.categoria === categoria) &&
    `${p.nome} ${p.descricao}`.toLowerCase().includes(busca.toLowerCase())
  ), [categoria, busca]);
  const quantidade = sacola.reduce((total, item) => total + item.quantidade, 0);
  const subtotal = sacola.reduce((total, item) => total + item.preco * item.quantidade, 0);

  function adicionar(produto: Produto) {
    setSacola((atual) => {
      const existe = atual.find((item) => item.id === produto.id);
      return existe
        ? atual.map((item) => item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item)
        : [...atual, { ...produto, quantidade: 1 }];
    });
    setPedidoMontado(false);
  }

  function alterarQuantidade(id: string, delta: number) {
    setSacola((atual) => atual
      .map((item) => item.id === id ? { ...item, quantidade: item.quantidade + delta } : item)
      .filter((item) => item.quantidade > 0));
    setPedidoMontado(false);
  }

  function montarPedido(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sacola.length || !nomeCliente.trim() || !bairro.trim()) return;
    setPedidoMontado(true);
    setCheckout(false);
  }

  return (
    <div className="min-h-screen bg-[#10100e] text-white">
      <Header quantidade={quantidade} abrirSacola={() => setSacolaAberta(true)} />
      <main>
        <section id="inicio" className="relative isolate overflow-hidden border-b border-white/10">
          <img src={heroBurger} alt="Hambúrguer do Lilhão" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/85 to-black/40" />
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#ffc400]/40 bg-[#ffc400]/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-[#ffc400]"><Utensils className="size-4" /> Lanchonete do Lilhão</span>
              <h1 className="mt-5 text-5xl font-black uppercase leading-[.95] tracking-tight sm:text-7xl">Sabor que<br /><span className="text-[#ffc400]">conquista.</span></h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">Hambúrgueres, combos, pratos e sobremesas preparados com aquele sabor que todo mundo aprova.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#cardapio" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#ffc400] px-7 font-extrabold text-black transition hover:scale-[1.02]">Ver cardápio <span className="ml-2">↓</span></a>
                <button onClick={() => setSacolaAberta(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/25 px-6 font-bold text-white hover:border-[#ffc400] hover:text-[#ffc400]"><ShoppingBag className="size-5" /> Minha sacola ({quantidade})</button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/65"><span>✓ Ingredientes selecionados</span><span>✓ Sabor que vicia</span><span>✓ Feito na hora</span></div>
            </div>
            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-3 rotate-3 rounded-[2rem] border border-[#ffc400]/30" />
              <img src={prodBurger} alt="Hambúrguer artesanal" className="relative aspect-square w-full rounded-[1.7rem] object-cover shadow-2xl" />
              <div className="absolute bottom-4 left-4 rounded-xl border border-[#ffc400]/40 bg-black/85 px-4 py-3 backdrop-blur"><p className="text-xs font-bold uppercase tracking-widest text-[#ffc400]">Seu próximo favorito</p><p className="text-lg font-black">É do Lilhão!</p></div>
            </div>
          </div>
        </section>

        <section id="cardapio" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div><p className="text-xs font-black uppercase tracking-[.2em] text-[#ffc400]">Escolha o seu</p><h2 className="mt-2 text-4xl font-black uppercase sm:text-5xl">Nosso cardápio</h2><p className="mt-3 max-w-xl text-sm text-white/60">Selecione seus favoritos e adicione à sacola. Os valores abaixo seguem o cardápio enviado.</p></div>
            <label className="flex min-h-12 w-full items-center gap-3 rounded-full border border-white/15 bg-white/[.04] px-4 sm:max-w-xs"><Search className="size-5 text-white/45" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no cardápio..." className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" /></label>
          </div>
          <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
            {categorias.map((item) => <button key={item} onClick={() => setCategoria(item)} className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-extrabold transition ${categoria === item ? "bg-[#ffc400] text-black" : "border border-white/15 bg-white/[.03] text-white/70 hover:border-[#ffc400]/50 hover:text-white"}`}>{item}</button>)}
          </div>
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((p) => {
              const noCarrinho = sacola.find((item) => item.id === p.id)?.quantidade ?? 0;
              return <article key={p.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#191916] transition hover:border-[#ffc400]/40">
                {p.imagem ? <div className="relative overflow-hidden"><img src={p.imagem} alt={p.nome} loading="lazy" className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />{p.selo && <span className="absolute left-3 top-3 rounded-full bg-[#ffc400] px-3 py-1 text-[11px] font-black uppercase text-black">{p.selo}</span>}</div> : <div className="relative grid aspect-[16/9] place-items-center bg-gradient-to-br from-[#2b2512] to-[#191916]"><span className="text-5xl">{p.categoria === "Bebidas" ? "🥤" : p.categoria === "Sorvetes" ? "🍨" : p.categoria === "Pizzas" ? "🍕" : p.categoria === "Mistos" ? "🥪" : "🍔"}</span>{p.selo && <span className="absolute left-3 top-3 rounded-full bg-[#ffc400] px-3 py-1 text-[11px] font-black uppercase text-black">{p.selo}</span>}</div>}
                <div className="flex flex-1 flex-col p-5"><div className="flex-1"><p className="text-[11px] font-bold uppercase tracking-widest text-[#ffc400]/80">{p.categoria}</p><h3 className="mt-1 text-xl font-black">{p.nome}</h3><p className="mt-2 text-sm leading-relaxed text-white/55">{p.descricao}</p></div><div className="mt-5 flex items-center justify-between gap-3"><span className="text-2xl font-black text-[#ffc400]">{dinheiro(p.preco)}</span><button onClick={() => adicionar(p)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#ffc400] px-4 text-sm font-extrabold text-black transition hover:bg-[#ffda4d]"><Plus className="size-4" /> Adicionar{noCarrinho > 0 ? ` (${noCarrinho})` : ""}</button></div></div>
              </article>;
            })}
          </div>
          {filtrados.length === 0 && <p className="rounded-2xl border border-white/10 p-8 text-center text-white/60">Nenhum item encontrado. Tente outra busca ou categoria.</p>}
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#ffc400]/20 bg-[#ffc400]/[.06] p-5 sm:flex-row"><div><p className="font-extrabold">Já escolheu seus favoritos?</p><p className="mt-1 text-sm text-white/55">Confira os itens e quantidades na sua sacola.</p></div><button onClick={() => setSacolaAberta(true)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#ffc400] px-6 font-extrabold text-black"><ShoppingBag className="size-5" /> Ver sacola ({quantidade})</button></div>
        </section>

        <section id="contato" className="border-t border-white/10 bg-[#171714]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6"><div className="text-center"><p className="text-xs font-black uppercase tracking-[.2em] text-[#ffc400]">Estamos por aqui</p><h2 className="mt-2 text-3xl font-black uppercase sm:text-4xl">Lilhão, sabor que conquista</h2></div><div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[.03] p-5 text-center"><Clock className="mx-auto size-6 text-[#ffc400]"/><h3 className="mt-3 font-extrabold">Horários</h3><p className="mt-1 text-sm text-white/55">Consulte a disponibilidade do dia</p></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-5 text-center"><Phone className="mx-auto size-6 text-[#ffc400]"/><h3 className="mt-3 font-extrabold">Pedidos</h3><p className="mt-1 text-sm text-white/55">(96) 9911-2135</p></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-5 text-center"><MapPin className="mx-auto size-6 text-[#ffc400]"/><h3 className="mt-3 font-extrabold">Entrega</h3><p className="mt-1 text-sm text-white/55">Consulte a taxa para o seu bairro</p></div></div></div>
        </section>
      </main>
      <footer className="border-t border-white/10 px-4 py-7 text-center"><p className="font-black">Lilhão<span className="text-[#ffc400]">.</span></p><p className="mt-1 text-xs text-white/40">Feito com muito sabor © {new Date().getFullYear()} Lanchonete do Lilhão</p></footer>

      {sacolaAberta && <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setSacolaAberta(false)}><aside role="dialog" aria-modal="true" aria-label="Sua sacola" onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#151512] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 p-5"><div><p className="text-xs font-black uppercase tracking-widest text-[#ffc400]">Seu pedido</p><h2 className="mt-1 text-2xl font-black">Minha sacola <span className="text-white/40">({quantidade})</span></h2></div><button onClick={() => setSacolaAberta(false)} aria-label="Fechar sacola" className="grid size-10 place-items-center rounded-full border border-white/15 hover:bg-white/10"><X className="size-5"/></button></div>
        <div className="flex-1 overflow-y-auto p-5">{pedidoMontado ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5"><CheckCircle2 className="size-9 text-emerald-400"/><h3 className="mt-3 text-xl font-black">Pedido montado!</h3><p className="mt-2 text-sm leading-relaxed text-white/70">Seu resumo está pronto, {nomeCliente}. Esta é uma prévia do pedido; o envio online e a confirmação com a lanchonete serão conectados na próxima etapa.</p><div className="mt-4 rounded-xl bg-black/20 p-3 text-sm"><p><b>Nome:</b> {nomeCliente}</p><p><b>Bairro:</b> {bairro}</p>{observacao && <p><b>Observação:</b> {observacao}</p>}<p className="mt-2 font-black text-[#ffc400]">Total: {dinheiro(subtotal)}</p></div><button onClick={() => { setPedidoMontado(false); setSacolaAberta(false); }} className="mt-4 min-h-11 w-full rounded-full bg-[#ffc400] font-extrabold text-black">Continuar navegando</button></div> : sacola.length === 0 ? <div className="py-16 text-center"><ShoppingBag className="mx-auto size-12 text-white/20"/><h3 className="mt-4 text-lg font-extrabold">Sua sacola está vazia</h3><p className="mt-2 text-sm text-white/50">Adicione algo delicioso do cardápio.</p><button onClick={() => setSacolaAberta(false)} className="mt-5 rounded-full bg-[#ffc400] px-5 py-3 text-sm font-extrabold text-black">Explorar cardápio</button></div> : <div className="space-y-4">{sacola.map((item) => <div key={item.id} className="rounded-xl border border-white/10 bg-white/[.03] p-4"><div className="flex justify-between gap-3"><div><h3 className="font-extrabold">{item.nome}</h3><p className="mt-1 text-sm font-bold text-[#ffc400]">{dinheiro(item.preco)}</p></div><button onClick={() => setSacola((atual) => atual.filter((i) => i.id !== item.id))} aria-label={`Remover ${item.nome}`} className="text-white/35 hover:text-red-400"><Trash2 className="size-4"/></button></div><div className="mt-3 flex items-center justify-between"><span className="text-sm text-white/45">Quantidade</span><div className="flex items-center gap-3"><button onClick={() => alterarQuantidade(item.id, -1)} aria-label="Diminuir" className="grid size-8 place-items-center rounded-full border border-white/15"><Minus className="size-4"/></button><span className="min-w-4 text-center font-black">{item.quantidade}</span><button onClick={() => alterarQuantidade(item.id, 1)} aria-label="Aumentar" className="grid size-8 place-items-center rounded-full bg-[#ffc400] text-black"><Plus className="size-4"/></button></div></div><p className="mt-3 text-right text-sm text-white/60">Total do item: <b className="text-white">{dinheiro(item.preco * item.quantidade)}</b></p></div>)}</div>}</div>
        {!pedidoMontado && sacola.length > 0 && <div className="border-t border-white/10 p-5"><div className="mb-4 flex items-center justify-between"><span className="font-bold text-white/60">Subtotal</span><span className="text-2xl font-black text-[#ffc400]">{dinheiro(subtotal)}</span></div>{checkout ? <form onSubmit={montarPedido} className="space-y-3"><label className="block text-xs font-bold text-white/60">Seu nome<input required value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-white/15 bg-black/20 px-3 text-base text-white outline-none focus:border-[#ffc400]" placeholder="Como podemos te chamar?"/></label><label className="block text-xs font-bold text-white/60">Bairro / local de entrega<input required value={bairro} onChange={(e) => setBairro(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-white/15 bg-black/20 px-3 text-base text-white outline-none focus:border-[#ffc400]" placeholder="Informe seu bairro"/></label><label className="block text-xs font-bold text-white/60">Observações (opcional)<textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-base text-white outline-none focus:border-[#ffc400]" rows={2} placeholder="Ponto de referência, adicionais..."/></label><button type="submit" className="min-h-12 w-full rounded-full bg-[#ffc400] font-black text-black">Montar resumo do pedido</button><button type="button" onClick={() => setCheckout(false)} className="min-h-10 w-full text-sm font-bold text-white/50">Voltar à sacola</button></form> : <button onClick={() => setCheckout(true)} className="min-h-12 w-full rounded-full bg-[#ffc400] font-black text-black transition hover:bg-[#ffda4d]">Continuar pedido <span className="ml-1">→</span></button>}<p className="mt-3 text-center text-[11px] leading-relaxed text-white/35">Taxa de entrega calculada à parte. O pedido ainda não é enviado à lanchonete nesta versão.</p></div>}
      </aside></div>}
    </div>
  );
}

export const Route = createFileRoute("/")({ component: Index });
