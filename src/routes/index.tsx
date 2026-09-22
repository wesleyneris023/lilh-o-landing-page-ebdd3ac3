import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Clock, Phone, Instagram } from "lucide-react";

import heroBurger from "@/assets/hero-burger.jpg";
import prodBurger from "@/assets/prod-burger.jpg";
import prodHotdog from "@/assets/prod-hotdog.jpg";
import prodFries from "@/assets/prod-fries.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lilhão — Lanchonete | Hambúrgueres e Lanches Artesanais" },
      {
        name: "description",
        content:
          "A lanchonete Lilhão: hambúrgueres artesanais, cachorro-quente caprichado e batatas crocantes. Peça pelo WhatsApp e saboreie.",
      },
      { property: "og:title", content: "Lilhão — Lanchonete" },
      {
        property: "og:description",
        content:
          "Hambúrgueres artesanais, cachorro-quente e batatas crocantes. Peça já o seu!",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
 { name: "twitter:title", content: "Lilhão — Lanchonete" },
      {
        name: "twitter:description",
        content:
          "Hambúrgueres artesanais, cachorro-quente e batatas crocantes. Peça já o seu!",
      },
    ],
  }),
});

const WHATSAPP_URL = "https://wa.me/5511999999999";

const produtos = [
  {
    nome: "Lilhão Burger",
    descricao:
      "Dois hambúrgueres de carne, cheddar derretido, bacon crocante, alface, tomate e maionese da casa.",
    preco: "R$ 24,90",
    imagem: prodBurger,
    destaque: "Mais pedido",
  },
  {
    nome: "Dogão Lilhão",
    descricao:
      "Salsicha premium, purê caseiro, milho, ervilha, batata palha e cheddar cremoso.",
    preco: "R$ 14,90",
    imagem: prodHotdog,
    destaque: null,
  },
  {
    nome: "Batata Cheddar & Bacon",
    descricao:
      "Porção generosa de batatas crocantes com cheddar cremoso e muito bacon, acompanha refrigerante.",
    preco: "R$ 19,90",
    imagem: prodFries,
    destaque: "Novidade",
  },
];

function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <a href="#" className="font-display text-3xl tracking-wide text-foreground">
          Lilhão<span className="text-primary">.</span>
        </a>
        <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground sm:flex">
          <a href="#inicio" className="transition-colors hover:text-foreground">
            Início
          </a>
          <a href="#destaques" className="transition-colors hover:text-foreground">
            Destaques
          </a>
          <a href="#contato" className="transition-colors hover:text-foreground">
            Contato
          </a>
        </nav>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105"
        >
          Pedir agora
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="inicio" className="relative flex min-h-svh items-center justify-center overflow-hidden">
      <img
        src={heroBurger}
        alt="Hambúrguer artesanal do Lilhão com queijo derretido e bacon"
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1280}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/55 to-background" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 pt-24 pb-16 text-center sm:px-6">
        <span className="inline-block rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-bold tracking-widest text-accent uppercase">
          Hambúrgueres artesanais • Desde 2015
        </span>
        <h1 className="font-display mt-6 text-8xl leading-none tracking-wide text-foreground text-glow sm:text-[10rem]">
          LILHÃO
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base font-medium text-foreground/85 sm:text-lg">
          O lanche que a galera ama: pão quentinho, carne suculenta e aquele
          cheddar que escorre. Vem pro Lilhão!
        </p>
        <div className="mt-8">
          <a
            href="#destaques"
            className="inline-flex items-center justify-center rounded-full bg-primary px-10 py-4 text-lg font-bold text-primary-foreground shadow-xl shadow-primary/40 transition-transform hover:scale-105"
          >
            Ver Cardápio
          </a>
        </div>
      </div>
    </section>
  );
}

function Destaques() {
  return (
    <section id="destaques" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="text-center">
        <span className="text-xs font-bold tracking-widest text-primary uppercase">
          Direto da chapa
        </span>
        <h2 className="font-display mt-2 text-5xl tracking-wide text-foreground sm:text-6xl">
          Destaques da casa
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Os queridinhos que saem da chapa direto pra sua mesa — ou pra sua porta.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {produtos.map((p) => (
          <article
            key={p.nome}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-lg transition-transform hover:-translate-y-1"
          >
            {p.destaque && (
              <span className="absolute top-4 left-4 z-10 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                {p.destaque}
              </span>
            )}
            <div className="overflow-hidden">
              <img
                src={p.imagem}
                alt={p.nome}
                loading="lazy"
                width={1024}
                height={1024}
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-lg font-bold text-foreground">{p.nome}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {p.descricao}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-2xl font-extrabold text-primary">{p.preco}</span>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
                >
                  Fazer Pedido
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const contatos = [
  {
    icone: MapPin,
    titulo: "Endereço",
    linhas: ["Rua das Delícias, 123 — Centro", "São Paulo / SP"],
  },
  {
    icone: Clock,
    titulo: "Horário",
    linhas: ["Terça a domingo", "18h às 23h"],
  },
  {
    icone: Phone,
    titulo: "WhatsApp",
    linhas: ["(11) 99999-9999", "Pedidos e reservas"],
  },
  {
    icone: Instagram,
    titulo: "Instagram",
    linhas: ["@lilhao.lanches", "Novidades todo dia"],
  },
];

function Contato() {
  return (
    <section id="contato" className="scroll-mt-20 border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">
            Fale com a gente
          </span>
          <h2 className="font-display mt-2 text-5xl tracking-wide text-foreground sm:text-6xl">
            Contato &amp; horários
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {contatos.map((c) => (
            <div
              key={c.titulo}
              className="rounded-3xl border border-border bg-card p-6 text-center"
            >
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/15">
                <c.icone className="size-6 text-primary" />
              </div>
              <h3 className="mt-4 font-bold text-foreground">{c.titulo}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {c.linhas[0]}
                <br />
                {c.linhas[1]}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-accent px-10 py-4 text-lg font-bold text-accent-foreground shadow-xl shadow-accent/25 transition-transform hover:scale-105"
          >
            Chamar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
        <span className="font-display text-3xl tracking-wide text-foreground">
          Lilhão<span className="text-primary">.</span>
        </span>
        <p className="text-sm text-muted-foreground">
          Feito com muito queijo e carinho © {new Date().getFullYear()} Lilhão
          Lanchonete
        </p>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Destaques />
        <Contato />
      </main>
      <Footer />
    </div>
  );
}

export default Index;

Route.update({ component: Index });
