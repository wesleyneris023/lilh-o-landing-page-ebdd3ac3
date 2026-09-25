export type Produto = { id: string; nome: string; descricao: string; preco: number; categoria: string; imagem?: string; selo?: string };
export type ItemSacola = Produto & { quantidade: number };
export type Pedido = { numero: string; criadoEm: string; itens: ItemSacola[]; nome: string; telefone: string; entrega: string; endereco: string; pagamento: string; observacao: string; subtotal: number; taxa: number; total: number; status: string };

import prodBurger from "@/assets/prod-burger.jpg";
import prodHotdog from "@/assets/prod-hotdog.jpg";
import prodFries from "@/assets/prod-fries.jpg";

export const produtosIniciais: Produto[] = [
  { id: "hamburguer", nome: "Hambúrguer", descricao: "Pão, carne, queijo, alface, tomate, repolho e pepino.", preco: 12, categoria: "Hambúrgueres", imagem: prodBurger },
  { id: "egg-hamburguer", nome: "Eggs-Hambúrguer", descricao: "Pão, carne, queijo, presunto, ovo e salada completa.", preco: 14, categoria: "Hambúrgueres", imagem: prodBurger },
  { id: "x-egg", nome: "X-Egg Hambúrgão", descricao: "Pão, 2 carnes, queijo, presunto, 2 ovos, batata e palha.", preco: 18, categoria: "Hambúrgueres", imagem: prodBurger },
  { id: "x-bacon", nome: "X-Bacon", descricao: "Pão, carne, queijo, ovo, bacon, presunto e salada.", preco: 18, categoria: "Hambúrgueres", imagem: prodBurger, selo: "Queridinho" },
  { id: "x-calabresa", nome: "X-Calabresa", descricao: "Pão, calabresa, bacon, ovo, queijo e salada.", preco: 18, categoria: "Hambúrgueres", imagem: prodBurger },
  { id: "x-dogao", nome: "X-Dogão", descricao: "Pão, salsicha, ovo, queijo, batata, bacon, calabresa e salada.", preco: 15, categoria: "Hambúrgueres", imagem: prodHotdog },
  { id: "x-lilhao", nome: "X-Lilhão", descricao: "Pão, 2 carnes, calabresa, salsicha, bacon, batata e salada.", preco: 22, categoria: "Hambúrgueres", imagem: prodBurger, selo: "Especial da casa" },
  { id: "calabacon", nome: "Calabacon", descricao: "Calabresa, bacon, ovo, queijo e salada.", preco: 16, categoria: "Hambúrgueres", imagem: prodBurger },
  { id: "carne-sol", nome: "Carne de Sol Completa", descricao: "Arroz, farofa especial, salada e macaxeira frita.", preco: 30, categoria: "Pratos", imagem: prodFries },
  { id: "misto", nome: "Misto Tradicional", descricao: "Pão de forma, queijo e presunto.", preco: 10, categoria: "Mistos" },
  { id: "misto-especial", nome: "Misto Especial", descricao: "Pão de forma, queijo, presunto e ovo.", preco: 12, categoria: "Mistos" },
  { id: "x-americano", nome: "X-Americano", descricao: "Pão de forma, queijo, presunto, ovo, alface, tomate e pepino.", preco: 14, categoria: "Mistos" },
  { id: "pizza-media", nome: "Pizza Média", descricao: "Queijo, presunto, molho e muito sabor.", preco: 45, categoria: "Pizzas" },
  { id: "refri-lata", nome: "Refrigerante Lata", descricao: "Consulte os sabores disponíveis.", preco: 7, categoria: "Bebidas" },
  { id: "refri-1l", nome: "Refrigerante 1L", descricao: "Geladinho para acompanhar.", preco: 12, categoria: "Bebidas" },
  { id: "refri-2l", nome: "Refrigerante 2L", descricao: "Ideal para compartilhar.", preco: 15, categoria: "Bebidas" },
  { id: "coca-1l", nome: "Coca-Cola 1L", descricao: "Geladinha para acompanhar.", preco: 13, categoria: "Bebidas" },
  { id: "coca-2l", nome: "Coca-Cola 2L", descricao: "Geladinha para compartilhar.", preco: 17, categoria: "Bebidas" },
  { id: "agua", nome: "Água Mineral", descricao: "Água mineral.", preco: 4, categoria: "Bebidas" },
  { id: "suco", nome: "Suco", descricao: "Consulte os sabores disponíveis.", preco: 7, categoria: "Bebidas" },
  { id: "copo", nome: "Sorvete no Copo", descricao: "Uma pausa geladinha e cremosa.", preco: 6, categoria: "Sorvetes" },
  { id: "taca", nome: "Taça", descricao: "Sobremesa gelada especial.", preco: 15, categoria: "Sorvetes" },
  { id: "cubinha", nome: "Cubinha", descricao: "Sobremesa gelada para dividir.", preco: 25, categoria: "Sorvetes" },
  { id: "combo-3", nome: "3 Hambúrgueres", descricao: "3 hambúrgueres por apenas R$ 33,00.", preco: 33, categoria: "Combos", selo: "Promoção" },
  { id: "combo-lilhao", nome: "Combo 2x Lilhão", descricao: "2 X-Lilhão por apenas R$ 38,00.", preco: 38, categoria: "Combos", selo: "Promoção" },
];

export const categorias = ["Todos", "Hambúrgueres", "Combos", "Pratos", "Mistos", "Pizzas", "Bebidas", "Sorvetes"];
export const dinheiro = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function lerProdutos(): Produto[] {
  if (typeof window === "undefined") return produtosIniciais;
  try { const raw = localStorage.getItem("lilhao-produtos"); return raw ? JSON.parse(raw) : produtosIniciais; } catch { return produtosIniciais; }
}
export function salvarProdutos(produtos: Produto[]) {
  try { localStorage.setItem("lilhao-produtos", JSON.stringify(produtos)); } catch {}
}
export function lerPedidos(): Pedido[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("lilhao-pedidos") || "[]"); } catch { return []; }
}
export function salvarPedidos(pedidos: Pedido[]) {
  try { localStorage.setItem("lilhao-pedidos", JSON.stringify(pedidos)); } catch {}
}
