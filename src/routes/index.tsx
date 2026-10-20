import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, Clock, Copy, CreditCard, Flame, Home, LayoutDashboard, MapPin, Minus, PackageCheck, Phone, Plus, QrCode, Search, ShoppingBag, Store, Trash2, User, Utensils, X } from "lucide-react";
import heroBurger from "@/assets/hero-burger.jpg";

import { categorias, dinheiro, lerProdutos, type ItemSacola, type Pedido, type Produto } from "@/data/store";
import { carregarCatalogo, carregarCategorias, carregarConfiguracoes, carregarFormasPagamento, criarPedidoReal, consultarStatusPagamentoPix, consultarHistoricoPorNomeTelefone, ehAdmin, criarContaCliente } from "@/lib/api";
import { supabase } from "@/lib/supabase";
function classeStatusPedido(status: string) {
  switch (status.trim().toLocaleLowerCase("pt-BR")) {
    case "recebido": return "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/20";
    case "em preparo": return "bg-sky-400/15 text-sky-300 ring-1 ring-sky-400/20";
    case "pronto": return "bg-violet-400/15 text-violet-300 ring-1 ring-violet-400/20";
    case "saiu para entrega": return "bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/20";
    case "concluído":
    case "concluido": return "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25";
    case "cancelado": return "bg-red-400/15 text-red-300 ring-1 ring-red-400/20";
    default: return "bg-white/10 text-white/75 ring-1 ring-white/10";
  }
}

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

function Index() {
  const [categoria, setCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [sacola, setSacola] = useState<ItemSacola[]>([]);
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [categoriasAbertas, setCategoriasAbertas] = useState(false);
  const [checkoutEtapa, setCheckoutEtapa] = useState(0);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
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
  const [preferenciasCarregadas, setPreferenciasCarregadas] = useState(false);
  const [historicoCarregando, setHistoricoCarregando] = useState(false);
  const [menu, setMenu] = useState<Produto[]>(lerProdutos());
  const [categoriasMenu, setCategoriasMenu] = useState<string[]>(categorias);
  const [pixData, setPixData] = useState<{
    order_id: string;
    payment_id: string | null;
    status: string;
    status_detail: string;
    qr_code: string;
    qr_code_base64: string;
    ticket_url: string;
  } | null>(null);
  const [pixStatus, setPixStatus] = useState<"pendente" | "aprovado" | "recusado" | "cancelado">("pendente");
  const [verificandoPix, setVerificandoPix] = useState(false);
  const [carregandoMenu, setCarregandoMenu] = useState(true);
  const [erroMenu, setErroMenu] = useState("");
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [pedidoIdempotencyKey, setPedidoIdempotencyKey] = useState("");
  const [erroCheckout, setErroCheckout] = useState("");
  const [taxaEntregaConfigurada, setTaxaEntregaConfigurada] = useState(0);
  const [pedidoMinimo, setPedidoMinimo] = useState(0);
  const [horarioAbertura, setHorarioAbertura] = useState("18:00");
  const [horarioFechamento, setHorarioFechamento] = useState("23:30");
  const [aceitaPedidos, setAceitaPedidos] = useState(false);
  const [configCarregada, setConfigCarregada] = useState(false);
  const [agoraTick, setAgoraTick] = useState(() => Date.now());
  const [formasPagamento, setFormasPagamento] = useState<string[]>([]);
  const [contaTelefone, setContaTelefone] = useState("");
  const [contaNome, setContaNome] = useState("");
  const [contaCarregando, setContaCarregando] = useState(false);
  const [contaErro, setContaErro] = useState("");
  const [contaConsultou, setContaConsultou] = useState(false);
  const [contaCriada, setContaCriada] = useState(false);
  const [acessoAdmin, setAcessoAdmin] = useState(false);

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
        setMenu(produtos ?? []);
        setCategoriasMenu(cats ?? ["Todos"]);
        if (cfg) {
          setTaxaEntregaConfigurada(Number(cfg.taxa_entrega || 0));
          setPedidoMinimo(Number(cfg.pedido_minimo || 0));
          setHorarioAbertura(cfg.horario_abertura || "18:00");
          setHorarioFechamento(cfg.horario_fechamento || "23:30");
          setAceitaPedidos(cfg.aceita_pedidos !== false);
          setConfigCarregada(true);
        }
        if (formas?.length) setFormasPagamento(formas);
        if (cfg) setConfigCarregada(true);
        if (produtos && cats) {
          setErroMenu("");
        } else {
          const failed = [catalogoResult, categoriasResult, configResult, formasResult].filter((r) => r.status === "rejected").length;
          setErroMenu("Alguns dados online não puderam ser carregados (" + failed + "). Por segurança, o checkout fica indisponível até os dados online serem recuperados.");
        }
      } catch {
        if (!ativo) return;
        setErroMenu("Não foi possível carregar o cardápio online. Atualize a página e tente novamente.");
        setMenu([]);
        setCategoriasMenu(["Todos"]);
      } finally {
        if (ativo) setCarregandoMenu(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setAgoraTick(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let ativo = true;
    const verificarAcessoAdmin = async () => {
      try {
        const autorizado = await ehAdmin();
        if (ativo) setAcessoAdmin(autorizado);
      } catch {
        if (ativo) setAcessoAdmin(false);
      }
    };
    void verificarAcessoAdmin();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => { void verificarAcessoAdmin(); }, 0);
    });
    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let clienteRestaurado = false;
    try {
      const saved = window.localStorage.getItem("lilhao-historico-cliente-v1");
      if (saved) {
        const parsed = JSON.parse(saved) as { nome?: string; telefone?: string };
        if (parsed.nome && parsed.nome.trim() && parsed.telefone && parsed.telefone.trim()) {
          setContaNome(parsed.nome);
          setContaTelefone(parsed.telefone);
          setContaConsultou(true);
          setContaCriada(true);
          clienteRestaurado = true;
        }
      }
    } catch (error) {
      // Do not delete the customer's saved identity if local cached data is malformed.
    }

    try {
      const cachedOrders = window.localStorage.getItem("lilhao-historico-pedidos-v1");
      if (cachedOrders) {
        const parsedOrders = JSON.parse(cachedOrders) as Pedido[];
        if (Array.isArray(parsedOrders)) setPedidos(parsedOrders.slice(0, 20));
      }
    } catch (error) {
      // Ignore a damaged order cache but preserve customer identity.
    }

    try {
      const abaSalva = window.localStorage.getItem("lilhao-aba-atual-v1");
      if (clienteRestaurado) {
        setAba("pedidos");
        window.localStorage.setItem("lilhao-aba-atual-v1", "pedidos");
      } else if (abaSalva === "pedidos" || abaSalva === "conta") {
        setAba(abaSalva);
      }
    } catch (error) {
      if (clienteRestaurado) setAba("pedidos");
    }
    setPreferenciasCarregadas(true);
  }, []);

  // Preserve the customer's current section across refreshes.
  useEffect(() => {
    if (preferenciasCarregadas) {
      window.localStorage.setItem("lilhao-aba-atual-v1", aba);
    }
  }, [aba, preferenciasCarregadas]);

  // The public history view polls only while open. This keeps order status fresh