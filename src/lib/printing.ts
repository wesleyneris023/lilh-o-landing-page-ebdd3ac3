import type { Pedido } from "@/data/store";
import { dinheiro } from "@/data/store";

export type PrintSettings = { enabled: boolean; mode: "manual" | "automatico" };
const STORAGE_KEY = "lilhao-print-settings-v1";
const AUTO_PRINTED_KEY = "lilhao-auto-printed-orders-v1";

export const defaultPrintSettings: PrintSettings = { enabled: true, mode: "manual" };

export function loadPrintSettings(): PrintSettings {
  if (typeof window === "undefined") return defaultPrintSettings;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved.enabled !== "boolean" || !["manual", "automatico"].includes(saved.mode)) return defaultPrintSettings;
    return saved;
  } catch { return defaultPrintSettings; }
}

export function savePrintSettings(settings: PrintSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch {}
}

function escapeHtml(value: unknown) {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"' : "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, char => entities[char] ?? char);
}

export function imprimirPedido(pedido: Pedido, nomeLoja = "Lilhão") {
  const popup = window.open("", "_blank", "width=420,height=700");
  if (!popup) {
    window.alert("O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.");
    return false;
  }
  const itens = pedido.itens.map(item => `
    <div class="item">
      <div class="item-name">${item.quantidade}x ${escapeHtml(item.nome)}</div>
      <div class="price">${dinheiro(item.preco * item.quantidade)}</div>
    </div>`).join("");
  const data = new Date(pedido.criadoEm).toLocaleString("pt-BR");
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pedido #${escapeHtml(pedido.numero)}</title>
  <style>
    @page { size: 58mm auto; margin: 2mm; }
    * { box-sizing: border-box; }
    body { width: 54mm; margin: 0 auto; color: #000; font: 12px/1.35 Arial, sans-serif; }
    h1 { text-align:center; font-size:19px; margin: 0 0 3px; }
    .center { text-align:center; }
    .muted { font-size:10px; }
    hr { border:0; border-top:1px dashed #000; margin:8px 0; }
    .strong { font-weight:700; }
    .item { display:flex; justify-content:space-between; gap:5px; margin:5px 0; }
    .item-name { flex:1; overflow-wrap:anywhere; }
    .price { white-space:nowrap; }
    .total { font-size:16px; font-weight:700; display:flex; justify-content:space-between; }
    .field { margin:4px 0; overflow-wrap:anywhere; }
    .footer { text-align:center; margin-top:10px; font-size:10px; }
    @media screen { body { padding: 8px 0; } }
  </style></head><body>
  <h1>${escapeHtml(nomeLoja)}</h1><div class="center strong">COMANDA / PEDIDO</div>
  <div class="center strong">Nº ${escapeHtml(pedido.numero)}</div><div class="center muted">${escapeHtml(data)}</div>
  <hr><div class="field"><b>Cliente:</b> ${escapeHtml(pedido.nome)}</div>
  <div class="field"><b>Telefone:</b> ${escapeHtml(pedido.telefone)}</div>
  <div class="field"><b>Modalidade:</b> ${escapeHtml(pedido.entrega)}</div>
  ${pedido.endereco ? `<div class="field"><b>Endereço:</b> ${escapeHtml(pedido.endereco)}</div>` : ""}
  <div class="field"><b>Pagamento:</b> ${escapeHtml(pedido.pagamento)}</div>
  <div class="field"><b>Status:</b> ${escapeHtml(pedido.status)}</div>
  <hr><div class="strong">ITENS DO PEDIDO</div>${itens}<hr>
  <div class="item"><span>Subtotal</span><span class="price">${dinheiro(pedido.subtotal)}</span></div>
  <div class="item"><span>Taxa de entrega</span><span class="price">${dinheiro(pedido.taxa)}</span></div>
  <div class="total"><span>TOTAL</span><span>${dinheiro(pedido.total)}</span></div>
  ${pedido.observacao ? `<hr><div class="field"><b>Observações:</b> ${escapeHtml(pedido.observacao)}</div>` : ""}
  <div class="footer">Obrigado pela preferência!<br>*** FIM DO PEDIDO ***</div>
  <script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\/script>
  </body></html>`);
  popup.document.close();
  return true;
}

export function deveImprimirAutomaticamente(numero: string): boolean {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(AUTO_PRINTED_KEY) || "[]");
    if (seen.includes(numero)) return false;
    localStorage.setItem(AUTO_PRINTED_KEY, JSON.stringify([...seen.slice(-99), numero]));
    return true;
  } catch { return false; }
}
